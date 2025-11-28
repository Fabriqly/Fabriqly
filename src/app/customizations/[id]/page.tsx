'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { 
  ArrowLeft,
  Package, 
  User, 
  Mail,
  Calendar,
  FileText,
  Image as ImageIcon,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Loader,
  Lock
} from 'lucide-react';
import { FileDisputeButton } from '@/components/disputes/FileDisputeButton';

interface CustomizationRequest {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  designerId?: string;
  designerName?: string;
  status: string;
  customizationNotes: string;
  customerDesignFile?: { url: string; name: string };
  customerPreviewImage?: { url: string; name: string };
  designerFinalFile?: { url: string; name: string };
  designerPreviewImage?: { url: string; name: string };
  pricingAgreement?: {
    designFee: number;
    productCost: number;
    printingCost: number;
    totalCost: number;
    paymentType: string;
  };
  paymentDetails?: {
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string;
    escrowStatus?: string;
  };
  orderId?: string;
  requestedAt: any;
  assignedAt?: any;
  completedAt?: any;
}

function CustomizationDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<CustomizationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = params.id as string;

  useEffect(() => {
    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[CustomizationDetails] Loading request:', requestId);
      const response = await fetch(`/api/customizations/${requestId}`);
      const data = await response.json();
      console.log('[CustomizationDetails] API Response:', { ok: response.ok, data });
      
      if (response.ok && data.success) {
        setRequest(data.data);
      } else {
        // Handle different error formats
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : data.error?.message || data.message || 'Failed to load customization request';
        console.error('[CustomizationDetails] Error:', errorMessage);
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('[CustomizationDetails] Exception:', error);
      setError(error?.message || 'Failed to load customization request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    
    // Handle Firestore Timestamp object (server-side)
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    }
    // Handle Firestore Timestamp serialized as object with seconds
    else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    }
    // Handle ISO string (from serialized Timestamp)
    else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    }
    // Handle Date object or timestamp number
    else {
      date = new Date(timestamp);
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      'pending_designer_review': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' },
      'awaiting_customer_approval': { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Awaiting Approval' },
      'customer_approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
      'in_production': { color: 'bg-purple-100 text-purple-800', icon: Package, label: 'In Production' },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status };
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !request) {
    // Ensure error is always a string
    const errorMessage = typeof error === 'string' ? error : JSON.stringify(error) || 'Request not found';
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Request</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {request.productName}
              </h1>
              <p className="text-gray-600">Request ID: {request.id.substring(0, 12)}...</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(request.status)}
              {/* File Dispute Button - Show for customers when status is in_progress or awaiting_customer_approval */}
              {user?.role === 'customer' && 
               (request.status === 'in_progress' || request.status === 'awaiting_customer_approval') && (
                <FileDisputeButton 
                  customizationRequestId={request.id}
                  variant="outline"
                  size="md"
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Product Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Information
            </h2>
            <div className="flex items-start gap-4">
              {request.productImage && (
                <img 
                  src={request.productImage} 
                  alt={request.productName}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              <div>
                <p className="font-medium text-lg">{request.productName}</p>
                <p className="text-sm text-gray-600 mt-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Requested: {formatDate(request.requestedAt)}
                </p>
                {request.orderId && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Order Created: #{request.orderId.substring(0, 8)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* People Involved */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Customer
              </h3>
              <p className="font-medium text-gray-900">{request.customerName}</p>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Mail className="w-4 h-4" />
                {request.customerEmail}
              </p>
            </div>

            {/* Designer */}
            {request.designerName && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Designer
                </h3>
                <p className="font-medium text-gray-900">{request.designerName}</p>
                {request.assignedAt && (
                  <p className="text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Assigned: {formatDate(request.assignedAt)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Customization Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Customization Instructions
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{request.customizationNotes}</p>
          </div>

          {/* Customer Files */}
          {(request.customerDesignFile || request.customerPreviewImage) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-gray-600" />
                Customer Files
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {request.customerDesignFile && (
                  <a
                    href={request.customerDesignFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">Design File</p>
                      <p className="text-xs text-gray-500">{request.customerDesignFile.name}</p>
                    </div>
                  </a>
                )}
                {request.customerPreviewImage && (
                  <div>
                    <p className="text-sm font-medium mb-2">Preview Image</p>
                    <img 
                      src={request.customerPreviewImage.url} 
                      alt="Customer preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Designer Final Files - Only show if payment is made */}
          {(request.designerFinalFile || request.designerPreviewImage) && (() => {
            // Check if customer has paid
            const hasPaid = request.paymentDetails && (
              request.paymentDetails.paymentStatus === 'fully_paid' ||
              (request.paymentDetails.paidAmount || 0) >= (request.pricingAgreement?.designFee || 0)
            );

            if (!hasPaid) {
              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-800">
                    <Lock className="w-5 h-5" />
                    Final Design Files (Payment Required)
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Please complete your payment to view the final design files.
                  </p>
                  {request.pricingAgreement && (
                    <div className="bg-white rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Payment Required:</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₱{request.pricingAgreement.designFee.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Final Design Files
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {request.designerFinalFile && (
                    <a
                      href={request.designerFinalFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100"
                    >
                      <Download className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">Final Design File</p>
                        <p className="text-xs text-gray-500">{request.designerFinalFile.name}</p>
                      </div>
                    </a>
                  )}
                  {request.designerPreviewImage && (
                    <div>
                      <p className="text-sm font-medium mb-2">Final Preview</p>
                      <img 
                        src={request.designerPreviewImage.url} 
                        alt="Designer preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Pricing & Payment */}
          {request.pricingAgreement && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Pricing Agreement</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Design Fee:</span>
                  <span className="font-medium">₱{request.pricingAgreement.designFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Cost:</span>
                  <span className="font-medium">₱{request.pricingAgreement.productCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Printing Cost:</span>
                  <span className="font-medium">₱{request.pricingAgreement.printingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-lg">
                  <span>Total Cost:</span>
                  <span>₱{request.pricingAgreement.totalCost.toFixed(2)}</span>
                </div>
              </div>

              {request.paymentDetails && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <h4 className="font-semibold mb-2">Payment Status</h4>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span>₱{request.paymentDetails.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span className="text-green-600 font-medium">₱{request.paymentDetails.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className={request.paymentDetails.remainingAmount > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      ₱{request.paymentDetails.remainingAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      request.paymentDetails.paymentStatus === 'fully_paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {String(request.paymentDetails.paymentStatus || '').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {request.paymentDetails.escrowStatus && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Escrow Status:</span>
                      <span className="text-sm text-blue-600 font-medium">
                        {String(request.paymentDetails.escrowStatus).replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomizationDetailsPage() {
  return <CustomizationDetailsPageContent />;
}
