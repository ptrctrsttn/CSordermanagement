'use client';

import { useState, useEffect } from 'react';
import { OrderList } from '@/components/OrderList';
import type { Order } from '@/types/index';

export default function TestPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [productList, setProductList] = useState<any[]>([]);

  // Fetch orders when component mounts
  useEffect(() => {
    fetchOrders();
    fetchProductList();
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

  const fetchProductList = async () => {
    try {
      const response = await fetch('/api/product-list');
      if (!response.ok) throw new Error('Failed to fetch product list');
      const data = await response.json();
      setProductList(data);
    } catch (error) {
      console.error('Error fetching product list:', error);
    }
  };

  const handleOrderUpdate = async (orderId: string, updates: any) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update order');
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  return (
    <div className="fixed inset-0 top-16">
      <OrderList
        orders={orders}
        onOrderUpdate={handleOrderUpdate}
        sortBy="dispatchTime"
        productList={productList}
      />
    </div>
  );
} 