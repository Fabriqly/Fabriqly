'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { useAuth } from '@/hooks/useAuth';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { TopProducts } from '@/components/explore/TopProducts';
import { ForYouFeed } from '@/components/explore/ForYouFeed';

export default function ExplorePage() {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToForYou = () => {
    const forYouSection = document.getElementById('for-you-section');
    if (forYouSection) {
      forYouSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance && currentSlide < 2) {
      // Swipe left - next slide
      setCurrentSlide(currentSlide + 1);
    } else if (distance < -minSwipeDistance && currentSlide > 0) {
      // Swipe right - previous slide
      setCurrentSlide(currentSlide - 1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Customer Header */}
      <CustomerHeader user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Guest Banner - Show only if user is not logged in */}
        {!user && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-3 sm:p-4 text-white">
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

        {/* Email Verification Banner */}
        {user && <EmailVerificationBanner />}

        {/* Hero Banner Section */}
        <section className="mb-8 sm:mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Discover Banner - Left Side (Large) - Desktop Only */}
            <button
              onClick={scrollToForYou}
              className="hidden lg:block lg:col-span-2 cursor-pointer w-full"
              type="button"
            >
              <div className="relative w-full h-[170px] sm:h-[255px] lg:h-[340px] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <Image
                  src="/Discover-Banner.png"
                  alt="Discover Fabriqly"
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            </button>

            {/* Right Side - Stacked Banners (Desktop) */}
            <div className="hidden lg:block space-y-4 sm:space-y-6">
              {/* Shop Owner Banner - Top Right */}
              <Link href="/apply/shop" className="block cursor-pointer group">
                <div className="relative rounded-lg overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 group-hover:-translate-y-1">
                  <div className="relative w-full h-[153px] sm:h-[162px] lg:h-[162px]">
                    <Image
                      src="/Shop-owner-apply.png"
                      alt="Expand your business"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      unoptimized
                    />
                  </div>
                </div>
              </Link>

              {/* Designer Banner - Bottom Right */}
              <Link href="/apply/designer" className="block cursor-pointer group">
                <div className="relative rounded-lg overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 group-hover:-translate-y-1">
                  <div className="relative w-full h-[153px] sm:h-[162px] lg:h-[162px]">
                    <Image
                      src="/Designer-apply.png"
                      alt="Become a Designer today"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      unoptimized
                    />
                  </div>
                </div>
              </Link>
            </div>

            {/* Mobile View - Carousel (All 3 Banners) */}
            <div className="lg:hidden relative">
              <div
                ref={carouselRef}
                className="relative overflow-hidden rounded-lg"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {/* Discover Banner - First Slide */}
                  <div className="min-w-full">
                    <button
                      onClick={scrollToForYou}
                      className="block cursor-pointer w-full"
                      type="button"
                    >
                      <div className="relative rounded-lg overflow-hidden shadow-lg">
                        <div className="relative w-full h-[170px] sm:h-[255px]">
                          <Image
                            src="/Discover-Banner.png"
                            alt="Discover Fabriqly"
                            fill
                            className="object-cover"
                            priority
                            unoptimized
                          />
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Shop Owner Banner - Second Slide */}
                  <div className="min-w-full">
                    <Link href="/apply/shop" className="block cursor-pointer">
                      <div className="relative rounded-lg overflow-hidden shadow-lg">
                        <div className="relative w-full h-[170px] sm:h-[255px]">
                          <Image
                            src="/Shop-owner-apply.png"
                            alt="Expand your business"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Designer Banner - Third Slide */}
                  <div className="min-w-full">
                    <Link href="/apply/designer" className="block cursor-pointer">
                      <div className="relative rounded-lg overflow-hidden shadow-lg">
                        <div className="relative w-full h-[170px] sm:h-[255px]">
                          <Image
                            src="/Designer-apply.png"
                            alt="Become a Designer today"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Carousel Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => goToSlide(0)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === 0 ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
                  }`}
                  aria-label="Go to Discover banner"
                />
                <button
                  onClick={() => goToSlide(1)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === 1 ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
                  }`}
                  aria-label="Go to Shop Owner banner"
                />
                <button
                  onClick={() => goToSlide(2)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === 2 ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
                  }`}
                  aria-label="Go to Designer banner"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Approved Application Notice */}
        {user && (user.role === 'designer' || user.role === 'business_owner') && (
          <section className="mb-8 sm:mb-12">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
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
          <section className="mb-8 sm:mb-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
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

        {/* Top Products Section */}
        <TopProducts />

        {/* For You Feed Section */}
        <div id="for-you-section">
          <ForYouFeed />
        </div>
      </main>
      
      <ScrollToTop />
    </div>
  );
}
