'use client';

import { useEffect, useState } from 'react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ProductCard } from '@/components/products/ProductCard';
import { useAuth } from '@/hooks/useAuth';
import { ProductWithDetails } from '@/types/products';
import { Filter, SlidersHorizontal, Search, Check, X, Palette } from 'lucide-react';

export default function GraphicsServicesPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  useEffect(() => {
    loadGraphicsServices();
  }, []);

  const loadGraphicsServices = async () => {
    try {
      setLoading(true);
      // Filter products by the "design" tag
      const response = await fetch('/api/products?tags=design&status=active&limit=100');
      const data = await response.json();
      
      if (response.ok && data.success) {
        const fetchedProducts: ProductWithDetails[] = data.data.products || [];
        
        // Normalize image data for ProductCard (same as merchandise page)
        const formattedProducts = fetchedProducts.map((product: any) => {
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
        
        // Extract unique tags from all products (excluding "design" and "merchandise" tags)
        const allTags = new Set<string>();
        formattedProducts.forEach((product: any) => {
          if (product.tags && Array.isArray(product.tags)) {
            product.tags.forEach((tag: string) => {
              if (tag && tag.trim() && tag.toLowerCase() !== 'design' && tag.toLowerCase() !== 'merchandise') {
                allTags.add(tag.trim());
              }
            });
          }
        });
        setTags(Array.from(allTags).sort());
      } else {
        console.error('Error loading graphics services:', data.error);
      }
    } catch (error) {
      console.error('Error loading graphics services:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      return [...prev, tag];
    });
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setTagSearch('');
  };

  const filteredTags = tags.filter(tag => 
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const filteredProducts = selectedTags.length > 0
    ? products.filter(product => 
        product.tags && Array.isArray(product.tags) && 
        product.tags.some(tag => selectedTags.includes(tag))
      )
    : products;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <CustomerHeader user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Graphics & Design Services</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Professional design services for your creative needs.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button 
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 font-medium hover:bg-gray-50 w-full justify-center"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showMobileFilter ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Sidebar Filter */}
          <aside className={`
            lg:w-64 flex-shrink-0 lg:block
            ${showMobileFilter ? 'block' : 'hidden'}
          `}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                  <Filter className="w-4 h-4" />
                  <h2>Tags</h2>
                </div>
                {selectedTags.length > 0 && (
                  <button 
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    Clear
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Tag Search */}
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              
              <div className="space-y-0.5 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                <button
                  onClick={() => setSelectedTags([])}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ${
                    selectedTags.length === 0
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>All Tags</span>
                  {selectedTags.length === 0 && <Check className="w-3.5 h-3.5" />}
                </button>
                
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">{tag}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    No tags found
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse h-[360px]">
                    <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Palette className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Found</h3>
                <p className="text-gray-500">
                  {selectedTags.length === 0 
                    ? 'No services available at the moment.' 
                    : `No services found with the selected tags.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="customer"
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

