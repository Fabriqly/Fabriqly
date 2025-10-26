'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Eye, 
  Download,
  AlertCircle 
} from 'lucide-react';
import { CustomizationRequest, CustomizationStats } from '@/types/customization';

interface CustomizationRequestListProps {
  userId: string;
  userRole: string;
  onViewRequest: (request: CustomizationRequest) => void;
}

export function CustomizationRequestList({ 
  userId, 
  userRole,
  onViewRequest 
}: CustomizationRequestListProps) {
  const [requests, setRequests] = useState<CustomizationRequest[]>([]);
  const [stats, setStats] = useState<CustomizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [userId, filter]);

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
        setRequests(result.data);
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
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
          </div>
        </div>
      )}

      {/* Filter */}
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
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

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
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {formatStatus(request.status)}
                  </span>
                </div>

                {/* Actions */}
                <div>
                  <button
                    onClick={() => onViewRequest(request)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
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

