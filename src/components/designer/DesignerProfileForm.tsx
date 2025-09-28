'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  DesignerProfile, 
  CreateDesignerProfileData, 
  UpdateDesignerProfileData 
} from '@/types/enhanced-products';
import { 
  Save, 
  X, 
  User, 
  Globe, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin,
  Star,
  Eye,
  Download,
  Award
} from 'lucide-react';

interface DesignerProfileFormProps {
  profile?: DesignerProfile;
  onSave?: (profile: DesignerProfile) => void;
  onCancel?: () => void;
}

export function DesignerProfileForm({ profile, onSave, onCancel }: DesignerProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDesignerProfileData>({
    businessName: '',
    bio: '',
    website: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: '',
      linkedin: ''
    },
    specialties: []
  });

  const [specialtyInput, setSpecialtyInput] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName,
        bio: profile.bio || '',
        website: profile.website || '',
        socialMedia: profile.socialMedia || {
          instagram: '',
          facebook: '',
          twitter: '',
          linkedin: ''
        },
        specialties: profile.specialties || []
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof CreateDesignerProfileData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleAddSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialtyInput.trim()]
      }));
      setSpecialtyInput('');
    }
  };

  const handleRemoveSpecialty = (specialtyToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(specialty => specialty !== specialtyToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = profile ? `/api/designer-profiles/${profile.id}` : '/api/designer-profiles';
      const method = profile ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save designer profile');
      }

      const data = await response.json();
      
      if (onSave) {
        onSave(data.profile);
      } else {
        router.push('/dashboard/designer-profile');
      }
    } catch (error: any) {
      console.error('Error saving designer profile:', error);
      alert(error.message || 'Failed to save designer profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {profile ? 'Edit Designer Profile' : 'Create Designer Profile'}
          </h2>
          <p className="text-gray-600 mt-1">
            {profile ? 'Update your designer profile information' : 'Set up your designer profile to showcase your work'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business/Studio Name *
              </label>
              <Input
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Enter your business or studio name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself and your design experience"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
                <Input
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Design Specialties</h3>
            </div>

            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  placeholder="Add a design specialty"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                />
                <Button type="button" onClick={handleAddSpecialty} variant="outline">
                  Add Specialty
                </Button>
              </div>

              {formData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialty(specialty)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Social Media</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.socialMedia?.instagram || ''}
                    onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                    placeholder="@yourusername"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook
                </label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.socialMedia?.facebook || ''}
                    onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                    placeholder="Your Facebook page"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter
                </label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.socialMedia?.twitter || ''}
                    onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                    placeholder="@yourusername"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.socialMedia?.linkedin || ''}
                    onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                    placeholder="Your LinkedIn profile"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              {profile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Designer Profile Display Component
interface DesignerProfileDisplayProps {
  profile: DesignerProfile;
  showActions?: boolean;
  onEdit?: (profile: DesignerProfile) => void;
}

export function DesignerProfileDisplay({ profile, showActions = false, onEdit }: DesignerProfileDisplayProps) {
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
            {profile.portfolioStats.totalDesigns}
          </div>
          <div className="text-sm text-gray-500">Designs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {profile.portfolioStats.totalDownloads}
          </div>
          <div className="text-sm text-gray-500">Downloads</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {profile.portfolioStats.totalViews}
          </div>
          <div className="text-sm text-gray-500">Views</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {profile.portfolioStats.averageRating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">Rating</div>
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
    </div>
  );
}
