'use client';

import { useState } from 'react';
import { X, Download, CheckCircle, XCircle, Loader } from 'lucide-react';
import { CustomizationRequestWithDetails } from '@/types/customization';

interface CustomizationReviewModalProps {
  request: CustomizationRequestWithDetails;
  onClose: () => void;
  onApprove?: () => Promise<void>;
  onReject?: (reason: string) => Promise<void>;
  onCancel?: () => Promise<void>;
  userRole: string;
}

export function CustomizationReviewModal({ 
  request, 
  onClose,
  onApprove,
  onReject,
  onCancel,
  userRole 
}: CustomizationReviewModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setLoading(true);
    setError('');
    try {
      await onApprove();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onReject(rejectionReason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    if (!confirm('Are you sure you want to cancel this request?')) return;
    
    setLoading(true);
    setError('');
    try {
      await onCancel();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  const isCustomer = userRole === 'customer';
  const canApproveReject = isCustomer && request.status === 'awaiting_customer_approval';
  const canCancel = isCustomer && ['pending_designer_review', 'in_progress'].includes(request.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Customization Request Details</h2>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
              {formatStatus(request.status)}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Product Information</h3>
            <div className="flex items-start gap-4">
              {request.productImage && (
                <img 
                  src={request.productImage} 
                  alt={request.productName}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div>
                <p className="font-medium text-lg">{request.productName}</p>
                <p className="text-gray-600">Quantity: {request.quantity}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Requested: {formatDate(request.requestedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Customer/Designer Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Customer</h3>
              <p className="text-gray-700">{request.customerName}</p>
              <p className="text-sm text-gray-600">{request.customerEmail}</p>
            </div>
            {request.designerName && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Designer</h3>
                <p className="text-gray-700">{request.designerName}</p>
                {request.assignedAt && (
                  <p className="text-sm text-gray-600">
                    Assigned: {formatDate(request.assignedAt)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Customization Notes */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Customization Instructions</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{request.customizationNotes}</p>
          </div>

          {/* Customer Files */}
          {(request.customerDesignFile || request.customerPreviewImage) && (
            <div>
              <h3 className="font-semibold mb-3">Customer Files</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {request.customerDesignFile && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Design File</p>
                    <a
                      href={request.customerDesignFile.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      {request.customerDesignFile.fileName}
                    </a>
                  </div>
                )}
                {request.customerPreviewImage && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview Image</p>
                    <img 
                      src={request.customerPreviewImage.url} 
                      alt="Customer preview"
                      className="w-full h-auto rounded mt-2"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Designer Work */}
          {(request.designerFinalFile || request.designerPreviewImage || request.designerNotes) && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Designer's Work</h3>
              
              {request.designerNotes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Designer Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{request.designerNotes}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {request.designerFinalFile && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Final Design File</p>
                    <a
                      href={request.designerFinalFile.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      {request.designerFinalFile.fileName}
                    </a>
                  </div>
                )}
                {request.designerPreviewImage && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Final Preview</p>
                    <img 
                      src={request.designerPreviewImage.url} 
                      alt="Final design preview"
                      className="w-full h-auto rounded mt-2"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {request.rejectionReason && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2">Rejection Feedback</h3>
              <p className="text-red-700">{request.rejectionReason}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold mb-2">Provide Feedback for Revision</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain what needs to be changed or improved..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Submit Feedback'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex flex-wrap gap-3">
          {canApproveReject && !showRejectForm && (
            <>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <CheckCircle className="w-5 h-5" />
                {loading ? 'Processing...' : 'Approve Design'}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                <XCircle className="w-5 h-5" />
                Request Revisions
              </button>
            </>
          )}
          
          {canCancel && !showRejectForm && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:bg-gray-100"
            >
              Cancel Request
            </button>
          )}

          <button
            onClick={onClose}
            disabled={loading}
            className="ml-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

