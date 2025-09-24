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
  Loader2
} from 'lucide-react';

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
  searchResult: ProductSearchResult | null;
  showFilters: boolean;
  viewMode: 'grid' | 'list';
  filters: ProductFilters;
  searchInput: string;
}

type ProductListAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: ProductWithDetails[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_SEARCH_RESULT'; payload: ProductSearchResult | null }
  | { type: 'SET_FILTERS'; payload: Partial<ProductFilters> }
  | { type: 'SET_SEARCH_INPUT'; payload: string }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'CLEAR_FILTERS' };

const initialState: ProductListState = {
  products: [],
  categories: [],
  loading: true,
  error: null,
  searchResult: null,
  showFilters: false,
  viewMode: 'grid',
  filters: {
    search: '',
    categoryId: '',
    status: undefined,
    isCustomizable: undefined,
    isDigital: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 20,
    offset: 0
  },
  searchInput: ''
};

function productListReducer(state: ProductListState, action: ProductListAction): ProductListState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_SEARCH_RESULT':
      return { ...state, searchResult: action.payload };
    case 'SET_FILTERS':
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload, offset: 0 } // Reset pagination when filters change
      };
    case 'SET_SEARCH_INPUT':
      return { ...state, searchInput: action.payload };
    case 'TOGGLE_FILTERS':
      return { ...state, showFilters: !state.showFilters };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          search: '',
          categoryId: '',
          isCustomizable: undefined,
          isDigital: undefined,
          minPrice: undefined,
          maxPrice: undefined,
      offset: 0
        },
        searchInput: ''
      };
    default:
      return state;
  }
}

// Break down the component into smaller, focused components
const SearchAndFilters = ({ 
  state, 
  dispatch, 
  onSearchChange, 
  onFilterChange, 
  onClearFilters 
}: any) => (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
            value={state.searchInput}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_INPUT', payload: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            variant="outline"
        onClick={() => dispatch({ type: 'TOGGLE_FILTERS' })}
        className={state.showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
        {hasActiveFilters(state.filters) && (
          <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            Active
          </span>
        )}
          </Button>

          <div className="flex items-center space-x-2">
            <Button
          variant={state.viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
          variant={state.viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

    {state.showFilters && (
      <div className="space-y-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Filter Products</h3>
          {hasActiveFilters(state.filters) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
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
              value={state.filters.categoryId}
              onChange={(e) => onFilterChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
              {state.categories.map((category: Category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
              value={state.filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
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
              value={state.filters.minPrice || ''}
              onChange={(e) => onFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
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
              value={state.filters.maxPrice || ''}
              onChange={(e) => onFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="999.99"
              />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={state.filters.isCustomizable === true}
              onChange={(e) => onFilterChange('isCustomizable', e.target.checked ? true : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Customizable Only
            </span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={state.filters.isDigital === true}
              onChange={(e) => onFilterChange('isDigital', e.target.checked ? true : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Digital Only
            </span>
          </label>
            </div>
          </div>
        )}
      </div>
);

const ProductGrid = ({ products, viewMode, onEditProduct, onDeleteProduct }: any) => (
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
        showActions={true}
        variant="management"
      />
    ))}
        </div>
);

const EmptyState = ({ hasActiveFilters, onClearFilters, onCreateProduct }: any) => (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Grid className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
      {hasActiveFilters ? 
              'Try adjusting your search criteria' : 
              'Get started by adding your first product'
            }
          </p>
    <div className="space-x-4">
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
      {!hasActiveFilters && (
        <Button onClick={onCreateProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          )}
        </div>
  </div>
);

const ErrorState = ({ error, onRetry, onCreateProduct }: any) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Products</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <div className="space-x-4">
        <Button onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button variant="outline" onClick={onCreateProduct}>
          <Plus className="w-4 h-4 mr-2" />
          Create Product
        </Button>
      </div>
    </div>
  </div>
);

// Helper function to check if filters are active
const hasActiveFilters = (filters: ProductFilters) => {
  return filters.search || filters.categoryId || 
    filters.isCustomizable !== undefined || filters.isDigital !== undefined ||
    filters.minPrice !== undefined || filters.maxPrice !== undefined;
};

export function ProductList({ businessOwnerId, showCreateButton = true }: ProductListProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(productListReducer, initialState);

  // Debounced search to improve performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.searchInput !== state.filters.search) {
        dispatch({ type: 'SET_FILTERS', payload: { search: state.searchInput } });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [state.searchInput, state.filters.search]);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [state.filters, businessOwnerId]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      dispatch({ type: 'SET_CATEGORIES', payload: data.categories || [] });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const queryParams = new URLSearchParams();
      
      if (businessOwnerId) queryParams.append('businessOwnerId', businessOwnerId);
      if (state.filters.search) queryParams.append('search', state.filters.search);
      if (state.filters.categoryId) queryParams.append('categoryId', state.filters.categoryId);
      if (state.filters.status) queryParams.append('status', state.filters.status);
      if (state.filters.isCustomizable !== undefined) queryParams.append('isCustomizable', state.filters.isCustomizable.toString());
      if (state.filters.isDigital !== undefined) queryParams.append('isDigital', state.filters.isDigital.toString());
      if (state.filters.minPrice !== undefined) queryParams.append('minPrice', state.filters.minPrice.toString());
      if (state.filters.maxPrice !== undefined) queryParams.append('maxPrice', state.filters.maxPrice.toString());
      if (state.filters.sortBy) queryParams.append('sortBy', state.filters.sortBy);
      if (state.filters.sortOrder) queryParams.append('sortOrder', state.filters.sortOrder);
      if (state.filters.limit) queryParams.append('limit', state.filters.limit.toString());
      if (state.filters.offset) queryParams.append('offset', state.filters.offset.toString());

      console.log('Loading products with params:', queryParams.toString());

      const response = await fetch(`/api/products?${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load products');
      }
      
      console.log('Products loaded:', data.products?.length || 0);
      
      dispatch({ type: 'SET_PRODUCTS', payload: data.products || [] });
      dispatch({ type: 'SET_SEARCH_RESULT', payload: data });
    } catch (error: any) {
      console.error('Error loading products:', error);
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
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  }, [state.products]);

  const handleRefresh = useCallback(() => {
    loadProducts();
  }, [loadProducts]);

  const handleExport = useCallback(() => {
    // TODO: Implement CSV export
    console.log('Export functionality to be implemented');
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

  // Memoized computed values
  const hasActiveFiltersValue = useMemo(() => hasActiveFilters(state.filters), [state.filters]);

  // Error state
  if (state.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
        </div>

        <ErrorState 
          error={state.error}
          onRetry={handleRefresh}
          onCreateProduct={handleCreateProduct}
        />
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
            Manage your product catalog
            {state.searchResult && ` (${state.searchResult.total} total)`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={state.loading}
          >
            <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          {showCreateButton && (
            <Button onClick={handleCreateProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <SearchAndFilters 
        state={state}
        dispatch={dispatch}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Products Grid/List */}
      {state.loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      ) : state.products.length === 0 ? (
        <EmptyState 
          hasActiveFilters={hasActiveFiltersValue}
          onClearFilters={handleClearFilters}
          onCreateProduct={handleCreateProduct}
        />
      ) : (
        <ProductGrid 
          products={state.products}
          viewMode={state.viewMode}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {/* Load More */}
      {state.searchResult && state.searchResult.hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={state.loading}
          >
            Load More Products
          </Button>
        </div>
      )}
    </div>
  );
}