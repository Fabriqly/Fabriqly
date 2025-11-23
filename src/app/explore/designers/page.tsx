'use client';

import { useEffect, useState } from 'react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { DesignerProfile } from '@/types/enhanced-products';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Award, Star, Download, Eye } from 'lucide-react';

export default function ExploreDesignersPage() {
  const { user } = useAuth();
  const [designers, setDesigners] = useState<DesignerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDesigners();
  }, []);

  const fetchDesigners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/designer-profiles?isActive=true&limit=100');
      const data = await response.json();
      
      if (data.profiles) {
        setDesigners(data.profiles || []);
      }
    } catch (error) {
      console.error('Error fetching designers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Designers</h1>
          <p className="text-gray-600">Discover talented designers and their creative work</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-24 bg-gray-200 rounded-full w-24 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designers.map((designer) => (
              <DesignerCard key={designer.id} designer={designer} />
            ))}
          </div>
        )}

        {!loading && designers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No designers found</p>
          </div>
        )}
      </main>
    </div>
  );
}

function DesignerCard({ designer }: { designer: DesignerProfile }) {
  return (
    <Link href={`/explore/designers/${designer.id}`}>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden cursor-pointer">
        <div className="p-6">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {designer.businessName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg truncate">{designer.businessName}</h3>
                {designer.isVerified && (
                  <Award className="w-5 h-5 text-blue-600 flex-shrink-0" />
                )}
              </div>
              {designer.bio && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{designer.bio}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {designer.portfolioStats?.totalDesigns || 0}
              </div>
              <div className="text-xs text-gray-500">Designs</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">
                {(designer.portfolioStats?.averageRating || 0).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
          </div>

          {/* Specialties */}
          {designer.specialties && designer.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {designer.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs"
                >
                  {specialty}
                </span>
              ))}
              {designer.specialties.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  +{designer.specialties.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Additional Stats */}
          <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-3">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                {designer.portfolioStats?.totalDownloads || 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {designer.portfolioStats?.totalViews || 0}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              {(designer.portfolioStats?.averageRating || 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

