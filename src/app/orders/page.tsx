'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Package, 
  Search, 
  Eye, 
  Truck, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { useSession } from 'next-auth/react';

interface Order {
  id: string;
  customerId: string;
  businessOwnerId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  discountAmount?: number;
  appliedCouponCode?: string;
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
  productName?: string;
  quantity: number;
  price: number;
  customizations?: Record<string, string>;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const markOrderToShip = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/to-ship`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Reload orders to show updated status
        await loadOrders();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to mark order as ready to ship');
      }
    } catch (error) {
      console.error('Error marking order as ready to ship:', error);
      setError('Failed to mark order as ready to ship');
    }
  };

  const markOrderDelivered = async (orderId: string) => {
    if (!confirm('Confirm that you have received this order?')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'delivered' }),
      });

      if (response.ok) {
        alert('Thank you! Order marked as delivered.');
        await loadOrders();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to mark order as delivered');
      }
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      setError('Failed to mark order as delivered');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? If payment was made, a refund will be processed.')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Order cancelled successfully. Refund will be processed if payment was made.');
        await loadOrders();
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'to_ship':
        return <Truck className="w-4 h-4 text-orange-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'to_ship':
        return 'bg-orange-100 text-orange-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    const matchesSearch = searchQuery === '' || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.status.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Customer Header with Explore Navbar */}
      <CustomerHeader user={session?.user || null} />

      {/* Page Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600 mt-1">
                Track and manage your orders
              </p>
            </div>
            <Link href="/explore">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="to_ship">Ready to Ship</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'You haven\'t placed any orders yet'
              }
            </p>
            <Link href="/explore">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order #{order.id.slice(-8)}</p>
                      <p className="text-xs text-gray-400">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatPrice(order.totalAmount)}</p>
                    {order.discountAmount && order.discountAmount > 0 && (
                      <p className="text-sm text-green-600">
                        Discount: -{formatPrice(order.discountAmount)}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-4">
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                        {/* Show designer final file as image if available */}
                        {item.customizations?.designerFinalFileUrl && (
                          <div className="flex-shrink-0">
                            <img 
                              src={item.customizations.designerFinalFileUrl as string}
                              alt="Design Preview"
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 flex items-start justify-between">
                          <div>
                            <span className="font-medium">{item.productName || `Product ${item.productId.slice(-8)}`}</span>
                            {item.customizations && Object.keys(item.customizations).length > 0 && (
                              <div className="text-xs text-gray-600 mt-1 space-y-1">
                                {item.customizations.customizationRequestId && (
                                  <span className="block">
                                    customizationRequestId: {item.customizations.customizationRequestId as string}
                                  </span>
                                )}
                                {item.customizations.designerName && (
                                  <span className="block">
                                    designerName: {item.customizations.designerName as string}
                                  </span>
                                )}
                                {item.customizations.printingShopName && (
                                  <span className="block">
                                    printingShopName: {item.customizations.printingShopName as string}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm">Qty: {item.quantity}</span>
                            <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="border-t pt-4 mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    
                    {order.trackingNumber && (
                      <Link href={`/orders/${order.id}/tracking`}>
                        <Button variant="outline" size="sm">
                          <Truck className="w-4 h-4 mr-2" />
                          Track Package
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Customer actions */}
                    {order.status === 'shipped' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-green-600 border-green-300 hover:bg-green-50"
                        onClick={() => markOrderDelivered(order.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Received
                      </Button>
                    )}

                    {/* Business owner actions */}
                    {order.status === 'processing' && user?.role === 'business_owner' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() => markOrderToShip(order.id)}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Mark as Ready to Ship
                      </Button>
                    )}
                    
                    {order.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Order
                      </Button>
                    )}
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


