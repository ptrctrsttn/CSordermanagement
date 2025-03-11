import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
let orders = [];
let drivers = [];
let productList = [];
const clients = new Set();
const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
const ORDERS_FILE = path.join(process.cwd(), 'orders.json');
const saveOrders = () => {
    try {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        console.log('Orders saved to file');
    }
    catch (error) {
        console.error('Error saving orders:', error);
    }
};
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
loadOrders();
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const START_ADDRESS = "562 richmond road grey lynn";
const UPDATE_INTERVAL = 60 * 60 * 1000;
let updateIntervalRef;
const parseAddress = (addressString) => {
    try {
        return JSON.parse(addressString);
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
    if (!phone)
        return '-';
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('6421')) {
        return '0' + digits.slice(2);
    }
    else if (digits.startsWith('21')) {
        return '0' + digits;
    }
    else if (digits.startsWith('+6421')) {
        return '0' + digits.slice(3);
    }
    return phone;
};
const calculateDispatchTime = (deliveryTime, travelTime) => {
    if (!deliveryTime)
        return null;
    const delivery = new Date(deliveryTime);
    const travelMinutes = travelTime || 5;
    return new Date(delivery.getTime() - (travelMinutes * 60 * 1000)).toISOString();
};
const updateAllTravelTimes = async () => {
    const updatedTimes = {};
    const fetch = (await import('node-fetch')).default;
    for (const order of orders) {
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
updateIntervalRef = setInterval(updateAllTravelTimes, UPDATE_INTERVAL);
const wss = new WebSocketServer({ port: 3002 });
console.log('WebSocket server starting on port 3002...');
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket server');
    clients.add(ws);
    const initialData = JSON.stringify({
        type: 'INITIAL_DATA',
        orders: orders,
        drivers: drivers,
        productList: productList
    });
    ws.send(initialData);
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('Received message:', data);
            if (data.type === 'ORDER_UPDATE') {
                const { orderId, updates } = data;
                console.log('Processing order update for:', orderId, updates);
                const orderIndex = orders.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    orders[orderIndex] = {
                        ...orders[orderIndex],
                        ...updates
                    };
                    saveOrders();
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
    ws.on('close', () => {
        console.log('Client disconnected from WebSocket server');
        clients.delete(ws);
    });
});
app.get('/api/orders', (req, res) => {
    res.json(orders);
});
app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
    console.log(`WebSocket server running on port 3002`);
});
wss.on('close', () => {
    if (updateIntervalRef) {
        clearInterval(updateIntervalRef);
    }
});
process.on('SIGINT', () => {
    console.log('Shutting down WebSocket server...');
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});
//# sourceMappingURL=websocket-server.js.map