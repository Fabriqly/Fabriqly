'use client';

import { useEffect, useState } from 'react';
import ShopList from '@/components/shop/ShopList';
import { ShopProfile } from '@/types/shop-profile';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface ShopReviewStats {
  averageRating: number;
  totalReviews: number;
}

export default function ShopsPage() {
  const { user } = useAuth();
  const [shops, setShops] = useState<ShopProfile[]>([]);
  const [featuredShops, setFeaturedShops] = useState<ShopProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const [shopsRes, featuredRes] = await Promise.all([
        fetch('/api/shop-profiles?approvalStatus=approved&isActive=true&limit=20'),
        fetch('/api/shop-profiles/featured?limit=6'),
      ]);

      const [shopsData, featuredData] = await Promise.all([
        shopsRes.json(),
        featuredRes.json(),
      ]);

      if (shopsData.success) setShops(shopsData.data);
      if (featuredData.success) setFeaturedShops(featuredData.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore Shops</h1>
          <p className="text-gray-600">Discover amazing shops and their unique products</p>
        </div>
        {user && (user.role === 'business_owner' || user.role === 'admin') && (
          <Link
            href="/dashboard/shop-profile/create"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Shop
          </Link>
        )}
      </div>

      {/* Featured Shops */}
      {featuredShops.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Featured Shops</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {featuredShops.map((shop) => (
              <FeaturedShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </div>
      )}

      {/* All Shops */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Shops</h2>
        <ShopList initialShops={shops} />
      </div>
    </div>
  );
}

function FeaturedShopCard({ shop }: { shop: ShopProfile }) {
  const [reviewStats, setReviewStats] = useState<ShopReviewStats>({
    averageRating: shop.ratings?.averageRating || 0,
    totalReviews: shop.ratings?.totalReviews || 0
  });

  useEffect(() => {
    // Fetch actual review data
    const fetchReviewStats = async () => {
      try {
        const response = await fetch(`/api/reviews/average?type=shop&targetId=${shop.id}`);
        const data = await response.json();
        
        if (data.success) {
          setReviewStats({
            averageRating: data.data.average || 0,
            totalReviews: data.data.total || 0
          });
        }
      } catch (error) {
        console.error('Error fetching shop review stats:', error);
      }
    };

    if (shop.id) {
      fetchReviewStats();
    }
  }, [shop.id]);

  return (
    <Link href={`/shops/${shop.username}`}>
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md border-2 border-blue-200 hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
        {shop.branding?.bannerUrl && (
          <div className="w-full h-40 bg-gray-200">
            <img
              src={shop.branding.bannerUrl}
              alt={shop.shopName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            {shop.branding?.logoUrl && (
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                <img
                  src={shop.branding.logoUrl}
                  alt={shop.shopName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-xl truncate">{shop.shopName}</h3>
                {shop.isVerified && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {shop.branding?.tagline && (
                <p className="text-sm text-gray-700 italic">&ldquo;{shop.branding.tagline}&rdquo;</p>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{shop.description}</p>

          <div className="flex justify-between items-center text-sm font-medium">
            <div className="flex gap-4">
              <span className="text-blue-700">{shop.shopStats.totalProducts} Products</span>
              <span className="text-purple-700">⭐ {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews} reviews)</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}


