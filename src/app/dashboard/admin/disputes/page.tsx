'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Dispute, DisputeResolutionData } from '@/types/dispute';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CheckCircle, XCircle, DollarSign, Clock, Eye, TrendingUp } from 'lucide-react';
import Link from 'next/link';

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

export default function AdminDisputesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    negotiation: 0,
    adminReview: 0,
    resolved: 0,
    atRiskAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionData, setResolutionData] = useState<DisputeResolutionData>({
    outcome: 'refunded',
    reason: '',
    issueStrike: false
  });
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      loadDisputes();
      loadStats();
    }
  }, [session]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/disputes/pending-admin');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load disputes');
      }

      setDisputes(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/disputes?stage=admin_review&status=open');
      const data = await response.json();
      
      if (response.ok) {
        const allDisputes = data.data || [];
        setStats({
          total: allDisputes.length,
          open: allDisputes.filter((d: Dispute) => d.status === 'open').length,
          negotiation: allDisputes.filter((d: Dispute) => d.stage === 'negotiation').length,
          adminReview: allDisputes.filter((d: Dispute) => d.stage === 'admin_review').length,
          resolved: allDisputes.filter((d: Dispute) => d.stage === 'resolved').length,
          atRiskAmount: 0 // TODO: Calculate from escrow
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolutionData.reason.trim()) {
      alert('Please provide a resolution reason');
      return;
    }

    try {
      setResolving(true);
      const response = await fetch(`/api/disputes/${selectedDispute.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolutionData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve dispute');
      }

      setShowResolutionModal(false);
      setSelectedDispute(null);
      await loadDisputes();
      await loadStats();
      alert('Dispute resolved successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading disputes...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
          <p className="mt-2 text-gray-600">Review and resolve customer disputes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.adminReview}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Negotiation</p>
                <p className="text-2xl font-bold text-gray-900">{stats.negotiation}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Open</p>
                <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">At Risk Amount</p>
                <p className="text-2xl font-bold text-gray-900">₱{stats.atRiskAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Disputes List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Pending Admin Review</h2>
          </div>
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          {disputes.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No disputes pending review</p>
            </div>
          ) : (
            <div className="divide-y">
              {disputes.map(dispute => (
                <div key={dispute.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {CATEGORY_LABELS[dispute.category] || dispute.category}
                        </h3>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          Admin Review
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {dispute.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Filed: {formatDate(dispute.createdAt)}</span>
                        {dispute.evidenceImages && dispute.evidenceImages.length > 0 && (
                          <span>{dispute.evidenceImages.length} image(s)</span>
                        )}
                        {dispute.partialRefundOffer && (
                          <span className="text-purple-600">Partial refund offered</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <Link href={`/disputes/${dispute.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setShowResolutionModal(true);
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolutionModal && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Resolve Dispute</h2>
              <p className="text-sm text-gray-600 mt-1">
                {CATEGORY_LABELS[selectedDispute.category] || selectedDispute.category}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Outcome <span className="text-red-500">*</span>
                </label>
                <select
                  value={resolutionData.outcome}
                  onChange={(e) => setResolutionData({
                    ...resolutionData,
                    outcome: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="refunded">Refund Customer (Full)</option>
                  <option value="partial_refund">Partial Refund</option>
                  <option value="released">Release Funds (Dispute Invalid)</option>
                  <option value="dismissed">Dismiss Dispute</option>
                </select>
              </div>

              {resolutionData.outcome === 'partial_refund' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partial Refund Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={resolutionData.partialRefundAmount || ''}
                    onChange={(e) => setResolutionData({
                      ...resolutionData,
                      partialRefundAmount: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter amount"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resolutionData.reason}
                  onChange={(e) => setResolutionData({
                    ...resolutionData,
                    reason: e.target.value
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Explain your decision..."
                  required
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={resolutionData.issueStrike}
                    onChange={(e) => setResolutionData({
                      ...resolutionData,
                      issueStrike: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Issue strike to accused party</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={resolutionData.adminNotes || ''}
                  onChange={(e) => setResolutionData({
                    ...resolutionData,
                    adminNotes: e.target.value
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Internal notes (not visible to parties)"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResolutionModal(false);
                  setSelectedDispute(null);
                }}
                disabled={resolving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={resolving || !resolutionData.reason.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {resolving ? 'Resolving...' : 'Resolve Dispute'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}






