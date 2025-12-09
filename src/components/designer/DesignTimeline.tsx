'use client';

import React, { useState, useEffect } from 'react';
import { DesignWithDetails } from '@/types/enhanced-products';
import Link from 'next/link';
import { Calendar, Eye, Download, Heart, Star } from 'lucide-react';

interface DesignTimelineProps {
  designerId: string;
  limit?: number;
}

export function DesignTimeline({ designerId, limit = 12 }: DesignTimelineProps) {
  const [designs, setDesigns] = useState<DesignWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (designerId) {
      fetchDesigns();
    }
  }, [designerId]);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/designs?designerId=${designerId}&isPublic=true&sortBy=createdAt&sortOrder=desc&limit=${limit}`
      );
      const data = await response.json();
      
      if (data.designs) {
        setDesigns(data.designs || []);
      } else {
        setError('Failed to load designs');
      }
    } catch (err: any) {
      console.error('Error fetching designs:', err);
      setError(err.message || 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj);
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No designs available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Design Portfolio</h3>
        <span className="text-sm text-gray-600">{designs.length} {designs.length === 1 ? 'design' : 'designs'}</span>
      </div>

      {/* Timeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {designs.map((design, index) => (
          <Link key={design.id} href={`/designs/${design.id}`}>
            <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden cursor-pointer group">
              {/* Design Image */}
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {design.thumbnailUrl ? (
                  <img
                    src={design.thumbnailUrl}
                    alt={design.designName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                    <span className="text-4xl font-bold text-gray-400">
                      {design.designName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Featured Badge */}
                {design.isFeatured && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold">
                    ★ Featured
                  </div>
                )}

                {/* Design Type Badge */}
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {design.designType}
                </div>
              </div>

              {/* Design Info */}
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {design.designName}
                </h4>
                
                {/* Date */}
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(design.createdAt)}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {design.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {design.downloadCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {design.likesCount || 0}
                    </span>
                  </div>
                  
                  {/* Rating */}
                  {design.pricing && !design.pricing.isFree && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium">
                        ${design.pricing.price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  )}
                  {design.pricing?.isFree && (
                    <span className="text-green-600 font-medium text-xs">FREE</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Link */}
      {designs.length >= limit && (
        <div className="text-center">
          <Link
            href={`/explore/designs?designerId=${designerId}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Designs →
          </Link>
        </div>
      )}
    </div>
  );
}

