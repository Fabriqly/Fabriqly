'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { 
  Package, 
  ArrowLeft, 
  Truck, 
  MapPin, 
  CreditCard, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Mail
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
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: Address;
  billingAddress?: Address;
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

interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  // Auto-refresh order status if payment is pending
  useEffect(() => {
    if (!order || order.paymentStatus !== 'pending') return;

    // Poll every 3 seconds to check for payment status update
    const interval = setInterval(() => {
      loadOrder();
    }, 3000);

    // Also refresh when page becomes visible (user returns from payment page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadOrder();
      }
    };

    // Refresh on focus (when user switches back to tab)
    const handleFocus = () => {
      loadOrder();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [order?.paymentStatus, orderId]);

  const loadOrder = async () => {
    try {
      // Don't show loading spinner on refresh to avoid UI flicker
      const isInitialLoad = !order;
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const response = await fetch(`/api/orders/${orderId}`, {
        cache: 'no-store', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        const updatedOrder = data.order;
        setOrder(updatedOrder);
        
        // If payment status changed to paid, stop polling
        if (order && order.paymentStatus === 'pending' && updatedOrder.paymentStatus === 'paid') {
          console.log('Payment status updated to paid!');
        }
      } else {
        setError(data.error || 'Failed to load order');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
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
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        const response = await fetch(`/api/orders/${order.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          router.push('/orders');
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to cancel order');
        }
      } catch (error) {
        console.error('Error cancelling order:', error);
        setError('Failed to cancel order');
      }
    }
  };

  const handlePayNow = async () => {
    if (!order || processingPayment) return;

    try {
      setProcessingPayment(true);
      setError(null);

      // Create payment invoice
      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: order.paymentMethod || 'xendit'
        }),
      });

      const data = await response.json();

      if (data.success && data.invoice?.invoice_url) {
        // Redirect to Xendit payment page
        window.location.href = data.invoice.invoice_url;
      } else {
        setError(data.error || 'Failed to create payment link');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      setError('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The order you\'re looking for doesn\'t exist.'}</p>
          <Link href="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.id.slice(-8)}
              </h1>
              <p className="text-gray-600 mt-1">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                {getStatusIcon(order.status)}
                <h2 className="text-lg font-semibold">Order Status</h2>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                
                {order.trackingNumber && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Truck className="w-4 h-4" />
                    <span>Tracking: {order.trackingNumber}</span>
                  </div>
                )}
              </div>

              {order.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">Product {item.productId.slice(-8)}</h3>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Customizations:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(item.customizations).map(([key, value]) => (
                              <span key={key} className="px-2 py-1 bg-gray-100 text-xs rounded">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-500">{formatPrice(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Shipping Address</h2>
              </div>
              
              <div className="text-sm">
                <p className="font-medium">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                {order.shippingAddress.company && (
                  <p>{order.shippingAddress.company}</p>
                )}
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && (
                  <p>{order.shippingAddress.address2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-2 flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>{order.shippingAddress.phone}</span>
                </p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Payment Information</h2>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium capitalize">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className={`font-medium ${
                    order.paymentStatus === 'paid' ? 'text-green-600' : 
                    order.paymentStatus === 'failed' ? 'text-red-600' : 
                    'text-yellow-600'
                  }`}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Payment Pending Notice */}
              {order.paymentStatus === 'pending' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Payment Required:</strong> Please complete payment to proceed with your order.
                  </p>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              {/* Order Totals */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              {/* Order Actions */}
              <div className="space-y-3">
                {/* Pay Now Button - Show when payment is pending */}
                {order.paymentStatus === 'pending' && (
                  <>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white" 
                      onClick={handlePayNow}
                      disabled={processingPayment}
                    >
                      {processingPayment ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay Now
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadOrder}
                      disabled={loading}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {loading ? 'Refreshing...' : 'Refresh Status'}
                    </Button>
                  </>
                )}

                {order.paymentStatus === 'paid' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Payment Completed</span>
                    </div>
                  </div>
                )}

                {order.trackingNumber && (
                  <Link href={`/orders/${order.id}/tracking`} className="block">
                    <Button className="w-full" variant="outline">
                      <Truck className="w-4 h-4 mr-2" />
                      Track Package
                    </Button>
                  </Link>
                )}
                
                {order.status === 'pending' && order.paymentStatus === 'pending' && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleCancelOrder}
                    disabled={processingPayment}
                  >
                    Cancel Order
                  </Button>
                )}
                
                <Link href="/explore" className="block">
                  <Button className="w-full" variant="outline">
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Order Timeline */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Order Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  
                  {order.status !== 'pending' && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium">Order Confirmed</p>
                        <p className="text-gray-500">
                          {new Date(new Date(order.createdAt).getTime() + 30 * 60 * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {['shipped', 'delivered'].includes(order.status) && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium">Shipped</p>
                        <p className="text-gray-500">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'delivered' && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium">Delivered</p>
                        <p className="text-gray-500">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


