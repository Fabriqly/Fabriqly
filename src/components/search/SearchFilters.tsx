'use client';

import { Filter, X, Check } from 'lucide-react';

export type SearchCategory = 'all' | 'products' | 'designs' | 'shops';

interface SearchFiltersProps {
  category: SearchCategory;
  onCategoryChange: (category: SearchCategory) => void;
  minPrice: string;
  maxPrice: string;
  onPriceChange: (min: string, max: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function SearchFilters({
  category,
  onCategoryChange,
  minPrice,
  maxPrice,
  onPriceChange,
  onClearFilters,
  hasActiveFilters
}: SearchFiltersProps) {
  const categories: { value: SearchCategory; label: string }[] = [
    { value: 'all', label: 'All Results' },
    { value: 'products', label: 'Products' },
    { value: 'designs', label: 'Designs' },
    { value: 'shops', label: 'Shops' }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Filter className="w-4 h-4" />
          <h2>Filters</h2>
        </div>
        {hasActiveFilters && (
          <button 
            onClick={onClearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            Clear
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Category</h3>
        <div className="space-y-0.5">
          {categories.map((cat) => {
            const isSelected = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{cat.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">Min Price</label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => onPriceChange(e.target.value, maxPrice)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">Max Price</label>
            <input
              type="number"
              placeholder="No limit"
              value={maxPrice}
              onChange={(e) => onPriceChange(minPrice, e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

