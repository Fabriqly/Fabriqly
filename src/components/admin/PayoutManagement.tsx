'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DollarSign, User, Calendar, CheckCircle, XCircle, Loader } from 'lucide-react';

interface PendingPayout {
  requestId: string;
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
  designer: {
    id: string;
    businessName: string;
    userId: string;
  } | null;
  amount: number;
  approvedAt: any;
  createdAt: any;
  status: string;
  escrowStatus: string;
}

export function PayoutManagement() {
  const [payouts, setPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPendingPayouts();
  }, []);

  const loadPendingPayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/payouts/pending');
      const data = await response.json();

      if (data.success) {
        setPayouts(data.data || []);
      } else {
        setError(data.error || 'Failed to load pending payouts');
      }
    } catch (err: any) {
      console.error('Error loading pending payouts:', err);
      setError(err.message || 'Failed to load pending payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayout = async (requestId: string) => {
    if (!confirm('Are you sure you want to release this payout? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(requestId);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/payouts/release-designer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Payout released successfully for request ${requestId}`);
        // Remove the payout from the list
        setPayouts(prev => prev.filter(p => p.requestId !== requestId));
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to release payout');
      }
    } catch (err: any) {
      console.error('Error releasing payout:', err);
      setError(err.message || 'Failed to release payout');
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading pending payouts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pending Designer Payouts</h2>
            <p className="text-gray-600 mt-1">
              Manage designer payouts for approved customization requests
            </p>
          </div>
          <Button onClick={loadPendingPayouts} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Payouts Table */}
      {payouts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Payouts</h3>
          <p className="text-gray-600">
            All designer payouts have been processed.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr key={payout.requestId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {payout.requestId.substring(0, 12)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payout.customer ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{payout.customer.name}</div>
                          <div className="text-gray-500">{payout.customer.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payout.designer ? (
                        <div className="text-sm font-medium text-gray-900">
                          {payout.designer.businessName}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(payout.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payout.approvedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        onClick={() => handleReleasePayout(payout.requestId)}
                        disabled={processing === payout.requestId}
                        size="sm"
                      >
                        {processing === payout.requestId ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Release Payout'
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Total Pending: <span className="font-semibold">{payouts.length}</span> payout{payouts.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                Total Amount: {formatCurrency(payouts.reduce((sum, p) => sum + p.amount, 0))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

