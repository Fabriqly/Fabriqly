'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ProductWithDetails } from '@/types/products';
import { LoadingCard } from '@/components/ui/LoadingCard';
import { ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface TopProductsProps {
  className?: string;
}

interface ProductWithSales extends ProductWithDetails {
  sales?: number; // Mock sales count
}

export function TopProducts({ className }: TopProductsProps) {
  const [products, setProducts] = useState<ProductWithSales[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const loadTopProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?status=active&limit=100');
        const data = await response.json();

        if (response.ok && data.success) {
          const allProducts: ProductWithSales[] = (data.data?.products || []).map((product: ProductWithDetails) => ({
            ...product,
            // Mock sales count - using a combination of factors for variety
            sales: Math.floor(Math.random() * 1000) + (product.stockQuantity || 0) % 100
          }));

          // Sort by sales (descending) and take top 20
          const topProducts = allProducts
            .sort((a, b) => (b.sales || 0) - (a.sales || 0))
            .slice(0, 20);

          setProducts(topProducts);
        }
      } catch (error) {
        console.error('Error loading top products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopProducts();
  }, []);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      // Use window width to determine card width (mobile: 160px, desktop: 192px)
      const isMobile = window.innerWidth < 640;
      const cardWidth = isMobile ? 160 : 192;
      const gap = isMobile ? 16 : 24;
      scrollContainerRef.current.scrollBy({
        left: -(cardWidth + gap) * 2, // Scroll 2 cards at a time
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      // Use window width to determine card width (mobile: 160px, desktop: 192px)
      const isMobile = window.innerWidth < 640;
      const cardWidth = isMobile ? 160 : 192;
      const gap = isMobile ? 16 : 24;
      scrollContainerRef.current.scrollBy({
        left: (cardWidth + gap) * 2, // Scroll 2 cards at a time
        behavior: 'smooth'
      });
    }
  };

  // Update scroll position on scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    
    // Check on resize
    const handleResize = () => {
      checkScrollPosition();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', handleResize);
    };
  }, [products, loading]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getPrimaryImage = (product: ProductWithDetails) => {
    if (!product.images || product.images.length === 0) return null;
    const primaryImg = product.images.find((img: any) => img.isPrimary);
    return primaryImg || product.images[0];
  };

  return (
    <section className={clsx('mt-8 sm:mt-16', className)}>
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Top Products</h2>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Our best-selling items this month</p>
        </div>
      </div>

      {/* Carousel Container with Arrows */}
      <div className="relative">
        {/* Left Arrow */}
        {!loading && products.length > 0 && canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-50 border border-gray-200"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Right Arrow */}
        {!loading && products.length > 0 && canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-50 border border-gray-200"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Horizontal Scroll Container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 sm:gap-6 pb-4 -mx-4 px-4 scroll-smooth"
        >
        {loading ? (
          // Loading cards
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-[160px] sm:w-48 snap-center">
              <LoadingCard />
            </div>
          ))
        ) : products.length > 0 ? (
          // Product cards
          products.map((product) => {
            const primaryImage = getPrimaryImage(product);
            const imageUrl = primaryImage?.imageUrl || null;

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex-shrink-0 w-[160px] sm:w-48 snap-center group"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem(`product_${product.id}_referrer`, 'explore');
                    sessionStorage.setItem(`product_${product.id}_referrerLabel`, 'Explore');
                    sessionStorage.setItem(`product_${product.id}_referrerPath`, '/explore');
                  }
                }}
              >
                <div className="bg-white rounded-lg shadow-md sm:hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={primaryImage?.altText || product.name}
                        className="w-full h-full object-cover sm:group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 sm:group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-auto">
                      <p className="text-lg font-bold text-indigo-600">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          // No products message
          <div className="w-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <ImageIcon className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
            <p className="text-gray-500">Check back later for top products.</p>
          </div>
        )}
        </div>
      </div>

      {/* Custom scrollbar hide styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </section>
  );
}

