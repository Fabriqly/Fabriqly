'use client';

import React, { useState, useEffect } from 'react';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ProductWithDetails, 
  ProductFilters, 
  ProductSearchResult,
  Category 
} from '@/types/products';
import { 
  Search, 
  Filter, 
  Grid, 
  List,
  SlidersHorizontal,
  X
} from 'lucide-react';

export function ProductCatalog() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResult, setSearchResult] = useState<ProductSearchResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    categoryId: '',
    status: 'active', // Only show active products to customers
    isCustomizable: undefined,
    isDigital: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 20,
    offset: 0
  });

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.isCustomizable !== undefined) queryParams.append('isCustomizable', filters.isCustomizable.toString());
      if (filters.isDigital !== undefined) queryParams.append('isDigital', filters.isDigital.toString());
      if (filters.minPrice !== undefined) queryParams.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) queryParams.append('maxPrice', filters.maxPrice.toString());
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const response = await fetch(`/api/products?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        // Handle the new standardized response structure
        if (data.success && data.data) {
          // New ResponseBuilder format: { success: true, data: { products: [...], total: ..., hasMore: ..., filters: {...} } }
          setProducts(data.data.products || []);
          setSearchResult(data.data);
        } else if (data.products) {
          // Legacy format: { products: [...] }
          setProducts(data.products || []);
          setSearchResult(data);
        } else if (Array.isArray(data)) {
          // Direct array response
          setProducts(data);
          setSearchResult({ products: data, total: data.length, hasMore: false, filters: {} });
        } else {
          setProducts([]);
          setSearchResult({ products: [], total: 0, hasMore: false, filters: {} });
        }
      } else {
        console.error('Error loading products:', data.error?.message || data.error);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      offset: 0
    }));
  };

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0
    }));
  };

  const clearFilters = () => {
    setFilters(prev => ({
      ...prev,
      search: '',
      categoryId: '',
      isCustomizable: undefined,
      isDigital: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      offset: 0
    }));
  };

  const hasActiveFilters = filters.search || filters.categoryId || 
    filters.isCustomizable !== undefined || filters.isDigital !== undefined ||
    filters.minPrice !== undefined || filters.maxPrice !== undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Catalog</h1>
          <p className="text-gray-600">
            Discover amazing products from talented designers
            {searchResult && ` (${searchResult.total} products)`}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== 'active' && v !== 'createdAt' && v !== 'desc' && v !== 20 && v !== 0).length}
                </span>
              )}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Filter Products</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type
                  </label>
                  <select
                    value={filters.isCustomizable === undefined ? '' : filters.isCustomizable ? 'customizable' : 'standard'}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : e.target.value === 'customizable';
                      handleFilterChange('isCustomizable', value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="customizable">Customizable</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="999.99"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.isDigital === true}
                    onChange={(e) => handleFilterChange('isDigital', e.target.checked ? true : undefined)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Digital Products Only
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${products.length} products found`}
          </div>

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Grid className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters ? 
                'Try adjusting your search criteria or clear filters' : 
                'No products are available at the moment'
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="catalog"
                showActions={false}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {searchResult && searchResult.hasMore && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              onClick={() => handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 20))}
              disabled={loading}
            >
              Load More Products
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

