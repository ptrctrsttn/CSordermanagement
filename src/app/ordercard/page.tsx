'use client';

import { useState } from 'react';
import { Order, OrderStatus } from '@prisma/client';

interface OrderCardProps {
  order: Order & {
    items: {
      id: string;
      quantity: number;
      price: number;
      product: {
        name: string;
      };
    }[];
  };
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  onEdit?: (orderId: string) => void;
}

export default function OrderCard({ order, onStatusChange, onEdit }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Order #{order.orderNumber}</h3>
          <p className="text-sm text-gray-600">{order.customerName}</p>
          <p className="text-sm text-gray-500">{order.customerEmail}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
            order.status === 'READY' ? 'bg-green-100 text-green-800' :
            order.status === 'DELIVERED' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
          }`}>
            {order.status}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Order Items</h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product.name}</span>
                  <span>{item.quantity} x ${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center border-t pt-4">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Order Date:</span>{' '}
                {new Date(order.orderDate).toLocaleDateString()}
              </p>
              {order.deliveryTime && (
                <p className="text-sm">
                  <span className="font-medium">Delivery Time:</span>{' '}
                  {new Date(order.deliveryTime).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {onStatusChange && (
                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                  className="rounded-md border-gray-300 text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="READY">Ready</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(order.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 