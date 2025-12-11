'use client';

import React, { useState, useEffect } from 'react';
import { DesignerProfile } from '@/types/enhanced-products';
import { Button } from '@/components/ui/Button';
import { DesignerReviewSection } from '@/components/reviews/DesignerReviewSection';
import { DesignTimeline } from './DesignTimeline';
import { 
  Globe, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin,
  Award,
  CheckCircle2,
  Star,
  Download,
  Eye,
  FileText
} from 'lucide-react';

interface DesignerProfileDisplayProps {
  profile: DesignerProfile;
  showActions?: boolean;
  onEdit?: (profile: DesignerProfile) => void;
}

export function DesignerProfileDisplay({ profile, showActions = false, onEdit }: DesignerProfileDisplayProps) {
  const [actualRatings, setActualRatings] = useState({
    averageRating: profile.portfolioStats?.averageRating || 0,
    totalReviews: 0
  });

  useEffect(() => {
    // Fetch actual review data
    const fetchRatings = async () => {
      try {
        const response = await fetch(`/api/reviews/average?type=designer&targetId=${profile.id}`);
        const data = await response.json();
        
        if (data.success) {
          setActualRatings({
            averageRating: data.data.average || 0,
            totalReviews: data.data.total || 0
          });
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    };

    if (profile.id) {
      fetchRatings();
    }
  }, [profile.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner Section */}
      <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-xl">
        {profile.bannerUrl ? (
          <img
            src={profile.bannerUrl}
            alt={`${profile.businessName} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        )}
      </div>

      {/* Designer Info Card - White Background */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 md:p-5">
          {/* Mobile View - Compact Layout */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3 mb-3">
              {/* Designer Avatar */}
              <div className="flex-shrink-0">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-full border-2 border-white bg-white shadow-md overflow-hidden">
                    {profile.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt={`${profile.businessName} logo`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                        {profile.businessName?.charAt(0) || 'D'}
                      </div>
                    )}
                  </div>
                  {profile.isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-1 border-2 border-white shadow-sm">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Designer Name */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {profile.businessName}
                </h1>
                {profile.isVerified && (
                  <div className="flex items-center text-blue-600 text-xs mt-0.5">
                    <Award className="w-3 h-3 mr-1" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio/Tagline */}
            {profile.bio && (
              <p className="text-xs text-gray-700 mb-3 px-1 line-clamp-2">
                {profile.bio}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-2 mb-3">
              <button className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer flex-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-gray-900 text-sm">{actualRatings.averageRating.toFixed(1)}</span>
                <span className="text-xs text-gray-600">({actualRatings.totalReviews})</span>
              </button>
              <button className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer flex-1">
                <FileText className="w-3.5 h-3.5 text-gray-600" />
                <span className="font-semibold text-gray-900 text-sm">{profile.portfolioStats?.totalDesigns || 0}</span>
                <span className="text-xs text-gray-600">Designs</span>
              </button>
              <button className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer flex-1">
                <Download className="w-3.5 h-3.5 text-gray-600" />
                <span className="font-semibold text-gray-900 text-sm">{profile.portfolioStats?.totalDownloads || 0}</span>
                <span className="text-xs text-gray-600">Downloads</span>
              </button>
            </div>
          </div>

          {/* Desktop View - Original Layout */}
          <div className="hidden lg:flex flex-col md:flex-row gap-4">
            {/* Designer Avatar */}
            <div className="flex-shrink-0">
              <div className="relative inline-block">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
                  {profile.profileImageUrl ? (
                    <img
                      src={profile.profileImageUrl}
                      alt={`${profile.businessName} logo`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl md:text-2xl font-bold">
                      {profile.businessName?.charAt(0) || 'D'}
                    </div>
                  )}
                </div>
                {profile.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 border-4 border-white shadow-md">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Designer Information */}
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                    {profile.businessName}
                  </h1>
                  {profile.isVerified && (
                    <div className="flex items-center text-blue-600 text-sm">
                      <Award className="w-4 h-4 mr-1" />
                      <span>Verified Designer</span>
                    </div>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-xs md:text-sm text-gray-700 italic mb-3">
                    &ldquo;{profile.bio}&rdquo;
                  </p>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-gray-900">{actualRatings.averageRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-600">({actualRatings.totalReviews})</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">{profile.portfolioStats?.totalDesigns || 0}</span>
                    <span className="text-sm text-gray-600">Designs</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <Download className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">{profile.portfolioStats?.totalDownloads || 0}</span>
                    <span className="text-sm text-gray-600">Downloads</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">{profile.portfolioStats?.totalViews || 0}</span>
                    <span className="text-sm text-gray-600">Views</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Left Sidebar (4 columns) */}
          <aside className="lg:col-span-4 space-y-4">
            {/* About Card */}
            {profile.bio && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">About</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Specialties Card */}
            {profile.specialties && profile.specialties.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Social Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Contact & Social</h3>
              <div className="space-y-3">
                {profile.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Website</p>
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {profile.website}
                      </a>
                    </div>
                  </div>
                )}

                {profile.socialMedia && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-2">Social Media</p>
                      <div className="flex flex-wrap gap-3">
                        {profile.socialMedia.instagram && (
                          <a 
                            href={`https://instagram.com/${profile.socialMedia.instagram.replace('@', '')}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-800"
                            aria-label="Instagram"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {profile.socialMedia.facebook && (
                          <a 
                            href={profile.socialMedia.facebook}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            aria-label="Facebook"
                          >
                            <Facebook className="w-5 h-5" />
                          </a>
                        )}
                        {profile.socialMedia.twitter && (
                          <a 
                            href={`https://twitter.com/${profile.socialMedia.twitter.replace('@', '')}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-600"
                            aria-label="Twitter"
                          >
                            <Twitter className="w-5 h-5" />
                          </a>
                        )}
                        {profile.socialMedia.linkedin && (
                          <a 
                            href={profile.socialMedia.linkedin}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-900"
                            aria-label="LinkedIn"
                          >
                            <Linkedin className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Right Main Content (8 columns) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Design Timeline Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Recent Designs</h3>
              <DesignTimeline designerId={profile.id} />
            </div>
          </div>
        </div>

        {/* Reviews Section - Full Width (Same as Business Profile) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <DesignerReviewSection designer={profile} />
        </div>
      </div>
    </div>
  );
}
