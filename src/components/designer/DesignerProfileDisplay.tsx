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
  Award
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {profile.businessName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.businessName}</h2>
            {profile.isVerified && (
              <div className="flex items-center text-blue-600 text-sm">
                <Award className="w-4 h-4 mr-1" />
                Verified Designer
              </div>
            )}
          </div>
        </div>

        {showActions && onEdit && (
          <Button variant="outline" onClick={() => onEdit(profile)}>
            Edit Profile
          </Button>
        )}
      </div>

      {profile.bio && (
        <div className="mb-6">
          <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {profile.portfolioStats?.totalDesigns || 0}
          </div>
          <div className="text-sm text-gray-500">Designs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {profile.portfolioStats?.totalDownloads || 0}
          </div>
          <div className="text-sm text-gray-500">Downloads</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {profile.portfolioStats?.totalViews || 0}
          </div>
          <div className="text-sm text-gray-500">Views</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {actualRatings.averageRating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">Rating ({actualRatings.totalReviews} reviews)</div>
        </div>
      </div>

      {/* Specialties */}
      {profile.specialties.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {profile.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contact & Social */}
      <div className="space-y-4">
        {profile.website && (
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <a 
              href={profile.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              {profile.website}
            </a>
          </div>
        )}

        {profile.socialMedia && (
          <div className="flex space-x-4">
            {profile.socialMedia.instagram && (
              <a 
                href={`https://instagram.com/${profile.socialMedia.instagram.replace('@', '')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pink-600 hover:text-pink-800"
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
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Design Timeline Section */}
      <div className="mt-6">
        <DesignTimeline designerId={profile.id} />
      </div>

      {/* Reviews Section */}
      <div className="mt-6">
        <DesignerReviewSection designer={profile} />
      </div>
    </div>
  );
}
