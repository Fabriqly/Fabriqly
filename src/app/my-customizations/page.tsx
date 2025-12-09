'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CustomizationRequest, CustomizationRequestWithDetails } from '@/types/customization';
import { TransactionChat } from '@/components/messaging/TransactionChat';
import { ShopSelectionModal } from '@/components/customization/ShopSelectionModal';
import { ShippingAddressModal } from '@/components/customization/ShippingAddressModal';
import { AddressListModal } from '@/components/customization/AddressListModal';
import { PaymentMethodModal } from '@/components/customization/PaymentMethodModal';
import { ProductionTracker } from '@/components/customization/ProductionTracker';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { CustomizationRequestList } from '@/components/customization/CustomizationRequestList';
import { CustomizationReviewModal } from '@/components/customization/CustomizationReviewModal';
import { DesignerPendingRequests } from '@/components/customization/DesignerPendingRequests';
import { DesignerWorkModal } from '@/components/customization/DesignerWorkModal';
import { PricingAgreementForm } from '@/components/customization/PricingAgreementForm';
import { Loader, Search, Clock, MessageCircle } from 'lucide-react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';

export default function MyCustomizationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<CustomizationRequest[]>([]);
  const [allRequests, setAllRequests] = useState<CustomizationRequest[]>([]); // Store all for filtering
  const [hasAnyRequests, setHasAnyRequests] = useState(false); // Track if user has any requests at all
  const [selectedRequest, setSelectedRequest] = useState<CustomizationRequest | null>(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<CustomizationRequestWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showShopModal, setShowShopModal] = useState(false);
  const [showAddressListModal, setShowAddressListModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [orderRequestId, setOrderRequestId] = useState<string | null>(null);
  const [pendingShippingAddress, setPendingShippingAddress] = useState<any>(null);
  const [pendingSaveToProfile, setPendingSaveToProfile] = useState(false);
  const [orderAmount, setOrderAmount] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [reviewType, setReviewType] = useState<'designer' | 'shop' | 'customization'>('designer');
  const [refreshKey, setRefreshKey] = useState(0);
  const [creatingOrder, setCreatingOrder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedChats, setExpandedChats] = useState<Set<string>>(new Set());
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const isDesigner = session?.user?.role === 'designer' || session?.user?.role === 'business_owner';
  const isCustomer = session?.user?.role === 'customer';

  useEffect(() => {
    // When status filter changes, reset to page 1
    if (status === 'authenticated') {
      setCurrentPage(1);
    }
  }, [statusFilter, status]);

  useEffect(() => {
    // Fetch when page changes, filter changes, or when authenticated
    if (status === 'authenticated') {
      fetchRequests(currentPage);
    }
  }, [currentPage, statusFilter, status]);

  // Fetch request details when selectedRequestId changes
  useEffect(() => {
    if (selectedRequestId && isCustomer) {
      const fetchRequestDetails = async () => {
        try {
          const response = await fetch(`/api/customizations/${selectedRequestId}`);
          const result = await response.json();
          if (result.success) {
            setSelectedRequestDetails(result.data);
            // Also update selectedRequest for modals
            const request = requests.find(r => r.id === selectedRequestId);
            if (request) {
              setSelectedRequest(request);
            }
          }
        } catch (error) {
          console.error('Error fetching request details:', error);
        }
      };
      fetchRequestDetails();
    }
  }, [selectedRequestId, isCustomer, requests]);

  const fetchRequests = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (isCustomer) {
        params.append('customerId', session?.user?.id || '');
      } else if (isDesigner) {
        params.append('designerId', session?.user?.id || '');
      }
      
      // Add status filter to server request
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      // Add pagination - limit to 10 items per page
      const limit = 10;
      const offset = (page - 1) * limit;
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const response = await fetch(`/api/customizations?${params}`);
      const data = await response.json();
      
      if (data.success) {
        const fetchedRequests = data.data || [];
        setAllRequests(fetchedRequests);
        setRequests(fetchedRequests);
        
        // Set first request as selected if none selected and requests exist
        if (!selectedRequestId && fetchedRequests.length > 0 && isCustomer) {
          setSelectedRequestId(fetchedRequests[0].id);
        }
        
        // Track if user has any requests at all (check without filter)
        if (statusFilter === 'all' && fetchedRequests.length > 0) {
          setHasAnyRequests(true);
        } else if (statusFilter === 'all' && page === 1 && fetchedRequests.length === 0) {
          // Only set to false if we're on page 1 with no results and no filter
          setHasAnyRequests(false);
        }
        
        // Simplified pagination calculation
        const limit = 10;
        // If we got less than limit, we're on the last page
        if (fetchedRequests.length < limit) {
          setTotalPages(page);
          setTotalCount((page - 1) * limit + fetchedRequests.length);
        } else {
          // If we got a full page, there might be more pages
          // For now, set to current page + 1 (will be corrected when we reach the last page)
          setTotalPages(page + 1);
          setTotalCount((page * limit) + 1); // Minimum estimate
        }
      } else {
        // If fetch failed, clear requests
        setAllRequests([]);
        setRequests([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setAllRequests([]);
      setRequests([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = async (request: CustomizationRequest) => {
    try {
      const response = await fetch(`/api/customizations/${request.id}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedRequestDetails(result.data);
        setShowReviewModal(true);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      alert('Failed to load request details');
    }
  };

  const handleClaimRequest = async (request: CustomizationRequest) => {
    try {
      const response = await fetch(`/api/customizations/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign' })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to claim request');
      }

      setRefreshKey(prev => prev + 1);
      await fetchRequests();
    } catch (error: any) {
      throw error;
    }
  };

  const handleWorkOnRequest = async (request: CustomizationRequest) => {
    try {
      const response = await fetch(`/api/customizations/${request.id}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedRequestDetails(result.data);
        setShowWorkModal(true);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      alert('Failed to load request details');
    }
  };

  const handleSetPricing = async (request: CustomizationRequest) => {
    try {
      const response = await fetch(`/api/customizations/${request.id}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedRequestDetails(result.data);
        setShowPricingModal(true);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      alert('Failed to load request details');
    }
  };

  const handleSubmitWork = async (finalFile: any, previewImage: any, notes: string) => {
    if (!selectedRequestDetails) return;

    try {
      const response = await fetch(`/api/customizations/${selectedRequestDetails.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'uploadFinal',
          designerFinalFile: finalFile,
          designerPreviewImage: previewImage,
          designerNotes: notes
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to submit work');
      }

      setShowWorkModal(false);
      setSelectedRequestDetails(null);
      setRefreshKey(prev => prev + 1);
      await fetchRequests();
      alert('Work submitted successfully! Customer will be notified.');
    } catch (error: any) {
      throw error;
    }
  };

  const handleApprove = async () => {
    if (!selectedRequestDetails) return;

    try {
      const response = await fetch(`/api/customizations/${selectedRequestDetails.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to approve');
      }

      setShowReviewModal(false);
      setSelectedRequestDetails(null);
      setRefreshKey(prev => prev + 1);
      await fetchRequests();
      alert('Design approved! You can now proceed to order.');
    } catch (error: any) {
      throw error;
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedRequestDetails) return;

    try {
      const response = await fetch(`/api/customizations/${selectedRequestDetails.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject',
          rejectionReason: reason 
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to reject');
      }

      setShowReviewModal(false);
      setSelectedRequestDetails(null);
      setRefreshKey(prev => prev + 1);
      await fetchRequests();
      alert('Feedback sent to designer for revision.');
    } catch (error: any) {
      throw error;
    }
  };

  const handleCancel = async () => {
    if (!selectedRequestDetails) return;

    try {
      const response = await fetch(`/api/customizations/${selectedRequestDetails.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to cancel');
      }

      setShowReviewModal(false);
      setSelectedRequestDetails(null);
      setRefreshKey(prev => prev + 1);
      await fetchRequests();
      alert('Request cancelled.');
    } catch (error: any) {
      throw error;
    }
  };

  const handleSelectShop = async () => {
    setShowShopModal(false);
    await fetchRequests();
    
    // After selecting shop, prompt to create order
    if (selectedRequest) {
      const createOrder = confirm('Shop selected! Would you like to proceed to create the order?');
      if (createOrder) {
        handleCreateOrder(selectedRequest.id);
      }
    }
  };

  const handleCreateOrder = (requestId: string) => {
    setOrderRequestId(requestId);
    setShowAddressListModal(true);
  };

  const handleAddressSelected = async (address: any) => {
    if (!orderRequestId) return;

    // Store shipping address and show payment method selection
    setPendingShippingAddress(address);
    setShowAddressListModal(false);
    setShowPaymentMethodModal(true);

    // Get order amount from customization request
    // Amount includes: product cost + printing cost (design fee is already paid separately)
    const request = requests.find(r => r.id === orderRequestId);
    if (request?.pricingAgreement) {
      const productCost = request.pricingAgreement.productCost || 0;
      const printingCost = request.pricingAgreement.printingCost || 0;
      const subtotal = productCost + printingCost;
      const tax = subtotal * 0.08; // 8% tax
      setOrderAmount(subtotal + tax);
    }
  };

  const handleAddNewAddress = () => {
    setShowAddressListModal(false);
    setShowShippingModal(true);
  };

  const handleShippingSubmit = async (shippingAddress: any, saveToProfile: boolean) => {
    if (!orderRequestId || !session?.user?.id) return;

    // Save address to profile if requested
    if (saveToProfile) {
      try {
        const saveResponse = await fetch(`/api/users/${session.user.id}/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            address: shippingAddress,
            setAsDefault: true
          })
        });
        
        if (saveResponse.ok) {
          // Refresh address list by updating refreshKey
          setRefreshKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error saving address:', error);
      }
    }

    // Store shipping address and show payment method selection
    setPendingShippingAddress(shippingAddress);
    setPendingSaveToProfile(saveToProfile);
    setShowShippingModal(false);
    setShowPaymentMethodModal(true);

    // Get order amount from customization request
    // Amount includes: product cost + printing cost (design fee is already paid separately)
    const request = requests.find(r => r.id === orderRequestId);
    if (request?.pricingAgreement) {
      const productCost = request.pricingAgreement.productCost || 0;
      const printingCost = request.pricingAgreement.printingCost || 0;
      const subtotal = productCost + printingCost;
      const tax = subtotal * 0.08; // 8% tax
      setOrderAmount(subtotal + tax);
    }
  };

  const handlePaymentMethodSubmit = async (paymentMethod: string) => {
    if (!orderRequestId || !session?.user?.id || !pendingShippingAddress || creatingOrder === orderRequestId) return;

    try {
      setCreatingOrder(orderRequestId);
      setShowPaymentMethodModal(false);

      // Create order with address and payment method
      const response = await fetch(`/api/customizations/${orderRequestId}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shippingAddress: pendingShippingAddress,
          paymentMethod 
        })
      });

      const data = await response.json();

      if (data.success) {
        setOrderRequestId(null);
        setPendingShippingAddress(null);
        setPendingSaveToProfile(false);
        
        // Redirect to order payment page
        router.push(`/orders/${data.data.orderId}`);
      } else {
        alert(data.error || 'Failed to create order');
        setShowPaymentMethodModal(true); // Show payment modal again on error
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
      setShowPaymentMethodModal(true); // Show payment modal again on error
    } finally {
      setCreatingOrder(null);
    }
  };

  const handleCompleteTransaction = async (requestId: string) => {
    if (!confirm('Are you sure you received the product and want to complete this transaction?')) {
      return;
    }

    try {
      const response = await fetch(`/api/customizations/${requestId}/complete`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        alert('Transaction completed! You can now leave reviews.');
        await fetchRequests();
      } else {
        alert(data.error || 'Failed to complete transaction');
      }
    } catch (error) {
      console.error('Error completing transaction:', error);
      alert('Failed to complete transaction');
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_designer_review': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'awaiting_customer_approval': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_production': return 'bg-orange-100 text-orange-800';
      case 'ready_for_pickup': return 'bg-teal-100 text-teal-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleAgreePrice = async (requestId: string) => {
    if (!confirm('Do you agree to this pricing?')) return;

    try {
      const response = await fetch(`/api/customizations/${requestId}/pricing`, {
        method: 'PATCH'
      });

      const data = await response.json();

      if (data.success) {
        alert('Pricing agreed! You can now proceed with payment.');
        await fetchRequests();
      } else {
        alert(data.error || 'Failed to agree to pricing');
      }
    } catch (error) {
      console.error('Error agreeing to pricing:', error);
      alert('Failed to agree to pricing');
    }
  };

  const handleRejectPricing = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejecting this pricing (optional):');
    if (reason === null) return; // User cancelled

    if (!confirm('Are you sure you want to reject this pricing? The designer will be able to submit a new pricing proposal.')) return;

    try {
      const response = await fetch(`/api/customizations/${requestId}/pricing`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason || undefined })
      });

      const data = await response.json();

      if (data.success) {
        alert('Pricing rejected. The designer can now submit a new pricing proposal.');
        await fetchRequests();
      } else {
        alert(data.error || 'Failed to reject pricing');
      }
    } catch (error) {
      console.error('Error rejecting pricing:', error);
      alert('Failed to reject pricing');
    }
  };

  const handleInitiatePayment = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request?.paymentDetails) return;

    const amount = request.paymentDetails.remainingAmount;

    try {
      const response = await fetch(`/api/customizations/${requestId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: 'xendit'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Get the invoice URL from the latest payment
        const latestPayment = data.data.paymentDetails?.payments[data.data.paymentDetails.payments.length - 1];
        if (latestPayment?.invoiceUrl) {
          window.location.href = latestPayment.invoiceUrl;
        } else {
          alert('Payment initiated successfully!');
          await fetchRequests();
        }
      } else {
        alert(data.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Failed to initiate payment');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // For designers, use dashboard layout with sidebar
  if (isDesigner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={session?.user || null} showMobileMenu={true} />
        <div className="flex flex-1">
          <DashboardSidebar user={session?.user || null} />
          <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Customization Requests</h1>
                <p className="text-gray-600 mt-1">
                  Manage customization requests from customers
                </p>
              </div>

              {/* Available Requests */}
              <div className="mb-8">
                <DesignerPendingRequests
                  key={`pending-${refreshKey}`}
                  onViewRequest={handleViewRequest}
                  onClaimRequest={handleClaimRequest}
                />
              </div>

              {/* My Active Requests */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">My Active Requests</h2>
                <CustomizationRequestList
                  key={`list-${refreshKey}`}
                  userId={session.user.id}
                  userRole={session.user.role}
                  onViewRequest={handleWorkOnRequest}
                  onSetPricing={handleSetPricing}
                  simpleFilter={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modals - Designer View */}
        {showReviewModal && selectedRequestDetails && (
          <CustomizationReviewModal
            request={selectedRequestDetails}
            onClose={() => {
              setShowReviewModal(false);
              setSelectedRequestDetails(null);
            }}
            userRole={session.user.role}
          />
        )}

        {showWorkModal && selectedRequestDetails && (
          <DesignerWorkModal
            request={selectedRequestDetails}
            onClose={() => {
              setShowWorkModal(false);
              setSelectedRequestDetails(null);
            }}
            onSubmit={handleSubmitWork}
            onSetPricing={() => {
              setShowWorkModal(false);
              setShowPricingModal(true);
            }}
          />
        )}

        {showPricingModal && selectedRequestDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-4">Set Pricing Agreement</h2>
              <PricingAgreementForm
                customizationRequestId={selectedRequestDetails.id}
                onSuccess={() => {
                  setShowPricingModal(false);
                  setSelectedRequestDetails(null);
                  setRefreshKey(prev => prev + 1);
                  fetchRequests();
                  alert('Pricing agreement created successfully!');
                }}
                onCancel={() => {
                  setShowPricingModal(false);
                }}
              />
            </div>
        </div>
      )}
    </div>
  );
}

  // For customers, use customer header with explore navbar
  return (
    <>
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session?.user || null} />
      
      <div className="flex gap-8 p-8">
        {/* Left Sidebar - Floating Navigation Card */}
        <CustomerNavigationSidebar />

        {/* Right Content Area */}
        <main className="flex-1">
          {/* Split View Container */}
          <div className="h-[calc(100vh-theme(spacing.32))] flex border border-gray-200 rounded-lg bg-white overflow-hidden">
            {/* Left Sidebar - Request List */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-bold text-gray-900 mb-4">My Customizations</h2>
                
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                {/* Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending_designer_review">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="awaiting_customer_approval">Awaiting Approval</option>
                  <option value="ready_for_production">Ready for Production</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              {/* Request List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {statusFilter !== 'all' ? (
                      <p>No requests with this status</p>
                    ) : (
                      <div>
                        <p className="mb-3">No customization requests yet</p>
                        <button
                          onClick={() => router.push('/explore')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Start Customizing
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {requests
                      .filter(request => {
                        const matchesSearch = searchQuery === '' || 
                          request.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          request.designerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          request.id.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchesSearch;
                      })
                      .map((request) => {
                        const isSelected = selectedRequestId === request.id;
                        return (
                          <button
                            key={request.id}
                            onClick={() => setSelectedRequestId(request.id)}
                            className={`w-full p-4 text-left hover:bg-gray-100 transition-colors ${
                              isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 text-sm flex-1 truncate">
                                {request.productName || 'Untitled Request'}
                              </h3>
                              <div className={`w-2 h-2 rounded-full ml-2 flex-shrink-0 ${
                                request.status === 'completed' ? 'bg-green-500' :
                                request.status === 'cancelled' ? 'bg-red-500' :
                                request.status === 'in_progress' || request.status === 'awaiting_customer_approval' ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`} />
                            </div>
                            {request.designerName && (
                              <p className="text-xs text-gray-600 mb-1">Designer: {request.designerName}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(request.status)}`}>
                                {getStatusLabel(request.status)}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {request.updatedAt ? (typeof request.updatedAt === 'string' ? new Date(request.updatedAt) : request.updatedAt.toDate ? request.updatedAt.toDate() : new Date()).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Panel - Request Details */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedRequestDetails ? (
                <>
                  {/* Detail Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-bold text-gray-900">
                        {selectedRequestDetails.productName || 'Customization Request'}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequestDetails.status)}`}>
                        {getStatusLabel(selectedRequestDetails.status)}
                      </span>
                    </div>
                    {selectedRequestDetails.designerName && (
                      <p className="text-xs text-gray-600">Designer: {selectedRequestDetails.designerName}</p>
                    )}
                  </div>
                  
                  {/* Scrollable Detail Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Section 1: Design Fee */}
                    {selectedRequestDetails.status === 'awaiting_customer_approval' && !selectedRequestDetails.pricingAgreement && (
                      <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-yellow-800">
                          ⏳ Waiting for Pricing
                        </h3>
                        <p className="text-sm text-yellow-700">
                          The designer is setting up the pricing for your custom design. You'll be notified when pricing is available.
                        </p>
                      </div>
                    )}
                    
                    {selectedRequestDetails.pricingAgreement && (
                      <div className="border-2 border-blue-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                          💰 Design Fee
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Designer's Fee:</span>
                            <span className="text-xl font-bold text-blue-600">
                              ₱{selectedRequestDetails.pricingAgreement.designFee.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                            <p className="mb-1">
                              <span className="font-semibold">Payment Method:</span>{' '}
                              {selectedRequestDetails.paymentDetails?.paymentType === 'upfront' ? 'Upfront (100%)' : 
                               selectedRequestDetails.paymentDetails?.paymentType === 'half_payment' ? 'Half Payment (50/50)' : 
                               'Milestone-based'}
                            </p>
                            <p className="text-gray-500 mt-1">
                              * Product and printing costs will be added by the shop
                            </p>
                          </div>
                          {!selectedRequestDetails.pricingAgreement.agreedByCustomer && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAgreePrice(selectedRequestDetails.id)}
                                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                              >
                                ✓ Agree to Design Fee
                              </button>
                              <button
                                onClick={() => handleRejectPricing(selectedRequestDetails.id)}
                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                              >
                                ✗ Reject & Request New Price
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Section 2: Payment Status */}
                    {selectedRequestDetails.paymentDetails && (
                      <div className="border rounded-lg p-4 bg-white shadow-sm">
                        <h3 className="font-bold text-lg mb-3">Payment Status</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-semibold">₱{selectedRequestDetails.paymentDetails.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Paid Amount:</span>
                            <span className="font-semibold text-green-600">₱{selectedRequestDetails.paymentDetails.paidAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                            <span>Remaining:</span>
                            <span className="text-red-600">₱{selectedRequestDetails.paymentDetails.remainingAmount.toFixed(2)}</span>
                          </div>
                          {selectedRequestDetails.paymentDetails.remainingAmount > 0 && 
                           selectedRequestDetails.pricingAgreement?.agreedByCustomer && (
                            <button
                              onClick={() => handleInitiatePayment(selectedRequestDetails.id)}
                              className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                            >
                              Make Payment
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Section 3: Actions */}
                    <div className="border rounded-lg p-4 bg-white shadow-sm">
                      <h3 className="font-bold text-lg mb-3">Actions</h3>
                      <div className="space-y-2">
                        {((selectedRequestDetails.status === 'awaiting_customer_approval') ||
                          (selectedRequestDetails.status === 'awaiting_pricing' && 
                           selectedRequestDetails.paymentDetails?.paymentStatus === 'fully_paid' &&
                           selectedRequestDetails.designerFinalFile)) && (
                          <button
                            onClick={() => {
                              const request = requests.find(r => r.id === selectedRequestDetails.id);
                              if (request) handleViewRequest(request);
                            }}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                          >
                            Review Design
                          </button>
                        )}
                        
                        {(selectedRequestDetails.status === 'approved' || selectedRequestDetails.status === 'ready_for_production') && 
                         !selectedRequestDetails.printingShopId && (
                          <button
                            onClick={() => {
                              const request = requests.find(r => r.id === selectedRequestDetails.id);
                              if (request) {
                                setSelectedRequest(request);
                                setShowShopModal(true);
                              }
                            }}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                          >
                            Select Printing Shop
                          </button>
                        )}
                        
                        {(selectedRequestDetails.status === 'approved' || selectedRequestDetails.status === 'ready_for_production') && 
                         selectedRequestDetails.printingShopId && !selectedRequestDetails.orderId && (
                          <button
                            onClick={() => handleCreateOrder(selectedRequestDetails.id)}
                            disabled={creatingOrder === selectedRequestDetails.id}
                            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2"
                          >
                            {creatingOrder === selectedRequestDetails.id ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Creating Order...
                              </>
                            ) : (
                              'Create Order & Proceed to Production'
                            )}
                          </button>
                        )}
                        
                        {selectedRequestDetails.orderId && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                            <p className="text-xs text-green-800 font-medium">
                              ✓ Order Created: {selectedRequestDetails.orderId.substring(0, 8)}...
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/orders/${selectedRequestDetails.orderId}`)}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                              >
                                View Order
                              </button>
                              <button
                                onClick={() => router.push(`/orders/${selectedRequestDetails.orderId}/tracking`)}
                                className="flex-1 px-3 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700"
                              >
                                Track Package
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {selectedRequestDetails.status === 'ready_for_pickup' && (
                          <button
                            onClick={() => handleCompleteTransaction(selectedRequestDetails.id)}
                            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                          >
                            Confirm Receipt & Complete
                          </button>
                        )}
                        
                        {selectedRequestDetails.status === 'completed' && (
                          <button
                            onClick={() => {
                              const request = requests.find(r => r.id === selectedRequestDetails.id);
                              if (request) {
                                setSelectedRequest(request);
                                setShowReviewForm(true);
                              }
                            }}
                            className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
                          >
                            Leave Reviews
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Section 4: Chat */}
                    {selectedRequestDetails.designerId && 
                     ['in_progress', 'awaiting_customer_approval', 'approved'].includes(selectedRequestDetails.status) && (
                      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                        <TransactionChat
                          customizationRequestId={selectedRequestDetails.id}
                          otherUserId={selectedRequestDetails.designerId}
                          otherUserName={selectedRequestDetails.designerName || 'Designer'}
                          otherUserRole="designer"
                        />
                      </div>
                    )}
                    
                    {/* Production Tracker */}
                    {['in_production', 'ready_for_pickup'].includes(selectedRequestDetails.status) && (
                      <div className="border rounded-lg bg-white shadow-sm">
                        <ProductionTracker request={selectedRequestDetails} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">No request selected</p>
                    <p className="text-sm">Select a request from the list to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </main>
      </div>
    </div>

      {/* Modals - Customer View */}
      {showReviewModal && selectedRequestDetails && (
        <CustomizationReviewModal
          request={selectedRequestDetails}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedRequestDetails(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={handleCancel}
          userRole={session.user.role}
        />
      )}

      {/* Shop Selection Modal - Customer View */}
      {showShopModal && selectedRequest && (
        <ShopSelectionModal
          customizationRequestId={selectedRequest.id}
          onSelect={handleSelectShop}
          onClose={() => setShowShopModal(false)}
        />
      )}

      {/* Address List Modal */}
      {showAddressListModal && session?.user?.id && (
        <AddressListModal
          key={`address-modal-${refreshKey}`}
          userId={session.user.id}
          onSelect={handleAddressSelected}
          onAddNew={handleAddNewAddress}
          onClose={() => {
            setShowAddressListModal(false);
            setOrderRequestId(null);
          }}
          refreshTrigger={refreshKey}
        />
      )}

      {/* Shipping Address Modal */}
      {showShippingModal && (
        <ShippingAddressModal
          onSubmit={handleShippingSubmit}
          onClose={() => {
            setShowShippingModal(false);
            setShowAddressListModal(true);
          }}
          userName={session?.user?.name}
          userId={session?.user?.id}
        />
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentMethodModal && orderRequestId && (
        <PaymentMethodModal
          onSubmit={handlePaymentMethodSubmit}
          onClose={() => {
            setShowPaymentMethodModal(false);
            setPendingShippingAddress(null);
            setPendingSaveToProfile(false);
            setShowAddressListModal(true);
          }}
          amount={orderAmount}
          loading={creatingOrder === orderRequestId}
        />
      )}

      {/* Review Form Modal - Customer View */}
      {showReviewForm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <ReviewForm
              reviewType={reviewType}
              targetId={
                reviewType === 'designer' ? selectedRequest.designerId! :
                reviewType === 'shop' ? selectedRequest.printingShopId! :
                selectedRequest.id
              }
              targetName={
                reviewType === 'designer' ? selectedRequest.designerName! :
                reviewType === 'shop' ? selectedRequest.printingShopName! :
                'Service'
              }
              onSuccess={() => {
                // Progress through review types
                if (reviewType === 'designer' && selectedRequest.printingShopId) {
                  setReviewType('shop');
                } else if (reviewType === 'shop') {
                  setReviewType('customization');
                } else {
                  setShowReviewForm(false);
                  setReviewType('designer');
                  alert('Thank you for your reviews!');
                }
              }}
              onCancel={() => {
                setShowReviewForm(false);
                setReviewType('designer');
              }}
            />
          </div>
        </div>
      )}
      
      <ScrollToTop />
    </>
  );
}

