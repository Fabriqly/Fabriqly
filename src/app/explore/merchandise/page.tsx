'use client';

import { useEffect, useState } from 'react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ProductCard } from '@/components/products/ProductCard';
import { LoadingCard } from '@/components/ui/LoadingCard';
import { useAuth } from '@/hooks/useAuth';
import { ProductWithDetails } from '@/types/products';
import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MerchandisePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMerchandiseProducts();
  }, []);

  const loadMerchandiseProducts = async () => {
    try {
      setLoading(true);
      // Filter products by the "merchandise" tag
      const response = await fetch('/api/products?tags=merchandise&status=active&limit=100');
      const data = await response.json();
      
      if (response.ok && data.success) {
        // The API returns { success: true, data: { products: [...] } }
        const products = data.data.products || [];
        setProducts(products);
      } else {
        console.error('Error loading merchandise products:', data.error);
      }
    } catch (error) {
      console.error('Error loading merchandise products:', error);
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
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href="/explore"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explore
          </Link>
        </div>

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

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-lg shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Merchandise</h1>
              <p className="text-gray-600 mt-1">Browse our exclusive collection of branded merchandise</p>
            </div>
          </div>
        </div>

        {/* Products Count */}
        {!loading && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              {products.length === 0 ? (
                'No merchandise available'
              ) : products.length === 1 ? (
                '1 product available'
              ) : (
                `${products.length} products available`
              )}
            </p>
          </div>
        )}

        {/* Products Grid */}
        <section>
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
              <div className="col-span-full">
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Merchandise Available</h3>
                  <p className="text-gray-500 mb-6">
                    We're currently working on bringing you amazing merchandise products. Check back soon!
                  </p>
                  <Link 
                    href="/explore"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Browse All Products
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-8 border border-indigo-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Package className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Products</h3>
                <p className="text-gray-600 text-sm">
                  All merchandise is made with high-quality materials and craftsmanship
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentic Brand</h3>
                <p className="text-gray-600 text-sm">
                  Official Fabriqly merchandise with authentic branding
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Shipping</h3>
                <p className="text-gray-600 text-sm">
                  Quick processing and delivery to your doorstep
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

