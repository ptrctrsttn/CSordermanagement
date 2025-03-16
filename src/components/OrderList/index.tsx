'use client';

import React, { useState, useEffect } from 'react';
import type { Order, OrderItem, Driver, ProductList, OrderStatus } from '@/types/index';
import { MapModal } from './MapModal';
import { EditOrderModal } from './EditModal';
import { format } from 'date-fns';

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

const parseAddress = (addressString: string | undefined): AddressData | null => {
  if (!addressString) return null;
  try {
    return JSON.parse(addressString);
  } catch (e) {
    console.error('Error parsing address:', e);
    return null;
  }
};

const formatAddress = (addressData: AddressData | null): string => {
  if (!addressData) return '';
  const parts = [
    addressData.address1,
    addressData.address2,
    addressData.city,
    addressData.province,
    addressData.zip
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

const calculateDispatchTime = (deliveryTime: string | undefined | null, travelTime: number | undefined | null): string | undefined => {
  if (!deliveryTime || !travelTime) return undefined;
  return new Date(new Date(deliveryTime).getTime() - travelTime * 60 * 1000).toISOString();
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
  }, { 
    regularItems: [] as Array<{ item: OrderItem; productDetails: ProductList | undefined }>, 
    addonItems: [] as Array<{ item: OrderItem; productDetails: ProductList | undefined }> 
  });

  return (
    <div className="py-1">
      <div className="flex items-start">
        {/* Regular Items */}
        <div className="w-[30%]">
          {regularItems.map(({ item, productDetails }: { item: OrderItem; productDetails: ProductList | undefined }, index: number) => (
            <div key={index} className="text-2xl text-black flex items-center">
              {/* SERVEWARE indicator */}
              <div className="w-[30px] text-base font-bold text-red-600">
                {productDetails?.serveware === 'SW' ? 'SW' : ''}
              </div>
              <div className="w-[300px]">
                <span>{productDetails?.handle || item.product.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {productDetails?.meat1 && (
                  <span className="text-red-600 w-[30px] text-xl">{productDetails.meat1}</span>
                )}
                {productDetails?.meat2 && (
                  <span className="text-red-600 w-[30px] text-xl">{productDetails.meat2}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Addons - Positioned at 30% from left */}
        {addonItems.length > 0 && (
          <div className="flex flex-wrap items-center">
            {addonItems.map(({ item, productDetails }: { item: OrderItem; productDetails: ProductList | undefined }, index: number) => (
              <>
                <div key={index} className="text-2xl text-black">
                  <span>
                    {item.quantity > 1 ? `${item.quantity}x ` : ''}
                    {productDetails?.handle || item.product.name}
                  </span>
                </div>
                {index < addonItems.length - 1 && (
                  <span className="text-pink-500 mx-2 text-xl">•</span>
                )}
              </>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface OrderListProps {
  orders: Order[];
  onOrderUpdate: (orderId: string, updates: any) => Promise<void>;
  sortBy?: 'dispatchTime' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  filterDate?: Date;
  productList?: ProductList[];
}

export const OrderList: React.FC<OrderListProps> = ({ 
  orders,
  onOrderUpdate,
  sortBy = 'dispatchTime',
  sortDirection = 'asc',
  filterDate,
  productList,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string | null>(null);
  const [notesPopupPosition, setNotesPopupPosition] = useState({ top: 0, left: 0 });
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [showDispatchedOrders, setShowDispatchedOrders] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Add driver fetching
  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers');
      if (!response.ok) throw new Error('Failed to fetch drivers');
      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Update driver assignment
  const handleDriverAssignment = async (orderId: string, driverId: string) => {
    try {
      const ws = new WebSocket('ws://localhost:3002');
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'ORDER_UPDATE',
          orderId: orderId,
          updates: {
            driverId: driverId || null
          }
        }));
        ws.close();
      };

      // Update local state
      setLocalOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.id === orderId) {
            const selectedDriver = driverId ? drivers.find(d => d.id === driverId) || null : null;
            return {
              ...order,
              driver: selectedDriver,
              driverId: driverId || null
            };
          }
          return order;
        });
      });
    } catch (error) {
      console.error('Error updating driver assignment:', error);
    }
  };

  // Add click outside handler
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notes-popup') && !target.closest('.notes-trigger')) {
        setShowNotesPopup(false);
        setSelectedNotes(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          const updatedOrder = {
            ...order,
            travelTime: minutes,
            isManualTravelTime: true,
            dispatchTime: calculateDispatchTime(order.deliveryTime, minutes),
            status: order.status,
            totalAmount: order.totalAmount,
            shopifyId: order.shopifyId,
            customerEmail: order.customerEmail,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          } satisfies Order;
          return updatedOrder;
        }
        return order;
      });
    });

    // Store in localStorage
    const currentTravelTimes = JSON.parse(localStorage.getItem('manualTravelTimes') || '{}');
    currentTravelTimes[orderId] = minutes;
    localStorage.setItem('manualTravelTimes', JSON.stringify(currentTravelTimes));

    // Persist changes through WebSocket
    try {
      console.log('Opening WebSocket connection for travel time update');
      const ws = new WebSocket('ws://localhost:3002');

      ws.onopen = () => {
        console.log('WebSocket connection opened successfully');
        const message = {
          type: 'ORDER_UPDATE',
          orderId: orderId,
          updates: {
            travelTime: minutes,
            isManualTravelTime: true
          }
        };
        console.log('Preparing to send WebSocket message:', message);
        ws.send(JSON.stringify(message));
        console.log('WebSocket message sent');
        
        // Don't close immediately, wait for response
        setTimeout(() => {
          console.log('Closing WebSocket connection after timeout');
          ws.close();
        }, 1000);
      };

      ws.onmessage = (event) => {
        console.log('Received WebSocket response:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed WebSocket response:', data);
          
          if (data.type === 'ORDER_UPDATE' && data.orderId === orderId) {
            console.log('Received matching order update, updating local state');
            setLocalOrders(prevOrders =>
              prevOrders.map(order =>
                order.id === orderId
                  ? {
                      ...order,
                      travelTime: data.updates.travelTime,
                      isManualTravelTime: true,
                      dispatchTime: calculateDispatchTime(order.deliveryTime, data.updates.travelTime),
                      status: order.status,
                      totalAmount: order.totalAmount,
                      shopifyId: order.shopifyId,
                      customerEmail: order.customerEmail,
                      createdAt: order.createdAt,
                      updatedAt: order.updatedAt
                    } satisfies Order
                  : order
              )
            );
          }
        } catch (error) {
          console.error('Error parsing WebSocket response:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Revert local state on error
        console.log('Reverting local state due to WebSocket error');
        setLocalOrders(orders);
        // Remove from localStorage on error
        const currentTravelTimes = JSON.parse(localStorage.getItem('manualTravelTimes') || '{}');
        delete currentTravelTimes[orderId];
        localStorage.setItem('manualTravelTimes', JSON.stringify(currentTravelTimes));
      };
    } catch (error) {
      console.error('Failed to update travel time:', error);
      // Revert local state on error
      console.log('Reverting local state due to error');
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
          const updatedOrder = {
            ...order,
            isDispatched: newDispatchStatus,
            status: order.status,
            totalAmount: order.totalAmount,
            shopifyId: order.shopifyId,
            customerEmail: order.customerEmail,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          } satisfies Order;
          return updatedOrder;
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
    <div className="h-full w-full overflow-y-auto bg-gray-50">
      {/* Dispatch Toggle */}
      <div className="sticky top-0 bg-gray-50 py-1 z-10 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showDispatchedOrders}
            onChange={(e) => setShowDispatchedOrders(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show Dispatched Orders
        </label>

        <button
          onClick={async () => {
            console.log('Clock icon clicked - Starting sequential travel time updates');
            
            // Filter orders that need travel time updates
            const ordersToUpdate = filteredOrders.filter(order => !order.isManualTravelTime);
            console.log(`Found ${ordersToUpdate.length} orders to update`);

            // Process each order sequentially
            for (const order of ordersToUpdate) {
              console.log(`Processing order ${order.id}`);
              
              // Skip if no valid address
              const addressData = parseAddress(order.address);
              if (!addressData) {
                console.log(`Skipping order ${order.id} - invalid address format`);
                continue;
              }

              const formattedAddress = formatAddress(addressData);
              if (formattedAddress === '') {
                console.log(`Skipping order ${order.id} - no valid address`);
                continue;
              }

              // Set the current order and open map modal
              setSelectedOrder(order);
              setShowMapModal(true);

              // Wait for modal to be closed before proceeding to next order
              await new Promise(resolve => {
                const checkModal = setInterval(() => {
                  if (!showMapModal) {
                    clearInterval(checkModal);
                    resolve(true);
                  }
                }, 100);
              });

              // Add a small delay between orders
              await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log('Completed processing all orders');
            setSelectedOrder(null);
          }}
          className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700"
          title="Update all travel times"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-5 h-5"
          >
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-0.5 divide-gray-200">
        {filteredOrders.map((order) => {
          const addressData = parseAddress(order.address);
          const formattedAddress = formatAddress(addressData);
          const dispatchTime = order.dispatchTime ? new Date(order.dispatchTime) : null;
          const deliveryTime = order.deliveryTime ? new Date(order.deliveryTime) : null;
          const note = cleanNote(order.note);

          return (
            <div key={order.id} className={`bg-white hover:bg-gray-50 rounded shadow-sm ${order.isDispatched ? 'opacity-50' : ''}`}>
              {/* Main Grid Layout */}
              <div className="grid grid-cols-12 gap-2 items-center p-0.5" style={{ backgroundColor: '#FFF8E2' }}>
                {/* All Controls Container - Far Left */}
                <div className="col-span-3 flex items-center gap-1">
                  {/* Icons */}
                  <div className="flex items-center gap-1">
                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowEditModal(true);
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 text-lg"
                      title="Edit order"
                    >
                      ✏️
                    </button>

                    {/* Dispatch Button */}
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
                        className="w-6 h-6"
                      >
                        {order.isDispatched ? (
                          <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V8.688c0-1.44-1.555-2.342-2.805-1.628L12 11.03v-2.34c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
                        ) : (
                          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        )}
                      </svg>
                    </button>
                  </div>

                  {/* Time and Controls */}
                  <div className="flex items-center gap-1 ml-1">
                    {/* Dispatch Time */}
                    <div className="text-lg font-medium w-[7rem]">
                      {dispatchTime ? format(dispatchTime, 'h:mm a') + ' ' : '-'}
                    </div>

                    {/* Travel Time */}
                    <input
                      type="number"
                      value={order.travelTime || ''}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value);
                        if (!isNaN(minutes) && minutes >= 0) {
                          handleTravelTimeUpdate(order.id, minutes);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className={`w-14 px-1 py-0.5 text-base border rounded shadow-sm hover:bg-gray-50 
                        ${order.isManualTravelTime ? 'bg-yellow-50' : 'bg-white'}`}
                      placeholder="-"
                      min="0"
                      title={order.isManualTravelTime ? 'Manually set travel time' : 'Automatically calculated travel time'}
                    />

                    {/* Driver Assignment */}
                    <select
                      value={order.driverId || ''}
                      onChange={(e) => handleDriverAssignment(order.id, e.target.value)}
                      className="w-28 px-1 py-0.5 text-base border rounded bg-white shadow-sm hover:bg-gray-50"
                    >
                      <option value="">Driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>

                    {/* Order Number and Phone */}
                    <div className="flex items-center gap-1 ml-1">
                      <span className="text-sm text-black">#{order.orderNumber.replace('#', '')} • {order.attributes?.Phone || '000000000'} • {deliveryTime ? format(deliveryTime, 'h:mm a') : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="col-span-3">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowMapModal(true);
                    }}
                    className="text-left text-lg w-full truncate hover:text-gray-600"
                    title={formattedAddress}
                  >
                    {formattedAddress}
                  </button>
                </div>

                {/* Customer Info - Single Column */}
                <div className="col-span-2 flex flex-col justify-center items-center text-base">
                  <div className="text-center">
                    <span>{addressData?.first_name} {addressData?.last_name}</span>
                    {addressData?.company && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{addressData.company}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes - Fixed to right side */}
                <div className="col-span-4">
                  {note && (
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setNotesPopupPosition({
                          top: rect.bottom + window.scrollY,
                          left: rect.left + window.scrollX
                        });
                        setSelectedNotes(note);
                        setShowNotesPopup(true);
                      }}
                      className="w-full text-left notes-trigger"
                    >
                      <div className="max-h-[2em] overflow-hidden">
                        <span className="text-base text-blue-600 block leading-[1.4em] whitespace-pre-wrap">
                          {note}
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white px-4 py-0.5">
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
            console.log('Map modal closing');
            setShowMapModal(false);
            setSelectedOrder(null);
          }}
          onDurationUpdate={(duration) => {
            console.log('Received duration update from map modal:', duration);
            const minutes = parseInt(duration.split(' ')[0]);
            console.log('Parsed minutes:', minutes);
            if (!isNaN(minutes) && selectedOrder) {
              console.log('Updating travel time for order:', selectedOrder.id, 'to', minutes, 'minutes');
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

      {/* Notes Popup */}
      {showNotesPopup && selectedNotes && (
        <div 
          className="fixed bg-white rounded-lg shadow-lg p-4 max-w-md notes-popup z-50"
          style={{ 
            top: `${notesPopupPosition.top}px`, 
            left: `${notesPopupPosition.left}px`,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          <div className="whitespace-pre-wrap text-gray-600 text-sm">
            {selectedNotes}
          </div>
        </div>
      )}
    </div>
  );
};