'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft,
  Package, 
  Truck, 
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  CreditCard,
  Loader,
  Eye,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';

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
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  shopName?: string;
}

interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  customizations?: Record<string, any>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const orderId = params.id as string;

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();
      
      if (response.ok && data.order) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Failed to load order details');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const convertToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    
    try {
      if (timestamp instanceof Date) {
        return timestamp;
      }
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      if (timestamp._seconds !== undefined) {
        const seconds = timestamp._seconds;
        const nanoseconds = timestamp._nanoseconds || 0;
        return new Date(seconds * 1000 + nanoseconds / 1000000);
      }
      return new Date(timestamp);
    } catch (error) {
      console.error('Error converting timestamp to date:', error);
      return null;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = convertToDate(timestamp);
    
    if (!date || isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'shipped':
      case 'to_ship':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'processing':
        return <Package className="w-5 h-5 text-orange-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'to_ship':
        return 'bg-orange-100 text-orange-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setActionLoading('cancel');
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        await loadOrder();
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDelivered = async () => {
    try {
      setActionLoading('delivered');
      const response = await fetch(`/api/orders/${orderId}/mark-delivered`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        await loadOrder();
      } else {
        alert(data.error || 'Failed to mark order as delivered');
      }
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      alert('Failed to mark order as delivered');
    } finally {
      setActionLoading(null);
    }
  };

  // Skeleton Loading Component
  const OrderDetailsSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />
      {/* Mobile: Horizontal Tab Bar */}
      <CustomerNavigationSidebar variant="mobile" />
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8">
        {/* Desktop: Vertical Sidebar */}
        <CustomerNavigationSidebar variant="desktop" />
        <div className="flex-1 w-full">
          {/* Header Skeleton */}
          <div className="mb-4 md:mb-6">
            <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse mb-3 md:mb-4"></div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="space-y-2">
                <div className="h-7 md:h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="h-10 w-36 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Order Status Card Skeleton */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                  <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Order Items Skeleton */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mb-3 md:mb-4"></div>
                <div className="space-y-3 md:space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-start gap-3 md:gap-4 pb-3 md:pb-4 border-b last:border-0 last:pb-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 mt-2">
                          <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                          <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address Skeleton */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-3 md:mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-4 w-40 bg-gray-200 rounded-md animate-pulse mt-2"></div>
                </div>
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-4 md:space-y-6">
              {/* Order Summary Skeleton */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mb-3 md:mb-4"></div>
                <div className="space-y-2 md:space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                    </div>
                  ))}
                  <div className="border-t pt-2 md:pt-3 flex justify-between">
                    <div className="h-5 w-12 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Payment Information Skeleton */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-3 md:mb-4"></div>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <div className="h-4 w-28 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Tracking Information Skeleton */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="h-6 w-44 bg-gray-200 rounded-md animate-pulse mb-3 md:mb-4"></div>
                <div className="space-y-2 md:space-y-3">
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                  <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse mt-3 md:mt-4"></div>
                </div>
              </div>

              {/* Actions Skeleton */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse mb-3 md:mb-4"></div>
                <div className="space-y-2">
                  <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <OrderDetailsSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />
        {/* Mobile: Horizontal Tab Bar */}
        <CustomerNavigationSidebar variant="mobile" />
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8">
          {/* Desktop: Vertical Sidebar */}
          <CustomerNavigationSidebar variant="desktop" />
          <div className="flex-1 w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-md mx-auto text-center">
              <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-3 md:mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">{error || 'The order you are looking for does not exist.'}</p>
              <Link href="/orders" className="inline-block">
                <Button className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />
      {/* Mobile: Horizontal Tab Bar */}
      <CustomerNavigationSidebar variant="mobile" />
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8">
        {/* Desktop: Vertical Sidebar */}
        <CustomerNavigationSidebar variant="desktop" />
        <div className="flex-1 w-full">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <Link href="/orders">
              <Button variant="outline" size="sm" className="mb-3 md:mb-4 w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Order #{order.id.slice(-8)}</p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                {order.trackingNumber && (
                  <Link href={`/orders/${order.id}/tracking`} className="flex-1 sm:flex-none">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Truck className="w-4 h-4 mr-2" />
                      Track Package
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Order Status Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">Order Status</h2>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Order Date</p>
                    <p className="font-medium text-sm md:text-base">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium text-sm md:text-base">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Order Items</h2>
                <div className="space-y-3 md:space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 md:gap-4 pb-3 md:pb-4 border-b last:border-0 last:pb-0">
                      {item.customizations?.designerFinalFileUrl && (
                        <div className="flex-shrink-0">
                          <img 
                            src={item.customizations.designerFinalFileUrl as string}
                            alt="Design Preview"
                            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm md:text-base text-gray-900 break-words">
                          {item.productName || `Product ${item.productId.slice(-8)}`}
                        </h3>
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="text-xs text-gray-600 mt-2 space-y-1">
                            {item.customizations.designerName && (
                              <p className="break-words">Designer: {item.customizations.designerName as string}</p>
                            )}
                            {item.customizations.printingShopName && (
                              <p className="break-words">Printing Shop: {item.customizations.printingShopName as string}</p>
                            )}
                            {item.customizations.customizationRequestId && (
                              <Link 
                                href={`/customizations/${item.customizations.customizationRequestId}`}
                                className="text-blue-600 hover:underline text-xs"
                              >
                                View Customization Request
                              </Link>
                            )}
                          </div>
                        )}
                        <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                          <span className="text-xs md:text-sm text-gray-500">Quantity: {item.quantity}</span>
                          <span className="font-medium text-sm md:text-base">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Shipping Address
                  </h2>
                  <div className="text-xs md:text-sm text-gray-700 space-y-1">
                    <p className="font-medium break-words">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p className="break-words">{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && (
                      <p className="break-words">{order.shippingAddress.address2}</p>
                    )}
                    <p className="break-words">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                    <p className="break-words">{order.shippingAddress.country}</p>
                    <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 md:space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Order Summary</h2>
                <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(order.subtotal)}</span>
                  </div>
                  {order.discountAmount && order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="break-words">Discount {order.appliedCouponCode && `(${order.appliedCouponCode})`}</span>
                      <span className="font-medium flex-shrink-0 ml-2">-{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatPrice(order.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{formatPrice(order.shippingCost)}</span>
                  </div>
                  <div className="border-t pt-2 md:pt-3 flex justify-between font-semibold text-base md:text-lg">
                    <span>Total</span>
                    <span>{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Payment Information
                </h2>
                <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium break-words text-left sm:text-right">{order.paymentMethod}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tracking Information */}
              {order.trackingNumber && (
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
                    <Truck className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Tracking Information
                  </h2>
                  <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                    <div>
                      <p className="text-gray-600">Tracking Number</p>
                      <p className="font-medium break-all">{order.trackingNumber}</p>
                    </div>
                    {order.carrier && (
                      <div>
                        <p className="text-gray-600">Carrier</p>
                        <p className="font-medium break-words">{order.carrier}</p>
                      </div>
                    )}
                    <Link href={`/orders/${order.id}/tracking`} className="block mt-3 md:mt-4">
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Tracking Details
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Order Actions */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Actions</h2>
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      className="w-full text-red-600 border-red-300 hover:bg-red-50"
                      onClick={handleCancelOrder}
                      disabled={actionLoading === 'cancel'}
                    >
                      {actionLoading === 'cancel' ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Cancel Order
                    </Button>
                  )}
                  {order.status === 'shipped' && (
                    <Button 
                      variant="outline" 
                      className="w-full text-green-600 border-green-300 hover:bg-green-50"
                      onClick={handleMarkDelivered}
                      disabled={actionLoading === 'delivered'}
                    >
                      {actionLoading === 'delivered' ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Mark as Received
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ScrollToTop />
    </div>
  );
}

