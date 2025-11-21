'use client';

import { useEffect, useState } from 'react';
import { ShopProfile, ApprovalStatus } from '@/types/shop-profile';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';

function AdminShopsContent() {
  const [pendingShops, setPendingShops] = useState<ShopProfile[]>([]);
  const [approvedShops, setApprovedShops] = useState<ShopProfile[]>([]);
  const [rejectedShops, setRejectedShops] = useState<ShopProfile[]>([]);
  const [suspendedShops, setSuspendedShops] = useState<ShopProfile[]>([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalSuspended: 0,
    totalActive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'suspended'>('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes, approvedRes, rejectedRes, suspendedRes] = await Promise.all([
        fetch('/api/admin/shop-profiles/stats'),
        fetch('/api/admin/shop-profiles/pending'),
        fetch('/api/admin/shop-profiles/approved'),
        fetch('/api/admin/shop-profiles/rejected'),
        fetch('/api/admin/shop-profiles/suspended'),
      ]);

      const [statsData, pendingData, approvedData, rejectedData, suspendedData] = await Promise.all([
        statsRes.json(),
        pendingRes.json(),
        approvedRes.json(),
        rejectedRes.json(),
        suspendedRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (pendingData.success) setPendingShops(pendingData.data);
      if (approvedData.success) setApprovedShops(approvedData.data);
      if (rejectedData.success) setRejectedShops(rejectedData.data);
      if (suspendedData.success) setSuspendedShops(suspendedData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (shopId: string) => {
    setActionLoading(shopId);
    try {
      const response = await fetch('/api/admin/shop-profiles/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchData(); // Refresh data
      } else {
        alert(data.error || 'Failed to approve shop');
      }
    } catch (error) {
      console.error('Error approving shop:', error);
      alert('Failed to approve shop');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (shopId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setActionLoading(shopId);
    try {
      const response = await fetch('/api/admin/shop-profiles/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, reason }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchData(); // Refresh data
      } else {
        alert(data.error || 'Failed to reject shop');
      }
    } catch (error) {
      console.error('Error rejecting shop:', error);
      alert('Failed to reject shop');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (shopId: string) => {
    const reason = prompt('Please provide a reason for suspension:');
    if (!reason) return;

    setActionLoading(shopId);
    try {
      const response = await fetch('/api/admin/shop-profiles/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, reason }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchData(); // Refresh data
      } else {
        alert(data.error || 'Failed to suspend shop');
      }
    } catch (error) {
      console.error('Error suspending shop:', error);
      alert('Failed to suspend shop');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (shopId: string) => {
    if (!confirm('Are you sure you want to restore this shop?')) return;

    setActionLoading(shopId);
    try {
      const response = await fetch('/api/admin/shop-profiles/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchData(); // Refresh data
      } else {
        alert(data.error || 'Failed to restore shop');
      }
    } catch (error) {
      console.error('Error restoring shop:', error);
      alert('Failed to restore shop');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Shop Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Pending" value={stats.totalPending} color="yellow" />
        <StatCard label="Approved" value={stats.totalApproved} color="green" />
        <StatCard label="Rejected" value={stats.totalRejected} color="red" />
        <StatCard label="Suspended" value={stats.totalSuspended} color="gray" />
        <StatCard label="Active" value={stats.totalActive} color="blue" />
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
              Pending ({pendingShops.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved ({approvedShops.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'rejected'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rejected ({rejectedShops.length})
            </button>
            <button
              onClick={() => setActiveTab('suspended')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'suspended'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Suspended ({suspendedShops.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <>
              <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
              {pendingShops.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No pending shop approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingShops.map((shop) => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      actions={
                        <>
                          <button
                            onClick={() => handleApprove(shop.id)}
                            disabled={actionLoading === shop.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
                          >
                            {actionLoading === shop.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(shop.id)}
                            disabled={actionLoading === shop.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm"
                          >
                            Reject
                          </button>
                        </>
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
              <h2 className="text-xl font-semibold mb-4">Approved Shops</h2>
              {approvedShops.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No approved shops</p>
              ) : (
                <div className="space-y-4">
                  {approvedShops.map((shop) => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      actions={
                        <button
                          onClick={() => handleSuspend(shop.id)}
                          disabled={actionLoading === shop.id}
                          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 text-sm"
                        >
                          {actionLoading === shop.id ? 'Processing...' : 'Suspend'}
                        </button>
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Rejected Tab */}
          {activeTab === 'rejected' && (
            <>
              <h2 className="text-xl font-semibold mb-4">Rejected Shops</h2>
              {rejectedShops.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No rejected shops</p>
              ) : (
                <div className="space-y-4">
                  {rejectedShops.map((shop) => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      actions={
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(shop.id)}
                            disabled={actionLoading === shop.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
                          >
                            {actionLoading === shop.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleSuspend(shop.id)}
                            disabled={actionLoading === shop.id}
                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 text-sm"
                          >
                            {actionLoading === shop.id ? 'Processing...' : 'Suspend'}
                          </button>
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Suspended Tab */}
          {activeTab === 'suspended' && (
            <>
              <h2 className="text-xl font-semibold mb-4">Suspended Shops</h2>
              {suspendedShops.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No suspended shops</p>
              ) : (
                <div className="space-y-4">
                  {suspendedShops.map((shop) => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      actions={
                        <button
                          onClick={() => handleRestore(shop.id)}
                          disabled={actionLoading === shop.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
                        >
                          {actionLoading === shop.id ? 'Processing...' : 'Restore'}
                        </button>
                      }
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

export default function AdminShopsPage() {
  return (
    <AdminLayout>
      <AdminShopsContent />
    </AdminLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color] || colorMap.blue}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
}

function ShopCard({
  shop,
  actions,
}: {
  shop: ShopProfile;
  actions: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Logo */}
        {shop.branding?.logoUrl && (
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
            <img src={shop.branding.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg">{shop.shopName}</h3>
              <p className="text-sm text-gray-600">@{shop.username}</p>
              <p className="text-sm text-gray-600">Owner: {shop.businessOwnerName}</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                shop.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                shop.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                shop.approvalStatus === 'suspended' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {shop.approvalStatus?.toUpperCase()}
              </span>
            </div>
            <Link
              href={`/shops/${shop.username}`}
              target="_blank"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View Full Profile →
            </Link>
          </div>

          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{shop.description}</p>

          {/* Rejection reason for rejected shops */}
          {shop.approvalStatus === 'rejected' && shop.rejectionReason && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-700">{shop.rejectionReason}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
              {shop.businessDetails.businessType}
            </span>
            {shop.location?.city && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                📍 {shop.location.city}, {shop.location.province}
              </span>
            )}
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
              📧 {shop.contactInfo.email}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}


