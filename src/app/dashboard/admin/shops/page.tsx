'use client';

import { useEffect, useState } from 'react';
import { ShopProfile, ApprovalStatus } from '@/types/shop-profile';
import { ShopAppeal } from '@/types/enhanced-products';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Check, X, Eye, Mail, MapPin, User, Calendar, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface ShopAppealWithShop extends ShopAppeal {
  shop?: {
    id: string;
    shopName: string;
    username: string;
    businessOwnerName: string;
    approvalStatus: string;
  };
}

function AdminShopsContent() {
  const [approvedShops, setApprovedShops] = useState<ShopProfile[]>([]);
  const [rejectedShops, setRejectedShops] = useState<ShopProfile[]>([]);
  const [suspendedShops, setSuspendedShops] = useState<ShopProfile[]>([]);
  const [appeals, setAppeals] = useState<ShopAppealWithShop[]>([]);
  const [stats, setStats] = useState({
    totalApproved: 0,
    totalRejected: 0,
    totalSuspended: 0,
    totalActive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [appealActionLoading, setAppealActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'approved' | 'rejected' | 'suspended' | 'appeals'>('approved');
  const [appealTab, setAppealTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
    fetchAppeals();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, approvedRes, rejectedRes, suspendedRes] = await Promise.all([
        fetch('/api/admin/shop-profiles/stats'),
        fetch('/api/admin/shop-profiles/approved'),
        fetch('/api/admin/shop-profiles/rejected'),
        fetch('/api/admin/shop-profiles/suspended'),
      ]);

      const [statsData, approvedData, rejectedData, suspendedData] = await Promise.all([
        statsRes.json(),
        approvedRes.json(),
        rejectedRes.json(),
        suspendedRes.json(),
      ]);

      if (statsData.success) {
        const stats = statsData.data;
        setStats({
          totalApproved: stats.totalApproved || 0,
          totalRejected: stats.totalRejected || 0,
          totalSuspended: stats.totalSuspended || 0,
          totalActive: stats.totalActive || 0,
        });
      }
      if (approvedData.success) setApprovedShops(approvedData.data);
      if (rejectedData.success) setRejectedShops(rejectedData.data);
      if (suspendedData.success) setSuspendedShops(suspendedData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppeals = async () => {
    try {
      const response = await fetch('/api/admin/shop-appeals');
      const data = await response.json();
      
      if (data.success) {
        setAppeals(data.data);
      }
    } catch (error) {
      console.error('Error fetching appeals:', error);
    }
  };

  const handleApproveAppeal = async (appealId: string) => {
    const reviewNotes = prompt('Please provide review notes (optional):');
    if (reviewNotes === null) return; // User cancelled

    setAppealActionLoading(appealId);
    try {
      const response = await fetch('/api/admin/shop-appeals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealId, reviewNotes }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAppeals(); // Refresh appeals
        await fetchData(); // Refresh shop data
        alert('Appeal approved successfully');
      } else {
        alert(data.error || 'Failed to approve appeal');
      }
    } catch (error) {
      console.error('Error approving appeal:', error);
      alert('Failed to approve appeal');
    } finally {
      setAppealActionLoading(null);
    }
  };

  const handleRejectAppeal = async (appealId: string) => {
    const reviewNotes = prompt('Please provide rejection reason:');
    if (!reviewNotes) return;

    setAppealActionLoading(appealId);
    try {
      const response = await fetch('/api/admin/shop-appeals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealId, reviewNotes }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAppeals(); // Refresh appeals
        alert('Appeal rejected');
      } else {
        alert(data.error || 'Failed to reject appeal');
      }
    } catch (error) {
      console.error('Error rejecting appeal:', error);
      alert('Failed to reject appeal');
    } finally {
      setAppealActionLoading(null);
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

  const getCurrentShops = () => {
    let shops: ShopProfile[] = [];
    switch (activeTab) {
      case 'approved': shops = approvedShops; break;
      case 'rejected': shops = rejectedShops; break;
      case 'suspended': shops = suspendedShops; break;
      default: shops = [];
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      shops = shops.filter(shop => 
        shop.shopName?.toLowerCase().includes(searchLower) ||
        shop.username?.toLowerCase().includes(searchLower) ||
        shop.businessOwnerName?.toLowerCase().includes(searchLower) ||
        shop.contactInfo?.email?.toLowerCase().includes(searchLower) ||
        shop.location?.city?.toLowerCase().includes(searchLower) ||
        shop.location?.province?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date
    shops.sort((a, b) => {
      const getDate = (shop: ShopProfile) => {
        if (!shop.createdAt) return 0;
        try {
          const date = shop.createdAt instanceof Date ? shop.createdAt : new Date(shop.createdAt);
          return date.getTime();
        } catch {
          return 0;
        }
      };
      
      const dateA = getDate(a);
      const dateB = getDate(b);
      
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return shops;
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getActionsForShop = (shop: ShopProfile) => {
    switch (shop.approvalStatus) {
      case 'approved':
        return (
          <button
            onClick={() => handleSuspend(shop.id)}
            disabled={actionLoading === shop.id}
            className="px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
          >
            {actionLoading === shop.id ? 'Processing...' : 'Suspend'}
          </button>
        );
      case 'rejected':
        return (
            <button
              onClick={() => handleSuspend(shop.id)}
              disabled={actionLoading === shop.id}
              className="px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
            >
              Suspend
            </button>
        );
      case 'suspended':
        return (
          <button
            onClick={() => handleRestore(shop.id)}
            disabled={actionLoading === shop.id}
            className="px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
          >
            {actionLoading === shop.id ? 'Processing...' : 'Restore'}
          </button>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Shop Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
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
            <button
              onClick={() => setActiveTab('appeals')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'appeals'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Appeals ({appeals.filter(a => a.status === 'pending').length})
            </button>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search shops by name, owner, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            {/* Sort Button */}
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Sort by Date</span>
              <span className="sm:hidden">Date</span>
              {sortOrder === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'appeals' ? (
            <>
              {/* Appeals Tab Content */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

                {/* Appeals Sub-tabs */}
                <div className="border-b mb-4">
                  <div className="flex">
                    <button
                      onClick={() => setAppealTab('pending')}
                      className={`px-6 py-3 font-medium text-sm ${
                        appealTab === 'pending'
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Pending ({appeals.filter(a => a.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setAppealTab('approved')}
                      className={`px-6 py-3 font-medium text-sm ${
                        appealTab === 'approved'
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Approved ({appeals.filter(a => a.status === 'approved').length})
                    </button>
                    <button
                      onClick={() => setAppealTab('rejected')}
                      className={`px-6 py-3 font-medium text-sm ${
                        appealTab === 'rejected'
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Rejected ({appeals.filter(a => a.status === 'rejected').length})
                    </button>
                  </div>
                </div>

                {/* Appeals List */}
                {appeals.filter(a => a.status === appealTab).length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    {appealTab === 'pending' ? 'No pending appeals' :
                     appealTab === 'approved' ? 'No approved appeals' :
                     'No rejected appeals'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {appeals.filter(a => a.status === appealTab).map((appeal) => (
                      <AppealCard
                        key={appeal.id}
                        appeal={appeal}
                        actions={
                          appealTab === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveAppeal(appeal.id)}
                                disabled={appealActionLoading === appeal.id}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
                              >
                                {appealActionLoading === appeal.id ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleRejectAppeal(appeal.id)}
                                disabled={appealActionLoading === appeal.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm"
                              >
                                {appealActionLoading === appeal.id ? 'Processing...' : 'Reject'}
                              </button>
                            </div>
                          ) : appealTab === 'approved' ? (
                            <span className="text-green-600 font-medium">Approved</span>
                          ) : (
                            <span className="text-red-600 font-medium">Rejected</span>
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {loading ? (
            <>
              {/* Desktop Skeleton */}
              <div className="hidden md:block">
                <TableSkeleton />
              </div>
              {/* Mobile Skeleton */}
              <div className="block md:hidden space-y-3">
                {[...Array(3)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                {getCurrentShops().length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-2">
                      {searchTerm.trim() 
                        ? `No shops found matching "${searchTerm}"` 
                        : 'No shops found'}
                    </p>
                    {searchTerm.trim() && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Shop/Owner</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCurrentShops().map((shop) => (
                        <tr key={shop.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {shop.branding?.logoUrl ? (
                                <img
                                  src={shop.branding.logoUrl}
                                  alt={shop.shopName}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">{shop.shopName}</div>
                                <div className="text-sm text-gray-500">@{shop.username}</div>
                                <div className="text-xs text-gray-400">{shop.businessOwnerName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {shop.contactInfo?.email && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <Mail className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[200px]">{shop.contactInfo.email}</span>
                                </div>
                              )}
                              {shop.location?.city && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[200px]">{shop.location.city}, {shop.location.province}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              shop.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              shop.approvalStatus === 'suspended' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {shop.approvalStatus?.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(shop.createdAt)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              {getActionsForShop(shop)}
                              <Link
                                href={`/shops/${shop.username}`}
                                target="_blank"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="View Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {getCurrentShops().length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-2">
                      {searchTerm.trim() 
                        ? `No shops found matching "${searchTerm}"` 
                        : 'No shops found'}
                    </p>
                    {searchTerm.trim() && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  getCurrentShops().map((shop) => (
                    <MobileShopCard
                      key={shop.id}
                      shop={shop}
                      onReject={() => handleReject(shop.id)}
                      onSuspend={() => handleSuspend(shop.id)}
                      onRestore={() => handleRestore(shop.id)}
                      actionLoading={actionLoading === shop.id}
                    />
                  ))
                )}
              </div>
                </>
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
    <div className={`rounded-lg border p-3 md:p-4 ${colorMap[color] || colorMap.blue}`}>
      <div className="text-xl md:text-2xl font-bold">{value}</div>
      <div className="text-xs md:text-sm font-medium">{label}</div>
    </div>
  );
}

function MobileShopCard({
  shop,
  onReject,
  onSuspend,
  onRestore,
  actionLoading,
}: {
  shop: ShopProfile;
  onReject: () => void;
  onSuspend: () => void;
  onRestore: () => void;
  actionLoading: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {shop.branding?.logoUrl ? (
          <img
            src={shop.branding.logoUrl}
            alt={shop.shopName}
            className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate">{shop.shopName}</h3>
              <p className="text-xs text-gray-500 truncate">@{shop.username}</p>
              <p className="text-xs text-gray-500 truncate">{shop.businessOwnerName}</p>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
              shop.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
              shop.approvalStatus === 'suspended' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {shop.approvalStatus?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Body - Owner and Email only */}
      <div className="space-y-1.5 mb-3 text-sm">
        {shop.contactInfo?.email && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{shop.contactInfo.email}</span>
          </div>
        )}
      </div>

      {/* Rejection reason */}
      {shop.approvalStatus === 'rejected' && shop.rejectionReason && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
          <p className="font-medium text-red-800 mb-0.5">Rejection Reason:</p>
          <p className="text-red-700">{shop.rejectionReason}</p>
        </div>
      )}

      {/* Footer - Actions */}
      <div className="flex gap-2">
        {shop.approvalStatus === 'approved' && (
          <button
            onClick={onSuspend}
            disabled={actionLoading}
            className="flex-1 px-3 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
          >
            {actionLoading ? 'Processing...' : 'Suspend'}
          </button>
        )}
        {shop.approvalStatus === 'rejected' && (
          <button
            onClick={onSuspend}
            disabled={actionLoading}
            className="flex-1 px-3 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
          >
            Suspend
          </button>
        )}
        {shop.approvalStatus === 'suspended' && (
          <button
            onClick={onRestore}
            disabled={actionLoading}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {actionLoading ? 'Processing...' : 'Restore'}
          </button>
        )}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-40 animate-pulse mb-3"></div>
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex-1 h-9 bg-gray-200 rounded animate-pulse"></div>
      </div>
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
  const formatAppealDate = (dateValue: any) => {
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
          <p className="text-sm text-gray-600">Submitted: {formatAppealDate(appeal.submittedAt || appeal.createdAt)}</p>
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
            Reviewed: {formatAppealDate(appeal.reviewedAt)}
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


