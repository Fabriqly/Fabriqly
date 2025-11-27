'use client';

import { useEffect, useState } from 'react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { DesignerProfile } from '@/types/enhanced-products';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Filter, SlidersHorizontal, Search, Check, X, Star, Download, Award, MapPin } from 'lucide-react';

export default function ExploreDesignersPage() {
  const { user } = useAuth();
  const [designers, setDesigners] = useState<DesignerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [specialtySearch, setSpecialtySearch] = useState('');

  useEffect(() => {
    fetchDesigners();
  }, []);

  const fetchDesigners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/designer-profiles?isActive=true&limit=100');
      const data = await response.json();
      
      if (data.profiles) {
        const fetchedDesigners: DesignerProfile[] = data.profiles || [];
        setDesigners(fetchedDesigners);
        
        // Extract unique specialties
        const allSpecialties = Array.from(
          new Set(fetchedDesigners.flatMap(designer => designer.specialties || []))
        ).sort();
        setSpecialties(allSpecialties);
      }
    } catch (error) {
      console.error('Error fetching designers:', error);
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

  const filteredDesigners = selectedSpecialties.length > 0
    ? designers.filter(designer => 
        designer.specialties?.some(specialty => selectedSpecialties.includes(specialty))
      )
    : designers;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <CustomerHeader user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Explore Designers</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Discover talented designers and their creative work.
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
            ) : filteredDesigners.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">No Designers Found</h3>
                <p className="text-gray-600">
                  {selectedSpecialties.length === 0 
                    ? 'No designers available at the moment.' 
                    : `No designers found with the selected specialties.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDesigners.map((designer) => (
                  <DesignerCard key={designer.id} designer={designer} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function DesignerCard({ designer }: { designer: DesignerProfile }) {
  const [actualRating, setActualRating] = useState<number>(designer.portfolioStats?.averageRating || 0);

  useEffect(() => {
    // Fetch actual review data
    const fetchRating = async () => {
      try {
        const response = await fetch(`/api/reviews/average?type=designer&targetId=${designer.id}`);
        const data = await response.json();
        
        if (data.success && data.data?.average !== undefined) {
          setActualRating(data.data.average || 0);
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      }
    };

    if (designer.id) {
      fetchRating();
    }
  }, [designer.id]);

  return (
    <Link href={`/explore/designers/${designer.id}`} className="group block h-full">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative">
        {/* Banner/Thumbnail */}
        <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 overflow-hidden rounded-t-xl relative">
          {designer.portfolioImageUrl ? (
            <img
              src={designer.portfolioImageUrl}
              alt={designer.businessName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-100 to-pink-100" />
          )}
        </div>
        
        {/* Avatar Overlay */}
        <div className="px-4 -mt-8 relative z-10">
          <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden">
            {designer.profileImageUrl ? (
              <img
                src={designer.profileImageUrl}
                alt={designer.businessName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                {designer.businessName?.charAt(0) || 'D'}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-5 pt-2 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {designer.businessName}
                </h3>
                {designer.isVerified && (
                  <Award className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              {designer.bio && (
                <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-0.5">
                  {designer.bio}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {designer.bio || 'No description available.'}
          </p>

          {/* Specialties */}
          {designer.specialties && designer.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
              {designer.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium border border-gray-100"
                >
                  {specialty}
                </span>
              ))}
              {designer.specialties.length > 3 && (
                <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-md text-xs font-medium border border-gray-100">
                  +{designer.specialties.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stats Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-gray-400" />
                <span>{designer.portfolioStats?.totalDesigns || 0} Designs</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span>{actualRating.toFixed(1)}</span>
              </div>
            </div>
            {designer.location && (
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{designer.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
