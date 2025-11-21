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
    specialties: [],
    payoutDetails: {
      bankCode: '',
      accountNumber: '',
      accountHolderName: ''
    }
  });

  const [specialtyInput, setSpecialtyInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
        specialties: profile.specialties || [],
        payoutDetails: (profile as any).payoutDetails || {
          bankCode: '',
          accountNumber: '',
          accountHolderName: ''
        }
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof CreateDesignerProfileData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePayoutDetailsChange = (field: 'bankCode' | 'accountNumber' | 'accountHolderName', value: string) => {
    setFormData(prev => ({
      ...prev,
      payoutDetails: {
        ...(prev.payoutDetails || { bankCode: '', accountNumber: '', accountHolderName: '' }),
        [field]: value
      }
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
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
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

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.businessName.trim()) {
      errors.push('Business name is required');
    } else if (formData.businessName.length < 2) {
      errors.push('Business name must be at least 2 characters long');
    } else if (formData.businessName.length > 100) {
      errors.push('Business name must be less than 100 characters');
    }

    if (formData.bio && formData.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    if (formData.website && !isValidUrl(formData.website)) {
      errors.push('Website must be a valid URL');
    }

    if (formData.specialties.length > 10) {
      errors.push('Maximum 10 specialties allowed');
    }

    return errors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
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
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.bio?.length || 0}/500 characters
              </div>
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

          {/* Payout Details */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Save className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Payout Details</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Add your bank account information to receive payments. For testing purposes, you can use dummy values.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Code
                </label>
                <Input
                  value={formData.payoutDetails?.bankCode || ''}
                  onChange={(e) => handlePayoutDetailsChange('bankCode', e.target.value)}
                  placeholder="e.g., BDO, BPI, GCASH"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Common codes: BDO, BPI, GCASH, PAYMAYA (for testing, any value works)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <Input
                  value={formData.payoutDetails?.accountNumber || ''}
                  onChange={(e) => handlePayoutDetailsChange('accountNumber', e.target.value)}
                  placeholder="Enter account number (dummy values OK for testing)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <Input
                  value={formData.payoutDetails?.accountHolderName || ''}
                  onChange={(e) => handlePayoutDetailsChange('accountHolderName', e.target.value)}
                  placeholder="Name as it appears on the account"
                />
              </div>
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

