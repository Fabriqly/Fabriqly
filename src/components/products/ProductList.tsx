'use client';

import React, { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ProductWithDetails, 
  ProductFilters, 
  ProductSearchResult,
  Category 
} from '@/types/products';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
  Send,
  Package
} from 'lucide-react';
import { CategorySelector } from './CategorySelector';

interface ProductListProps {
  businessOwnerId?: string;
  showCreateButton?: boolean;
}

// State management with useReducer for better performance
interface ProductListState {
  products: ProductWithDetails[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  searchResult: ProductSearchResult | null;
  viewMode: 'grid' | 'list';
}

type ProductListAction = 
  | { type: 'SET_PRODUCTS'; payload: ProductWithDetails[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<ProductFilters> }
  | { type: 'SET_SEARCH_RESULT'; payload: ProductSearchResult }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'CLEAR_FILTERS' };

const initialState: ProductListState = {
  products: [],
  categories: [],
  loading: false,
  error: null,
  filters: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 20,
    offset: 0
  },
  searchResult: null,
  viewMode: 'grid'
};

function productListReducer(state: ProductListState, action: ProductListAction): ProductListState {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_SEARCH_RESULT':
      return { 
        ...state, 
        products: action.payload.products,
        searchResult: action.payload
      };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          sortBy: 'createdAt',
          sortOrder: 'desc',
          limit: 20,
          offset: 0
        }
      };
    default:
      return state;
  }
}

const SearchAndFilters = ({ 
  filters, 
  categories, 
  onFilterChange, 
  onClearFilters, 
  hasActiveFilters 
}: any) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Category Filter */}
        <div className="min-w-48">
          <CategorySelector
            value={filters.categoryId || ''}
            onChange={(categoryId) => onFilterChange('categoryId', categoryId || undefined)}
            placeholder="All Categories"
          />
        </div>

        {/* Status Filter */}
        <div className="min-w-32">
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Sort */}
        <div className="min-w-32">
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              onFilterChange('sortBy', sortBy);
              onFilterChange('sortOrder', sortOrder);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Clear</span>
          </Button>
        )}
      </div>
    </div>
  </div>
);

const ProductGrid = ({ products, viewMode, onEditProduct, onDeleteProduct, onPublishProduct }: any) => (
  <div className={
    viewMode === 'grid' 
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      : 'space-y-4'
  }>
    {products.map((product: ProductWithDetails) => (
      <ProductCard
        key={product.id}
        product={product}
        onEdit={onEditProduct}
        onDelete={onDeleteProduct}
        onPublish={onPublishProduct}
        showActions={true}
        variant="management"
      />
    ))}
  </div>
);

const EmptyState = ({ hasActiveFilters, onClearFilters, onCreateProduct }: any) => (
  <div className="text-center py-12">
    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {hasActiveFilters ? 'No products match your filters' : 'No products yet'}
    </h3>
    <p className="text-gray-500 mb-6">
      {hasActiveFilters 
        ? 'Try adjusting your search criteria or clear the filters.'
        : 'Get started by creating your first product.'
      }
    </p>
    <div className="flex justify-center space-x-4">
      {hasActiveFilters ? (
        <Button onClick={onClearFilters} variant="outline">
          Clear Filters
        </Button>
      ) : (
        <Button onClick={onCreateProduct} variant="primary" className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Product</span>
        </Button>
      )}
    </div>
  </div>
);

export function ProductList({ businessOwnerId, showCreateButton = true }: ProductListProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(productListReducer, initialState);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load products when filters change
  useEffect(() => {
    loadProducts();
  }, [state.filters, businessOwnerId]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_CATEGORIES', payload: data.categories || [] });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading categories:', error);
      }
    }
  }, []);

  const loadProducts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const params = new URLSearchParams();
      
      // Add business owner filter
      if (businessOwnerId) {
        params.append('businessOwnerId', businessOwnerId);
      }
      
      // Add other filters
      Object.entries(state.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: ProductSearchResult = await response.json();
      dispatch({ type: 'SET_SEARCH_RESULT', payload: data });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading products:', error);
      }
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load products' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.filters, businessOwnerId]);

  const handleFilterChange = useCallback((key: keyof ProductFilters, value: any) => {
    dispatch({ type: 'SET_FILTERS', payload: { [key]: value } });
  }, []);

  const handleEditProduct = useCallback((product: ProductWithDetails) => {
    router.push(`/dashboard/products/edit/${product.id}`);
  }, [router]);

  const handleDeleteProduct = useCallback(async (product: ProductWithDetails) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        dispatch({ type: 'SET_PRODUCTS', payload: state.products.filter(p => p.id !== product.id) });
        // Optionally show success message
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete product');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting product:', error);
      }
      alert('Failed to delete product');
    }
  }, [state.products]);

  const handlePublishProduct = useCallback(async (product: ProductWithDetails) => {
    if (!confirm(`Are you sure you want to publish "${product.name}"? This will make it visible to customers.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${product.id}/publish`, {
        method: 'POST'
      });

      if (response.ok) {
        // Update the product status in the local state
        const updatedProducts = state.products.map(p => 
          p.id === product.id ? { ...p, status: 'active' as const } : p
        );
        dispatch({ type: 'SET_PRODUCTS', payload: updatedProducts });
        
        // Show success message
        alert(`"${product.name}" has been published successfully!`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to publish product');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error publishing product:', error);
      }
      alert('Failed to publish product');
    }
  }, [state.products]);

  const handleRefresh = useCallback(() => {
    loadProducts();
  }, [loadProducts]);

  const handleExport = useCallback(() => {
    // TODO: Implement CSV export
    if (process.env.NODE_ENV === 'development') {
      console.log('Export functionality to be implemented');
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    dispatch({ 
      type: 'SET_FILTERS', 
      payload: { offset: (state.filters.offset || 0) + (state.filters.limit || 20) }
    });
  }, [state.filters.offset, state.filters.limit]);

  const handleClearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const handleCreateProduct = useCallback(() => {
    router.push('/dashboard/products/create');
  }, [router]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(state.filters).some(([key, value]) => {
      if (key === 'sortBy' || key === 'sortOrder' || key === 'limit' || key === 'offset') {
        return false; // These are default filters
      }
      return value !== undefined && value !== null && value !== '';
    });
  }, [state.filters]);

  const draftProductsCount = useMemo(() => {
    return state.products.filter(p => p.status === 'draft').length;
  }, [state.products]);

  if (state.loading && state.products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">
            {state.products.length} products
            {draftProductsCount > 0 && (
              <span className="ml-2 text-orange-600">
                ({draftProductsCount} draft{draftProductsCount !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-md">
            <Button
              variant={state.viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
              className="rounded-r-none border-r-0"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={state.viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={state.loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            
            {showCreateButton && (
              <Button
                onClick={handleCreateProduct}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Product</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        filters={state.filters}
        categories={state.categories}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Error State */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{state.error}</p>
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {state.products.length > 0 ? (
        <ProductGrid
          products={state.products}
          viewMode={state.viewMode}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onPublishProduct={handlePublishProduct}
        />
      ) : (
        <EmptyState
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onCreateProduct={handleCreateProduct}
        />
      )}

      {/* Load More */}
      {state.searchResult?.hasMore && (
        <div className="text-center py-6">
          <Button
            onClick={handleLoadMore}
            disabled={state.loading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {state.loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Load More</span>
          </Button>
        </div>
      )}
    </div>
  );
}