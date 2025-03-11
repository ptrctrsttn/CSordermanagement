'use client';

import React, { useState } from 'react';
import { Order, ProductList, Driver } from '@/types';
import { MapModal } from './MapModal';
import { EditOrderModal } from './EditModal';
import { format } from 'date-fns';

interface OrderListProps {
  orders: Order[];
  onOrderUpdate: (orderId: string, updates: any) => Promise<void>;
  sortBy?: 'dispatchTime' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  filterDate?: Date;
  productList?: ProductList[];
  drivers?: Driver[];
}

interface AddressData {
  first_name: string;
  last_name: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string | null;
}

const parseAddress = (addressString: string): AddressData | null => {
  try {
    return JSON.parse(addressString);
  } catch (e) {
    console.error('Error parsing address:', e);
    return null;
  }
};

const formatAddress = (addressData: AddressData | null): string => {
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

const cleanNote = (note: string | undefined): string | undefined => {
  if (!note) return undefined;
  
  // Check if the note ONLY contains delivery date and time information
  const deliveryInfoPattern = /^\s*Delivery Date:[^|]*\|\s*Delivery Time:[^|]*(AM|PM)\s*$/;
  if (deliveryInfoPattern.test(note)) {
    return undefined;
  }
  
  // If there's more content, clean up the delivery info from the end
  const cleaned = note.replace(/\s*\|\s*Delivery Date:[^|]*\|\s*Delivery Time:[^|]*(AM|PM)\s*$/g, '').trim();
  return cleaned || undefined;
};

const extractPhoneNumber = (note: string | undefined): string | undefined => {
  if (!note) return undefined;
  
  // Look for phone number in the format "Phone: <number>"
  const phoneMatch = note.match(/Phone:\s*([^\n|]+)/);
  if (phoneMatch) {
    return phoneMatch[1].trim();
  }
  
  return undefined;
};

const MeatValues = ({ productDetails }: { productDetails: ProductList | undefined }) => {
  if (!productDetails?.meat1 && !productDetails?.meat2) return null;
  
  return (
    <div className="ml-[10%] inline-flex items-center gap-4">
      {productDetails.meat1 && (
        <span className="text-red-600">{productDetails.meat1}</span>
      )}
      {productDetails.meat2 && (
        <span className="text-red-600">{productDetails.meat2}</span>
      )}
    </div>
  );
};

const OrderItems = ({ items, productList }: { items: Order['items']; productList?: ProductList[] }) => {
  if (!items || items.length === 0) return null;

  // Separate items into regular products and addons
  const { regularItems, addonItems } = items.reduce((acc, item) => {
    const productDetails = productList?.find(p => p.variantSku === item.product.sku);
    if (productDetails?.addon === 'yes') {
      acc.addonItems.push({ item, productDetails });
    } else {
      acc.regularItems.push({ item, productDetails });
    }
    return acc;
  }, { regularItems: [] as Array<{ item: any; productDetails: ProductList | undefined }>, 
       addonItems: [] as Array<{ item: any; productDetails: ProductList | undefined }> });

  return (
    <div className="py-2">
      <div className="flex items-start gap-4">
        {/* Regular Items */}
        <div className="flex-1">
          {regularItems.map(({ item, productDetails }, index) => (
            <div key={index} className="text-lg text-black flex items-center">
              <div className="w-[300px]">
                <span>{productDetails?.handle || item.product.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {productDetails?.meat1 && (
                  <span className="text-red-600 w-[30px]">{productDetails.meat1}</span>
                )}
                {productDetails?.meat2 && (
                  <span className="text-red-600 w-[30px]">{productDetails.meat2}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Addons - Now on the same line as first product */}
        {addonItems.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {addonItems.map(({ item, productDetails }, index) => (
              <div key={index} className="text-lg text-blue-600">
                <span>
                  {item.quantity > 1 ? `${item.quantity}x ` : ''}
                  {productDetails?.handle || item.product.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const OrderList: React.FC<OrderListProps> = ({ 
  orders,
  onOrderUpdate,
  sortBy = 'dispatchTime',
  sortDirection = 'asc',
  filterDate,
  productList,
  drivers = []
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localOrders, setLocalOrders] = useState(orders);
  const [showDispatchedOrders, setShowDispatchedOrders] = useState(false);

  // Load manual travel times from localStorage on mount
  React.useEffect(() => {
    const savedTravelTimes = localStorage.getItem('manualTravelTimes');
    if (savedTravelTimes) {
      const travelTimes = JSON.parse(savedTravelTimes);
      setLocalOrders(prevOrders => 
        prevOrders.map(order => {
          if (travelTimes[order.id]) {
            return {
              ...order,
              travelTime: travelTimes[order.id].time,
              isManualTravelTime: true,
              dispatchTime: order.deliveryTime 
                ? new Date(new Date(order.deliveryTime).getTime() - travelTimes[order.id].time * 60 * 1000).toISOString()
                : null
            };
          }
          return order;
        })
      );
    }
  }, []);

  // Update local orders when props change, preserving manual travel times
  React.useEffect(() => {
    const savedTravelTimes = localStorage.getItem('manualTravelTimes');
    const travelTimes = savedTravelTimes ? JSON.parse(savedTravelTimes) : {};
    
    setLocalOrders(orders.map(order => {
      if (travelTimes[order.id]) {
        return {
          ...order,
          travelTime: travelTimes[order.id].time,
          isManualTravelTime: true,
          dispatchTime: order.deliveryTime 
            ? new Date(new Date(order.deliveryTime).getTime() - travelTimes[order.id].time * 60 * 1000).toISOString()
            : null
        };
      }
      return order;
    }));
  }, [orders]);

  const handleTravelTimeUpdate = async (orderId: string, minutes: number) => {
    // Update local state immediately
    setLocalOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            travelTime: minutes,
            isManualTravelTime: true,
            dispatchTime: order.deliveryTime 
              ? new Date(new Date(order.deliveryTime).getTime() - minutes * 60 * 1000).toISOString()
              : null
          };
        }
        return order;
      });
    });

    // Save to localStorage
    const savedTravelTimes = localStorage.getItem('manualTravelTimes');
    const travelTimes = savedTravelTimes ? JSON.parse(savedTravelTimes) : {};
    travelTimes[orderId] = {
      time: minutes,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('manualTravelTimes', JSON.stringify(travelTimes));

    // Persist changes through WebSocket
    try {
      const ws = new WebSocket('ws://localhost:3002');
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'ORDER_UPDATE',
          orderId: orderId,
          updates: {
            travelTime: minutes,
            isManualTravelTime: true
          }
        }));
        ws.close();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Revert local state on error
        setLocalOrders(orders);
        // Remove from localStorage on error
        const currentTravelTimes = JSON.parse(localStorage.getItem('manualTravelTimes') || '{}');
        delete currentTravelTimes[orderId];
        localStorage.setItem('manualTravelTimes', JSON.stringify(currentTravelTimes));
      };
    } catch (error) {
      console.error('Failed to update travel time:', error);
      // Revert local state on error
      setLocalOrders(orders);
      // Remove from localStorage on error
      const currentTravelTimes = JSON.parse(localStorage.getItem('manualTravelTimes') || '{}');
      delete currentTravelTimes[orderId];
      localStorage.setItem('manualTravelTimes', JSON.stringify(currentTravelTimes));
    }
  };

  const handleDispatch = async (orderId: string) => {
    // Get current order
    const currentOrder = localOrders.find(order => order.id === orderId);
    if (!currentOrder) return;

    // Toggle dispatch status
    const newDispatchStatus = !currentOrder.isDispatched;

    // Update local state immediately
    setLocalOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            isDispatched: newDispatchStatus
          };
        }
        return order;
      });
    });

    const MAX_RETRIES = 3;
    let retryCount = 0;

    const attemptConnection = () => {
      console.log(`Attempting to connect to WebSocket server (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      
      try {
        const ws = new WebSocket('ws://localhost:3002');
        
        // Add a timeout to handle connection failures
        const connectionTimeout = setTimeout(() => {
          ws.close();
          console.error('WebSocket connection timeout');
          if (retryCount < MAX_RETRIES - 1) {
            retryCount++;
            attemptConnection();
          } else {
            console.error('Max retry attempts reached. Please ensure the WebSocket server is running.');
            // Revert local state
            setLocalOrders(prevOrders => {
              return prevOrders.map(order => {
                if (order.id === orderId) {
                  return {
                    ...order,
                    isDispatched: !newDispatchStatus
                  };
                }
                return order;
              });
            });
          }
        }, 5000);

        ws.onopen = () => {
          console.log('WebSocket connection established');
          clearTimeout(connectionTimeout);
          ws.send(JSON.stringify({
            type: 'ORDER_UPDATE',
            orderId: orderId,
            updates: {
              isDispatched: newDispatchStatus
            }
          }));
          console.log(`Order ${newDispatchStatus ? 'dispatched' : 'undispatched'}:`, orderId);
          ws.close();
        };

        ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket connection error:', error);
          if (retryCount < MAX_RETRIES - 1) {
            retryCount++;
            attemptConnection();
          } else {
            console.error('Max retry attempts reached after errors. Please ensure the WebSocket server is running.');
            // Revert local state
            setLocalOrders(prevOrders => {
              return prevOrders.map(order => {
                if (order.id === orderId) {
                  return {
                    ...order,
                    isDispatched: !newDispatchStatus
                  };
                }
                return order;
              });
            });
          }
        };

        ws.onclose = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket connection closed');
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        if (retryCount < MAX_RETRIES - 1) {
          retryCount++;
          attemptConnection();
        } else {
          console.error('Max retry attempts reached. Please ensure the WebSocket server is running.');
          // Revert local state
          setLocalOrders(prevOrders => {
            return prevOrders.map(order => {
              if (order.id === orderId) {
                return {
                  ...order,
                  isDispatched: !newDispatchStatus
                };
              }
              return order;
            });
          });
        }
      }
    };

    attemptConnection();
  };

  // Sort orders by dispatch time or creation date
  const sortedOrders = [...localOrders].sort((a, b) => {
    const getOrderTime = (order: Order) => {
      if (sortBy === 'dispatchTime') {
        return order.dispatchTime || order.deliveryTime || order.orderDate;
      }
      return order.orderDate;
    };

    const aTime = getOrderTime(a);
    const bTime = getOrderTime(b);
    const comparison = new Date(aTime || 0).getTime() - new Date(bTime || 0).getTime();
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Filter orders based on dispatch status
  const filteredOrders = filterDate 
    ? sortedOrders.filter(order => {
        const orderDate = new Date(order.dispatchTime || order.deliveryTime || order.orderDate || '');
        const dateMatches = orderDate.toDateString() === filterDate.toDateString();
        return showDispatchedOrders ? dateMatches : dateMatches && !order.isDispatched;
      })
    : sortedOrders.filter(order => showDispatchedOrders ? true : !order.isDispatched);

  const getProductHandle = (sku: string | null) => {
    if (!sku || !productList) return null;
    const product = productList.find(p => p.variantSku === sku);
    return product?.handle || null;
  };

  if (filteredOrders.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No orders found for the selected date
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 px-[2.5%]">
      {/* Dispatch Toggle */}
      <div className="sticky top-0 bg-gray-50 py-2 z-10 flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showDispatchedOrders}
            onChange={(e) => setShowDispatchedOrders(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show Dispatched Orders
        </label>
      </div>

      <div className="space-y-1 divide-gray-200">
        {filteredOrders.map((order) => {
          const addressData = parseAddress(order.address);
          const formattedAddress = formatAddress(addressData);
          const dispatchTime = order.dispatchTime ? new Date(order.dispatchTime) : null;
          const deliveryTime = order.deliveryTime ? new Date(order.deliveryTime) : null;
          const note = cleanNote(order.note);

          return (
            <div key={order.id} className={`bg-white hover:bg-gray-50 rounded shadow-sm ${order.isDispatched ? 'opacity-50' : ''}`}>
              {/* Main Grid Layout */}
              <div className="grid grid-cols-12 gap-4 items-center p-3 bg-gray-50">
                {/* Dispatch Button */}
                <div className="col-span-3 flex items-center gap-2">
                  <button
                    onClick={() => handleDispatch(order.id)}
                    className={`p-1.5 rounded-full hover:bg-gray-100 ${
                      order.isDispatched ? 'text-green-600 hover:text-red-600' : 'text-gray-500 hover:text-green-600'
                    }`}
                    title={order.isDispatched ? 'Undo Dispatch' : 'Dispatch Order'}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-5 h-5"
                    >
                      {order.isDispatched ? (
                        <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V8.688c0-1.44-1.555-2.342-2.805-1.628L12 11.03v-2.34c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
                      ) : (
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                      )}
                    </svg>
                  </button>

                  {/* Dispatch Time */}
                  <div className="text-sm font-medium">
                    {dispatchTime ? format(dispatchTime, 'h:mm a') : '-'}
                  </div>

                  {/* Travel Time */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={order.travelTime || ''}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value);
                        if (!isNaN(minutes) && minutes >= 0) {
                          handleTravelTimeUpdate(order.id, minutes);
                        }
                      }}
                      className={`w-12 px-1 py-0.5 text-sm border rounded shadow-sm hover:bg-gray-50 
                        ${order.isManualTravelTime ? 'bg-yellow-50' : 'bg-white'}`}
                      placeholder="-"
                      min="0"
                      title={order.isManualTravelTime ? 'Manually set travel time' : 'Automatically calculated travel time'}
                    />
                  </div>

                  {/* Driver Assignment */}
                  <select
                    value={order.driver?.id || ''}
                    onChange={(e) => {
                      const driverId = e.target.value;
                      const driver = drivers.find(d => d.id === driverId) || null;
                      onOrderUpdate(order.id, { driver });
                    }}
                    className="w-24 px-1 py-0.5 text-sm border rounded bg-white shadow-sm hover:bg-gray-50"
                  >
                    <option value="">Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address and Customer Details */}
                <div className="col-span-4 space-y-0.5">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowMapModal(true);
                    }}
                    className="text-left text-sm w-full truncate flex items-center gap-2 hover:text-gray-600"
                    title={formattedAddress}
                  >
                    <span>📍</span>
                    {formattedAddress}
                  </button>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <span>#{order.orderNumber}</span>
                    <span className="text-black">•</span>
                    <span>{addressData?.first_name} {addressData?.last_name}</span>
                    {addressData?.company && (
                      <>
                        <span className="text-black">•</span>
                        <span>{addressData.company}</span>
                      </>
                    )}
                    {extractPhoneNumber(order.note) && (
                      <>
                        <span className="text-black">•</span>
                        <span>{extractPhoneNumber(order.note)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delivery Time */}
                <div className="col-span-2 text-sm">
                  {deliveryTime ? format(deliveryTime, 'h:mm a') : '-'}
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  {note && (
                    <div style={{ height: 'calc(1.5em * 2)' }} className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                      <span className="text-sm text-blue-600 block leading-normal">
                        {note}
                      </span>
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowEditModal(true);
                    }}
                    className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100"
                    title="Edit order"
                  >
                    ✏️
                  </button>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white px-4">
                <OrderItems items={order.items} productList={productList} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {selectedOrder && showMapModal && (
        <MapModal
          address={formatAddress(parseAddress(selectedOrder.address))}
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            setSelectedOrder(null);
          }}
          onDurationUpdate={(duration) => {
            const minutes = parseInt(duration.split(' ')[0]);
            if (!isNaN(minutes) && selectedOrder) {
              handleTravelTimeUpdate(selectedOrder.id, minutes);
            }
          }}
          orderId={selectedOrder.id}
          isManualTravelTime={selectedOrder.isManualTravelTime || false}
        />
      )}

      {selectedOrder && showEditModal && (
        <EditOrderModal
          order={selectedOrder}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
          onSave={onOrderUpdate}
          productList={productList}
        />
      )}
    </div>
  );
};