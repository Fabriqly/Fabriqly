'use client';

import { useState, useEffect } from 'react';
import { ShopProfile } from '@/types/shop-profile';
import Link from 'next/link';

interface ShopListProps {
  initialShops?: ShopProfile[];
  searchTerm?: string;
  category?: string;
}

interface ShopReviewStats {
  averageRating: number;
  totalReviews: number;
}

export default function ShopList({ initialShops = [], searchTerm = '', category }: ShopListProps) {
  const [shops, setShops] = useState<ShopProfile[]>(initialShops);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState(category || '');

  useEffect(() => {
    if (initialShops.length === 0) {
      fetchShops();
    }
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
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

  const handleSearch = () => {
    fetchShops();
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search shops..."
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

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
      ) : shops.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No shops found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
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
    <Link href={`/shops/${shop.username}`}>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden cursor-pointer">
        {/* Banner/Thumbnail */}
        {shop.branding?.bannerUrl && (
          <div className="w-full h-32 bg-gray-200">
            <img
              src={shop.branding.bannerUrl}
              alt={shop.shopName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-4">
          {/* Logo & Name */}
          <div className="flex items-start gap-3 mb-3">
            {shop.branding?.logoUrl && (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                <img
                  src={shop.branding.logoUrl}
                  alt={shop.shopName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{shop.shopName}</h3>
              <p className="text-sm text-gray-600">@{shop.username}</p>
            </div>
            {shop.isVerified && (
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{shop.description}</p>

          {/* Specialties */}
          {shop.specialties && shop.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {shop.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                >
                  {specialty}
                </span>
              ))}
              {shop.specialties.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  +{shop.specialties.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-3">
            <div className="flex gap-4">
              <span>{shop.shopStats?.totalProducts || 0} Products</span>
              <span>⭐ {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews} reviews)</span>
            </div>
            {shop.location && shop.location.city && (
              <span className="text-xs">{shop.location.city}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}


