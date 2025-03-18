'use client';

import React, { useState, useEffect } from 'react';
import { OrderList } from '@/components/OrderList';
import Calendar from 'react-calendar';
import type { Value } from 'react-calendar/dist/cjs/shared/types';
import 'react-calendar/dist/Calendar.css';
import { Order, ProductList } from '@/types';
import { MouseEvent } from 'react';

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

  const handleDateChange = (value: Value) => {
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

  // Get order count for a specific date
  const getOrderCount = (date: Date) => {
    return orders.filter(order => {
      const orderDate = order.deliveryTime 
        ? new Date(order.deliveryTime) 
        : order.dispatchTime 
          ? new Date(order.dispatchTime)
          : new Date(order.orderDate);
      
      return (
        orderDate.getFullYear() === date.getFullYear() &&
        orderDate.getMonth() === date.getMonth() &&
        orderDate.getDate() === date.getDate()
      );
    }).length;
  };

  // Custom tile content to show order count
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const count = getOrderCount(date);
      return (
        <div className="text-xs mt-1">
          <span className={`inline-flex items-center justify-center ${
            count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
          } rounded-full px-2 py-0.5`}>
            {count}
          </span>
        </div>
      );
    }
    return null;
  };

  // Custom tile className to highlight dates with orders
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const count = getOrderCount(date);
      const isSelected = 
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate();

      return `${count > 0 ? 'font-medium' : ''} ${
        isSelected ? 'bg-blue-50 text-blue-800' : ''
      }`;
    }
    return '';
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
    <div className="fixed inset-0 top-16 flex overflow-hidden">
      {/* Left sidebar with calendar and stock list */}
      <div className="w-[300px] bg-white border-r overflow-y-auto">
        <div className="p-4">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            className="w-full rounded-lg border shadow-sm p-2"
          />
          <style jsx global>{`
            .react-calendar {
              border: none;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .react-calendar__tile {
              padding: 1em 0.5em;
              position: relative;
              height: 70px;
            }
            .react-calendar__tile:enabled:hover,
            .react-calendar__tile:enabled:focus {
              background-color: #f0f9ff;
              color: #1e40af;
            }
            .react-calendar__tile--now {
              background-color: #fef3c7;
              color: #92400e;
            }
            .react-calendar__tile--now:enabled:hover,
            .react-calendar__tile--now:enabled:focus {
              background-color: #fef3c7;
              color: #92400e;
            }
            .react-calendar__month-view__days__day--weekend {
              color: #dc2626;
            }
            .react-calendar__navigation button:enabled:hover,
            .react-calendar__navigation button:enabled:focus {
              background-color: #f0f9ff;
            }
            .react-calendar__navigation button[disabled] {
              background-color: #f3f4f6;
            }
            .react-calendar__month-view__weekdays__weekday {
              padding: 0.5em;
              text-transform: uppercase;
              font-size: 0.8em;
              font-weight: 600;
              color: #6b7280;
            }
          `}</style>
        </div>
        <div className="p-4">
          {/* Stock list will go here */}
          <h2 className="text-xl font-bold mb-4">Stock List</h2>
          {/* Stock list content */}
        </div>
      </div>

      {/* Main content area with order list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm">
          <h1 className="text-2xl font-bold p-4">
            Orders for {selectedDate.toLocaleDateString()} ({filteredOrders.length})
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
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