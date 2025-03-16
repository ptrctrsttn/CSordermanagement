'use client';

import React, { useState, useEffect } from 'react';
import { OrderList } from '@/components/OrderList';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Order, ProductList } from '@/types';

type CalendarValue = Date | Date[] | null;

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [productList, setProductList] = useState<ProductList[]>([]);

  // Fetch orders when component mounts
  useEffect(() => {
    console.log('Setting up initial fetch');
    fetchOrders();
    fetchProductList();
  }, []); 

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders...');
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      console.log('Fetched orders:', data.length);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductList = async () => {
    try {
      console.log('Fetching product list...');
      const response = await fetch('/api/product-list');
      if (!response.ok) {
        throw new Error('Failed to fetch product list');
      }
      const data = await response.json();
      console.log('Fetched product list:', data.length);
      setProductList(data);
    } catch (error) {
      console.error('Error fetching product list:', error);
    }
  };

  const handleDateChange = (value: CalendarValue) => {
    if (value instanceof Date) {
      console.log('Selected date:', value.toISOString());
      setSelectedDate(value);
    }
  };

  const handleOrderUpdate = async (orderId: string, updates: any) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // Filter orders for the selected date
  const filteredOrders = orders.filter(order => {
    if (!order.orderDate) {
      console.log('Order missing date:', order);
      return false;
    }

    const orderDate = order.deliveryTime 
      ? new Date(order.deliveryTime) 
      : order.dispatchTime 
        ? new Date(order.dispatchTime)
        : new Date(order.orderDate);
    
    const isSameDay = (
      orderDate.getFullYear() === selectedDate.getFullYear() &&
      orderDate.getMonth() === selectedDate.getMonth() &&
      orderDate.getDate() === selectedDate.getDate()
    );

    if (isSameDay) {
      console.log('Found order for selected date:', order.orderNumber);
    }

    return isSameDay;
  });

  console.log('Total orders:', orders.length);
  console.log('Filtered orders:', filteredOrders.length);

  return (
    <div className="fixed inset-0 top-16 flex">
      {/* Left sidebar with calendar and stock list */}
      <div className="w-[300px] bg-white border-r">
        <div className="p-4">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
          />
        </div>
        <div className="p-4">
          {/* Stock list will go here */}
          <h2 className="text-xl font-bold mb-4">Stock List</h2>
          {/* Stock list content */}
        </div>
      </div>

      {/* Main content area with order list */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm">
          <h1 className="text-2xl font-bold p-4">
            Orders for {selectedDate.toLocaleDateString()} ({filteredOrders.length})
          </h1>
        </div>
        <div className="flex-1">
          <OrderList
            orders={filteredOrders}
            onOrderUpdate={handleOrderUpdate}
            filterDate={selectedDate}
            sortBy="dispatchTime"
            productList={productList}
          />
        </div>
      </div>
    </div>
  );
} 