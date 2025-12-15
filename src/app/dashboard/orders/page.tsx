'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { 
  Package, 
  Search, 
  Eye, 
  Truck, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  FileText,
  Loader,
  ArrowUpDown,
  ChevronDown,
  ChevronUp
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
  carrier?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  customizations?: {
    customizationRequestId?: string;
    designerFinalFileUrl?: string;
    designerName?: string;
    printingShopName?: string;
  };
}

export default function ShopOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Check if user is a designer (design orders are automatically delivered)
  const isDesigner = user?.role === 'designer';
  
  // Check if all orders are design orders
  const allDesignOrders = orders.length > 0 && orders.every(order => 
    order.items.every((item: any) => 
      item.itemType === 'design' || (item.designId && !item.productId)
    )
  );
  
  // For designers or when all orders are design orders, show simplified tabs
  const showSimplifiedTabs = isDesigner || allDesignOrders;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedAddresses, setExpandedAddresses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all orders (no status filter) to include cancelled orders
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (response.ok) {
        const ordersList = data.orders || [];
        console.log(`[Orders Dashboard] Loaded ${ordersList.length} orders for ${user?.role}`);
        // Log order statuses for debugging
        const statusCounts = ordersList.reduce((acc: Record<string, number>, order: Order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {});
        console.log('[Orders Dashboard] Order status breakdown:', statusCounts);
        setOrders(ordersList);
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

  const markOrderAsShipped = async (orderId: string) => {
    if (!trackingNumber.trim()) {
      alert('Please enter a tracking number');
      return;
    }

    try {
      // Add tracking number (this also automatically sets status to 'shipped')
      const trackingResponse = await fetch(`/api/orders/${orderId}/tracking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trackingNumber: trackingNumber.trim(),
          carrier: carrier.trim() || 'Standard Shipping'
        }),
      });

      if (!trackingResponse.ok) {
        const data = await trackingResponse.json();
        throw new Error(data.error || 'Failed to add tracking number');
      }

      // Success! The tracking API automatically marks order as shipped
      alert('Order marked as shipped successfully! If this is a customization order with escrow, shop payment will be released.');
      setSelectedOrder(null);
      setTrackingNumber('');
      setCarrier('');
      await loadOrders();
    } catch (error: any) {
      console.error('Error marking order as shipped:', error);
      alert(error.message || 'Failed to mark order as shipped');
    }
  };

  const markOrderProcessing = async (orderId: string) => {
    if (!confirm('Accept this order and start processing?')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing' }),
      });

      if (response.ok) {
        alert('Order accepted and moved to processing!');
        await loadOrders();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to accept order');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('Please provide a reason for rejecting this order (optional):');
    if (reason === null) return; // User cancelled

    if (!confirm('Are you sure you want to reject this order? The customer will be able to select a different shop.')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason || undefined }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Order rejected successfully. Customer can now select a different shop.');
        await loadOrders();
      } else {
        alert(data.error || 'Failed to reject order');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order');
    }
  };

  const markOrderToShip = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/to-ship`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        await loadOrders();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to mark order as ready to ship');
      }
    } catch (error) {
      console.error('Error marking order:', error);
      alert('Failed to mark order as ready to ship');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'to_ship':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'to_ship':
        return <AlertCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.shippingAddress?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.shippingAddress?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
      
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filter or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, itemsPerPage, searchQuery, sortOrder]);

  // Get count of orders per status
  const getStatusCount = (status: string) => {
    if (status === 'all') {
      return orders.filter(order => {
        const matchesSearch = 
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.shippingAddress?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.shippingAddress?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      }).length;
    }
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.shippingAddress?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.shippingAddress?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && order.status === status;
    }).length;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader user={user} />

      <div className="flex flex-1">
        {/* Dashboard Sidebar */}
        <DashboardSidebar user={user} />

        {/* Main Content */}
        <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
              <p className="text-gray-600">Manage and fulfill your shop orders</p>
            </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order ID or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 sm:w-[160px] sm:justify-center whitespace-nowrap"
            title={sortOrder === 'asc' ? 'Sort by date: Oldest first (Click to switch to newest first)' : 'Sort by date: Newest first (Click to switch to oldest first)'}
          >
            <ArrowUpDown className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">
              {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
            </span>
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {showSimplifiedTabs ? (
              // Simplified tabs for designers (design orders are automatically delivered)
              <>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getStatusCount('all')}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('delivered')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    statusFilter === 'delivered'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Delivered
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getStatusCount('delivered')}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    statusFilter === 'cancelled'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Cancelled
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getStatusCount('cancelled')}
                  </span>
                </button>
              </>
            ) : (
              // Full tabs for shop owners (product orders)
              <>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getStatusCount('all')}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    statusFilter === 'pending'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Pending
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getStatusCount('pending')}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('processing')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    statusFilter === 'processing'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Processing
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getStatusCount('processing')}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('to_ship')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    statusFilter === 'to_ship'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  To Ship
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getStatusCount('to_ship')}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('shipped')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    statusFilter === 'shipped'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Shipped
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getStatusCount('shipped')}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('delivered')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    statusFilter === 'delivered'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Delivered
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getStatusCount('delivered')}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    statusFilter === 'cancelled'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Cancelled
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getStatusCount('cancelled')}
                  </span>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Items Per Page Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">Items per page:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white appearance-none cursor-pointer min-w-[80px]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={30}>30</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredOrders.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow animate-pulse">
              <div className="p-6">
                {/* Order Header Skeleton */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                      <div className="h-5 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                </div>

                {/* Order Items Skeleton */}
                <div className="border-t border-b border-gray-200 py-4 mb-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>

                {/* Order Summary Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shipping Address Skeleton */}
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-4 bg-gray-200 rounded w-36"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>

                  {/* Order Total & Actions Skeleton */}
                  <div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                        <div className="h-5 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Orders will appear here once customers place them'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedOrders.map((order) => {
            const isCustomizationOrder = order.items.some(item => item.customizations?.customizationRequestId);
            const isAddressExpanded = expandedAddresses[order.id] ?? false;
            
            return (
              <div key={order.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-3 md:p-6">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">
                          Order #{order.id.substring(0, 8)}
                        </h3>
                        {/* Custom Design tag - desktop only */}
                        {isCustomizationOrder && (
                          <span className="hidden md:inline-block px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 text-xs font-semibold rounded">
                            🎨 Custom Design
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                        {/* Custom Design tag - mobile only, below date */}
                        {isCustomizationOrder && (
                          <span className="md:hidden px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 text-xs font-semibold rounded">
                            🎨 Custom Design
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-b border-gray-200 py-3 md:py-4 mb-3 md:mb-4">
                    {order.items.map((item, index) => {
                      const isDesign = item.itemType === 'design' || (item.designId && !item.productId);
                      
                      return (
                        <div key={index} className="flex items-center justify-between py-1.5 md:py-2">
                          <div className="flex-1">
                            {isDesign ? (
                              <>
                                <p className="font-medium text-gray-900">
                                  {item.designName || `Design ${item.designId?.substring(0, 8) || 'Unknown'}`}
                                </p>
                                {item.designType && (
                                  <p className="text-xs text-gray-500 mt-0.5 capitalize">
                                    {item.designType}
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="font-medium text-gray-900">
                                  {item.productName || (item.productId ? `Product ${item.productId.substring(0, 8)}` : 'Unknown Product')}
                                </p>
                                {item.customizations?.designerName && (
                                  <p className="text-sm text-gray-600">
                                    Designer: {item.customizations.designerName}
                                  </p>
                                )}
                                {item.customizations?.customizationRequestId && (
                                  <Link
                                    href={`/customizations/${item.customizations.customizationRequestId}`}
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    View Customization Request
                                  </Link>
                                )}
                              </>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {item.quantity} × ₱{item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Shipping Address */}
                    <div>
                      <button
                        onClick={() => setExpandedAddresses(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                        className="md:pointer-events-none w-full md:w-auto text-left md:cursor-default"
                      >
                        <h4 className="font-semibold text-gray-900 mb-1.5 md:mb-2 flex items-center justify-between md:justify-start gap-2 text-sm md:text-base">
                          <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Shipping Address
                          </span>
                          <span className="md:hidden flex-shrink-0">
                            {isAddressExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </span>
                        </h4>
                      </button>
                      {/* Collapsed view on mobile - show summary */}
                      {!isAddressExpanded && (
                        <div className="md:hidden text-sm text-gray-600">
                          <p className="font-medium">
                            {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                          </p>
                          <p className="text-gray-500">
                            {order.shippingAddress?.city}, {order.shippingAddress?.state}
                          </p>
                        </div>
                      )}
                      {/* Expanded/Desktop view - show full address */}
                      <div className={`text-sm text-gray-600 space-y-1 ${!isAddressExpanded ? 'hidden md:block' : ''}`}>
                        <p className="font-medium">
                          {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                        </p>
                        <p>{order.shippingAddress?.address1}</p>
                        {order.shippingAddress?.address2 && <p>{order.shippingAddress.address2}</p>}
                        <p>
                          {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
                        </p>
                        <p>{order.shippingAddress?.country}</p>
                        <p className="flex items-center gap-1 mt-2">
                          <Phone className="w-3 h-3" />
                          {order.shippingAddress?.phone}
                        </p>
                      </div>
                    </div>

                    {/* Order Total & Actions */}
                    <div>
                      <div className="space-y-2 mb-3 md:mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span>₱{order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax:</span>
                          <span>₱{order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping:</span>
                          <span>₱{order.shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>₱{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => markOrderProcessing(order.id)}
                              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Accept & Start Processing
                            </button>
                            <button
                              onClick={() => handleRejectOrder(order.id)}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject Order
                            </button>
                          </>
                        )}

                        {order.status === 'processing' && (
                          <>
                            <button
                              onClick={() => markOrderToShip(order.id)}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Package className="w-4 h-4" />
                              Mark as Ready to Ship
                            </button>
                            <button
                              onClick={() => handleRejectOrder(order.id)}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject Order
                            </button>
                          </>
                        )}

                        {order.status === 'to_ship' && (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Truck className="w-4 h-4" />
                            Mark as Shipped
                          </button>
                        )}

                        {order.trackingNumber && (
                          <div className="bg-gray-50 rounded p-3 text-sm">
                            <p className="text-gray-600 mb-1">Tracking Number:</p>
                            <p className="font-mono font-semibold">{order.trackingNumber}</p>
                            {order.carrier && (
                              <p className="text-gray-600 text-xs mt-1">Carrier: {order.carrier}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Notes:</p>
                          <p className="text-sm text-gray-600">{order.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-500">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages || totalPages === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Ship Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Mark Order as Shipped</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number *
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carrier (Optional)
                </label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., LBC, J&T, Ninja Van"
                />
              </div>

              {selectedOrder.items.some(item => item.customizations?.customizationRequestId) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💰 <strong>Escrow Payment:</strong> This is a customization order. When you mark it as shipped, your shop payment will be automatically released from escrow!
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => markOrderAsShipped(selectedOrder.id)}
                disabled={!trackingNumber.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Confirm Shipment
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setTrackingNumber('');
                  setCarrier('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}

