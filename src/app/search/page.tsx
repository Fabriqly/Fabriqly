'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Dialog } from '@headlessui/react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { ProductCard } from '@/components/products/ProductCard';
import { DesignCard } from '@/components/designer/DesignCard';
import { SearchFilters, SearchCategory } from '@/components/search/SearchFilters';
import { useAuth } from '@/hooks/useAuth';
import { ProductWithDetails } from '@/types/products';
import { DesignWithDetails } from '@/types/enhanced-products';
import { ShopProfile } from '@/types/shop-profile';
import { Search, Filter, X, ChevronDown, Package, Star, MapPin } from 'lucide-react';
import Link from 'next/link';

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'newest';

interface SearchResultItem {
  type: 'product' | 'design' | 'shop';
  id: string;
  product?: ProductWithDetails;
  design?: DesignWithDetails;
  shop?: ShopProfile;
  sortValue: number; // For sorting
}

export default function SearchPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || searchParams.get('query') || '';
  
  const [category, setCategory] = useState<SearchCategory>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [designs, setDesigns] = useState<DesignWithDetails[]>([]);
  const [shops, setShops] = useState<ShopProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    } else {
      setHasSearched(false);
      setProducts([]);
      setDesigns([]);
      setShops([]);
    }
  }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      await Promise.all([
        searchProducts(),
        searchDesigns(),
        searchShops()
      ]);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&status=active&limit=50`);
      const data = await response.json();
      
      if (data.success && data.data?.products) {
        const formattedProducts = data.data.products.map((product: any) => {
          if (!product.images || product.images.length === 0) {
            if (product.primaryImageUrl) {
              product.images = [{
                imageUrl: product.primaryImageUrl,
                isPrimary: true,
                altText: product.name
              }];
            } else if (product.imageUrl) {
              product.images = [{
                imageUrl: product.imageUrl,
                isPrimary: true,
                altText: product.name
              }];
            } else {
              product.images = [];
            }
          } else {
            product.images = product.images.map((img: any) => ({
              ...img,
              imageUrl: img.imageUrl || img.url,
              isPrimary: img.isPrimary !== undefined ? img.isPrimary : false,
              altText: img.altText || product.name
            }));
          }
          return product;
        });
        
        setProducts(formattedProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    }
  };

  const searchDesigns = async () => {
    try {
      const response = await fetch(`/api/designs?search=${encodeURIComponent(query)}&isPublic=true&isActive=true&limit=50`);
      const data = await response.json();
      
      if (data.success || data.designs) {
        setDesigns(data.designs || data.data?.designs || []);
      } else {
        setDesigns([]);
      }
    } catch (error) {
      console.error('Error searching designs:', error);
      setDesigns([]);
    }
  };

  const searchShops = async () => {
    try {
      const response = await fetch(`/api/shop-profiles/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setShops(data.data);
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error('Error searching shops:', error);
      setShops([]);
    }
  };

  // Combine and filter results
  const getFilteredAndSortedResults = (): SearchResultItem[] => {
    let items: SearchResultItem[] = [];

    // Add products
    if (category === 'all' || category === 'products') {
      products.forEach(product => {
        const price = product.basePrice || 0;
        // Apply price filter
        if (minPrice && price < parseFloat(minPrice)) return;
        if (maxPrice && price > parseFloat(maxPrice)) return;
        
        items.push({
          type: 'product',
          id: product.id,
          product,
          sortValue: 0 // Will be calculated during sort
        });
      });
    }

    // Add designs
    if (category === 'all' || category === 'designs') {
      designs.forEach(design => {
        const price = design.price || 0;
        // Apply price filter
        if (minPrice && price < parseFloat(minPrice)) return;
        if (maxPrice && price > parseFloat(maxPrice)) return;
        
        items.push({
          type: 'design',
          id: design.id,
          design,
          sortValue: 0 // Will be calculated during sort
        });
      });
    }

    // Add shops
    if (category === 'all' || category === 'shops') {
      shops.forEach(shop => {
        items.push({
          type: 'shop',
          id: shop.id || '',
          shop,
          sortValue: 0 // Will be calculated during sort
        });
      });
    }

    // Calculate sort values and sort items
    items = items.map(item => ({
      ...item,
      sortValue: getSortValue(item)
    }));

    items.sort((a, b) => {
      if (sortBy === 'price-low') {
        // Shops (no price) should go to the end
        if (a.type === 'shop' && b.type !== 'shop') return 1;
        if (a.type !== 'shop' && b.type === 'shop') return -1;
        if (a.type === 'shop' && b.type === 'shop') return 0;
        return a.sortValue - b.sortValue;
      } else if (sortBy === 'price-high') {
        // Shops (no price) should go to the end
        if (a.type === 'shop' && b.type !== 'shop') return 1;
        if (a.type !== 'shop' && b.type === 'shop') return -1;
        if (a.type === 'shop' && b.type === 'shop') return 0;
        return b.sortValue - a.sortValue;
      } else if (sortBy === 'newest') {
        return b.sortValue - a.sortValue;
      }
      // relevance - keep original order (products, then designs, then shops)
      const order = { product: 0, design: 1, shop: 2 };
      return order[a.type] - order[b.type];
    });

    return items;
  };

  const getSortValue = (item: SearchResultItem): number => {
    if (sortBy === 'price-low' || sortBy === 'price-high') {
      if (item.type === 'product' && item.product) {
        return item.product.basePrice || 0;
      }
      if (item.type === 'design' && item.design) {
        return item.design.price || 0;
      }
      // Shops don't have price - return a very high number so they sort to the end
      return Number.MAX_SAFE_INTEGER;
    }
    if (sortBy === 'newest') {
      let date: Date | null = null;
      if (item.type === 'product' && item.product) {
        date = item.product.createdAt ? new Date(item.product.createdAt) : null;
      } else if (item.type === 'design' && item.design) {
        date = item.design.createdAt ? new Date(item.design.createdAt) : null;
      } else if (item.type === 'shop' && item.shop) {
        date = item.shop.createdAt ? new Date(item.shop.createdAt) : null;
      }
      return date ? date.getTime() : 0;
    }
    return 0;
  };

  const results = getFilteredAndSortedResults();
  const resultCount = results.length;

  const hasActiveFilters = category !== 'all' || minPrice !== '' || maxPrice !== '';

  const handleClearFilters = () => {
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
  };

  const handlePriceChange = (min: string, max: string) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const renderResultCard = (item: SearchResultItem) => {
    if (item.type === 'product' && item.product) {
      return (
        <ProductCard
          key={item.id}
          product={item.product}
          variant="customer"
          showActions={false}
        />
      );
    }

    if (item.type === 'design' && item.design) {
      return (
        <DesignCard
          key={item.id}
          design={item.design}
          variant="catalog"
          showActions={false}
        />
      );
    }

    if (item.type === 'shop' && item.shop) {
      return <ShopCard key={item.id} shop={item.shop} />;
    }

    return null;
  };

  const renderEmptyState = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Search className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {query 
            ? `We couldn't find any results matching "${query}". Try different keywords or adjust your filters.`
            : 'Enter a search term in the header to find products, designs, and shops.'}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <CustomerHeader user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasSearched ? (
          renderEmptyState()
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Desktop Only */}
            <aside className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-20">
                <SearchFilters
                  category={category}
                  onCategoryChange={setCategory}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onPriceChange={handlePriceChange}
                  onClearFilters={handleClearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </aside>

            {/* Main Feed */}
            <div className="flex-1">
              {/* Header */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-900">{resultCount}</span> result{resultCount !== 1 ? 's' : ''} for <span className="font-semibold text-gray-900">'{query}'</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setMobileFilterOpen(true)}
                    className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 font-medium hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4" />
                    Filter & Sort
                  </button>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all [&::-webkit-appearance]:none [&::-moz-appearance]:none"
                      style={{
                        backgroundImage: 'none'
                      }}
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="newest">Newest</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Results Grid */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse h-[420px]">
                      <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : resultCount === 0 ? (
                renderEmptyState()
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {results.map(renderResultCard)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Filter Drawer */}
        <Dialog open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <Dialog.Panel className="w-screen max-w-md transform transition-transform">
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Filter & Sort</h2>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Sort By</h3>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 [&::-webkit-appearance]:none [&::-moz-appearance]:none"
                      style={{
                        backgroundImage: 'none'
                      }}
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="newest">Newest</option>
                    </select>
                  </div>

                  <SearchFilters
                    category={category}
                    onCategoryChange={setCategory}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onPriceChange={handlePriceChange}
                    onClearFilters={handleClearFilters}
                    hasActiveFilters={hasActiveFilters}
                  />
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </main>
      
      <ScrollToTop />
    </div>
  );
}

// Shop Card Component (extracted from ShopList for unified grid)
function ShopCard({ shop }: { shop: ShopProfile }) {
  const [reviewStats, setReviewStats] = useState({
    averageRating: shop.ratings?.averageRating || 0,
    totalReviews: shop.ratings?.totalReviews || 0
  });

  useEffect(() => {
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col min-h-[420px]">
        {/* Banner/Thumbnail */}
        <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 overflow-hidden rounded-t-xl relative">
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
        
        {/* Logo Overlay */}
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
          <div className="mb-2">
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

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed flex-1">
            {shop.description || 'No description available.'}
          </p>

          {/* Stats Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              <span>{shop.shopStats?.totalProducts || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>{reviewStats.averageRating.toFixed(1)}</span>
            </div>
            {shop.location?.city && (
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[60px]">{shop.location.city}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
