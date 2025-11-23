'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { ShopPricingForm } from '@/components/customization/ShopPricingForm';
import { 
  Package, 
  Search, 
  Eye, 
  DollarSign,
  CheckCircle, 
  Clock,
  Loader,
  Filter
} from 'lucide-react';

interface CustomizationRequest {
  id: string;
  productName: string;
  customerName: string;
  designerName?: string;
  status: string;
  pricingAgreement?: {
    designFee: number;
    productCost: number;
    printingCost: number;
    totalCost: number;
  };
  printingShopName?: string;
  createdAt: any;
  updatedAt: any;
}

export default function ShopCustomizationsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CustomizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<CustomizationRequest | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch customization requests where this shop owner's shop is selected
      const response = await fetch('/api/customizations?printingShop=mine');
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data || []);
      } else {
        setError(data.error || 'Failed to load customization requests');
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      setError('Failed to load customization requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPricing = (request: CustomizationRequest) => {
    setSelectedRequest(request);
    setShowPricingModal(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending_designer_review': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      'awaiting_customer_approval': { color: 'bg-blue-100 text-blue-800', label: 'Awaiting Approval' },
      'customer_approved': { color: 'bg-green-100 text-green-800', label: 'Approved' },
      'in_production': { color: 'bg-purple-100 text-purple-800', label: 'In Production' },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completed' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchQuery === '' || 
      request.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const needsPricing = (request: CustomizationRequest) => {
    return request.pricingAgreement && 
           (request.pricingAgreement.productCost === 0 || request.pricingAgreement.printingCost === 0);
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
      <DashboardHeader user={user} />

      <div className="flex flex-1">
        <DashboardSidebar user={user} />

        <div className="flex-1">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop Customization Orders</h1>
              <p className="text-gray-600">Manage customization requests assigned to your shop</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by product or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="customer_approved">Approved</option>
                  <option value="in_production">In Production</option>
                  <option value="completed">Completed</option>
                </select>
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
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No customization orders found</h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Customization requests will appear here when customers select your shop'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {request.productName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Customer: {request.customerName}
                            {request.designerName && ` • Designer: ${request.designerName}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested: {formatDate(request.createdAt)}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      {/* Pricing Details */}
                      {request.pricingAgreement && (
                        <div className="border-t border-b border-gray-200 py-4 mb-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Design Fee</p>
                              <p className="text-sm font-medium">₱{request.pricingAgreement.designFee.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Product Cost</p>
                              <p className="text-sm font-medium">₱{request.pricingAgreement.productCost.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Printing Cost</p>
                              <p className="text-sm font-medium">₱{request.pricingAgreement.printingCost.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Total Cost</p>
                              <p className="text-lg font-semibold text-blue-600">₱{request.pricingAgreement.totalCost.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Alert if pricing is incomplete */}
                          {needsPricing(request) && (
                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-sm text-yellow-800">
                                ⚠️ <strong>Action Required:</strong> Please add product and printing costs to proceed with production.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        {needsPricing(request) && (
                          <button
                            onClick={() => handleAddPricing(request)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                            <DollarSign className="w-4 h-4" />
                            Add Shop Costs
                          </button>
                        )}
                        <button
                          onClick={() => window.location.href = `/customizations/${request.id}`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      {showPricingModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ShopPricingForm
                customizationRequestId={selectedRequest.id}
                currentDesignFee={selectedRequest.pricingAgreement?.designFee || 0}
                onSuccess={() => {
                  setShowPricingModal(false);
                  setSelectedRequest(null);
                  loadRequests();
                }}
                onCancel={() => {
                  setShowPricingModal(false);
                  setSelectedRequest(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




