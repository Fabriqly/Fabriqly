'use client';

import { useState, useEffect } from 'react';
import { ShopProfile } from '@/types/shop-profile';
import Link from 'next/link';
import { MapPin, Star, Package } from 'lucide-react';

interface ShopListProps {
  initialShops?: ShopProfile[];
  selectedSpecialties?: string[];
}

interface ShopReviewStats {
  averageRating: number;
  totalReviews: number;
}

export default function ShopList({ initialShops = [], selectedSpecialties = [] }: ShopListProps) {
  const [shops, setShops] = useState<ShopProfile[]>(initialShops);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialShops.length === 0) {
      fetchShops();
    } else {
      setShops(initialShops);
    }
  }, [initialShops]);

  const fetchShops = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('approvalStatus', 'approved');
      params.append('isActive', 'true');
      
      const response = await fetch(`/api/shop-profiles?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setShops(data.data);
      } else {
        setError(data.error || 'Failed to load shops');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = selectedSpecialties.length > 0
    ? shops.filter(shop => 
        shop.specialties?.some(specialty => selectedSpecialties.includes(specialty))
      )
    : shops;

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Shop Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading shops...</p>
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No shops found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShopCard({ shop }: { shop: ShopProfile }) {
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
    <Link href={`/shops/${shop.username}`} className="group block h-full">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative">
        {/* Banner/Thumbnail */}
        <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 overflow-hidden rounded-t-xl relative">
          {shop.branding?.bannerUrl ? (
            <img
              src={shop.branding.bannerUrl}
              alt={shop.shopName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )}
        </div>
        
        {/* Logo Overlay - Positioned relative to container but pushed up */}
        <div className="px-4 -mt-8 relative z-10">
          <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden">
            {shop.branding?.logoUrl ? (
              <img
                src={shop.branding.logoUrl}
                alt={shop.shopName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl font-bold">
                {shop.shopName?.charAt(0) || 'S'}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-5 pt-2 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {shop.shopName}
                </h3>
                {shop.isVerified && (
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-500 font-medium">@{shop.username}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {shop.description || 'No description available.'}
          </p>

          {/* Specialties */}
          {shop.specialties && shop.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
              {shop.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium border border-gray-100"
                >
                  {specialty}
                </span>
              ))}
              {shop.specialties.length > 3 && (
                <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-md text-xs font-medium border border-gray-100">
                  +{shop.specialties.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stats Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-gray-400" />
                <span>{shop.shopStats?.totalProducts || 0} Items</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span>{reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews})</span>
              </div>
            </div>
            {shop.location?.city && (
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{shop.location.city}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
