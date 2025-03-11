import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import cors from 'cors';
import { format } from 'date-fns';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Store orders in memory
let orders: Order[] = [];
let drivers: Driver[] = [];
let productList: ProductList[] = [];

// Store WebSocket clients
const clients = new Set<WebSocket>();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// File path for persisting orders
const ORDERS_FILE = path.join(process.cwd(), 'orders.json');

// Function to save orders to file
const saveOrders = () => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    console.log('Orders saved to file');
  } catch (error: any) {
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
    } else {
      console.log('No existing orders file found');
      orders = [];
    }
  } catch (error: any) {
    console.error('Error loading orders:', error);
    orders = [];
  }
};

// Load orders when server starts
loadOrders();

interface AddressData {
  first_name: string
  last_name: string
  company: string | null
  address1: string
  address2: string | null
  city: string
  province: string
  zip: string
  country: string
  phone: string | null
}

interface Driver {
  id: string
  name: string
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    name: string
    sku: string | null
  }
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  address: string
  status: string
  orderDate: string
  deliveryTime: string | null
  travelTime: number | null
  driver: Driver | null
  items: OrderItem[]
  phone: string | null
  note?: string
  createdAt?: string
  dispatchTime: string | null
  isDispatched?: boolean
  isManualTravelTime?: boolean
}

interface ProductList {
  id: string;
  addon: string;
  handle: string;
  totalCost: string | null;
  listOfIng: string | null;
  meat1: string | null;
  meat2: string | null;
  option1: string | null;
  option2: string | null;
  serveware: string | null;
  timerA: string | null;
  timerB: string | null;
  skuSearch: string | null;
  variantSku: string;
}

interface GoogleMapsResponse {
  rows?: Array<{
    elements?: Array<{
      status?: string;
      duration?: {
        text: string;
      };
    }>;
  }>;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const START_ADDRESS = "562 richmond road grey lynn"
const UPDATE_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

// Store the update interval reference
let updateIntervalRef: NodeJS.Timeout;

const parseAddress = (addressString: string): AddressData | null => {
  try {
    return JSON.parse(addressString)
  } catch (e) {
    console.error('Error parsing address:', e)
    return null
  }
}

const formatAddress = (addressData: AddressData | null): string => {
  if (!addressData) return '-'
  
  const parts = [
    addressData.address1,
    addressData.address2,
    addressData.city,
    addressData.province,
    addressData.zip,
    addressData.country
  ].filter(Boolean)
  
  return parts.join(', ')
}

const formatPhoneNumber = (phone: string | null): string => {
  if (!phone) return '-'
  
  const digits = phone.replace(/\D/g, '')
  
  if (digits.startsWith('6421')) {
    return '0' + digits.slice(2)
  } else if (digits.startsWith('21')) {
    return '0' + digits
  } else if (digits.startsWith('+6421')) {
    return '0' + digits.slice(3)
  }
  
  return phone
}

const calculateDispatchTime = (deliveryTime: string | null, travelTime: number | null): string | null => {
  if (!deliveryTime) return null
  const delivery = new Date(deliveryTime)
  const travelMinutes = travelTime || 5 // Use 5 as default if travelTime is null
  return new Date(delivery.getTime() - (travelMinutes * 60 * 1000)).toISOString()
}

const updateAllTravelTimes = async () => {
  const updatedTimes: { [key: string]: number } = {};
  const fetch = (await import('node-fetch')).default;
  
  for (const order of orders) {
    // Skip orders with manually set travel times
    if (order.isManualTravelTime) {
      continue;
    }

    try {
      const addressData = parseAddress(order.address);
      if (!addressData) continue;

      const formattedAddress = formatAddress(addressData);
      const response = await fetch(
        `/api/maps?type=distancematrix&address=${encodeURIComponent(formattedAddress)}&startAddress=${encodeURIComponent(START_ADDRESS)}`
      );
      
      if (!response.ok) {
        console.warn(`Failed to fetch travel time for order ${order.id}:`, response.status);
        continue;
      }

      const data = await response.json() as GoogleMapsResponse;
      
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
    } catch (error) {
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
const wss = new WebSocketServer({ port: 3002 });

console.log('WebSocket server starting on port 3002...');

wss.on('connection', (ws: WebSocket) => {
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

  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);

      if (data.type === 'ORDER_UPDATE') {
        const { orderId, updates } = data;
        console.log('Processing order update for:', orderId, updates);

        // Find and update the order
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
          orders[orderIndex] = {
            ...orders[orderIndex],
            ...updates
          };

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
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket server');
    clients.delete(ws);
  });
});

// API endpoints
app.get('/api/orders', (req: Request, res: Response) => {
  res.json(orders);
});

app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
  console.log(`WebSocket server running on port 3002`);
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