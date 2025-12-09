'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import ShopList from '@/components/shop/ShopList';
import { ShopProfile } from '@/types/shop-profile';
import { useAuth } from '@/hooks/useAuth';
import { Filter, SlidersHorizontal, Search, Check, X } from 'lucide-react';

export default function ExploreShopsPage() {
  const { user } = useAuth();
  const [shops, setShops] = useState<ShopProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [specialtySearch, setSpecialtySearch] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shop-profiles?isActive=true&approvalStatus=approved&limit=100');
      const data = await response.json();
      
      if (data.success) {
        const fetchedShops: ShopProfile[] = data.data || [];
        setShops(fetchedShops);
        
        // Extract unique specialties
        const allSpecialties = Array.from(
          new Set(fetchedShops.flatMap(shop => shop.specialties || []))
        ).sort();
        setSpecialties(allSpecialties);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => {
      if (prev.includes(specialty)) {
        return prev.filter(s => s !== specialty);
      }
      return [...prev, specialty];
    });
  };

  const clearFilters = () => {
    setSelectedSpecialties([]);
    setSpecialtySearch('');
  };

  const filteredSpecialties = specialties.filter(specialty => 
    specialty.toLowerCase().includes(specialtySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <CustomerHeader user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Explore Shops</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
            Discover talented creators and their unique custom products.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4">
            <button 
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 font-medium hover:bg-gray-50 w-full justify-center"
            >
              <Filter className="w-4 h-4" />
              Filter & Sort
            </button>
          </div>

          {/* Sidebar Filter - Desktop Only */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                  <Filter className="w-4 h-4" />
                  <h2>Specialties</h2>
                </div>
                {selectedSpecialties.length > 0 && (
                  <button 
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    Clear
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Specialty Search */}
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search specialties..."
                  value={specialtySearch}
                  onChange={(e) => setSpecialtySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              
              <div className="space-y-0.5 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                <button
                  onClick={() => setSelectedSpecialties([])}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ${
                    selectedSpecialties.length === 0
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>All Specialties</span>
                  {selectedSpecialties.length === 0 && <Check className="w-3.5 h-3.5" />}
                </button>
                
                {filteredSpecialties.length > 0 ? (
                  filteredSpecialties.map((specialty) => {
                    const isSelected = selectedSpecialties.includes(specialty);
                    return (
                      <button
                        key={specialty}
                        onClick={() => toggleSpecialty(specialty)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">{specialty}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    No specialties found
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
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
            ) : (
              <ShopList initialShops={shops} selectedSpecialties={selectedSpecialties} />
            )}
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <Dialog open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <Dialog.Panel className="w-screen max-w-md transform transition-transform">
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Filter & Sort</h2>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-gray-900 font-semibold">
                        <Filter className="w-4 h-4" />
                        <h2>Specialties</h2>
                      </div>
                      {selectedSpecialties.length > 0 && (
                        <button 
                          onClick={clearFilters}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          Clear
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Specialty Search */}
                    <div className="relative mb-3">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input
                        type="text"
                        placeholder="Search specialties..."
                        value={specialtySearch}
                        onChange={(e) => setSpecialtySearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-0.5 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                      <button
                        onClick={() => setSelectedSpecialties([])}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ${
                          selectedSpecialties.length === 0
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>All Specialties</span>
                        {selectedSpecialties.length === 0 && <Check className="w-3.5 h-3.5" />}
                      </button>
                      
                      {filteredSpecialties.length > 0 ? (
                        filteredSpecialties.map((specialty) => {
                          const isSelected = selectedSpecialties.includes(specialty);
                          return (
                            <button
                              key={specialty}
                              onClick={() => toggleSpecialty(specialty)}
                              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span className="truncate">{specialty}</span>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-xs">
                          No specialties found
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </main>
      
      <ScrollToTop />
    </div>
  );
}

