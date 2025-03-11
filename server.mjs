import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import cors from 'cors';
import { format } from 'date-fns';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const START_ADDRESS = "562 richmond road grey lynn";
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

const wss = new WebSocketServer({ port: 3002 });

// Store connected clients and data
const clients = new Set();
let orders = [];
let drivers = [];
let productList = [];

const parseAddress = (addressString) => {
  try {
    return JSON.parse(addressString);
  } catch (e) {
    console.error('Error parsing address:', e);
    return null;
  }
};

const formatAddress = (addressData) => {
  if (!addressData) return '-';
  
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
  if (!phone) return '-';
  
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('6421')) {
    return '0' + digits.slice(2);
  } else if (digits.startsWith('21')) {
    return '0' + digits;
  } else if (digits.startsWith('+6421')) {
    return '0' + digits.slice(3);
  }
  
  return phone;
};

const calculateDispatchTime = (deliveryTime, travelTime) => {
  if (!deliveryTime) return null;
  const delivery = new Date(deliveryTime);
  const travelMinutes = travelTime || 5; // Use 5 as default if travelTime is null
  return new Date(delivery.getTime() - (travelMinutes * 60 * 1000)).toISOString();
};

const updateAllTravelTimes = async () => {
  const updatedTimes = {};
  
  for (const order of orders) {
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

      const data = await response.json();
      
      if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
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

  // Broadcast updates to all clients
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
setInterval(updateAllTravelTimes, UPDATE_INTERVAL);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  clients.add(ws);
  console.log('Client connected');

  // Send initial data to new client
  ws.send(JSON.stringify({
    type: 'INIT',
    orders: orders.map(order => ({
      ...order,
      dispatchTime: calculateDispatchTime(order.deliveryTime, order.travelTime)
    })),
    drivers,
    productList
  }));

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'ORDER_UPDATE':
          const { orderId, updates } = data;
          const orderIndex = orders.findIndex(o => o.id === orderId);
          
          if (orderIndex !== -1) {
            orders[orderIndex] = {
              ...orders[orderIndex],
              ...updates,
              dispatchTime: calculateDispatchTime(
                updates.deliveryTime || orders[orderIndex].deliveryTime,
                updates.travelTime || orders[orderIndex].travelTime
              )
            };

            // Broadcast update to all clients
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
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
});

// Set up ping interval to keep connections alive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

// Start HTTP server
app.listen(port, () => {
  console.log(`HTTP server running on port ${port}`);
}); 