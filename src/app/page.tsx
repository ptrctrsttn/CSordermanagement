'use client';

import { useState, useEffect } from "react";
import { Order } from "@/types";

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const todayOrders = orders.filter(order => {
    if (!order.deliveryTime) return false;
    const deliveryDate = new Date(order.deliveryTime);
    const today = new Date();
    return (
      deliveryDate.getDate() === today.getDate() &&
      deliveryDate.getMonth() === today.getMonth() &&
      deliveryDate.getFullYear() === today.getFullYear()
    );
  });

  const pendingOrders = orders.filter(order => order.status === 'PENDING');
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome to Order Management System</h1>
        <p className="mt-2 text-gray-600">Select a section from the navigation menu to get started.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">Today's Orders</h2>
          <p className="mt-2 text-3xl font-semibold text-indigo-600">{todayOrders.length}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">Pending Orders</h2>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">{pendingOrders.length}</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">Today's Revenue</h2>
          <p className="mt-2 text-3xl font-semibold text-green-600">${todayRevenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
