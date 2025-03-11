'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { OrderList } from '@/components/OrderList'

interface AddressData {
  first_name: string
  last_name: string
  company: string | null
  address1: string
  address2: string | null
  city: string
  province: string
  zip: string
  country: string
  phone: string | null
}

interface Driver {
  id: string
  name: string
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    name: string
    sku: string | null
  }
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  address: string
  status: string
  orderDate: string
  deliveryTime: string | null
  travelTime: number | null
  driver: Driver | null
  items: OrderItem[]
  phone: string | null
  note?: string
}

interface MapModalProps {
  address: string
  isOpen: boolean
  onClose: () => void
  onDurationUpdate: (duration: string) => void
}

interface EditOrderModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
  onSave: (orderId: string, updates: any) => Promise<void>
  productList?: ProductList[]
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

interface GoogleMapsPlaces {
  Autocomplete: new (input: HTMLInputElement, options: GoogleMapsAutocompleteOptions) => GoogleMapsAutocomplete;
}

interface GoogleMaps {
  maps: {
    places: GoogleMapsPlaces;
    LatLng: new (lat: number, lng: number) => any;
    LatLngBounds: new (sw: any, ne: any) => any;
  };
}

declare global {
  interface Window {
    google: GoogleMaps;
  }
}

interface ProductList {
  id: string;
  addon: string;
  handle: string;
  totalCost: string | null;
  listOfIng: string | null;
  meat1: string | null;
  meat2: string | null;
  option1: string | null;
  option2: string | null;
  serveware: string | null;
  timerA: string | null;
  timerB: string | null;
  skuSearch: string | null;
  variantSku: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const START_ADDRESS = "562 richmond road grey lynn"

const UPDATE_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

const parseAddress = (addressString: string): AddressData | null => {
  try {
    return JSON.parse(addressString)
  } catch (e) {
    console.error('Error parsing address:', e)
    return null
  }
}

const formatAddress = (addressData: AddressData | null): string => {
  if (!addressData) return '-'
  
  const parts = [
    addressData.address1,
    addressData.address2,
    addressData.city,
    addressData.province,
    addressData.zip,
    addressData.country
  ].filter(Boolean)
  
  return parts.join(', ')
}

const formatPhoneNumber = (phone: string | null): string => {
  if (!phone) return '-'
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Handle different formats
  if (digits.startsWith('6421')) {
    // Convert 6421xxxxxx to 021xxxxxx
    return '0' + digits.slice(2)
  } else if (digits.startsWith('21')) {
    // Already in correct format
    return '0' + digits
  } else if (digits.startsWith('+6421')) {
    // Convert +6421xxxxxx to 021xxxxxx
    return '0' + digits.slice(3)
  }
  
  // If no match, return original
  return phone
}

const MapModal = ({ address, isOpen, onClose, onDurationUpdate }: MapModalProps) => {
  const [distance, setDistance] = useState<string | null>(null)
  const [duration, setDuration] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get coordinates first
        const geocodeResponse = await fetch(`/api/maps?type=geocode&address=${encodeURIComponent(address)}`)
        const geocodeData = await geocodeResponse.json()
        
        if (geocodeData.results && geocodeData.results[0]) {
          const location = geocodeData.results[0].geometry.location
          setCoordinates(location)
        }

        // Then get distance and duration
        const distanceResponse = await fetch(
          `/api/maps?type=distancematrix&address=${encodeURIComponent(address)}&startAddress=${encodeURIComponent(START_ADDRESS)}`
        )
        const distanceData = await distanceResponse.json()
        
        if (distanceData.rows && distanceData.rows[0] && distanceData.rows[0].elements && distanceData.rows[0].elements[0]) {
          const element = distanceData.rows[0].elements[0]
          if (element.status === 'OK') {
            setDistance(element.distance.text)
            setDuration(element.duration.text)
            onDurationUpdate(element.duration.text)
          }
        }
      } catch (error) {
        console.error('Error fetching map data:', error)
        setError('Failed to load map data. Please try again.')
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [address, isOpen, onDurationUpdate])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const encodedStartAddress = encodeURIComponent(START_ADDRESS)
  const encodedDestAddress = encodeURIComponent(address)
  const directionsUrl = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${encodedStartAddress}&destination=${encodedDestAddress}`
  const streetViewUrl = coordinates 
    ? `https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_API_KEY}&location=${coordinates.lat},${coordinates.lng}&heading=210&pitch=0&fov=100`
    : null

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-transparent" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Delivery Route & Location</h2>
            <div className="text-sm text-gray-600 mt-1">
              <div>From: {START_ADDRESS}</div>
              <div>To: {address}</div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Route Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Distance:</span>
                <span className="font-medium">{distance || 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Travel Time:</span>
                <span className="font-medium">{duration || 'Loading...'}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Delivery Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Address:</span>
                <span className="font-medium">{address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Location:</span>
                <span className="font-medium">{START_ADDRESS}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[400px] rounded-lg overflow-hidden">
            <iframe
              title="Delivery Route"
              width="100%"
              height="100%"
              frameBorder="0"
              src={directionsUrl}
              allowFullScreen
              className="rounded-lg"
            />
          </div>
          <div className="h-[400px] rounded-lg overflow-hidden">
            {streetViewUrl ? (
              <iframe
                title="Destination Street View"
                width="100%"
                height="100%"
                frameBorder="0"
                src={streetViewUrl}
                allowFullScreen
                className="rounded-lg"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500">
                Loading street view...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const EditOrderModal = ({ order, isOpen, onClose, onSave, productList }: EditOrderModalProps) => {
  const [deliveryTime, setDeliveryTime] = useState(() => {
    if (!order.deliveryTime) return ''
    // Convert UTC to local time for the input
    const date = new Date(order.deliveryTime)
    return date.toISOString().slice(0, 16)
  })
  const [notes, setNotes] = useState(() => {
    const noteContent = order.note || '';
    const deliveryInfoIndex = noteContent.indexOf('Delivery Date:');
    return deliveryInfoIndex > 0 ? noteContent.substring(0, deliveryInfoIndex).trim() : '';
  })
  const [addressData, setAddressData] = useState<AddressData | null>(parseAddress(order.address) || {
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
  })
  const [items, setItems] = useState<OrderItem[]>(order.items || [])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [autocomplete, setAutocomplete] = useState<GoogleMapsAutocomplete | null>(null)

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.google) {
      const input = document.getElementById('address-input') as HTMLInputElement
      if (input) {
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          componentRestrictions: { country: 'nz' },
          bounds: new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(-37.0648, 174.6137), // SW corner of Auckland
            new window.google.maps.LatLng(-36.6790, 175.2876)  // NE corner of Auckland
          ),
          fields: ['address_components', 'formatted_address', 'geometry']
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place.address_components) {
            const addressComponents = place.address_components.reduce((acc: any, component: any) => {
              const type = component.types[0]
              acc[type] = component.long_name
              return acc
            }, {})

            setAddressData(prev => prev ? {
              ...prev,
              address1: addressComponents.street_number 
                ? `${addressComponents.street_number} ${addressComponents.route}`
                : addressComponents.route || '',
              city: addressComponents.locality || '',
              province: addressComponents.administrative_area_level_1 || '',
              zip: addressComponents.postal_code || '',
              country: addressComponents.country || 'New Zealand'
            } : null)
          }
        })

        setAutocomplete(autocomplete)
      }
    }
  }, [isOpen])

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleAddItem = () => {
    if (!selectedProduct || !productList) return

    const productDetails = productList.find(p => p.variantSku === selectedProduct)
    if (!productDetails) return

    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9), // Generate a temporary ID
      quantity: 1,
      price: 0, // You might want to add proper price handling
      product: {
        name: productDetails.handle || '',
        sku: productDetails.variantSku
      }
    }

    setItems(prev => [...prev, newItem])
    setSelectedProduct('')
  }

  const handleDeliveryTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (!newValue) {
      setDeliveryTime('')
      return
    }

    // Store the local time value directly
    setDeliveryTime(newValue)
  }

  const handleSave = async () => {
    const updatedAddress = JSON.stringify(addressData)
    
    const originalNote = order.note || '';
    const deliveryInfoMatch = originalNote.match(/(\s*\|\s*Delivery Date:[^|]*\|\s*Delivery Time:[^|]*(AM|PM)\s*$)/);
    const deliveryInfo = deliveryInfoMatch ? deliveryInfoMatch[0] : '';
    
    const updatedNote = notes ? `${notes}${deliveryInfo}` : deliveryInfo;

    // Convert local time to UTC for saving
    let updatedDeliveryTime = null;
    if (deliveryTime) {
      const localDate = new Date(deliveryTime);
      updatedDeliveryTime = localDate.toISOString();
    }

    await onSave(order.id, {
      deliveryTime: updatedDeliveryTime,
      address: updatedAddress,
      note: updatedNote,
      items: items
    })
    onClose()
  }

  const handleAddressChange = (field: keyof AddressData, value: string | null) => {
    setAddressData(prev => prev ? { ...prev, [field]: value } : null)
  }

  const formatProductOption = (product: Partial<ProductList> & { handle: string; variantSku: string }) => {
    let label = product.handle || ''
    if (product.meat1 || product.meat2) {
      label += ' ('
      if (product.meat1) label += product.meat1
      if (product.meat1 && product.meat2) label += ' • '
      if (product.meat2) label += product.meat2
      label += ')'
    }
    return label
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-transparent" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Order #{order.orderNumber}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
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
              Order Items
            </label>
            <div className="space-y-2">
              {items.map((item) => {
                const productDetails = productList?.find(p => p.variantSku === item.product.sku)
                return (
                  <div key={item.id} className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <span className="text-sm">{formatProductOption(productDetails || { handle: item.product.name, variantSku: item.product.sku || '' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value)
                          if (newQuantity > 0) {
                            setItems(prev => prev.map(i => 
                              i.id === item.id ? { ...i, quantity: newQuantity } : i
                            ))
                          }
                        }}
                        className="w-16 border rounded px-2 py-1 text-sm"
                        min="1"
                      />
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
              
              <div className="flex gap-2">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select product to add...</option>
                  {productList?.map((product) => (
                    <option key={product.variantSku} value={product.variantSku}>
                      {formatProductOption(product)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddItem}
                  disabled={!selectedProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={deliveryTime}
                onChange={handleDeliveryTimeChange}
                className="w-full border rounded px-3 py-2"
                min={new Date().toISOString().slice(0, 16)}
              />
              {deliveryTime && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  {new Date(deliveryTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Delivery Address</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">First Name</label>
                <input
                  type="text"
                  value={addressData?.first_name || ''}
                  onChange={(e) => handleAddressChange('first_name', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                <input
                  type="text"
                  value={addressData?.last_name || ''}
                  onChange={(e) => handleAddressChange('last_name', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Street Address</label>
              <input
                id="address-input"
                type="text"
                value={addressData?.address1 || ''}
                onChange={(e) => handleAddressChange('address1', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Start typing to search for an address in Auckland..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Apartment/Suite (optional)</label>
              <input
                type="text"
                value={addressData?.address2 || ''}
                onChange={(e) => handleAddressChange('address2', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  value={addressData?.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={addressData?.zip || ''}
                  onChange={(e) => handleAddressChange('zip', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
              <input
                type="tel"
                value={addressData?.phone || ''}
                onChange={(e) => handleAddressChange('phone', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

const MeatValues = ({ productDetails }: { productDetails: ProductList | undefined }) => {
  if (!productDetails) return null;
  return (
    <>
      {productDetails.meat1 && <span className="text-red-600">{productDetails.meat1}</span>}
      {productDetails.meat1 && productDetails.meat2 && <span className="text-black"> • </span>}
      {productDetails.meat2 && <span className="text-red-600">{productDetails.meat2}</span>}
    </>
  );
};

const cleanNote = (note: string | undefined): string | null => {
  if (!note) return null;
  
  // Check if the note ONLY contains delivery date and time information
  const deliveryInfoPattern = /^\s*Delivery Date:[^|]*\|\s*Delivery Time:[^|]*(AM|PM)\s*$/;
  if (deliveryInfoPattern.test(note)) {
    return null;
  }
  
  // If there's more content, clean up the delivery info from the end
  const cleaned = note.replace(/\s*\|\s*Delivery Date:[^|]*\|\s*Delivery Time:[^|]*(AM|PM)\s*$/g, '').trim();
  return cleaned || null;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [estimatedTravelTimes, setEstimatedTravelTimes] = useState<{ [key: string]: number }>({})
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [productList, setProductList] = useState<ProductList[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Function to update travel times for all orders
  const updateAllTravelTimes = useCallback(async () => {
    const updatedTimes: { [key: string]: number } = {};
    
    for (const order of orders) {
      try {
        const addressData = parseAddress(order.address);
        if (!addressData) continue;

        const formattedAddress = formatAddress(addressData);
        const response = await fetch(
          `/api/maps?type=distancematrix&address=${encodeURIComponent(formattedAddress)}&startAddress=${encodeURIComponent(START_ADDRESS)}`
        );
        
        if (!response.ok) {
          console.warn(`Failed to fetch travel time for order ${order.id}:`, response.status);
          continue;
        }

        const data = await response.json();
        
        if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
          const duration = data.rows[0].elements[0].duration.text;
          const minutes = parseInt(duration.split(' ')[0]);
          if (!isNaN(minutes)) {
            updatedTimes[order.id] = minutes;
          }
        }
      } catch (error) {
        console.warn(`Error updating travel time for order ${order.id}:`, error);
        // Continue with next order
        continue;
      }
    }

    // Only update state if we have any successful times
    if (Object.keys(updatedTimes).length > 0) {
      setEstimatedTravelTimes(prev => ({
        ...prev,
        ...updatedTimes
      }));
    }
  }, [orders])

  // Set up periodic updates
  useEffect(() => {
    // Initial update
    updateAllTravelTimes()

    // Set up interval for periodic updates
    const interval = setInterval(updateAllTravelTimes, UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [updateAllTravelTimes])

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_INTERVAL = 3000; // 3 seconds

    const connect = () => {
      try {
        console.log('Attempting WebSocket connection...');
        ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002');
        
        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          setWsConnected(true);
          reconnectAttempts = 0; // Reset attempts on successful connection
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            if (data.type === 'ORDER_UPDATE') {
              console.log('Order update received:', {
                orderId: data.orderId,
                updates: data.updates,
                hasNote: !!data.updates.note
              });
              setOrders(prev => prev.map(order => 
                order.id === data.orderId ? { ...order, ...data.updates } : order
              ));
            } else if (data.type === 'NEW_ORDER') {
              console.log('New order received:', {
                orderNumber: data.order.orderNumber,
                hasNote: !!data.order.note,
                note: data.order.note,
                timestamp: new Date().toISOString()
              });
              // Ensure we don't add duplicate orders
              setOrders(prev => {
                const exists = prev.some(order => order.id === data.order.id);
                if (exists) {
                  console.log('Order already exists, skipping:', data.order.id);
                  return prev;
                }
                console.log('Adding new order to state:', data.order.id);
                return [...prev, data.order];
              });

              // Fetch travel time for the new order
              const addressData = parseAddress(data.order.address);
              if (addressData) {
                const formattedAddress = formatAddress(addressData);
                fetch(
                  `/api/maps?type=distancematrix&address=${encodeURIComponent(formattedAddress)}&startAddress=${encodeURIComponent(START_ADDRESS)}`
                )
                  .then(response => response.json())
                  .then(data => {
                    if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
                      const duration = data.rows[0].elements[0].duration.text;
                      const minutes = parseInt(duration.split(' ')[0]);
                      if (!isNaN(minutes)) {
                        setEstimatedTravelTimes(prev => ({
                          ...prev,
                          [data.order.id]: minutes
                        }));
                      }
                    }
                  })
                  .catch(error => console.warn('Error fetching travel time for new order:', error));
              }
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
          
          // Attempt to reconnect unless we've hit the maximum attempts
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

  // Add WebSocket connection status indicator
  const connectionStatus = (
    <div className={`flex items-center gap-2 ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
      <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-600' : 'bg-red-600'}`} />
      <span className="text-sm">{wsConnected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );

  // Set up periodic order refresh
  useEffect(() => {
    const refreshOrders = () => {
      fetchOrders()
      setLastRefresh(new Date())
    }

    // Refresh orders every 30 seconds
    const interval = setInterval(refreshOrders, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchDrivers()
    fetchProductList()
  }, [])

  const fetchOrders = async () => {
    try {
      console.log('=== Starting Orders Fetch ===');
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      console.log('Orders fetch response:', {
        status: response.status,
        orderCount: data?.length || 0,
        timestamp: new Date().toISOString(),
        orders: data.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          deliveryTime: o.deliveryTime,
          updatedAt: o.updatedAt
        }))
      });
      
      if (data.error) {
        console.error('Error in orders response:', data.error);
        return; // Don't update state if there's an error
      }

      // Only update orders if we got valid data
      if (Array.isArray(data)) {
        // Log the current state before update
        console.log('Current orders state before update:', orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          deliveryTime: o.deliveryTime,
          updatedAt: o.updatedAt
        })));

        // Update orders state
        setOrders(data);
        
        // Log the new state after update
        console.log('Orders state updated with', data.length, 'orders');
        console.log('New orders state:', data.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          deliveryTime: o.deliveryTime,
          updatedAt: o.updatedAt
        })));
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Don't update state on error to preserve existing orders
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers')
      const data = await response.json()
      setDrivers(data)
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const fetchProductList = async () => {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch('/api/product-list')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setProductList(data || []) // Ensure we always set an array
        break;
      } catch (error) {
        console.error(`Error fetching product list (attempt ${retryCount + 1}/${maxRetries}):`, error)
        retryCount++
        if (retryCount === maxRetries) {
          setProductList([]) // Set empty array as fallback
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
        }
      }
    }
  }

  const getProductHandle = (sku: string | null) => {
    if (!sku || !productList) return null;
    const product = productList.find(p => p.variantSku === sku);
    return product?.handle || null;
  }

  const handleEstimatedTravelTime = (orderId: string, duration: string) => {
    const minutes = parseInt(duration.split(' ')[0])
    if (!isNaN(minutes)) {
      setEstimatedTravelTimes(prev => ({
        ...prev,
        [orderId]: minutes
      }))
      
      // Broadcast the update to other clients
      fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TRAVEL_TIME_UPDATE',
          travelTimes: { [orderId]: minutes }
        })
      }).catch(console.error)
    }
  }

  const updateOrder = async (orderId: string, updates: any) => {
    try {
      console.log('=== Starting Client-Side Order Update ===');
      console.log('Order ID:', orderId);
      console.log('Updates to apply:', JSON.stringify(updates, null, 2));

      // Log current orders state
      console.log('Current orders state:', orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status
      })));

      console.log('Sending update request to API...');
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          data: data
        });
        throw new Error(data.error || 'Failed to update order');
      }

      console.log('Updating local state...');
      // Update the order in the local state
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order.id === orderId ? { ...order, ...updates } : order
        );
        console.log('Updated orders state:', updatedOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status
        })));
        return updatedOrders;
      });

      // Only fetch all orders if we need to (e.g., if items were updated)
      if (updates.items) {
        console.log('Items were updated, fetching fresh order data...');
        await fetchOrders();
      }

      console.log('=== Client-Side Order Update Complete ===');
    } catch (error) {
      console.error('=== Client-Side Order Update Error ===');
      console.error('Error details:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error; // Re-throw to be handled by the UI
    }
  };

  const calculateDispatchTime = (deliveryTime: string | null, travelTime: number | null) => {
    if (!deliveryTime) return null
    const delivery = new Date(deliveryTime)
    const travelMinutes = travelTime || 5 // Use 5 as default if travelTime is null
    return new Date(delivery.getTime() - (travelMinutes * 60 * 1000))
  }

  const handleOrderUpdate = async (orderId: string, updates: any) => {
    try {
      console.log('=== Starting Client-Side Order Update ===');
      console.log('Order ID:', orderId);
      console.log('Updates to apply:', JSON.stringify(updates, null, 2));

      // Log current orders state
      console.log('Current orders state:', orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        deliveryTime: o.deliveryTime,
        updatedAt: o.updatedAt
      })));

      console.log('Sending update request to API...');
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          data: data
        });
        throw new Error(data.error || 'Failed to update order');
      }

      // Update the order in the local state immediately
      console.log('Updating local state...');
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order.id === orderId ? { ...order, ...data } : order
        );
        console.log('Updated orders state:', updatedOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          deliveryTime: o.deliveryTime,
          updatedAt: o.updatedAt
        })));
        return updatedOrders;
      });

      // Fetch fresh data to ensure consistency
      console.log('Fetching fresh order data...');
      await fetchOrders();

      console.log('=== Client-Side Order Update Complete ===');
    } catch (error) {
      console.error('=== Client-Side Order Update Error ===');
      console.error('Error details:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error; // Re-throw to be handled by the UI
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>

  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="flex-none bg-white shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">All Orders</h1>
          <div className="flex items-center gap-2">
            {connectionStatus}
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
            sortBy="orderDate"
            sortDirection="desc"
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
              const order = orders.find(o => formatAddress(parseAddress(o.address)) === selectedAddress)
              if (order) {
                handleEstimatedTravelTime(order.id, duration)
              }
            }}
          />
        )}

        {editingOrder && (
          <EditOrderModal
            order={editingOrder}
            isOpen={!!editingOrder}
            onClose={() => setEditingOrder(null)}
            onSave={updateOrder}
            productList={productList}
          />
        )}
      </div>
    </div>
  )
} 