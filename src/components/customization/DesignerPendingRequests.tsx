'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Package, Loader, Eye } from 'lucide-react';
import { CustomizationRequest } from '@/types/customization';

interface DesignerPendingRequestsProps {
  onViewRequest: (request: CustomizationRequest) => void;
  onClaimRequest: (request: CustomizationRequest) => Promise<void>;
}

export function DesignerPendingRequests({ 
  onViewRequest,
  onClaimRequest 
}: DesignerPendingRequestsProps) {
  const [requests, setRequests] = useState<CustomizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequests();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('/api/customizations/pending');
      const result = await response.json();
      
      if (result.success) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (request: CustomizationRequest) => {
    if (!confirm(`Claim this customization request for ${request.productName}?`)) {
      return;
    }

    setClaiming(request.id);
    try {
      await onClaimRequest(request);
      // Remove from list after claiming
      setRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (error) {
      console.error('Error claiming request:', error);
      alert('Failed to claim request. It may have been claimed by another designer.');
    } finally {
      setClaiming(null);
    }
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
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Available Requests</h2>
          <p className="text-gray-600 mt-1">
            {requests.length} request{requests.length !== 1 ? 's' : ''} waiting for a designer
          </p>
        </div>
        <button
          onClick={fetchPendingRequests}
          disabled={loading}
          className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <Loader className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No pending requests at the moment</p>
          <p className="text-sm text-gray-500 mt-2">Check back soon for new customization requests</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div 
              key={request.id} 
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Request Info */}
                <div className="flex items-start gap-4 flex-1">
                  {request.productImage && (
                    <img 
                      src={request.productImage} 
                      alt={request.productName}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{request.productName}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {request.customerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(request.requestedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notes Preview */}
                    {request.customizationNotes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          <span className="font-medium">Instructions:</span> {request.customizationNotes}
                        </p>
                      </div>
                    )}

                    {/* File Indicators */}
                    <div className="flex gap-2 mt-3">
                      {request.customerDesignFile && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          📎 Design File Attached
                        </span>
                      )}
                      {request.customerPreviewImage && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          🖼️ Preview Image Attached
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  <button
                    onClick={() => onViewRequest(request)}
                    className="flex-1 md:flex-none px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleClaim(request)}
                    disabled={claiming === request.id}
                    className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {claiming === request.id ? (
                      <span className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Claiming...
                      </span>
                    ) : (
                      'Claim Request'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

