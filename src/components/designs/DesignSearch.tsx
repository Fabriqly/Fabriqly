'use client';

import React, { useState, useEffect } from 'react';
import { DesignWithDetails } from '@/types/enhanced-products';
import { DesignSearchOptions } from '@/services/interfaces/IDesignService';
import { DesignGrid } from './DesignGrid';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  Search, 
  Filter, 
  X,
  Tag,
  Star,
  Download,
  Heart,
  Eye
} from 'lucide-react';

interface DesignSearchProps {
  onResults?: (designs: DesignWithDetails[]) => void;
  placeholder?: string;
  showFilters?: boolean;
  initialQuery?: string;
  limit?: number;
}

export function DesignSearch({
  onResults,
  placeholder = "Search designs...",
  showFilters = true,
  initialQuery = '',
  limit = 20
}: DesignSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [designs, setDesigns] = useState<DesignWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<DesignSearchOptions>({
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Load designs when search term or filters change
  useEffect(() => {
    if (searchTerm.trim() || Object.keys(filters).length > 2) {
      searchDesigns(true);
    }
  }, [searchTerm, filters]);

  const searchDesigns = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      if (reset) {
        setCurrentPage(1);
        setDesigns([]);
      }

      const queryParams = new URLSearchParams();
      
      // Add search term
      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      // Add pagination
      const page = reset ? 1 : currentPage;
      const offset = (page - 1) * (filters.limit || limit);
      queryParams.append('offset', offset.toString());

      const response = await fetch(`/api/designs?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search designs');
      }

      const newDesigns = data.designs || [];
      
      if (reset) {
        setDesigns(newDesigns);
      } else {
        setDesigns(prev => [...prev, ...newDesigns]);
      }

      setHasMore(newDesigns.length === (filters.limit || limit));
      setCurrentPage(page + 1);

      // Notify parent component
      if (onResults) {
        onResults(reset ? newDesigns : [...designs, ...newDesigns]);
      }
    } catch (error: any) {
      console.error('Error searching designs:', error);
      setError(error.message || 'Failed to search designs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchDesigns(true);
  };

  const handleLoadMore = () => {
    searchDesigns(false);
  };

  const handleFilterChange = (key: keyof DesignSearchOptions, value: any) => {
    setFilters((prev: DesignSearchOptions) => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchTerm('');
  };

  const getFilterCount = () => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (filters.categoryId) count++;
    if (filters.designType) count++;
    if (filters.isFree !== undefined) count++;
    if (filters.isFeatured !== undefined) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" loading={loading}>
            Search
          </Button>
          {showFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {getFilterCount() > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  {getFilterCount()}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
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
                  {/* Categories would be loaded from API */}
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

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="downloadCount-desc">Most Downloaded</option>
                  <option value="viewCount-desc">Most Viewed</option>
                  <option value="likesCount-desc">Most Liked</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* Search Results */}
      {designs.length > 0 && (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {designs.length} design{designs.length !== 1 ? 's' : ''} found
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>

          {/* Designs Grid */}
          <DesignGrid
            designs={designs}
            loading={loading}
            error={error}
            onLoadMore={hasMore ? handleLoadMore : undefined}
            hasMore={hasMore}
            columns={4}
            variant="catalog"
          />
        </div>
      )}

      {/* No Results */}
      {!loading && designs.length === 0 && (searchTerm || getFilterCount() > 0) && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            No designs found matching your search criteria.
          </p>
          <Button onClick={clearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      )}

      {/* Initial State */}
      {!loading && designs.length === 0 && !searchTerm && getFilterCount() === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Start typing to search for designs
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <Tag className="w-4 h-4" />
              <span>Search by tags</span>
            </span>
            <span className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>Find featured designs</span>
            </span>
            <span className="flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>Browse popular downloads</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
