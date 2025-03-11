'use client';

import React, { useState, useEffect } from 'react';
import { Order, ProductList } from '@/types';

interface EditOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: string, updates: any) => Promise<void>;
  productList?: ProductList[];
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

interface GoogleMapsAutocomplete {
  addListener: (event: string, callback: () => void) => void;
  getPlace: () => {
    address_components?: Array<{
      long_name: string;
      types: string[];
    }>;
  };
}

interface GoogleMapsAutocompleteOptions {
  componentRestrictions?: { country: string };
  bounds?: any;
  fields?: string[];
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options: GoogleMapsAutocompleteOptions) => GoogleMapsAutocomplete;
        };
        LatLng: new (lat: number, lng: number) => any;
        LatLngBounds: new (sw: any, ne: any) => any;
      };
    };
  }
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
  productList
}) => {
  const [deliveryTime, setDeliveryTime] = useState(() => {
    if (!order.deliveryTime) return '';
    // Convert UTC to local time for display
    const date = new Date(order.deliveryTime);
    return date.toISOString().slice(0, 16);
  });

  const [notes, setNotes] = useState(() => {
    const noteContent = order.note || '';
    const deliveryInfoIndex = noteContent.indexOf('Delivery Date:');
    return deliveryInfoIndex > 0 ? noteContent.substring(0, deliveryInfoIndex).trim() : '';
  });

  const [addressData, setAddressData] = useState<AddressData | null>(
    (() => {
      try {
        return JSON.parse(order.address);
      } catch (e) {
        return {
          first_name: '',
          last_name: '',
          company: null,
          address1: '',
          address2: null,
          city: '',
          province: '',
          zip: '',
          country: '',
          phone: null
        };
      }
    })()
  );

  const [items, setItems] = useState(order.items || []);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [autocomplete, setAutocomplete] = useState<GoogleMapsAutocomplete | null>(null);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.google) {
      const input = document.getElementById('address-input') as HTMLInputElement;
      if (input) {
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          componentRestrictions: { country: 'nz' },
          bounds: new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(-37.0648, 174.6137), // SW corner of Auckland
            new window.google.maps.LatLng(-36.6790, 175.2876)  // NE corner of Auckland
          ),
          fields: ['address_components', 'formatted_address', 'geometry', 'name'],
          types: ['address']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.address_components) {
            const addressComponents = place.address_components.reduce((acc: any, component: any) => {
              const type = component.types[0];
              acc[type] = component.long_name;
              return acc;
            }, {});

            // Extract the street number and route separately
            const streetNumber = addressComponents.street_number || '';
            const route = addressComponents.route || '';
            const address1 = streetNumber ? `${streetNumber} ${route}` : route;

            setAddressData(prev => prev ? {
              ...prev,
              address1,
              city: addressComponents.locality || 'Auckland',
              province: addressComponents.administrative_area_level_1 || 'Auckland',
              zip: addressComponents.postal_code || '',
              country: addressComponents.country || 'New Zealand',
              // If this is a business address, use the name as company
              company: place.name && place.name !== address1 ? place.name : prev.company
            } : null);
          }
        });

        setAutocomplete(autocomplete);
      }
    }
  }, [isOpen]);

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddItem = () => {
    if (!selectedProduct || !productList) return;

    const productDetails = productList.find(p => p.variantSku === selectedProduct);
    if (!productDetails) return;

    const newItem = {
      id: Math.random().toString(36).substr(2, 9), // Generate a temporary ID
      quantity: 1,
      price: 0, // You might want to add proper price handling
      product: {
        name: productDetails.handle || '',
        sku: productDetails.variantSku
      }
    };

    setItems(prev => [...prev, newItem]);
    setSelectedProduct('');
  };

  const handleDeliveryTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryTime(e.target.value);
  };

  const handleSave = async () => {
    const updatedAddress = JSON.stringify(addressData);
    
    const originalNote = order.note || '';
    const deliveryInfoMatch = originalNote.match(/(\s*\|\s*Delivery Date:[^|]*\|\s*Delivery Time:[^|]*(AM|PM)\s*$)/);
    const deliveryInfo = deliveryInfoMatch ? deliveryInfoMatch[0] : '';
    
    const updatedNote = notes ? `${notes}${deliveryInfo}` : deliveryInfo;

    // Convert local time to UTC for saving, properly handling timezone
    let updatedDeliveryTime = null;
    if (deliveryTime) {
      // Parse the local date components
      const localDate = new Date(deliveryTime);
      // Create a UTC date with the same local time components
      const utcDate = new Date(Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        localDate.getHours(),
        localDate.getMinutes()
      ));
      updatedDeliveryTime = utcDate.toISOString();
    }

    await onSave(order.id, {
      deliveryTime: updatedDeliveryTime,
      address: updatedAddress,
      note: updatedNote,
      items: items
    });
    onClose();
  };

  const handleAddressChange = (field: keyof AddressData, value: string | null) => {
    setAddressData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const formatProductOption = (product: Partial<ProductList> & { handle: string; variantSku: string }) => {
    let label = product.handle || '';
    if (product.meat1 || product.meat2) {
      label += ' (';
      if (product.meat1) label += product.meat1;
      if (product.meat1 && product.meat2) label += ' • ';
      if (product.meat2) label += product.meat2;
      label += ')';
    }
    return label;
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={stopPropagation}>
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Edit Order #{order.orderNumber}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2 min-h-[100px] resize-y"
              placeholder="Add your notes here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Time
            </label>
            <input
              type="datetime-local"
              value={deliveryTime}
              onChange={handleDeliveryTimeChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              id="address-input"
              type="text"
              value={addressData?.address1 || ''}
              onChange={(e) => handleAddressChange('address1', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Street address"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={addressData?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="City"
              />
              <input
                type="text"
                value={addressData?.zip || ''}
                onChange={(e) => handleAddressChange('zip', e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="Postal code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Contact Details
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={addressData?.first_name || ''}
                onChange={(e) => handleAddressChange('first_name', e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="First name"
              />
              <input
                type="text"
                value={addressData?.last_name || ''}
                onChange={(e) => handleAddressChange('last_name', e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="Last name"
              />
            </div>
            <input
              type="text"
              value={addressData?.company || ''}
              onChange={(e) => handleAddressChange('company', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Company (optional)"
            />
            <input
              type="tel"
              value={addressData?.phone || ''}
              onChange={(e) => handleAddressChange('phone', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Phone number"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Items
            </label>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span>{item.product.name}</span>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 border rounded px-3 py-2"
              >
                <option value="">Select a product...</option>
                {productList?.map((product) => (
                  <option key={product.variantSku} value={product.variantSku}>
                    {formatProductOption(product)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddItem}
                disabled={!selectedProduct}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
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
    </div>
  );
}; 