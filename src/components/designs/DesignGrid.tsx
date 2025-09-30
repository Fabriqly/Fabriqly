'use client';

import React from 'react';
import { DesignWithDetails } from '@/types/enhanced-products';
import { DesignCard } from '@/components/designer/DesignCard';

interface DesignGridProps {
  designs: DesignWithDetails[];
  loading?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  showActions?: boolean;
  variant?: 'catalog' | 'portfolio';
}

export function DesignGrid({
  designs,
  loading = false,
  error = null,
  onLoadMore,
  hasMore = false,
  columns = 4,
  showActions = false,
  variant = 'catalog'
}: DesignGridProps) {
  const getGridClasses = () => {
    const baseClasses = 'grid gap-6';
    
    switch (columns) {
      case 1:
        return `${baseClasses} grid-cols-1`;
      case 2:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2`;
      case 3:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`;
      case 4:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
      case 5:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`;
      case 6:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6`;
      default:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        {onLoadMore && (
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No designs found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Designs Grid */}
      <div className={getGridClasses()}>
        {designs.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            variant={variant}
            showActions={showActions}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load More Designs
          </button>
        </div>
      )}
    </div>
  );
}
