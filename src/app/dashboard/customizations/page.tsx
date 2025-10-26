'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CustomizationRequestList } from '@/components/customization/CustomizationRequestList';
import { CustomizationReviewModal } from '@/components/customization/CustomizationReviewModal';
import { DesignerPendingRequests } from '@/components/customization/DesignerPendingRequests';
import { DesignerWorkModal } from '@/components/customization/DesignerWorkModal';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { CustomizationRequest, CustomizationRequestWithDetails } from '@/types/customization';
import { Loader } from 'lucide-react';

export default function CustomizationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<CustomizationRequestWithDetails | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isDesigner = session.user.role === 'designer' || session.user.role === 'business_owner';
  const isCustomer = session.user.role === 'customer';

  const handleViewRequest = async (request: CustomizationRequest) => {
    try {
      // Fetch full details
      const response = await fetch(`/api/customizations/${request.id}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedRequest(result.data);
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

      // Refresh the list
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      throw error;
    }
  };

  const handleWorkOnRequest = async (request: CustomizationRequest) => {
    try {
      // Fetch full details
      const response = await fetch(`/api/customizations/${request.id}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedRequest(result.data);
        setShowWorkModal(true);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      alert('Failed to load request details');
    }
  };

  const handleSubmitWork = async (finalFile: any, previewImage: any, notes: string) => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/customizations/${selectedRequest.id}`, {
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
      setSelectedRequest(null);
      setRefreshKey(prev => prev + 1);
      alert('Work submitted successfully! Customer will be notified.');
    } catch (error: any) {
      throw error;
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/customizations/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to approve');
      }

      setShowReviewModal(false);
      setSelectedRequest(null);
      setRefreshKey(prev => prev + 1);
      alert('Design approved! You can now proceed to order.');
    } catch (error: any) {
      throw error;
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/customizations/${selectedRequest.id}`, {
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
      setSelectedRequest(null);
      setRefreshKey(prev => prev + 1);
      alert('Feedback sent to designer for revision.');
    } catch (error: any) {
      throw error;
    }
  };

  const handleCancel = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/customizations/${selectedRequest.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to cancel');
      }

      setShowReviewModal(false);
      setSelectedRequest(null);
      setRefreshKey(prev => prev + 1);
      alert('Request cancelled.');
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader user={session.user} />

      <div className="flex flex-1">
        {/* Dashboard Sidebar */}
        <DashboardSidebar user={session.user} />

        {/* Main Content */}
        <div className="flex-1">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {isDesigner ? 'Customization Requests' : 'My Customization Requests'}
              </h1>
              <p className="mt-2 text-gray-600">
                {isDesigner 
                  ? 'Manage customization requests from customers'
                  : 'Track your custom design requests'
                }
              </p>
            </div>

            {/* Designer View: Show pending requests first */}
            {isDesigner && (
              <div className="mb-8">
                <DesignerPendingRequests
                  key={`pending-${refreshKey}`}
                  onViewRequest={handleViewRequest}
                  onClaimRequest={handleClaimRequest}
                />
              </div>
            )}

            {/* My Requests (both customer and designer) */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {isDesigner ? 'My Active Requests' : 'All Requests'}
              </h2>
              <CustomizationRequestList
                key={`list-${refreshKey}`}
                userId={session.user.id}
                userRole={session.user.role}
                onViewRequest={isDesigner ? handleWorkOnRequest : handleViewRequest}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReviewModal && selectedRequest && (
        <CustomizationReviewModal
          request={selectedRequest}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedRequest(null);
          }}
          onApprove={isCustomer ? handleApprove : undefined}
          onReject={isCustomer ? handleReject : undefined}
          onCancel={isCustomer ? handleCancel : undefined}
          userRole={session.user.role}
        />
      )}

      {showWorkModal && selectedRequest && (
        <DesignerWorkModal
          request={selectedRequest}
          onClose={() => {
            setShowWorkModal(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleSubmitWork}
        />
      )}
    </div>
  );
}

