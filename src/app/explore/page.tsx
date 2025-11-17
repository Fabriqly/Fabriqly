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
  const [merchandiseProducts, setMerchandiseProducts] = useState<ProductWithDetails[]>([]);
  const [graphicsProducts, setGraphicsProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchandiseLoading, setMerchandiseLoading] = useState(true);
  const [graphicsLoading, setGraphicsLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
    loadMerchandiseProducts();
    loadGraphicsServices();
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

  const loadMerchandiseProducts = async () => {
    try {
      setMerchandiseLoading(true);
      const response = await fetch('/api/products?tags=merchandise&status=active&limit=4');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMerchandiseProducts(data.data.products || []);
      } else {
        console.error('Error loading merchandise products:', data.error);
      }
    } catch (error) {
      console.error('Error loading merchandise products:', error);
    } finally {
      setMerchandiseLoading(false);
    }
  };

  const loadGraphicsServices = async () => {
    try {
      setGraphicsLoading(true);
      const response = await fetch('/api/products?tags=design&status=active&limit=4');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGraphicsProducts(data.data.products || []);
      } else {
        console.error('Error loading graphics services:', data.error);
      }
    } catch (error) {
      console.error('Error loading graphics services:', error);
    } finally {
      setGraphicsLoading(false);
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

        {/* Marketing/Ads Section */}
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
              <a 
                href="/explore/merchandise" 
                className="block bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white min-h-[90px] flex items-center justify-center hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="text-center">
                  <h3 className="font-semibold">Merchandise</h3>
                  <p className="text-green-100 text-sm">Official branded products</p>
                </div>
              </a>
              <a 
                href="/graphics-services" 
                className="block bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white min-h-[90px] flex items-center justify-center hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="text-center">
                  <h3 className="font-semibold">Graphics Services</h3>
                  <p className="text-purple-100 text-sm">Professional design work</p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Join as Designer or Shop - Only show for customers */}
        {user && user.role === 'customer' && (
          <section className="mb-12">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-8 border border-indigo-100">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Join Our Community</h2>
                <p className="text-gray-600 mt-2">Become a designer or open your shop on Fabriqly</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Become a Designer Card */}
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-100 rounded-full p-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <h3 className="ml-3 text-xl font-semibold text-gray-900">Become a Designer</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Showcase your creative work, offer design services, and connect with clients looking for custom designs.
                  </p>
                  <ul className="text-sm text-gray-600 mb-6 space-y-2">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Upload and sell your designs
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Work on custom projects
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Build your portfolio
                    </li>
                  </ul>
                  <a
                    href="/apply/designer"
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Apply as Designer
                  </a>
                </div>

                {/* Become a Shop Owner Card */}
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="ml-3 text-xl font-semibold text-gray-900">Become a Shop Owner</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Start selling products, manage inventory, and fulfill orders from customers across the platform.
                  </p>
                  <ul className="text-sm text-gray-600 mb-6 space-y-2">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      List and sell products
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Manage orders and inventory
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Access business analytics
                    </li>
                  </ul>
                  <a
                    href="/apply/shop"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Apply as Shop Owner
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Approved Application Notice */}
        {user && (user.role === 'designer' || user.role === 'business_owner') && (
          <section className="mb-12">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    🎉 Congratulations! Your Application Has Been Approved
                  </h3>
                  <p className="text-green-800 mb-4">
                    Your {user.role === 'designer' ? 'designer' : 'shop owner'} application has been approved! 
                    You can now access your dashboard and start {user.role === 'designer' ? 'uploading designs' : 'managing your shop'}.
                  </p>
                  <a
                    href="/dashboard"
                    className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Go to Dashboard
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Pending Application Notice */}
        {user && (user.role === 'pending_designer' || user.role === 'pending_shop') && (
          <section className="mb-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    Application Under Review
                  </h3>
                  <p className="text-yellow-800 mb-4">
                    Your {user.role === 'pending_designer' ? 'designer' : 'shop'} application is currently being reviewed by our team. 
                    We'll notify you once a decision has been made.
                  </p>
                  <a
                    href="/my-applications"
                    className="inline-flex items-center text-yellow-900 font-medium hover:text-yellow-700"
                  >
                    View Application Status
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

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

        {/* Merchandise Section */}
        {merchandiseProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-teal-600 p-2 rounded-lg">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Official Merchandise</h2>
                  <p className="text-gray-600 mt-1">Exclusive branded products and merchandise</p>
                </div>
              </div>
              <a 
                href="/explore/merchandise" 
                className="text-green-600 hover:text-green-500 font-medium transition-colors"
              >
                View All →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {merchandiseLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <LoadingCard key={index} />
                ))
              ) : (
                merchandiseProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="customer"
                    showActions={false}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {/* Graphics Services Section */}
        {graphicsProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-lg">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Graphics & Design Services</h2>
                  <p className="text-gray-600 mt-1">Professional design work for your creative needs</p>
                </div>
              </div>
              <a 
                href="/graphics-services" 
                className="text-purple-600 hover:text-purple-500 font-medium transition-colors"
              >
                View All →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {graphicsLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <LoadingCard key={index} />
                ))
              ) : (
                graphicsProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="customer"
                    showActions={false}
                  />
                ))
              )}
            </div>
          </section>
        )}

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
