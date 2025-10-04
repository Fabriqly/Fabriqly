'use client';

import { useEffect, useState } from 'react';
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
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
        />
      </div>
    </div>
  );
}


