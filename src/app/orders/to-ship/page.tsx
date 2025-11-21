'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Package, 
  Search, 
  Truck, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Eye,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  customerId: string;
  businessOwnerId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'to_ship' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: any;
  paymentMethod: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  customizations?: Record<string, string>;
}

export default function OrdersToShipPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrdersToShip();
  }, []);

  const loadOrdersToShip = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders/to-ship');
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to load orders ready to ship');
      }
    } catch (error) {
      console.error('Error loading orders ready to ship:', error);
      setError('Failed to load orders ready to ship');
    } finally {
      setLoading(false);
    }
  };

  const markOrderAsShipped = async (orderId: string, trackingNumber?: string) => {
    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId));
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'shipped',
          trackingNumber: trackingNumber || undefined
        }),
      });

      if (response.ok) {
        // Reload orders to show updated status
        await loadOrdersToShip();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to mark order as shipped');
      }
    } catch (error) {
      console.error('Error marking order as shipped:', error);
      setError('Failed to mark order as shipped');
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    return searchQuery === '' || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingAddress?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingAddress?.city?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading orders ready to ship...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orders Ready to Ship</h1>
              <p className="text-gray-600 mt-1">
                Manage orders that are ready for shipping
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/orders">
                <Button variant="outline">View All Orders</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by order ID, customer name, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No orders ready to ship</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? 'No orders match your search criteria'
                : 'All orders have been processed or there are no orders in "ready to ship" status'
              }
            </p>
            <Link href="/orders">
              <Button>View All Orders</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-orange-500" />
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Ready to Ship
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order #{order.id.slice(-8)}</p>
                      <p className="text-xs text-gray-400">
                        Ready since {formatDate(order.updatedAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatPrice(order.totalAmount)}</p>
                    <p className="text-sm text-gray-500">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border-t pt-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">Shipping Address</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>{order.shippingAddress?.name}</p>
                        <p>{order.shippingAddress?.address}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
                        <p>{order.shippingAddress?.country}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Items to Ship</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">Product {item.productId.slice(-8)}</span>
                          {item.customizations && Object.keys(item.customizations).length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {Object.entries(item.customizations).map(([key, value]) => (
                                <span key={key} className="block">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span>Qty: {item.quantity}</span>
                          <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="border-t pt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        const trackingNumber = prompt('Enter tracking number (optional):');
                        markOrderAsShipped(order.id, trackingNumber || undefined);
                      }}
                      disabled={updatingOrders.has(order.id)}
                    >
                      {updatingOrders.has(order.id) ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Shipped
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
