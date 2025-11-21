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
import { Loader } from 'lucide-react';

export default function MyCustomizationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<CustomizationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CustomizationRequest | null>(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<CustomizationRequestWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchRequests();
    }
  }, [status, session, router]);

  const isDesigner = session?.user?.role === 'designer' || session?.user?.role === 'business_owner';
  const isCustomer = session?.user?.role === 'customer';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const queryParam = isCustomer 
        ? `customerId=${session?.user?.id}`
        : isDesigner 
        ? `designerId=${session?.user?.id}`
        : '';
      
      const response = await fetch(`/api/customizations?${queryParam}`);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
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
    if (!orderRequestId || creatingOrder === orderRequestId) return;

    try {
      setCreatingOrder(orderRequestId);
      const response = await fetch(`/api/customizations/${orderRequestId}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress: address })
      });

      const data = await response.json();

      if (data.success) {
        setShowAddressListModal(false);
        setOrderRequestId(null);
        alert(`Order created successfully! Order ID: ${data.data.orderId.substring(0, 8)}...\n\nProduction can now begin.`);
        await fetchRequests();
      } else {
        alert(data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    } finally {
      setCreatingOrder(null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isDesigner ? 'Customization Requests' : 'My Customizations'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isDesigner 
                  ? 'Manage customization requests from customers'
                  : 'Track your custom design requests'
                }
              </p>
            </div>
            <button
              onClick={() => router.push(isDesigner ? '/dashboard' : '/explore')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isDesigner ? 'Dashboard' : 'Browse Products'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Designer View: Show pending requests first */}
        {isDesigner && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Available Requests</h2>
            <DesignerPendingRequests
              key={`pending-${refreshKey}`}
              onViewRequest={handleViewRequest}
              onClaimRequest={handleClaimRequest}
            />
          </div>
        )}

        {/* Designer: My Active Requests | Customer: All Requests */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            {isDesigner ? 'My Active Requests' : 'All Requests'}
          </h2>
          
          {isDesigner ? (
            <CustomizationRequestList
              key={`list-${refreshKey}`}
              userId={session.user.id}
              userRole={session.user.role}
              onViewRequest={handleWorkOnRequest}
              onSetPricing={handleSetPricing}
            />
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600 mb-4">You don't have any customization requests yet.</p>
              <button
                onClick={() => router.push('/explore')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Customizing
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Request Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{request.productName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Request ID: {request.id.substring(0, 8)}...
                      </p>
                      {request.designerName && (
                        <p className="text-sm text-gray-600">Designer: {request.designerName}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                </div>

                {/* Request Details */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Chat and Details */}
                    <div className="space-y-4">
                      {/* Pricing Information */}
                      {request.status === 'awaiting_customer_approval' && !request.pricingAgreement && (
                        <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-yellow-800">
                            ⏳ Waiting for Pricing
                          </h4>
                          <p className="text-sm text-yellow-700">
                            The designer is setting up the pricing for your custom design.  
                            You'll be notified when pricing is available.
                          </p>
                        </div>
                      )}
                      
                      {request.pricingAgreement && (
                        <div className="border-2 border-blue-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            💰 Design Fee
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">Designer's Fee:</span>
                              <span className="text-2xl font-bold text-blue-600">
                                ₱{request.pricingAgreement.designFee.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                              <p className="mb-1">
                                <span className="font-semibold">Payment Method:</span> {
                                  request.pricingAgreement.paymentType === 'upfront' ? 'Upfront (100%)' : 
                                  request.pricingAgreement.paymentType === 'half_payment' ? 'Half Payment (50/50)' : 'Milestone-based'
                                }
                              </p>
                              <p className="text-gray-500 mt-1">
                                * Product and printing costs will be added by the shop
                              </p>
                            </div>
                            {!request.pricingAgreement.agreedByCustomer && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleAgreePrice(request.id)}
                                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                  ✓ Agree to Design Fee
                                </button>
                                <button
                                  onClick={() => handleRejectPricing(request.id)}
                                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                  ✗ Reject & Request New Price
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment Status */}
                      {request.paymentDetails && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">Payment Status</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Total Amount:</span>
                              <span>₱{request.paymentDetails.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Paid Amount:</span>
                              <span className="text-green-600">₱{request.paymentDetails.paidAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Remaining:</span>
                              <span className="text-red-600">₱{request.paymentDetails.remainingAmount.toFixed(2)}</span>
                            </div>
                            {request.paymentDetails.remainingAmount > 0 && 
                             request.pricingAgreement?.agreedByCustomer && (
                              <button
                                onClick={() => handleInitiatePayment(request.id)}
                                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Make Payment
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {request.status === 'awaiting_customer_approval' && (
                          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
                              🎨 Design Ready for Review
                            </h4>
                            <p className="text-sm text-blue-700 mb-3">
                              The designer has submitted the final design. Please review and provide feedback.
                            </p>
                            <button
                              onClick={() => handleViewRequest(request)}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                            >
                              Review Design
                            </button>
                          </div>
                        )}

                        {request.status === 'approved' && !request.printingShopId && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowShopModal(true);
                            }}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Select Printing Shop
                          </button>
                        )}

                        {request.status === 'approved' && request.printingShopId && !request.orderId && (
                          <button
                            onClick={() => handleCreateOrder(request.id)}
                            disabled={creatingOrder === request.id}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {creatingOrder === request.id ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Creating Order...
                              </>
                            ) : (
                              'Create Order & Proceed to Production'
                            )}
                          </button>
                        )}

                        {request.orderId && (
                          <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                            <p className="text-sm text-green-800">
                              ✓ Order Created: {request.orderId.substring(0, 8)}...
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/orders/${request.orderId}`)}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              >
                                View Order
                              </button>
                              <button
                                onClick={() => router.push(`/orders/${request.orderId}/tracking`)}
                                className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                              >
                                Track Package
                              </button>
                            </div>
                          </div>
                        )}

                        {request.status === 'ready_for_pickup' && (
                          <button
                            onClick={() => handleCompleteTransaction(request.id)}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Confirm Receipt & Complete
                          </button>
                        )}

                        {request.status === 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowReviewForm(true);
                            }}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Leave Reviews
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: Chat or Production */}
                    <div>
                      {request.designerId && ['in_progress', 'awaiting_customer_approval', 'approved'].includes(request.status) && (
                        <TransactionChat
                          customizationRequestId={request.id}
                          otherUserId={request.designerId}
                          otherUserName={request.designerName || 'Designer'}
                          otherUserRole="designer"
                        />
                      )}

                      {['in_production', 'ready_for_pickup'].includes(request.status) && (
                        <ProductionTracker request={request} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
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
          onApprove={isCustomer ? handleApprove : undefined}
          onReject={isCustomer ? handleReject : undefined}
          onCancel={isCustomer ? handleCancel : undefined}
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
            setShowShippingModal(true);
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
    </div>
  );
}

