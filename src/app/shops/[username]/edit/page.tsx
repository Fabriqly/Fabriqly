'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShopProfileForm from '@/components/shop/ShopProfileForm';
import { ShopProfile, UpdateShopProfileData } from '@/types/shop-profile';
import { useSession } from 'next-auth/react';

export default function EditShopPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const username = params.username as string;

  useEffect(() => {
    fetchShop();
  }, [username]);

  const fetchShop = async () => {
    try {
      const response = await fetch(`/api/shop-profiles/username/${username}`);
      const data = await response.json();

      if (data.success) {
        // Check if user can edit this shop
        if (session && (session.user as any)?.id !== data.data.userId) {
          setError('You do not have permission to edit this shop');
        } else {
          setShop(data.data);
        }
      } else {
        setError(data.error || 'Shop not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateShopProfileData) => {
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

      // Redirect to shop profile
      router.push(`/shops/${result.data.username}`);
    } catch (error: any) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="flex flex-col lg:flex-row gap-6 p-6">
          {/* Left Column - Branding Section Skeleton (33% on desktop) */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              {/* Header Skeleton */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
              
              {/* Logo Upload Skeleton */}
              <div className="space-y-2 mb-6">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="w-full h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>

              {/* Banner Upload Skeleton */}
              <div className="space-y-2 mb-6">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="w-full h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>

              {/* Thumbnail Upload Skeleton */}
              <div className="space-y-2 mb-6">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="w-full h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>

              {/* Tagline Skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>

          {/* Right Column - Form Sections Skeleton (66% on desktop) */}
          <div className="w-full lg:w-2/3 space-y-6">
            {/* Basic Information Skeleton */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-40"></div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-36"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>

            {/* Contact Information Skeleton */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-44"></div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>

            {/* Location Skeleton */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>

            {/* Business Details Skeleton */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-36"></div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>

            {/* Shop Description Skeleton */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-36"></div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>

            {/* Buttons Skeleton */}
            <div className="flex justify-end gap-4 pt-4">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Shop not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleCancel = useCallback(() => {
    // Since we only render the form when shop is loaded, shop.username should always be available
    // But we'll use params username as a safety fallback
    const targetUsername = shop?.username || username;
    router.push(`/shops/${targetUsername}`);
  }, [shop?.username, username, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Shop Profile</h1>
          <p className="text-gray-600">Update your shop information</p>
        </div>

        <ShopProfileForm
          onSubmit={handleSubmit}
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
          onCancel={() => {
            // Explicit navigation to shop profile page
            const targetUsername = shop.username || username;
            router.push(`/shops/${targetUsername}`);
          }}
        />
      </div>
    </div>
  );
}


