import React, { useState } from 'react';
import { Order } from '@/types';

interface EditOrderModalProps {
  order: Order;
  onSave: (order: Order) => Promise<void>;
  onClose: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onSave, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [editedOrder, setEditedOrder] = useState<Order>(order);
  const [deliveryTime, setDeliveryTime] = useState(() => {
    if (!order.deliveryTime) return '';
    // Convert UTC to local time for the input
    const date = new Date(order.deliveryTime);
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16);
  });

  console.log('EditOrderModal rendered with order:', {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    itemCount: order.items.length,
    deliveryTime: order.deliveryTime,
    localDeliveryTime: deliveryTime
  });

  const handleSave = async () => {
    try {
      console.log('=== Starting EditOrderModal Save ===');
      
      // Convert local time back to UTC for saving
      let updatedDeliveryTime = null;
      if (deliveryTime) {
        const localDate = new Date(deliveryTime);
        // Adjust for timezone offset to get UTC
        const utcDate = new Date(localDate.getTime() + (localDate.getTimezoneOffset() * 60000));
        updatedDeliveryTime = utcDate.toISOString();
      }

      console.log('Time conversion:', {
        input: deliveryTime,
        localDate: deliveryTime ? new Date(deliveryTime).toISOString() : null,
        utcDate: updatedDeliveryTime
      });

      const updatedOrder = {
        ...editedOrder,
        deliveryTime: updatedDeliveryTime
      };

      console.log('Saving order with updates:', {
        id: updatedOrder.id,
        deliveryTime: updatedOrder.deliveryTime,
        note: updatedOrder.note
      });

      setError(null);
      await onSave(updatedOrder);
      console.log('Save successful, closing modal...');
      onClose();
    } catch (error) {
      console.error('=== EditOrderModal Save Error ===');
      console.error('Error details:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      setError(error instanceof Error ? error.message : 'Failed to save order');
    }
  };

  const handleDeliveryTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('Delivery time changed:', {
      from: deliveryTime,
      to: newValue,
      localDate: newValue ? new Date(newValue).toISOString() : null
    });
    setDeliveryTime(newValue);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Order</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Time
            </label>
            <input
              type="datetime-local"
              value={deliveryTime}
              onChange={handleDeliveryTimeChange}
              className="w-full border rounded px-3 py-2"
              min={new Date().toISOString().slice(0, 16)}
            />
            {deliveryTime && (
              <div className="mt-1 text-sm text-gray-500">
                Local time: {new Date(deliveryTime).toLocaleString()}
              </div>
            )}
          </div>
          
          {/* ... rest of the form fields ... */}
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}; 