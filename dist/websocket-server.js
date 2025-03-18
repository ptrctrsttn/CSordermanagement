import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Store orders in memory
let orders = [];
let drivers = [];
let productList = [];
// Store WebSocket clients
const clients = new Set();
const app = express();
const wsPort = 3002; // WebSocket port
const httpPort = 3003; // Use a different port for HTTP
app.use(cors());
app.use(express.json());
// File path for persisting orders
const ORDERS_FILE = path.join(process.cwd(), 'orders.json');
// Function to save orders to file
const saveOrders = () => {
    try {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        console.log('Orders saved to file');
    }
    catch (error) {
        console.error('Error saving orders:', error);
    }
};
// Function to load orders from file
const loadOrders = () => {
    try {
        if (fs.existsSync(ORDERS_FILE)) {
            const data = fs.readFileSync(ORDERS_FILE, 'utf8');
            orders = JSON.parse(data);
            console.log('Orders loaded from file');
        }
        else {
            console.log('No existing orders file found');
            orders = [];
        }
    }
    catch (error) {
        console.error('Error loading orders:', error);
        orders = [];
    }
};
// Load orders when server starts
loadOrders();
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const START_ADDRESS = "562 richmond road grey lynn";
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
// Store the update interval reference
let updateIntervalRef;
const parseAddress = (addressString) => {
    try {
        const parsedAddress = JSON.parse(addressString);
        console.log('Parsed address phone number:', parsedAddress.phone);
        return parsedAddress;
    }
    catch (e) {
        console.error('Error parsing address:', e);
        return null;
    }
};
const formatAddress = (addressData) => {
    if (!addressData)
        return '-';
    const parts = [
        addressData.address1,
        addressData.address2,
        addressData.city,
        addressData.province,
        addressData.zip,
        addressData.country
    ].filter(Boolean);
    return parts.join(', ');
};
const formatPhoneNumber = (phone) => {
    console.log('Formatting phone number:', phone);
    if (!phone) {
        console.log('Phone number is null or empty');
        return '-';
    }
    const digits = phone.replace(/\D/g, '');
    console.log('Phone digits after removing non-digits:', digits);
    if (digits.startsWith('6421')) {
        console.log('Converting 6421 prefix');
        return '0' + digits.slice(2);
    }
    else if (digits.startsWith('21')) {
        console.log('Converting 21 prefix');
        return '0' + digits;
    }
    else if (digits.startsWith('+6421')) {
        console.log('Converting +6421 prefix');
        return '0' + digits.slice(3);
    }
    console.log('No prefix conversion needed');
    return phone;
};
const calculateDispatchTime = (deliveryTime, travelTime) => {
    if (!deliveryTime)
        return null;
    const delivery = new Date(deliveryTime);
    const travelMinutes = travelTime || 5; // Use 5 as default if travelTime is null
    return new Date(delivery.getTime() - (travelMinutes * 60 * 1000)).toISOString();
};
const updateAllTravelTimes = async () => {
    const updatedTimes = {};
    const fetch = (await import('node-fetch')).default;
    for (const order of orders) {
        // Skip orders with manually set travel times
        if (order.isManualTravelTime) {
            continue;
        }
        try {
            const addressData = parseAddress(order.address);
            if (!addressData)
                continue;
            const formattedAddress = formatAddress(addressData);
            const response = await fetch(`/api/maps?type=distancematrix&address=${encodeURIComponent(formattedAddress)}&startAddress=${encodeURIComponent(START_ADDRESS)}`);
            if (!response.ok) {
                console.warn(`Failed to fetch travel time for order ${order.id}:`, response.status);
                continue;
            }
            const data = await response.json();
            if (data?.rows?.[0]?.elements?.[0]?.status === 'OK' && data.rows[0].elements[0].duration?.text) {
                const duration = data.rows[0].elements[0].duration.text;
                const minutes = parseInt(duration.split(' ')[0]);
                if (!isNaN(minutes)) {
                    updatedTimes[order.id] = minutes;
                    // Update order's travel time
                    const orderIndex = orders.findIndex(o => o.id === order.id);
                    if (orderIndex !== -1) {
                        orders[orderIndex] = {
                            ...orders[orderIndex],
                            travelTime: minutes,
                            dispatchTime: calculateDispatchTime(orders[orderIndex].deliveryTime, minutes)
                        };
                    }
                }
            }
        }
        catch (error) {
            console.warn(`Error updating travel time for order ${order.id}:`, error);
            continue;
        }
    }
    // Only broadcast if there are non-manual updates
    if (Object.keys(updatedTimes).length > 0) {
        const updateMessage = JSON.stringify({
            type: 'TRAVEL_TIME_UPDATE',
            travelTimes: updatedTimes,
            orders: orders
        });
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(updateMessage);
            }
        });
    }
};
// Set up periodic travel time updates
updateIntervalRef = setInterval(updateAllTravelTimes, UPDATE_INTERVAL);
// Create WebSocket server
const wss = new WebSocketServer({ port: wsPort });
console.log(`WebSocket server is running on port ${wsPort}`);
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket server');
    clients.add(ws);
    // Send initial data to client
    const initialData = JSON.stringify({
        type: 'INITIAL_DATA',
        orders: orders,
        drivers: drivers,
        productList: productList
    });
    ws.send(initialData);
    ws.addEventListener('message', async (event) => {
        try {
            const data = JSON.parse(event.data.toString());
            console.log('Received message:', data);
            if (data.type === 'ORDER_UPDATE') {
                const { orderId, updates } = data;
                console.log('Processing order update for:', orderId);
                console.log('Update payload:', updates);
                if (updates.phone) {
                    console.log('Phone number being updated to:', updates.phone);
                }
                if (updates.address) {
                    const addressData = parseAddress(updates.address);
                    console.log('Address update contains phone:', addressData?.phone);
                }
                // Find and update the order
                const orderIndex = orders.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    const oldOrder = orders[orderIndex];
                    console.log('Previous phone number:', oldOrder.phone);
                    console.log('Previous address phone:', parseAddress(oldOrder.address)?.phone);
                    orders[orderIndex] = {
                        ...orders[orderIndex],
                        ...updates
                    };
                    console.log('Updated order phone:', orders[orderIndex].phone);
                    console.log('Updated address phone:', parseAddress(orders[orderIndex].address)?.phone);
                    // Save updated orders to file
                    saveOrders();
                    // Broadcast the update to all connected clients
                    const updateMessage = JSON.stringify({
                        type: 'ORDER_UPDATE',
                        order: orders[orderIndex]
                    });
                    clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(updateMessage);
                        }
                    });
                }
            }
        }
        catch (error) {
            console.error('Error processing message:', error);
        }
    });
    ws.addEventListener('close', () => {
        console.log('Client disconnected from WebSocket server');
        clients.delete(ws);
    });
    ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
    });
});
// API endpoints
app.get('/api/orders', (req, res) => {
    res.json(orders);
});
// Stock-related endpoints
app.get('/api/stock/gilmours', (req, res) => {
    try {
        const gilmoursItems = productList.filter(item => item.handle === 'gilmours');
        res.json(gilmoursItems);
    }
    catch (error) {
        console.error('Error fetching Gilmours items:', error);
        res.status(500).json({ error: 'Failed to fetch Gilmours items' });
    }
});
app.get('/api/stock/bidfood', (req, res) => {
    try {
        const bidfoodItems = productList.filter(item => item.handle === 'bidfood');
        res.json(bidfoodItems);
    }
    catch (error) {
        console.error('Error fetching Bidfood items:', error);
        res.status(500).json({ error: 'Failed to fetch Bidfood items' });
    }
});
app.get('/api/stock/other', (req, res) => {
    try {
        const otherItems = productList.filter(item => item.handle === 'other');
        res.json(otherItems);
    }
    catch (error) {
        console.error('Error fetching other items:', error);
        res.status(500).json({ error: 'Failed to fetch other items' });
    }
});
app.get('/api/products', (req, res) => {
    try {
        res.json(productList);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// Start HTTP server
app.listen(httpPort, () => {
    console.log(`HTTP server is running on port ${httpPort}`);
});
// Clean up on server close
wss.on('close', () => {
    if (updateIntervalRef) {
        clearInterval(updateIntervalRef);
    }
});
// Handle server shutdown
process.on('SIGINT', () => {
    console.log('Shutting down WebSocket server...');
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});
