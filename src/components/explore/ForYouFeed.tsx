'use client';

import { useEffect, useState, useRef } from 'react';
import { ProductWithDetails } from '@/types/products';
import { DesignWithDetails } from '@/types/enhanced-products';
import { LoadingCard } from '@/components/ui/LoadingCard';
import { ProductCard } from '@/components/products/ProductCard';
import { DesignCard } from '@/components/designer/DesignCard';
import { ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ForYouFeedProps {
  className?: string;
}

type FeedItem = 
  | { type: 'product'; data: ProductWithDetails }
  | { type: 'design'; data: DesignWithDetails };

export function ForYouFeed({ className }: ForYouFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(25); // Initial: 5 rows * 5 columns (lg breakpoint)
  const shuffledItemsRef = useRef<FeedItem[]>([]);

  useEffect(() => {
    const loadAllItems = async () => {
      try {
        setLoading(true);

        // Fetch products and designs in parallel
        const [productsResponse, designsResponse] = await Promise.all([
          fetch('/api/products?status=active&limit=200'),
          fetch('/api/designs?isPublic=true&isActive=true&limit=200')
        ]);

        const [productsData, designsData] = await Promise.all([
          productsResponse.json(),
          designsResponse.json()
        ]);

        const allItems: FeedItem[] = [];

        // Add products
        if (productsResponse.ok && productsData.success) {
          const products: ProductWithDetails[] = productsData.data?.products || [];
          products.forEach((product) => {
            allItems.push({ type: 'product', data: product });
          });
        }

        // Add designs
        if (designsResponse.ok && (designsData.designs || designsData.success)) {
          const designs: DesignWithDetails[] = designsData.designs || designsData.data?.designs || [];
          designs.forEach((design) => {
            allItems.push({ type: 'design', data: design });
          });
        }

        // Shuffle array using Fisher-Yates algorithm (stable shuffle)
        const shuffled = [...allItems];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        shuffledItemsRef.current = shuffled;
        setItems(shuffled);
      } catch (error) {
        console.error('Error loading feed items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllItems();
  }, []);

  const handleShowMore = () => {
    // Show 3 more rows worth of items
    // Assuming responsive grid: 2 cols (mobile) -> 4 cols (md) -> 5 cols (lg)
    // Default to 15 items (3 rows * 5 cols for lg breakpoint)
    setVisibleCount((prev) => prev + 15);
  };

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <section className={clsx('mt-8 sm:mt-16', className)}>
      <div className="mb-4 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">For You</h2>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Personalized recommendations just for you</p>
      </div>

      {/* Responsive Grid - Adjusted for 5 cards per row on lg screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
        {loading ? (
          // Loading cards
          Array.from({ length: 20 }).map((_, index) => (
            <LoadingCard key={index} />
          ))
        ) : visibleItems.length > 0 ? (
          // Feed items
          visibleItems.map((item) => {
            if (item.type === 'product') {
              const product = item.data;
              return (
                <ProductCard
                  key={`product-${product.id}`}
                  product={product}
                  variant="customer"
                  showActions={false}
                />
              );
            } else {
              // Design item
              const design = item.data;
              return (
                <DesignCard
                  key={`design-${design.id}`}
                  design={design}
                  variant="catalog"
                  showActions={false}
                />
              );
            }
          })
        ) : (
          // No items message
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <ImageIcon className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Available</h3>
            <p className="text-gray-500">Check back later for personalized recommendations.</p>
          </div>
        )}
      </div>

      {/* Show More Button */}
      {!loading && hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={handleShowMore}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
          >
            Show More Products
          </button>
        </div>
      )}
    </section>
  );
}

