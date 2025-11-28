'use client';

import { useEffect, useState } from 'react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { DesignCard } from '@/components/designer/DesignCard';
import { useAuth } from '@/hooks/useAuth';
import { DesignWithDetails } from '@/types/enhanced-products';
import { Filter, SlidersHorizontal, Search, Check, X } from 'lucide-react';

export default function ExploreDesignsPage() {
  const { user } = useAuth();
  const [designs, setDesigns] = useState<DesignWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/designs?isPublic=true&isActive=true&limit=100');
      const data = await response.json();
      
      if (data.success || data.designs) {
        const fetchedDesigns: DesignWithDetails[] = data.designs || data.data?.designs || [];
        setDesigns(fetchedDesigns);
        
        // Extract unique tags from all designs
        const allTags = new Set<string>();
        fetchedDesigns.forEach((design) => {
          if (design.tags && Array.isArray(design.tags)) {
            design.tags.forEach((tag: string) => {
              if (tag && tag.trim()) {
                allTags.add(tag.trim());
              }
            });
          }
        });
        setTags(Array.from(allTags).sort());
      }
    } catch (error) {
      console.error('Error fetching designs:', error);
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

  const filteredDesigns = selectedTags.length > 0
    ? designs.filter(design => 
        design.tags && Array.isArray(design.tags) && 
        design.tags.some(tag => selectedTags.includes(tag))
      )
    : designs;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <CustomerHeader user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Explore Designs</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Discover amazing designs from talented creators.
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
            ) : filteredDesigns.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Designs Found</h3>
                <p className="text-gray-500">
                  {selectedTags.length === 0 
                    ? 'No designs available at the moment.' 
                    : `No designs found with the selected tags.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDesigns.map((design) => (
                  <DesignCard
                    key={design.id}
                    design={design}
                    variant="catalog"
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
