'use client';

import { useEffect, useState } from 'react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ProductCard } from '@/components/products/ProductCard';
import { LoadingCard } from '@/components/ui/LoadingCard';
import { useAuth } from '@/hooks/useAuth';
import { ProductWithDetails } from '@/types/products';

export default function ExplorePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?limit=8&status=active');
      const data = await response.json();
      
      if (response.ok && data.success) {
        // The API returns { success: true, data: { products: [...] } }
        setProducts(data.data.products || []);
      } else {
        console.error('Error loading products:', data.error);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Customer Header */}
      <CustomerHeader user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guest Banner - Show only if user is not logged in */}
        {!user && (
          <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold">Preview Mode</p>
                  <p className="text-sm text-indigo-100">You're browsing as a guest. Login to purchase items and access your cart.</p>
                </div>
              </div>
              <a 
                href="/login" 
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors whitespace-nowrap"
              >
                Login Now
              </a>
            </div>
          </div>
        )}

        {/* Marketing/Ads Section - Blank for now */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Large promotional card */}
            <div className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white min-h-[200px] flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Welcome to Fabriqly</h2>
                <p className="text-blue-100">Discover amazing designs and custom products</p>
              </div>
            </div>

            {/* Smaller promotional cards */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white min-h-[90px] flex items-center justify-center">
                <div className="text-center">
                  <h3 className="font-semibold">Custom Designs</h3>
                  <p className="text-green-100 text-sm">Made just for you</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white min-h-[90px] flex items-center justify-center">
                <div className="text-center">
                  <h3 className="font-semibold">Fast Delivery</h3>
                  <p className="text-orange-100 text-sm">Quick turnaround</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-600 mt-2">Discover our most popular items</p>
            </div>
            {!loading && products.length > 0 && (
              <button className="text-indigo-600 hover:text-indigo-500 font-medium">
                View All →
              </button>
            )}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              // Loading cards
              Array.from({ length: 8 }).map((_, index) => (
                <LoadingCard key={index} />
              ))
            ) : products.length > 0 ? (
              // Actual products
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="customer"
                  showActions={false}
                />
              ))
            ) : (
              // No products message
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
                <p className="text-gray-500">Check back later for new featured products.</p>
              </div>
            )}
          </div>
        </section>

        {/* Additional Sections - Placeholder for future content */}
        <section className="mt-16">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">More Coming Soon</h3>
            <p className="text-gray-600">We're working on bringing you more amazing features and products.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
