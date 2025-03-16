'use client'

import { useState, useEffect } from 'react'
import { OrderList } from '@/components/OrderList/index'
import { format, startOfDay, endOfDay } from 'date-fns'
import { Order, Driver } from '@/types'
import { MapModal } from '@/components/OrderList/MapModal'
import { EditOrderModal } from '@/components/OrderList/EditModal'
import { parseAddress, formatAddress } from '@/utils/address'

export default function RealtimeOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [estimatedTravelTimes, setEstimatedTravelTimes] = useState<Record<string, number>>({})
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [productList, setProductList] = useState<any[]>([])
  const [wsConnected, setWsConnected] = useState(false)

  // Filter orders for today
  const todayOrders = orders.filter(order => {
    if (!order.deliveryTime) return false
    const deliveryDate = new Date(order.deliveryTime)
    const today = new Date()
    return (
      deliveryDate.getDate() === today.getDate() &&
      deliveryDate.getMonth() === today.getMonth() &&
      deliveryDate.getFullYear() === today.getFullYear()
    )
  })

  const connectionStatus = wsConnected ? (
    <span className="text-green-500">● Connected</span>
  ) : (
    <span className="text-red-500">● Disconnected</span>
  )

  const calculateDispatchTime = (deliveryTime: string, travelTime: number) => {
    if (!deliveryTime) return null
    const delivery = new Date(deliveryTime)
    return new Date(delivery.getTime() - travelTime * 60000)
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleOrderUpdate = async (orderId: string, updates: Partial<Order>) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Failed to update order')
      await fetchOrders()
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const handleEstimatedTravelTime = async (orderId: string, duration: number) => {
    try {
      await handleOrderUpdate(orderId, { travelTime: duration })
      setEstimatedTravelTimes(prev => ({ ...prev, [orderId]: duration }))
    } catch (error) {
      console.error('Error updating travel time:', error)
    }
  }

  const updateOrder = async (order: Order) => {
    await handleOrderUpdate(order.id, order)
    setEditingOrder(null)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return (
    <div className="fixed inset-0 top-16">
      <div className="h-full flex flex-col">
        <div className="flex-none bg-white shadow-sm">
          <div className="px-4 py-2 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Today's Orders</h1>
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
        
        <div className="flex-1">
          {todayOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No orders for today
            </div>
          ) : (
            <OrderList
              key={`orderlist-${lastRefresh.getTime()}`}
              orders={todayOrders.map(order => ({
                ...order,
                dispatchTime: calculateDispatchTime(order.deliveryTime, order.travelTime)?.toISOString() || null
              }))}
              onOrderUpdate={handleOrderUpdate}
              sortBy="dispatchTime"
              sortDirection="asc"
              productList={productList}
              drivers={drivers}
            />
          )}
        </div>
      </div>

      {selectedAddress && (
        <MapModal
          address={selectedAddress}
          isOpen={!!selectedAddress}
          onClose={() => setSelectedAddress(null)}
          onDurationUpdate={(duration: number) => {
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
  )
} 