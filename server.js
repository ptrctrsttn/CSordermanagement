import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const START_ADDRESS = "562 richmond road grey lynn";

// Create WebSocket server
const wss = new WebSocketServer({ port: 3002 });

// Store state
let orders = [];
let drivers = [];
let productList = [];

// Helper function to calculate dispatch time
function calculateDispatchTime(deliveryTime, travelTime) {
  if (!deliveryTime) return null;
  const delivery = new Date(deliveryTime);
  const travelMinutes = travelTime || 5; // Use 5 as default
  return new Date(delivery.getTime() - (travelMinutes * 60 * 1000)).toISOString();
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'INIT',
    orders: orders.map(order => ({
      ...order,
      dispatchTime: calculateDispatchTime(order.deliveryTime, order.travelTime)
    })),
    drivers,
    productList
  }));

  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received WebSocket message:', data);

      switch (data.type) {
        case 'INIT_DATA':
          // Store initial data received from client
          orders = data.orders || [];
          drivers = data.drivers || [];
          productList = data.productList || [];
          console.log('Initialized server with data:', { 
            ordersCount: orders.length, 
            driversCount: drivers.length,
            productListCount: productList.length 
          });
          break;

        case 'TRAVEL_TIME_UPDATE':
          console.log('Processing travel time update:', data);
          const { address, duration, orderId } = data;
          // Extract minutes from duration string (e.g. "25 mins" -> 25)
          const minutes = parseInt(duration.split(' ')[0]);
          
          if (!isNaN(minutes)) {
            // Update travel time for the order
            const orderIndex = orders.findIndex(o => o.id === orderId);
            console.log('Found order index:', orderIndex, 'for orderId:', orderId);
            
            if (orderIndex !== -1) {
              orders[orderIndex] = {
                ...orders[orderIndex],
                travelTime: minutes,
                isManualTravelTime: false,
                dispatchTime: calculateDispatchTime(orders[orderIndex].deliveryTime, minutes)
              };

              // Broadcast update
              const updateMessage = JSON.stringify({
                type: 'ORDER_UPDATE',
                order: orders[orderIndex]
              });

              console.log('Broadcasting travel time update:', updateMessage);
              wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(updateMessage);
                }
              });
            }
          }
          break;

        case 'ORDER_UPDATE':
          console.log('Processing order update:', data);
          const { orderId: updateId, updates } = data;
          const orderIndex = orders.findIndex(o => o.id === updateId);
          console.log('Found order index:', orderIndex, 'for orderId:', updateId);
          
          if (orderIndex !== -1) {
            orders[orderIndex] = {
              ...orders[orderIndex],
              ...updates,
              dispatchTime: calculateDispatchTime(
                updates.deliveryTime || orders[orderIndex].deliveryTime,
                updates.travelTime || orders[orderIndex].travelTime
              )
            };

            // Broadcast update
            const updateMessage = JSON.stringify({
              type: 'ORDER_UPDATE',
              order: orders[orderIndex]
            });

            console.log('Broadcasting order update:', updateMessage);
            wss.clients.forEach(client => {
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

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// HTTP endpoints
app.get('/api/orders', (req, res) => {
  res.json(orders.map(order => ({
    ...order,
    dispatchTime: calculateDispatchTime(order.deliveryTime, order.travelTime)
  })));
});

app.get('/api/drivers', (req, res) => {
  res.json(drivers);
});

app.get('/api/product-list', (req, res) => {
  res.json(productList);
});

// Start servers
wss.on('listening', () => {
  console.log('WebSocket server running on port 3002');
});

app.listen(port, () => {
  console.log(`HTTP server running on port ${port}`);
}); 