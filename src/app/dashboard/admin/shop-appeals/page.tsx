'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ShopAppeal } from '@/types/enhanced-products';

interface ShopAppealWithShop extends ShopAppeal {
  shop?: {
    id: string;
    shopName: string;
    username: string;
    businessOwnerName: string;
    approvalStatus: string;
  };
}

function AdminShopAppealsContent() {
  const [appeals, setAppeals] = useState<ShopAppealWithShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      const response = await fetch('/api/admin/shop-appeals');
      const data = await response.json();
      
      
      if (data.success) {
        setAppeals(data.data);
      }
    } catch (error) {
      console.error('Error fetching appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAppeal = async (appealId: string) => {
    const reviewNotes = prompt('Please provide review notes (optional):');
    if (reviewNotes === null) return; // User cancelled

    setActionLoading(appealId);
    try {
      const response = await fetch('/api/admin/shop-appeals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealId, reviewNotes }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAppeals(); // Refresh data
        alert('Appeal approved successfully');
      } else {
        alert(data.error || 'Failed to approve appeal');
      }
    } catch (error) {
      console.error('Error approving appeal:', error);
      alert('Failed to approve appeal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAppeal = async (appealId: string) => {
    const reviewNotes = prompt('Please provide rejection reason:');
    if (!reviewNotes) return;

    setActionLoading(appealId);
    try {
      const response = await fetch('/api/admin/shop-appeals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealId, reviewNotes }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAppeals(); // Refresh data
        alert('Appeal rejected');
      } else {
        alert(data.error || 'Failed to reject appeal');
      }
    } catch (error) {
      console.error('Error rejecting appeal:', error);
      alert('Failed to reject appeal');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAppeals = appeals.filter(appeal => appeal.status === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading appeals...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Shop Appeals Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard 
          label="Pending Appeals" 
          value={appeals.filter(a => a.status === 'pending').length} 
          color="yellow" 
        />
        <StatCard 
          label="Approved Appeals" 
          value={appeals.filter(a => a.status === 'approved').length} 
          color="green" 
        />
        <StatCard 
          label="Rejected Appeals" 
          value={appeals.filter(a => a.status === 'rejected').length} 
          color="red" 
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({appeals.filter(a => a.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved ({appeals.filter(a => a.status === 'approved').length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'rejected'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rejected ({appeals.filter(a => a.status === 'rejected').length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <>
              <h2 className="text-xl font-semibold mb-4">Pending Appeals</h2>
              {filteredAppeals.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No pending appeals</p>
              ) : (
                <div className="space-y-4">
                  {filteredAppeals.map((appeal) => (
                    <AppealCard
                      key={appeal.id}
                      appeal={appeal}
                      actions={
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveAppeal(appeal.id)}
                            disabled={actionLoading === appeal.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
                          >
                            {actionLoading === appeal.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectAppeal(appeal.id)}
                            disabled={actionLoading === appeal.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm"
                          >
                            {actionLoading === appeal.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Approved Tab */}
          {activeTab === 'approved' && (
            <>
              <h2 className="text-xl font-semibold mb-4">Approved Appeals</h2>
              {filteredAppeals.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No approved appeals</p>
              ) : (
                <div className="space-y-4">
                  {filteredAppeals.map((appeal) => (
                    <AppealCard
                      key={appeal.id}
                      appeal={appeal}
                      actions={<span className="text-green-600 font-medium">Approved</span>}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Rejected Tab */}
          {activeTab === 'rejected' && (
            <>
              <h2 className="text-xl font-semibold mb-4">Rejected Appeals</h2>
              {filteredAppeals.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No rejected appeals</p>
              ) : (
                <div className="space-y-4">
                  {filteredAppeals.map((appeal) => (
                    <AppealCard
                      key={appeal.id}
                      appeal={appeal}
                      actions={<span className="text-red-600 font-medium">Rejected</span>}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminShopAppealsPage() {
  return (
    <AdminLayout>
      <AdminShopAppealsContent />
    </AdminLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color as keyof typeof colorMap] || colorMap.blue}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
}

function AppealCard({
  appeal,
  actions,
}: {
  appeal: ShopAppealWithShop;
  actions: React.ReactNode;
}) {
  
  // Helper function to safely convert Firestore timestamps to dates
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    
    try {
      // Handle malformed timestamp strings
      if (typeof dateValue === 'string' && dateValue === '[object Object]') {
        return 'N/A';
      }
      
      // Handle Firestore Timestamp objects with seconds property
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString();
      }
      
      // Handle Firestore Timestamp objects with toDate method
      if (dateValue && typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleDateString();
      }
      
      // Handle JavaScript Date objects
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }
      
      // Handle string dates
      if (typeof dateValue === 'string') {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString();
        }
      }
      
      // Handle numeric timestamps
      if (typeof dateValue === 'number') {
        return new Date(dateValue).toLocaleDateString();
      }
      
      return 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return 'N/A';
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{appeal.shopName}</h3>
          <p className="text-sm text-gray-600">Shop ID: {appeal.shopId}</p>
          <p className="text-sm text-gray-600">Submitted: {formatDate(appeal.submittedAt || appeal.createdAt)}</p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            appeal.status === 'approved' ? 'bg-green-100 text-green-800' :
            appeal.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {appeal.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <h4 className="font-medium text-gray-800 mb-1">Appeal Reason:</h4>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{appeal.appealReason}</p>
      </div>

      {appeal.additionalInfo && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800 mb-1">Additional Information:</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{appeal.additionalInfo}</p>
        </div>
      )}

      {appeal.reviewNotes && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800 mb-1">Review Notes:</h4>
          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">{appeal.reviewNotes}</p>
        </div>
      )}

      {appeal.reviewedAt && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">
            Reviewed: {formatDate(appeal.reviewedAt)}
            {appeal.reviewedBy && ` by ${appeal.reviewedBy}`}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        {actions}
      </div>
    </div>
  );
}
