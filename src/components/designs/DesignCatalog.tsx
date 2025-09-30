'use client';

import React, { useState, useEffect } from 'react';
import { DesignWithDetails, DesignFilters, Category } from '@/types/enhanced-products';
import { DesignCard } from '@/components/designer/DesignCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SortAsc, 
  SortDesc,
  Star,
  Download,
  Heart,
  Eye,
  Tag,
  X
} from 'lucide-react';

interface DesignCatalogProps {
  initialDesigns?: DesignWithDetails[];
  showFilters?: boolean;
  showSearch?: boolean;
  showSorting?: boolean;
  showViewToggle?: boolean;
  title?: string;
  subtitle?: string;
}

export function DesignCatalog({
  initialDesigns = [],
  showFilters = true,
  showSearch = true,
  showSorting = true,
  showViewToggle = true,
  title = "Design Catalog",
  subtitle = "Discover amazing designs from talented creators"
}: DesignCatalogProps) {
  const [designs, setDesigns] = useState<DesignWithDetails[]>(initialDesigns);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DesignFilters>({
    isPublic: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 20
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load designs when filters change
  useEffect(() => {
    loadDesigns();
  }, [filters, searchTerm]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadDesigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      
      // Add filters to query
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      // Add search term
      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      const response = await fetch(`/api/designs?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load designs');
      }

      setDesigns(data.designs || []);
    } catch (error: any) {
      console.error('Error loading designs:', error);
      setError(error.message || 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof DesignFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSortChange = (sortBy: string) => {
    const currentSortBy = filters.sortBy;
    const currentSortOrder = filters.sortOrder;

    if (currentSortBy === sortBy) {
      // Toggle sort order if same field
      setFilters(prev => ({
        ...prev,
        sortOrder: currentSortOrder === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      // Set new sort field with default order
      setFilters(prev => ({
        ...prev,
        sortBy: sortBy as any,
        sortOrder: 'desc'
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      isPublic: true,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 20
    });
    setSearchTerm('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDesigns();
  };

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === 'asc' ? 
      <SortAsc className="w-4 h-4" /> : 
      <SortDesc className="w-4 h-4" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        {showSearch && (
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search designs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        )}

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          {/* Filter Toggle */}
          {showFilters && (
            <Button
              variant="outline"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {Object.values(filters).some(v => v !== undefined && v !== null && v !== '') && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  Active
                </span>
              )}
            </Button>
          )}

          {/* View Toggle and Sort */}
          <div className="flex items-center space-x-4">
            {showViewToggle && (
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
            )}

            {showSorting && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSortChange('createdAt')}
                  className="flex items-center space-x-1"
                >
                  <span>Newest</span>
                  {getSortIcon('createdAt')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSortChange('downloadCount')}
                  className="flex items-center space-x-1"
                >
                  <span>Popular</span>
                  {getSortIcon('downloadCount')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSortChange('viewCount')}
                  className="flex items-center space-x-1"
                >
                  <span>Most Viewed</span>
                  {getSortIcon('viewCount')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSortChange('likesCount')}
                  className="flex items-center space-x-1"
                >
                  <span>Most Liked</span>
                  {getSortIcon('likesCount')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Design Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Design Type
              </label>
              <select
                value={filters.designType || ''}
                onChange={(e) => handleFilterChange('designType', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="template">Template</option>
                <option value="custom">Custom</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <select
                value={filters.isFree === undefined ? '' : filters.isFree ? 'free' : 'paid'}
                onChange={(e) => handleFilterChange('isFree', e.target.value === 'free' ? true : e.target.value === 'paid' ? false : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Prices</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Featured Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured
              </label>
              <select
                value={filters.isFeatured === undefined ? '' : filters.isFeatured ? 'featured' : 'not-featured'}
                onChange={(e) => handleFilterChange('isFeatured', e.target.value === 'featured' ? true : e.target.value === 'not-featured' ? false : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Designs</option>
                <option value="featured">Featured Only</option>
                <option value="not-featured">Not Featured</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={clearFilters} className="flex items-center space-x-2">
              <X className="w-4 h-4" />
              <span>Clear Filters</span>
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDesigns} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Designs Grid/List */}
      {!loading && !error && (
        <>
          {designs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No designs found matching your criteria.</p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {designs.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  variant={viewMode === 'grid' ? 'catalog' : 'portfolio'}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Load More Button */}
      {!loading && !error && designs.length > 0 && designs.length >= (filters.limit || 20) && (
        <div className="text-center mt-8">
          <Button
            onClick={() => handleFilterChange('limit', (filters.limit || 20) + 20)}
            variant="outline"
          >
            Load More Designs
          </Button>
        </div>
      )}
    </div>
  );
}
