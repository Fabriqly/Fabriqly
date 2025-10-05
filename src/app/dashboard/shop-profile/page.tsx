'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShopProfile, UpdateShopProfileData } from '@/types/shop-profile';
import ShopProfileForm from '@/components/shop/ShopProfileForm';
import ShopProfileView from '@/components/shop/ShopProfileView';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';

export default function ShopProfilePage() {
  const { user, isLoading } = useAuth(true, 'business_owner');
  const router = useRouter();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchShop();
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
    } catch (error: any) {
      throw error;
    }
  };

  const handleCreateShop = () => {
    router.push('/shops/create');
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading shop profile...</p>
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
        <div className="flex-1">
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Shop Profile</h1>
        <div className="flex gap-3">
          <a
            href={`/shops/${shop.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            View Public Page
          </a>
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {shop.approvalStatus === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-800">Pending Approval</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your shop profile is under review by our admin team. You'll be notified once it's approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {shop.approvalStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-800">Application Rejected</h3>
              <p className="text-sm text-red-700 mt-1">
                {shop.rejectionReason || 'Your shop profile was not approved. Please update your information and try again.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {shop.approvalStatus === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-green-800">Shop Approved</h3>
              <p className="text-sm text-green-700 mt-1">
                Your shop is live and visible to customers!
              </p>
            </div>
          </div>
        </div>
      )}

      <ShopProfileView shop={shop} showEditButton={false} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

