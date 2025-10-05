'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ShopProfileView from '@/components/shop/ShopProfileView';
import { ShopProfile } from '@/types/shop-profile';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ShopProfilePage() {
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
        setShop(data.data);
      } else {
        setError(data.error || 'Shop not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/shops/${username}/edit`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading shop profile...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Shop Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The shop you are looking for does not exist.'}</p>
          <a
            href="/shops"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Browse All Shops
          </a>
        </div>
      </div>
    );
  }

  const canEdit = session && (session.user as any)?.id === shop.userId;

  return (
    <div className="container mx-auto px-4 py-8">
      <ShopProfileView 
        shop={shop} 
        showEditButton={canEdit} 
        onEdit={canEdit ? handleEdit : undefined}
      />
    </div>
  );
}


