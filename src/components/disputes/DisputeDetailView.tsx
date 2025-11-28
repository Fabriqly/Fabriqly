'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle, CheckCircle, XCircle, Clock, DollarSign, MessageSquare, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { Dispute, DisputeWithDetails, PartialRefundOffer } from '@/types/dispute';
import { Button } from '@/components/ui/Button';
import { DisputeChat } from './DisputeChat';

interface DisputeDetailViewProps {
  disputeId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  design_ghosting: 'Designer Not Responding',
  design_quality_mismatch: 'Poor Design Quality',
  design_copyright_infringement: 'Copyright Infringement',
  shipping_not_received: 'Item Not Received',
  shipping_damaged: 'Item Damaged',
  shipping_wrong_item: 'Wrong Item',
  shipping_print_quality: 'Poor Print Quality',
  shipping_late_delivery: 'Late Delivery',
  shipping_incomplete_order: 'Incomplete Order'
};

export function DisputeDetailView({ disputeId }: DisputeDetailViewProps) {
  const { data: session } = useSession();
  const [dispute, setDispute] = useState<DisputeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDispute();
  }, [disputeId]);

  const loadDispute = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/disputes/${disputeId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load dispute');
      }

      setDispute(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dispute');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDispute = async () => {
    if (!confirm('Are you sure you want to accept this dispute? This will trigger a full refund.')) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/disputes/${disputeId}/accept`, {
        method: 'POST'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept dispute');
      }

      await loadDispute();
      alert('Dispute accepted. Full refund will be processed.');
    } catch (err: any) {
      alert(err.message || 'Failed to accept dispute');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDispute = async () => {
    if (!confirm('Are you sure you want to cancel this dispute?')) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/disputes/${disputeId}/cancel`, {
        method: 'POST'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel dispute');
      }

      await loadDispute();
      alert('Dispute cancelled successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel dispute');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptPartialRefund = async () => {
    if (!confirm('Are you sure you want to accept this partial refund offer?')) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/disputes/${disputeId}/partial-refund`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept partial refund');
      }

      await loadDispute();
      alert('Partial refund accepted. Payment will be processed.');
    } catch (err: any) {
      alert(err.message || 'Failed to accept partial refund');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPartialRefund = async () => {
    if (!confirm('Are you sure you want to reject this partial refund offer?')) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/disputes/${disputeId}/partial-refund`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject partial refund');
      }

      await loadDispute();
    } catch (err: any) {
      alert(err.message || 'Failed to reject partial refund');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading dispute details...</div>;
  }

  if (error || !dispute) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error || 'Dispute not found'}</p>
      </div>
    );
  }

  const isFiler = session?.user?.id === dispute.filedBy;
  const isAccused = session?.user?.id === dispute.accusedParty;
  const isAdmin = session?.user?.role === 'admin';
  const canTakeAction = dispute.stage === 'negotiation' && dispute.status === 'open';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {CATEGORY_LABELS[dispute.category] || dispute.category}
            </h1>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                dispute.stage === 'negotiation' ? 'bg-yellow-100 text-yellow-800' :
                dispute.stage === 'admin_review' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }`}>
                {dispute.stage === 'negotiation' ? 'Negotiation' :
                 dispute.stage === 'admin_review' ? 'Admin Review' :
                 'Resolved'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                dispute.status === 'open' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {dispute.status === 'open' ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Filed: {formatDate(dispute.createdAt)}</p>
            {dispute.resolvedAt && (
              <p>Resolved: {formatDate(dispute.resolvedAt)}</p>
            )}
          </div>
        </div>

        <p className="text-gray-700 mb-4">{dispute.description}</p>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-500 mb-1">Filed By</p>
            <p className="font-medium">{dispute.filer?.displayName || dispute.filer?.email || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Accused Party</p>
            <p className="font-medium">{dispute.accused?.displayName || dispute.accused?.email || 'Unknown'}</p>
          </div>
        </div>
      </div>

      {/* Partial Refund Offer */}
      {dispute.partialRefundOffer && dispute.partialRefundOffer.status === 'pending' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Partial Refund Offer
              </h3>
              <p className="text-purple-800 mb-1">
                {dispute.accused?.displayName || 'The other party'} has offered a partial refund of{' '}
                <span className="font-bold">₱{dispute.partialRefundOffer.amount.toLocaleString()}</span>
                {dispute.partialRefundOffer.percentage && ` (${dispute.partialRefundOffer.percentage}%)`}
              </p>
              <p className="text-sm text-purple-600">
                Offered: {formatDate(dispute.partialRefundOffer.offeredAt)}
              </p>
            </div>
            {isFiler && canTakeAction && (
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptPartialRefund}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Accept Offer
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectPartialRefund}
                  disabled={actionLoading}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evidence */}
      {(dispute.evidenceImages?.length > 0 || dispute.evidenceVideo) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Evidence</h2>
          {dispute.evidenceImages && dispute.evidenceImages.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Images ({dispute.evidenceImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dispute.evidenceImages.map((img, index) => (
                  <a
                    key={index}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group"
                  >
                    <img
                      src={img.url}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:border-blue-400 transition"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          {dispute.evidenceVideo && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Evidence
              </h3>
              <video
                src={dispute.evidenceVideo.url}
                controls
                className="w-full max-w-2xl rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {canTakeAction && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            {isAccused && (
              <Button
                onClick={handleAcceptDispute}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                Accept Dispute (Full Refund)
              </Button>
            )}
            {isFiler && (
              <Button
                variant="outline"
                onClick={handleCancelDispute}
                disabled={actionLoading}
              >
                Cancel Dispute
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Resolution Info */}
      {dispute.resolutionOutcome && (
        <div className={`rounded-lg p-6 ${
          dispute.resolutionOutcome === 'refunded' ? 'bg-green-50 border border-green-200' :
          dispute.resolutionOutcome === 'released' ? 'bg-blue-50 border border-blue-200' :
          dispute.resolutionOutcome === 'dismissed' ? 'bg-gray-50 border border-gray-200' :
          'bg-purple-50 border border-purple-200'
        }`}>
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            {dispute.resolutionOutcome === 'refunded' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {dispute.resolutionOutcome === 'released' && <XCircle className="w-5 h-5 text-blue-600" />}
            {dispute.resolutionOutcome === 'dismissed' && <XCircle className="w-5 h-5 text-gray-600" />}
            {dispute.resolutionOutcome === 'partial_refund' && <DollarSign className="w-5 h-5 text-purple-600" />}
            Resolution: {dispute.resolutionOutcome.replace('_', ' ').toUpperCase()}
          </h2>
          {dispute.resolutionReason && (
            <p className="text-gray-700">{dispute.resolutionReason}</p>
          )}
          {dispute.resolvedBy && (
            <p className="text-sm text-gray-500 mt-2">
              Resolved by admin on {formatDate(dispute.resolvedAt)}
            </p>
          )}
        </div>
      )}

      {/* Chat */}
      {dispute.conversationId && (
        <div className="bg-white rounded-lg shadow">
          <DisputeChat
            disputeId={dispute.id}
            conversationId={dispute.conversationId}
            otherUserId={isFiler ? dispute.accusedParty : dispute.filedBy}
            otherUserName={isFiler ? (dispute.accused?.displayName || 'Other Party') : (dispute.filer?.displayName || 'Other Party')}
            canOfferPartialRefund={isAccused && canTakeAction}
            dispute={dispute}
          />
        </div>
      )}
    </div>
  );
}






