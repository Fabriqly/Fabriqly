'use client';

import { useEffect, useState } from 'react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import ShopList from '@/components/shop/ShopList';
import { ShopProfile } from '@/types/shop-profile';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function ExploreShopsPage() {
  const { user } = useAuth();
  const [shops, setShops] = useState<ShopProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shop-profiles?isActive=true&approvalStatus=approved&limit=100');
      const data = await response.json();
      
      if (data.success) {
        setShops(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Shops</h1>
          <p className="text-gray-600">Discover amazing shops and their unique products</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <ShopList initialShops={shops} />
        )}
      </main>
    </div>
  );
}

