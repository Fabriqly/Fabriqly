'use client';

import React, { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Product, 
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
  Package,
  Image as ImageIcon,
  Tag,
  Edit,
  Trash2,
  Palette,
  Download as DownloadIcon,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { CategorySelector } from './CategorySelector';

interface ProductListProps {
  businessOwnerId?: string;
  showCreateButton?: boolean;
  onRefreshReady?: (refreshFn: () => void) => void;
  onProductCountChange?: (count: number, draftCount: number) => void;
}

// State management with useReducer for better performance
interface ProductListState {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  searchResult: ProductSearchResult | null;
  viewMode: 'grid' | 'list';
  currentPage: number;
  itemsPerPage: number; // For list view only
}

type ProductListAction = 
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<ProductFilters> }
  | { type: 'SET_SEARCH_RESULT'; payload: ProductSearchResult }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'CLEAR_FILTERS' };

// Pagination constants
const GRID_ITEMS_PER_PAGE = 12; // 3 rows × 4 columns
const LIST_ITEMS_PER_PAGE_OPTIONS = [10, 15, 20, 25, 30];
const LIST_DEFAULT_ITEMS_PER_PAGE = 10;

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
  viewMode: 'grid',
  currentPage: 1,
  itemsPerPage: LIST_DEFAULT_ITEMS_PER_PAGE
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
      return { ...state, viewMode: action.payload, currentPage: 1 }; // Reset to page 1 when switching views
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload, currentPage: 1 }; // Reset to page 1 when changing items per page
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          sortBy: 'createdAt',
          sortOrder: 'desc',
          limit: 20,
          offset: 0
        },
        currentPage: 1
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
  <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
    <div className="flex flex-col gap-4">
      {/* Search - Full width on mobile */}
      <div className="w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Filters - Stack on mobile, horizontal on desktop */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        {/* Filter Row - Stack on mobile */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 flex-1">
          {/* Category Filter */}
          <div className="w-full md:min-w-48 md:flex-1">
            <CategorySelector
              value={filters.categoryId || ''}
              onChange={(categoryId) => onFilterChange('categoryId', categoryId || undefined)}
              placeholder="All Categories"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:min-w-32 md:flex-1">
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Sort */}
          <div className="w-full md:min-w-32 md:flex-1">
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                onFilterChange('sortBy', sortBy);
                onFilterChange('sortOrder', sortOrder);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center justify-center space-x-2 w-full md:w-auto"
            >
              <X className="w-4 h-4" />
              <span>Clear Filters</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) => {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Draft' },
    active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
    out_of_stock: { bg: 'bg-red-100', text: 'text-red-800', label: 'Out of Stock' }
  };

  const config = statusConfig[status] || statusConfig.inactive;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`${config.bg} ${config.text} ${sizeClasses} font-semibold rounded-full`}>
      {config.label}
    </span>
  );
};

// Stat Box Component (without icons)
const StatBox = ({ label, value }: { label: string; value: number | string }) => (
  <div className="bg-slate-50 rounded-lg p-1.5 text-center">
    <p className="text-xs font-semibold text-slate-600 mb-0.5">{label}</p>
    <p className="text-xs font-bold text-slate-900">{value}</p>
  </div>
);

// Grid Card Component
const GridCard = ({ product, onEdit, onDelete }: { 
  product: Product & { category?: any; images?: any[] }; 
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}) => {
  const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
  // Use a simple SVG data URI placeholder instead of external service
  const placeholderSvg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="#e5e7eb" width="400" height="400"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">No Image</text></svg>');
  const imageUrl = primaryImage?.imageUrl || `data:image/svg+xml,${placeholderSvg}`;
  const categoryName = product.category?.name || 'Uncategorized';
  const imagesCount = product.images?.length || 0;
  const tagsCount = product.tags?.length || 0;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top: Image & Status */}
      <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback to placeholder SVG if image fails to load
            const placeholderSvg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="#e5e7eb" width="400" height="400"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">No Image</text></svg>');
            e.currentTarget.src = `data:image/svg+xml,${placeholderSvg}`;
          }}
        />
        <div className="absolute top-2 left-2">
          <StatusBadge status={product.status} />
        </div>
      </div>

      {/* Middle: Content */}
      <div className="p-2.5 flex-1 flex flex-col">
        {/* Title & SKU */}
        <div className="mb-2">
          <h3 className="font-bold text-slate-900 text-base mb-0.5 truncate">{product.name}</h3>
          <p className="text-xs text-slate-500 mb-0.5 line-clamp-1">{product.shortDescription || product.description || 'No description'}</p>
          <p className="text-xs text-slate-400 font-mono truncate">SKU: {product.sku || 'N/A'}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          <StatBox label="Stock" value={product.stockQuantity || 0} />
          <StatBox label="Images" value={imagesCount} />
          <StatBox label="Tags" value={tagsCount} />
        </div>

        {/* Price & Category */}
        <div className="mt-auto pt-2 border-t border-slate-100">
          <div className="mb-2">
            <p className="text-xs text-slate-500 mb-0.5">{categoryName}</p>
            <p className="text-lg font-bold text-indigo-600">₱{product.price?.toLocaleString() || '0.00'}</p>
          </div>

          {/* Product Options & Tags - Single Row */}
          <div className="mb-2 flex flex-wrap gap-1">
            {/* Product Options */}
            {product.isCustomizable && (
              <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-medium border border-purple-100 flex items-center gap-0.5">
                <Palette className="w-2.5 h-2.5" />
                <span>Customizable</span>
              </span>
            )}
            {product.isDigital && (
              <span className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded-full text-[10px] font-medium border border-cyan-100 flex items-center gap-0.5">
                <DownloadIcon className="w-2.5 h-2.5" />
                <span>Digital</span>
              </span>
            )}
            
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <>
                {product.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium border border-blue-100"
                  >
                    {tag}
                  </span>
                ))}
                {product.tags.length > 3 && (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                    +{product.tags.length - 3}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product);
                }}
                className="flex items-center justify-center bg-red-100 hover:bg-red-500 text-white w-8 h-8 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// List Card Component
const ListCard = ({ product, onEdit, onDelete }: { 
  product: Product & { category?: any; images?: any[] }; 
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}) => {
  const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
  // Use a simple SVG data URI placeholder instead of external service
  const placeholderSvg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="#e5e7eb" width="400" height="400"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">No Image</text></svg>');
  const imageUrl = primaryImage?.imageUrl || `data:image/svg+xml,${placeholderSvg}`;
  const categoryName = product.category?.name || 'Uncategorized';
  const imagesCount = product.images?.length || 0;
  const tagsCount = product.tags?.length || 0;

  const formatDate = (date: any) => {
    try {
      if (!date) return 'N/A';
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Mobile View - Simplified Layout */}
      <div className="md:hidden p-3 flex items-center gap-3">
        {/* Image */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-base mb-1 truncate">{product.name}</h3>
          <p className="text-blue-600 font-semibold text-base mb-1">₱{product.price?.toLocaleString() || '0.00'}</p>
          <p className="text-xs text-slate-400">Updated: {formatDate(product.updatedAt)}</p>
        </div>

        {/* Status & Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={product.status} size="sm" />
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(product)}
                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(product)}
                className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop View - Full Layout */}
      <div className="hidden md:flex p-3 items-center gap-4">
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute top-1 left-1">
            <StatusBadge status={product.status} size="sm" />
          </div>
        </div>

        {/* Main Details Wrapper */}
        <div className="flex-1 min-w-0 flex flex-row items-center gap-4 w-full">
          {/* Info Section */}
          <div className="w-5/12">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 text-lg truncate">{product.name}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-1 truncate">{product.shortDescription || product.description || 'No description'}</p>
            <p className="text-xs text-slate-400 font-mono truncate mb-1.5">SKU: {product.sku || 'N/A'}</p>
            
            {/* Product Options & Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              {product.isCustomizable && (
                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-medium border border-purple-100 flex items-center gap-0.5">
                  <Palette className="w-2.5 h-2.5" />
                  <span>Customizable</span>
                </span>
              )}
              {product.isDigital && (
                <span className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded-full text-[10px] font-medium border border-cyan-100 flex items-center gap-0.5">
                  <DownloadIcon className="w-2.5 h-2.5" />
                  <span>Digital</span>
                </span>
              )}
              {product.tags && product.tags.length > 0 && (
                <>
                  {product.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium border border-blue-100"
                    >
                      {tag}
                    </span>
                  ))}
                  {product.tags.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                      +{product.tags.length - 3}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="w-auto flex items-center justify-around gap-8">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Price</p>
              <p className="font-bold text-indigo-600">₱{product.price?.toLocaleString() || '0.00'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Stock</p>
              <p className="font-bold text-slate-900">{product.stockQuantity || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Last Upd</p>
              <p className="text-sm text-slate-600">{formatDate(product.updatedAt)}</p>
            </div>
          </div>

          {/* Stats Group - Gray Box */}
          <div className="w-auto">
            <div className="bg-slate-50 rounded-lg p-2 grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Stock</p>
                <p className="text-sm font-bold text-slate-900">{product.stockQuantity || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Images</p>
                <p className="text-sm font-bold text-slate-900">{imagesCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Tags</p>
                <p className="text-sm font-bold text-slate-900">{tagsCount}</p>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex-1 flex items-center justify-center gap-3">
            {onEdit && (
              <button
                onClick={() => onEdit(product)}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(product)}
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loading Card Component
const GridCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-pulse">
    {/* Image Skeleton */}
    <div className="relative h-36 w-full bg-slate-200"></div>

    {/* Content Skeleton */}
    <div className="p-2.5 flex-1 flex flex-col">
      {/* Title & SKU */}
      <div className="mb-2">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-1.5"></div>
        <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <div className="bg-slate-50 rounded-lg p-1.5">
          <div className="h-2.5 bg-slate-200 rounded w-12 mx-auto mb-1"></div>
          <div className="h-3 bg-slate-200 rounded w-8 mx-auto"></div>
        </div>
        <div className="bg-slate-50 rounded-lg p-1.5">
          <div className="h-2.5 bg-slate-200 rounded w-14 mx-auto mb-1"></div>
          <div className="h-3 bg-slate-200 rounded w-6 mx-auto"></div>
        </div>
        <div className="bg-slate-50 rounded-lg p-1.5">
          <div className="h-2.5 bg-slate-200 rounded w-10 mx-auto mb-1"></div>
          <div className="h-3 bg-slate-200 rounded w-6 mx-auto"></div>
        </div>
      </div>

      {/* Price & Buttons */}
      <div className="mt-auto pt-2 border-t border-slate-100">
        <div className="mb-2">
          <div className="h-2.5 bg-slate-200 rounded w-20 mb-1"></div>
          <div className="h-5 bg-slate-200 rounded w-24"></div>
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1 h-8 bg-slate-200 rounded-lg"></div>
          <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
);

const ProductGrid = ({ products, viewMode, onEditProduct, onDeleteProduct, loading }: any) => {
  if (loading && products.length === 0) {
    return (
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
          : 'space-y-4'
      }>
        {Array.from({ length: 8 }).map((_, i) => (
          <GridCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={
      viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
        : 'space-y-4'
    }>
      {products.map((product: Product & { category?: any; images?: any[] }) => (
        viewMode === 'grid' ? (
          <GridCard
            key={product.id}
            product={product}
            onEdit={onEditProduct}
            onDelete={onDeleteProduct}
          />
        ) : (
          <ListCard
            key={product.id}
            product={product}
            onEdit={onEditProduct}
            onDelete={onDeleteProduct}
          />
        )
      ))}
    </div>
  );
};

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
        <Button onClick={onCreateProduct} variant="default" className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Product</span>
        </Button>
      )}
    </div>
  </div>
);

export function ProductList({ businessOwnerId, showCreateButton = true, onRefreshReady, onProductCountChange }: ProductListProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(productListReducer, initialState);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

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
      
      // Add all filters including status
      Object.entries(state.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
      
      // If no status filter is provided, show all products for business owners
      if (!state.filters.status) {
        params.append('status', 'all');
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      
      // Handle the new standardized response structure
      let searchResult: ProductSearchResult;
      if (data.success && data.data) {
        // New ResponseBuilder format: { success: true, data: { products: [...], total: ..., hasMore: ..., filters: {...} } }
        searchResult = data.data;
      } else if (data.products) {
        // Legacy format: { products: [...] }
        searchResult = data;
      } else {
        // Fallback
        searchResult = { products: [], total: 0, hasMore: false, filters: {} };
      }
      
      dispatch({ type: 'SET_SEARCH_RESULT', payload: searchResult });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading products:', error);
      }
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load products' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.filters, businessOwnerId]);

  // Load products when filters change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Expose refresh function to parent component
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(loadProducts);
    }
  }, [onRefreshReady, loadProducts]);

  const handleFilterChange = useCallback((key: keyof ProductFilters, value: any) => {
    dispatch({ type: 'SET_FILTERS', payload: { [key]: value } });
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 }); // Reset to page 1 when filters change
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    router.push(`/dashboard/products/edit/${product.id}`);
  }, [router]);

  const handleDeleteProduct = useCallback(async (product: Product) => {
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

  const handlePublishProduct = useCallback(async (product: Product) => {
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

  // Notify parent of product count changes
  useEffect(() => {
    if (onProductCountChange) {
      onProductCountChange(state.products.length, draftProductsCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.products.length, draftProductsCount]);

  return (
    <div className="space-y-6">
      {/* View Mode Toggle and Items Per Page - Opposite sides */}
      <div className="flex items-center justify-between">
        {/* View Mode Toggle - Left side */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center border border-gray-300 rounded-md">
            <Button
              variant={state.viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
              className="rounded-r-none border-r-0"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={state.viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Items per page selector (List view only) - Right side */}
        {state.viewMode === 'list' && state.products.length > 0 && (
          <div className="flex items-center space-x-2">
            <label htmlFor="items-per-page" className="text-sm font-medium text-gray-700">
              Items per page:
            </label>
            <select
              id="items-per-page"
              value={state.itemsPerPage}
              onChange={(e) => dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: parseInt(e.target.value) })}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              {LIST_ITEMS_PER_PAGE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )}
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
      {(() => {
        // Calculate pagination
        const itemsPerPage = state.viewMode === 'grid' ? GRID_ITEMS_PER_PAGE : state.itemsPerPage;
        const totalItems = state.products.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (state.currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = state.products.slice(startIndex, endIndex);

        return (
          <>
            {paginatedProducts.length > 0 || state.loading ? (
              <ProductGrid
                products={paginatedProducts}
                viewMode={state.viewMode}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                loading={state.loading}
              />
            ) : (
              <EmptyState
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
                onCreateProduct={handleCreateProduct}
              />
            )}

            {/* Pagination Controls - Always show, but disable when only 1 page */}
            {state.products.length > 0 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-6">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} products
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: state.currentPage - 1 })}
                    disabled={state.currentPage === 1 || state.loading || totalPages <= 1}
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (state.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (state.currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = state.currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={state.currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: pageNum })}
                          disabled={state.loading || totalPages <= 1}
                          className="min-w-[2.5rem]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: state.currentPage + 1 })}
                    disabled={state.currentPage === totalPages || state.loading || totalPages <= 1}
                    className="flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}