'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  AlertCircle,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
import { useSession } from 'next-auth/react';

// Cache configuration
const CACHE_KEY = 'orders_cache';
const CACHE_TIMESTAMP_KEY = 'orders_cache_timestamp';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

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
  shopName?: string; // Shop/Seller name
}

interface OrderItem {
  itemType?: 'product' | 'design';
  productId?: string;
  designId?: string;
  productName?: string;
  designName?: string;
  designType?: 'template' | 'custom' | 'premium';
  thumbnailUrl?: string;
  storagePath?: string;
  storageBucket?: string;
  quantity: number;
  price: number;
  customizations?: Record<string, any>;
  product?: {
    id: string;
    name: string;
    images?: Array<{
      id: string;
      imageUrl: string;
      altText?: string;
      isPrimary?: boolean;
    }>;
  };
  selectedDesign?: { name: string; priceModifier?: number };
  selectedSize?: { name: string; priceModifier?: number };
  selectedColorId?: string;
  selectedColorName?: string;
  selectedVariants?: Record<string, any>;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  // Define loadOrders before useEffect hooks that use it
  const loadOrders = useCallback(async (forceRefresh = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    // Check if we need to fetch (cache expired or force refresh)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (!forceRefresh && timeSinceLastFetch < CACHE_DURATION && lastFetchTimeRef.current > 0) {
      // Cache is still valid, don't fetch
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/orders', {
        headers: {
          'Cache-Control': 'no-cache', // Let browser handle caching
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        const ordersWithShopNames = await Promise.all(
          (data.orders || []).map(async (order: Order) => {
            // Fetch shop name if businessOwnerId exists
            if (order.businessOwnerId) {
              try {
                const shopResponse = await fetch(`/api/shop-profiles/user/${order.businessOwnerId}`);
                const shopData = await shopResponse.json();
                if (shopData.success && shopData.data) {
                  return { ...order, shopName: shopData.data.shopName || shopData.data.businessName };
                }
              } catch (error) {
                console.error('Error fetching shop name:', error);
              }
            }
            return order;
          })
        );
        
        setOrders(ordersWithShopNames);
        lastFetchTimeRef.current = now;
        
        // Cache the data
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(ordersWithShopNames));
          sessionStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
        } catch (error) {
          console.error('Error caching orders:', error);
        }
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const invalidateCache = useCallback(() => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
      sessionStorage.removeItem(CACHE_TIMESTAMP_KEY);
      lastFetchTimeRef.current = 0;
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }, []);

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        const cachedTimestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (cachedData && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          
          // If cache is still valid, use it
          if (now - timestamp < CACHE_DURATION) {
            const parsedOrders = JSON.parse(cachedData);
            setOrders(parsedOrders);
            setLoading(false);
            lastFetchTimeRef.current = timestamp;
            return true; // Cache was used
          }
        }
      } catch (error) {
        console.error('Error loading cached orders:', error);
      }
      return false; // Cache was not used
    };

    const cacheUsed = loadCachedData();
    if (!cacheUsed) {
      loadOrders(true);
    }
  }, [loadOrders]);

  // Refresh data when tab becomes visible and cache is stale
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTimeRef.current;
        
        // If cache is expired, refresh in background
        if (timeSinceLastFetch >= CACHE_DURATION) {
          loadOrders(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadOrders]);

  const markOrderToShip = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/to-ship`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Invalidate cache and reload orders
        invalidateCache();
        await loadOrders(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to mark order as ready to ship');
      }
    } catch (error) {
      console.error('Error marking order as ready to ship:', error);
      setError('Failed to mark order as ready to ship');
    }
  }, [loadOrders, invalidateCache]);

  const markOrderDelivered = useCallback(async (orderId: string) => {
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
        invalidateCache();
        await loadOrders(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to mark order as delivered');
      }
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      setError('Failed to mark order as delivered');
    }
  }, [loadOrders, invalidateCache]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
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
        invalidateCache();
        await loadOrders(true);
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  }, [loadOrders, invalidateCache]);

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Memoize filtered and sorted orders to prevent unnecessary recalculations
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        // Enhanced search: Order ID, Shop name, or Product name
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === '' || 
          order.id.toLowerCase().includes(searchLower) ||
          (order.shopName && order.shopName.toLowerCase().includes(searchLower)) ||
          order.items.some(item => 
            (item.productName && item.productName.toLowerCase().includes(searchLower)) ||
            (item.designName && item.designName.toLowerCase().includes(searchLower)) ||
            (item.productId && item.productId.toLowerCase().includes(searchLower)) ||
            (item.designId && item.designId.toLowerCase().includes(searchLower))
          );
        
        // Status filter mapping
        let statusMatch = false;
        if (statusFilter === 'all') {
          statusMatch = true;
        } else if (statusFilter === 'pending') {
          statusMatch = order.status === 'pending';
        } else if (statusFilter === 'processing') {
          statusMatch = order.status === 'processing' || order.status === 'to_ship';
        } else if (statusFilter === 'shipped') {
          statusMatch = order.status === 'shipped';
        } else if (statusFilter === 'delivered') {
          statusMatch = order.status === 'delivered';
        } else if (statusFilter === 'cancelled') {
          statusMatch = order.status === 'cancelled';
        }
        
        return matchesSearch && statusMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [orders, searchQuery, statusFilter, sortOrder]);

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session?.user || null} />
      
      {/* Mobile: Horizontal Tab Bar */}
      <CustomerNavigationSidebar variant="mobile" />
      
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8">
        {/* Desktop: Vertical Sidebar */}
        <CustomerNavigationSidebar variant="desktop" />

        {/* Right Content Area */}
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Orders</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Track and manage your orders</p>
              </div>
              {!loading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    invalidateCache();
                    loadOrders(true);
                  }}
                  className="w-full sm:w-auto"
                  title="Refresh orders"
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>

            {loading ? (
              <>
                {/* Tab Navigation Skeleton */}
                <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                  <div className="border-b border-gray-200">
                    <nav className="flex overflow-x-auto no-scrollbar space-x-4 md:space-x-8 px-4 md:px-6" aria-label="Tabs">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="py-3 md:py-4 px-1 flex-shrink-0"
                        >
                          <div className="h-4 md:h-5 w-20 md:w-24 bg-gray-200 rounded-md animate-pulse"></div>
                        </div>
                      ))}
                    </nav>
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .no-scrollbar {
                          -ms-overflow-style: none;
                          scrollbar-width: none;
                        }
                        .no-scrollbar::-webkit-scrollbar {
                          display: none;
                        }
                      `
                    }} />
                  </div>
                </div>

                {/* Search Bar with Sort Skeleton */}
                <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 mb-4 md:mb-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <div className="relative flex-1">
                      <div className="h-10 md:h-11 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="h-10 md:h-11 w-full sm:w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>

                {/* Order Cards Skeleton */}
                <div className="space-y-3 md:space-y-4">
                  {[1, 2, 3].map((orderIndex) => (
                    <div key={orderIndex} className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                      {/* Order Header Skeleton */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                            <div className="h-3 w-40 bg-gray-200 rounded-md animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="text-left sm:text-right w-full sm:w-auto space-y-1">
                          <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                          <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                        </div>
                      </div>

                      {/* Order Items Skeleton */}
                      <div className="border-t pt-3 md:pt-4">
                        <div className="space-y-3 md:space-y-4">
                          {[1, 2].map((itemIndex) => (
                            <div key={itemIndex} className="flex items-start gap-3 md:gap-4">
                              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 min-w-0">
                                <div className="flex-1 min-w-0">
                                  <div className="h-5 w-3/4 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                                  <div className="space-y-1">
                                    <div className="h-3 w-1/2 bg-gray-200 rounded-md animate-pulse"></div>
                                    <div className="h-3 w-2/3 bg-gray-200 rounded-md animate-pulse"></div>
                                  </div>
                                </div>
                                <div className="text-left sm:text-right flex-shrink-0">
                                  <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
                                  <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Actions Skeleton */}
                      <div className="border-t pt-3 md:pt-4 mt-3 md:mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-4 w-full sm:w-auto">
                          <div className="h-9 w-full sm:w-32 bg-gray-200 rounded-md animate-pulse"></div>
                          <div className="h-9 w-full sm:w-36 bg-gray-200 rounded-md animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                  <div className="border-b border-gray-200">
                    <nav className="flex overflow-x-auto no-scrollbar space-x-4 md:space-x-8 px-4 md:px-6" aria-label="Tabs">
                      {[
                        { id: 'all', label: 'All Orders' },
                        { id: 'pending', label: 'Pending' },
                        { id: 'processing', label: 'Processing' },
                        { id: 'shipped', label: 'Shipped' },
                        { id: 'delivered', label: 'Delivered' },
                        { id: 'cancelled', label: 'Cancelled' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setStatusFilter(tab.id)}
                          className={`
                            py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap flex-shrink-0
                            ${
                              statusFilter === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                          `}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .no-scrollbar {
                          -ms-overflow-style: none;
                          scrollbar-width: none;
                        }
                        .no-scrollbar::-webkit-scrollbar {
                          display: none;
                        }
                      `
                    }} />
                  </div>
                </div>

                {/* Search Bar with Sort */}
                <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 mb-4 md:mb-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                      <Input
                        placeholder="Search by Shop, Order ID or Product"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 md:pl-10 text-sm md:text-base bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                    <button
                      onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                      className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group relative w-full sm:w-auto"
                      title={sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                    >
                      {sortOrder === 'newest' ? (
                        <ArrowDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ArrowUp className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-xs md:text-sm text-gray-600 font-medium">
                        {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                      </span>
                    </button>
                  </div>
                </div>

            {/* Orders List */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 text-center">
            <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-600 mb-2">No orders found</h3>
            <p className="text-sm md:text-base text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'You haven\'t placed any orders yet'
              }
            </p>
            <Link href="/explore">
              <Button className="w-full sm:w-auto">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Order #{order.id.slice(-8)}</p>
                      <p className="text-xs text-gray-400">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-base md:text-lg font-semibold">{formatPrice(order.totalAmount)}</p>
                    {order.discountAmount && order.discountAmount > 0 && (
                      <p className="text-xs md:text-sm text-green-600">
                        Discount: -{formatPrice(order.discountAmount)}
                      </p>
                    )}
                    <p className="text-xs md:text-sm text-gray-500">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-3 md:pt-4">
                  {order.items.length === 0 ? (
                    <p className="text-sm text-gray-500">No items in this order</p>
                  ) : (
                    <>
                      <div className="space-y-3 md:space-y-4">
                        {(expandedOrders.has(order.id) ? order.items : order.items.slice(0, 2)).map((item, index) => (
                          <div key={index} className="flex items-start gap-3 md:gap-4">
                            {/* Product/Design Image */}
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {(() => {
                                const isDesign = item.itemType === 'design' || (item.designId && !item.productId);
                                
                                // Handle design items
                                if (isDesign && item.thumbnailUrl) {
                                  return (
                                    <img
                                      src={item.thumbnailUrl}
                                      alt={item.designName || 'Design'}
                                      className="w-full h-full object-cover"
                                    />
                                  );
                                }
                                
                                // Handle product items
                                if (item.product?.images && item.product.images.length > 0) {
                                  return (
                                    <img
                                      src={item.product.images[0].imageUrl}
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  );
                                }
                                
                                // Handle customization preview
                                if (item.customizations?.designerFinalFileUrl) {
                                  return (
                                    <img 
                                      src={item.customizations.designerFinalFileUrl as string}
                                      alt="Design Preview"
                                      className="w-full h-full object-cover"
                                    />
                                  );
                                }
                                
                                // Fallback
                                return (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                );
                              })()}
                            </div>
                            
                            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 min-w-0">
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm md:text-base block truncate">
                                  {(() => {
                                    const isDesign = item.itemType === 'design' || (item.designId && !item.productId);
                                    
                                    if (isDesign) {
                                      return item.designName || `Design ${item.designId?.slice(-8) || 'Unknown'}`;
                                    }
                                    
                                    return item.product?.name || item.productName || (item.productId ? `Product ${item.productId.slice(-8)}` : 'Unknown Product');
                                  })()}
                                </span>
                                
                                {/* Design Type Badge (for design items) */}
                                {(() => {
                                  const isDesign = item.itemType === 'design' || (item.designId && !item.productId);
                                  if (isDesign && item.designType) {
                                    return (
                                      <div className="text-xs text-gray-500 mt-1">
                                        <span className="capitalize">{item.designType}</span>
                                        {item.designType === 'premium' && (
                                          <span className="ml-1 text-indigo-600">Premium</span>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Variant Info (for product items) */}
                                {(() => {
                                  const isDesign = item.itemType === 'design' || (item.designId && !item.productId);
                                  if (!isDesign && (item.selectedDesign || item.selectedSize || (item.selectedVariants && Object.keys(item.selectedVariants).length > 0) || item.selectedColorId)) {
                                    return (
                                      <div className="text-sm text-gray-400 mt-1 space-y-0.5">
                                        {item.selectedDesign && (
                                          <div>Design: {item.selectedDesign.name}</div>
                                        )}
                                        {item.selectedSize && (
                                          <div>Size: {item.selectedSize.name}</div>
                                        )}
                                        {item.selectedVariants && Object.entries(item.selectedVariants).map(([key, value]) => (
                                          <div key={key}>{key}: {value}</div>
                                        ))}
                                        {item.selectedColorId && (
                                          <div>Color: {item.selectedColorName || item.selectedColorId}</div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Customization Info (for custom orders) */}
                                {item.customizations && (item.customizations.customizationRequestId || item.customizations.designerName || item.customizations.printingShopName) && (
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
                              <div className="text-left sm:text-right flex-shrink-0">
                                <span className="text-xs md:text-sm block">Qty: {item.quantity}</span>
                                <p className="font-medium text-sm md:text-base">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Show expand/collapse button if more than 2 items */}
                      {order.items.length > 2 && (
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedOrders);
                            if (newExpanded.has(order.id)) {
                              newExpanded.delete(order.id);
                            } else {
                              newExpanded.add(order.id);
                            }
                            setExpandedOrders(newExpanded);
                          }}
                          className="mt-3 md:mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors w-full sm:w-auto"
                        >
                          {expandedOrders.has(order.id) ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              <span>Show Less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              <span>Show All {order.items.length} Items</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Order Actions */}
                <div className="border-t pt-3 md:pt-4 mt-3 md:mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-4 w-full sm:w-auto">
                    <Link href={`/orders/${order.id}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    
                    {order.trackingNumber && (
                      <Link href={`/orders/${order.id}/tracking`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
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
              </>
            )}
          </div>
        </main>
      </div>
      
      <ScrollToTop />
    </div>
  );
}


