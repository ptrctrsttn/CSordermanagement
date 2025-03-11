'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { OrderList } from '@/components/OrderList';
import { Order, ProductList, Driver } from '@/types';
import { MapModal } from '@/components/OrderList/MapModal';
import { EditOrderModal } from '@/components/OrderList/EditModal';
import { parseAddress, formatAddress } from '@/utils/address';

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 2000; // 2 seconds

export default function RealtimePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [productList, setProductList] = useState<ProductList[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [estimatedTravelTimes, setEstimatedTravelTimes] = useState<{ [key: string]: number }>({});

  // WebSocket setup
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;

    const connect = () => {
      try {
        ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3002');

        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'INITIAL_DATA':
                setOrders(data.orders);
                break;
              case 'ORDER_UPDATE':
                setOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.id === data.orderId 
                      ? { ...order, ...data.updates }
                      : order
                  )
                );
                break;
              case 'TRAVEL_TIME_UPDATE':
                setEstimatedTravelTimes(prev => ({
                  ...prev,
                  ...data.travelTimes
                }));
                break;
              default:
                console.warn('Unknown message type:', data.type);
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.warn('WebSocket error:', error);
          setWsConnected(false);
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          setWsConnected(false);
          
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            reconnectTimeout = setTimeout(connect, RECONNECT_INTERVAL * reconnectAttempts);
          } else {
            console.error('Max reconnection attempts reached. Please refresh the page.');
          }
        };

      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        setWsConnected(false);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchOrders();
    fetchDrivers();
    fetchProductList();
  }, []);

  // Set up periodic refresh
  useEffect(() => {
    const refreshOrders = () => {
      fetchOrders();
      setLastRefresh(new Date());
    };

    const interval = setInterval(refreshOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers');
      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchProductList = async () => {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch('/api/product-list');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProductList(data || []);
        break;
      } catch (error) {
        console.error(`Error fetching product list (attempt ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
        if (retryCount === maxRetries) {
          setProductList([]);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
  };

  const handleOrderUpdate = async (orderId: string, updates: any) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      // Refresh orders after update
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      setError('Failed to update order');
    }
  };

  const handleEstimatedTravelTime = (orderId: string, duration: string) => {
    const minutes = parseInt(duration.split(' ')[0]);
    if (!isNaN(minutes)) {
      setEstimatedTravelTimes(prev => ({
        ...prev,
        [orderId]: minutes
      }));
      
      fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TRAVEL_TIME_UPDATE',
          travelTimes: { [orderId]: minutes }
        })
      }).catch(console.error);
    }
  };

  const calculateDispatchTime = (deliveryTime: string | null, travelTime: number | null) => {
    if (!deliveryTime) return null;
    const delivery = new Date(deliveryTime);
    const travelMinutes = travelTime || 5;
    return new Date(delivery.getTime() - (travelMinutes * 60 * 1000));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="flex-none bg-white shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">All Orders</h1>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-600' : 'bg-red-600'}`} />
              <span className="text-sm">{wsConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={() => {
                fetchOrders();
                setLastRefresh(new Date());
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Refresh Orders
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No orders found
          </div>
        ) : (
          <OrderList
            orders={orders.map(order => ({
              ...order,
              dispatchTime: calculateDispatchTime(order.deliveryTime, order.travelTime)?.toISOString() || null
            }))}
            onOrderUpdate={handleOrderUpdate}
            sortBy="dispatchTime"
            sortDirection="asc"
            productList={productList}
            drivers={drivers}
          />
        )}

        {selectedAddress && (
          <MapModal
            address={selectedAddress}
            isOpen={!!selectedAddress}
            onClose={() => setSelectedAddress(null)}
            onDurationUpdate={(duration) => {
              const order = orders.find(o => formatAddress(parseAddress(o.address)) === selectedAddress);
              if (order) {
                handleEstimatedTravelTime(order.id, duration);
              }
            }}
            orderId={orders.find(o => formatAddress(parseAddress(o.address)) === selectedAddress)?.id || ''}
            isManualTravelTime={orders.find(o => formatAddress(parseAddress(o.address)) === selectedAddress)?.isManualTravelTime || false}
          />
        )}

        {editingOrder && (
          <EditOrderModal
            order={editingOrder}
            isOpen={!!editingOrder}
            onClose={() => setEditingOrder(null)}
            onSave={handleOrderUpdate}
            productList={productList}
          />
        )}
      </div>
    </div>
  );
} 