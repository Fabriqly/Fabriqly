'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle, MessageSquare, Eye } from 'lucide-react';
import { Dispute, DisputeStage, DisputeStatus } from '@/types/dispute';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface DisputeListProps {
  userId?: string;
  showFilters?: boolean;
}

const STAGE_LABELS: Record<DisputeStage, { label: string; color: string }> = {
  negotiation: { label: 'Negotiation', color: 'bg-yellow-100 text-yellow-800' },
  admin_review: { label: 'Admin Review', color: 'bg-orange-100 text-orange-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' }
};

const STATUS_LABELS: Record<DisputeStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' }
};

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

export function DisputeList({ userId, showFilters = true }: DisputeListProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStage, setFilterStage] = useState<DisputeStage | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<DisputeStatus | 'all'>('all');

  useEffect(() => {
    loadDisputes();
  }, [userId, filterStage, filterStatus]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userId) params.append('filedBy', userId);
      if (filterStage !== 'all') params.append('stage', filterStage);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`/api/disputes?${params.toString()}`);
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
        <div>
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value as DisputeStage | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Stages</option>
              <option value="negotiation">Negotiation</option>
              <option value="admin_review">Admin Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as DisputeStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      )}

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No disputes found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(dispute => (
            <Link
              key={dispute.id}
              href={`/disputes/${dispute.id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STAGE_LABELS[dispute.stage].color}`}>
                      {STAGE_LABELS[dispute.stage].label}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_LABELS[dispute.status].color}`}>
                      {STATUS_LABELS[dispute.status].label}
                    </span>
                    {dispute.partialRefundOffer && dispute.partialRefundOffer.status === 'pending' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Partial Refund Offered
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {CATEGORY_LABELS[dispute.category] || dispute.category}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {dispute.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Filed: {formatDate(dispute.createdAt)}</span>
                    {dispute.evidenceImages && dispute.evidenceImages.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {dispute.evidenceImages.length} image{dispute.evidenceImages.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {dispute.evidenceVideo && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Video evidence
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}






