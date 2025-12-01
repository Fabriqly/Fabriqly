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
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
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
  productName?: string;
  productImage?: string;
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
  const { data: session } = useSession();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [enrichedItems, setEnrichedItems] = useState<OrderItem[]>([]);

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
        
        // Enrich order items with product details
        const enriched = await Promise.all(
          updatedOrder.items.map(async (item: OrderItem) => {
            try {
              // Fetch product details
              const productResponse = await fetch(`/api/products/${item.productId}`);
              const productData = await productResponse.json();
              
              if (productResponse.ok && productData.success) {
                const product = productData.data;
                // Get primary image or first image
                const productImage = product.images?.find((img: any) => img.isPrimary)?.imageUrl || 
                                   product.images?.[0]?.imageUrl || 
                                   null;
                
                return {
                  ...item,
                  productName: product.name || `Product ${item.productId.slice(-8)}`,
                  productImage: productImage
                };
              }
            } catch (error) {
              console.error(`Error fetching product ${item.productId}:`, error);
            }
            
            // Fallback if product fetch fails
            return {
              ...item,
              productName: item.productName || `Product ${item.productId.slice(-8)}`,
              productImage: item.productImage
            };
          })
        );
        
        setEnrichedItems(enriched);
        
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

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session?.user || null} />
      
      <div className="flex gap-8 p-8">
        {/* Left Sidebar - Floating Navigation Card */}
        <CustomerNavigationSidebar />

        {/* Right Content Area */}
        <main className="flex-1">
          <div className="max-w-4xl">
            {/* Page Header */}
            <div className="mb-6">
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
              {loading ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-600">Loading order details...</p>
                </div>
              ) : error || !order ? (
                <div className="text-center py-8">
                  <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
                  <p className="text-gray-600 mb-4">{error || 'The order you\'re looking for doesn\'t exist.'}</p>
                  <Link href="/orders">
                    <Button>Back to Orders</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-2.5 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        Order #{order.id.slice(-8)}
                      </h1>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                    {order.trackingNumber && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                        <Truck className="w-4 h-4" />
                        <span>Tracking: {order.trackingNumber}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">

                    {/* Order Items */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h2 className="text-lg font-semibold mb-4">Order Items</h2>
                      
                      <div className="space-y-4">
                        {(enrichedItems.length > 0 ? enrichedItems : order.items).map((item, index) => {
                          // Prefer designer final file from customizations, then product image, then placeholder
                          const displayImage = item.customizations?.designerFinalFileUrl || 
                                            item.productImage || 
                                            null;
                          const productName = item.productName || `Product ${item.productId.slice(-8)}`;
                          
                          return (
                            <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                {displayImage ? (
                                  <img 
                                    src={displayImage} 
                                    alt={productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900">{productName}</h3>
                                <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                
                                {item.customizations && Object.keys(item.customizations).length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Customization Details:</p>
                                    <div className="space-y-1">
                                      {item.customizations.designerName && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-600">Designer:</span>
                                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                                            {item.customizations.designerName}
                                          </span>
                                        </div>
                                      )}
                                      {item.customizations.printingShopName && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-600">Printing Shop:</span>
                                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-medium">
                                            {item.customizations.printingShopName}
                                          </span>
                                        </div>
                                      )}
                                      {item.customizations.customizationRequestId && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-xs text-gray-600">Request ID:</span>
                                          <span className="text-xs text-gray-700 font-mono">
                                            {item.customizations.customizationRequestId}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                <p className="text-sm text-gray-500">{formatPrice(item.price)} each</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Summary Card */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
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
                      </div>
                    </div>

                    {/* Shipping Address and Payment Information - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>

                    {/* Order Timeline */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="font-medium mb-3">Order Timeline</h3>
                      <div className="relative">
                        <div className="space-y-6 text-sm">
                          {(() => {
                            // Build timeline items array
                            const timelineItems = [
                              {
                                label: 'Order Placed',
                                date: formatDate(order.createdAt)
                              }
                            ];

                            if (order.status !== 'pending') {
                              timelineItems.push({
                                label: 'Order Confirmed',
                                date: new Date(new Date(order.createdAt).getTime() + 30 * 60 * 1000).toLocaleDateString()
                              });
                            }

                            if (['shipped', 'delivered'].includes(order.status)) {
                              timelineItems.push({
                                label: 'Shipped',
                                date: formatDate(order.updatedAt)
                              });
                            }

                            if (order.status === 'delivered') {
                              timelineItems.push({
                                label: 'Delivered',
                                date: formatDate(order.updatedAt)
                              });
                            }

                            return timelineItems.map((item, index) => {
                              const isLast = index === timelineItems.length - 1;
                              return (
                                <div key={index} className="relative flex items-center">
                                  {/* Vertical connecting line - positioned behind circles */}
                                  {!isLast && (
                                    <div className="absolute left-4 top-8 bottom-[-1.5rem] w-0.5 bg-gray-300"></div>
                                  )}
                                  
                                  {/* Circle icon with white border to create gap */}
                                  <div className="relative z-10 flex-shrink-0 mr-4">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-4 border-white">
                                      <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                  </div>
                                  
                                  {/* Content - vertically centered with circle */}
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{item.label}</p>
                                    <p className="text-gray-500 text-sm">{item.date}</p>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
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
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


