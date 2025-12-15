'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShopProfile, UpdateShopProfileData } from '@/types/shop-profile';
import ShopProfileForm from '@/components/shop/ShopProfileForm';
import ShopProfileView from '@/components/shop/ShopProfileView';
import ShopAppealForm from '@/components/shop/ShopAppealForm';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  MessageSquare,
  RefreshCw
} from 'lucide-react';

export default function ShopProfilePage() {
  const { user, isLoading } = useAuth(true, 'business_owner');
  const router = useRouter();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchShop();
      loadVerificationStatus();
    }
  }, [user?.id]);

  const fetchShop = async () => {
    if (!user?.id) return;

    try {
      // Use the dedicated endpoint for fetching user's own shop
      const response = await fetch(`/api/shop-profiles/user/${user.id}`);
      const data = await response.json();

      if (data.success && data.data) {
        setShop(data.data);
      }
    } catch (err: any) {
      console.error('Error fetching shop:', err);
      setError(err.message || 'Failed to load shop profile');
    } finally {
      setLoading(false);
    }
  };

  const loadVerificationStatus = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingStatus(true);
      const response = await fetch('/api/shop-verification-status');
      const data = await response.json();

      if (response.ok) {
        setVerificationStatus(data);
      } else {
        console.error('Failed to load verification status:', data.error);
      }
    } catch (error: any) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleUpdate = async (data: UpdateShopProfileData) => {
    if (!shop) return;

    try {
      const response = await fetch(`/api/shop-profiles/${shop.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update shop profile');
      }

      setShop(result.data);
      setEditing(false);
      // Reload verification status after profile update
      loadVerificationStatus();
    } catch (error: any) {
      throw error;
    }
  };

  const handleAppealSuccess = () => {
    loadVerificationStatus();
  };

  const handleCreateShop = () => {
    router.push('/dashboard/shop-profile/create');
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Dashboard Header */}
        <DashboardHeader user={user} />

        <div className="flex flex-1">
          {/* Dashboard Sidebar */}
          <DashboardSidebar user={user} />

          {/* Main Content */}
          <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
              <div className="max-w-6xl mx-auto">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center mb-6 animate-pulse">
                  <div className="h-9 bg-gray-200 rounded w-48"></div>
                  <div className="flex gap-3">
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                    <div className="h-10 bg-gray-200 rounded w-28"></div>
                  </div>
                </div>

                {/* Hero Banner Skeleton */}
                <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden bg-gray-200 rounded-t-xl animate-pulse mb-4"></div>

                {/* Shop Info Card Skeleton */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 md:p-5 animate-pulse">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Shop Avatar Skeleton */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 border-4 border-white"></div>
                      </div>

                      {/* Shop Information Skeleton */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-64"></div>
                        </div>
                        
                        {/* Stats Skeleton */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
                            <div className="h-8 bg-gray-200 rounded-lg w-28"></div>
                          </div>
                          <div className="h-10 bg-gray-200 rounded-lg w-28"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Skeleton - Split Layout */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
                    {/* Left Sidebar Skeleton (4 columns) */}
                    <aside className="lg:col-span-4 space-y-4">
                      {/* About Card Skeleton */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
                        <div className="space-y-2 mb-3">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="flex flex-wrap gap-2">
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        </div>
                      </div>

                      {/* Business Details Card Skeleton */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-36 mb-3"></div>
                        <div className="space-y-3">
                          <div>
                            <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div>
                            <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                          </div>
                          <div>
                            <div className="h-3 bg-gray-200 rounded w-28 mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-36"></div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Card Skeleton */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-40 mb-3"></div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-gray-200 rounded mt-0.5"></div>
                            <div className="flex-1">
                              <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                              <div className="h-4 bg-gray-200 rounded w-48"></div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-gray-200 rounded mt-0.5"></div>
                            <div className="flex-1">
                              <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                              <div className="h-4 bg-gray-200 rounded w-40"></div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-gray-200 rounded mt-0.5"></div>
                            <div className="flex-1">
                              <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                              <div className="h-4 bg-gray-200 rounded w-56"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </aside>

                    {/* Right Main Content Skeleton (8 columns) */}
                    <div className="lg:col-span-8">
                      {/* Products Section Skeleton */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
                        <div className="h-7 bg-gray-200 rounded w-40 mb-4"></div>
                        
                        {/* Category Filter Skeleton */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          <div className="h-8 bg-gray-200 rounded-full w-16"></div>
                          <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                          <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                          <div className="h-8 bg-gray-200 rounded-full w-28"></div>
                        </div>

                        {/* Products Grid Skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                              <div className="aspect-square bg-gray-200"></div>
                              <div className="p-3">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader user={user} />

      <div className="flex flex-1">
        {/* Dashboard Sidebar */}
        <DashboardSidebar user={user} />

        {/* Main Content */}
        <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="max-w-6xl mx-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {!shop ? (
                <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <svg
            className="w-24 h-24 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold mb-2">No Shop Profile Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your shop profile to start selling on Fabriqly. Your shop will be reviewed by our admin team before going live.
          </p>
          
          
          <button
            onClick={handleCreateShop}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Create Shop Profile
          </button>
        </div>
                </div>
              ) : editing ? (
                <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Edit Shop Profile</h1>
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
        <ShopProfileForm
          onSubmit={handleUpdate}
          initialData={{
            shopName: shop.shopName,
            username: shop.username,
            businessOwnerName: shop.businessOwnerName,
            contactInfo: shop.contactInfo,
            location: shop.location,
            branding: shop.branding,
            businessDetails: shop.businessDetails,
            description: shop.description,
            specialties: shop.specialties,
            supportedProductCategories: shop.supportedProductCategories,
            customizationPolicy: shop.customizationPolicy,
            socialMedia: shop.socialMedia,
            website: shop.website,
          }}
          isEditing={true}
        />
                </div>
              ) : (
                <div>
      <div className="mb-6">
        {/* Title Section */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Shop Profile</h1>
        </div>
        
        {/* Action Buttons - Stack on mobile, horizontal on desktop */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <a
            href={`/shops/${shop.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm sm:text-base"
          >
            View Public Page
          </a>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm sm:text-base"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Enhanced Status Banner */}
      {shop && verificationStatus && (
        <>
          {/* Approved Status */}
          {verificationStatus.verificationStatus === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-800">Shop Approved ✅</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your shop is live and visible to customers! You can start selling and managing your products.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Status */}
          {verificationStatus.verificationStatus === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <Clock className="h-6 w-6 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Application Under Review</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your shop profile is currently under review by our admin team. We'll notify you once the review is complete.
                  </p>
                  {shop.createdAt && (
                    <p className="text-xs text-yellow-600 mt-2">
                      Submitted: {new Date(shop.createdAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rejected Status */}
          {verificationStatus.verificationStatus === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <XCircle className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-red-800">Application Rejected</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Your shop profile was not approved. Please review the feedback below and update your information.
                  </p>
                  {verificationStatus.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-100 rounded-lg">
                      <p className="font-medium text-red-800">Reason:</p>
                      <p className="text-red-700">{verificationStatus.rejectionReason}</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                    >
                      <RefreshCw className="h-4 w-4 inline mr-2" />
                      Re-submit Application
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suspended Status */}
          {verificationStatus.verificationStatus === 'suspended' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-red-800">Shop Suspended</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Your shop has been suspended. You can submit an appeal to request a review of this decision.
                  </p>
                  {verificationStatus.suspensionReason && (
                    <div className="mt-3 p-3 bg-red-100 rounded-lg">
                      <p className="font-medium text-red-800">Reason:</p>
                      <p className="text-red-700">{verificationStatus.suspensionReason}</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <button
                      onClick={() => setShowAppealForm(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium"
                    >
                      <MessageSquare className="h-4 w-4 inline mr-2" />
                      Submit Appeal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ShopProfileView shop={shop} showEditButton={false} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appeal Form Modal */}
      <ShopAppealForm
        isOpen={showAppealForm}
        onClose={() => setShowAppealForm(false)}
        onSuccess={handleAppealSuccess}
        suspensionReason={verificationStatus?.suspensionReason}
      />
    </div>
  );
}

