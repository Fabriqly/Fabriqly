'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Eye, 
  Download,
  AlertCircle,
  Search,
  Filter,
  X
} from 'lucide-react';
import { CustomizationRequest, CustomizationStats } from '@/types/customization';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CustomizationRequestListProps {
  userId: string;
  userRole: string;
  onViewRequest: (request: CustomizationRequest) => void;
  onSetPricing?: (request: CustomizationRequest) => void;
  simpleFilter?: boolean; // If true, show only simple status filter (no search, no advanced filters)
}

export function CustomizationRequestList({ 
  userId, 
  userRole,
  onViewRequest,
  onSetPricing,
  simpleFilter = false
}: CustomizationRequestListProps) {
  const [requests, setRequests] = useState<CustomizationRequest[]>([]);
  const [allRequests, setAllRequests] = useState<CustomizationRequest[]>([]); // Store all requests for client-side filtering
  const [stats, setStats] = useState<CustomizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [userId, filter]);

  useEffect(() => {
    // Apply client-side filters when search, payment, date, or sort changes (only if not simple filter)
    if (!simpleFilter) {
      applyFilters();
    }
  }, [searchQuery, paymentFilter, dateFilter, sortBy, allRequests, simpleFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (userRole === 'customer') {
        params.append('customerId', userId);
      } else if (userRole === 'designer' || userRole === 'business_owner') {
        params.append('designerId', userId);
      }
      
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/customizations?${params}`);
      const result = await response.json();
      
      if (result.success) {
        const fetchedRequests = result.data || [];
        setAllRequests(fetchedRequests);
        // If simple filter, don't apply client-side filtering - just use server results
        if (simpleFilter) {
          setRequests(fetchedRequests);
        } else {
          setRequests(fetchedRequests);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (userRole === 'customer') {
        params.append('customerId', userId);
      } else if (userRole === 'designer' || userRole === 'business_owner') {
        params.append('designerId', userId);
      }

      const response = await fetch(`/api/customizations/stats?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_designer_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting_customer_approval':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_designer_review':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <Loader className="w-4 h-4 animate-spin" />;
      case 'awaiting_customer_approval':
        return <AlertCircle className="w-4 h-4" />;
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    
    // Handle Firestore Timestamp object
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    }
    // Handle Firestore Timestamp serialized as object with seconds
    else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    }
    // Handle ISO string or timestamp number
    else {
      date = new Date(timestamp);
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDateFromTimestamp = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    
    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      } else if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
      } else {
        return new Date(timestamp);
      }
    } catch {
      return null;
    }
  };

  const applyFilters = () => {
    let filtered = [...allRequests];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request => 
        request.productName?.toLowerCase().includes(query) ||
        request.customerName?.toLowerCase().includes(query) ||
        request.designerName?.toLowerCase().includes(query) ||
        request.customizationNotes?.toLowerCase().includes(query) ||
        request.id.toLowerCase().includes(query)
      );
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(request => {
        if (!request.paymentDetails) {
          return paymentFilter === 'unpaid';
        }
        
        switch (paymentFilter) {
          case 'paid':
            return request.paymentDetails.paymentStatus === 'fully_paid' ||
                   (request.paymentDetails.paidAmount || 0) > 0;
          case 'unpaid':
            return !request.paymentDetails || 
                   request.paymentDetails.paymentStatus === 'pending' ||
                   (request.paymentDetails.paidAmount || 0) === 0;
          case 'partial':
            return request.paymentDetails.paymentStatus === 'partially_paid';
          default:
            return true;
        }
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(request => {
        const requestDate = getDateFromTimestamp(request.requestedAt || request.createdAt);
        if (!requestDate) return false;

        switch (dateFilter) {
          case 'today':
            return requestDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return requestDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return requestDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return requestDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = getDateFromTimestamp(a.requestedAt || a.createdAt);
      const dateB = getDateFromTimestamp(b.requestedAt || b.createdAt);
      
      if (!dateA || !dateB) return 0;

      switch (sortBy) {
        case 'newest':
          return dateB.getTime() - dateA.getTime();
        case 'oldest':
          return dateA.getTime() - dateB.getTime();
        case 'product_asc':
          return (a.productName || '').localeCompare(b.productName || '');
        case 'product_desc':
          return (b.productName || '').localeCompare(a.productName || '');
        default:
          return 0;
      }
    });

    setRequests(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPaymentFilter('all');
    setDateFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Requests</p>
            <p className="text-2xl font-bold">{stats.totalRequests}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pendingReview}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          </div>
        </div>
      )}

      {/* Filters Section */}
      {simpleFilter ? (
        // Simple filter for designers
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Requests</option>
            <option value="pending_designer_review">Pending Review</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_customer_approval">Awaiting Approval</option>
            <option value="ready_for_production">Ready for Production</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      ) : (
        // Full filters for other users
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          {/* Search and Filter Toggle */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by product, customer, designer, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              {(searchQuery || paymentFilter !== 'all' || dateFilter !== 'all' || sortBy !== 'newest') && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Requests</option>
              <option value="pending_designer_review">Pending Review</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_customer_approval">Awaiting Approval</option>
              <option value="ready_for_production">Ready for Production</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              {/* Payment Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partially Paid</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="product_asc">Product Name (A-Z)</option>
                  <option value="product_desc">Product Name (Z-A)</option>
                </select>
              </div>
            </div>
          )}

          {/* Active Filters Count */}
          {(searchQuery || paymentFilter !== 'all' || dateFilter !== 'all' || sortBy !== 'newest') && (
            <div className="text-sm text-gray-600">
              Showing {requests.length} of {allRequests.length} requests
            </div>
          )}
        </div>
      )}

      {/* Request List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-gray-600">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No customization requests found</p>
          </div>
        ) : (
          requests.map((request) => (
            <div 
              key={request.id} 
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Product Info */}
                <div className="flex items-start gap-4 flex-1">
                  {request.productImage && (
                    <img 
                      src={request.productImage} 
                      alt={request.productName}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{request.productName}</h3>
                    {userRole === 'customer' && request.designerName && (
                      <p className="text-sm text-gray-600">Designer: {request.designerName}</p>
                    )}
                    {(userRole === 'designer' || userRole === 'business_owner') && (
                      <p className="text-sm text-gray-600">Customer: {request.customerName}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Requested: {formatDate(request.requestedAt)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {formatStatus(request.status)}
                  </span>
                  
                  {/* Pricing Status for Designers */}
                  {userRole === 'designer' && (request.status === 'awaiting_customer_approval' || request.status === 'awaiting_pricing') && (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      request.pricingAgreement 
                        ? 'bg-green-100 text-green-800' 
                        : request.status === 'awaiting_pricing'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.pricingAgreement 
                        ? '✓ Pricing Set' 
                        : request.status === 'awaiting_pricing'
                        ? '⚠️ Pricing Rejected'
                        : '⚠️ Pricing Needed'}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onViewRequest(request)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  
                  {/* Set Pricing Button for Designers */}
                  {userRole === 'designer' && 
                   (request.status === 'awaiting_customer_approval' || request.status === 'awaiting_pricing') && 
                   !request.pricingAgreement && 
                   onSetPricing && (
                    <button
                      onClick={() => onSetPricing(request)}
                      className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 ${
                        request.status === 'awaiting_pricing'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-yellow-600 hover:bg-yellow-700'
                      }`}
                    >
                      💰 {request.status === 'awaiting_pricing' ? 'Set New Price' : 'Set Pricing'}
                    </button>
                  )}
                </div>
              </div>

              {/* Notes Preview */}
              {request.customizationNotes && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    <span className="font-medium">Notes:</span> {request.customizationNotes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

