'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { 
  DesignerProfile, 
  CreateDesignerProfileData, 
  UpdateDesignerProfileData,
  FeaturedCustomer
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
  Award,
  Plus,
  Users,
  Image as ImageIcon,
  ChevronDown
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
    profileImageUrl: '',
    bannerUrl: '',
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
  const [featuredCustomers, setFeaturedCustomers] = useState<Array<Omit<FeaturedCustomer, 'id' | 'createdAt'> & { id?: string; createdAt?: any }>>([]);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<'profile' | 'banner' | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName,
        bio: profile.bio || '',
        website: profile.website || '',
        profileImageUrl: profile.profileImageUrl || '',
        bannerUrl: profile.bannerUrl || '',
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
      setProfileImagePreview(profile.profileImageUrl || null);
      setBannerPreview(profile.bannerUrl || null);
      setImageUploadError(null);
      // Load featured customers
      if (profile.featuredCustomers && profile.featuredCustomers.length > 0) {
        const mapped = profile.featuredCustomers.map(customer => ({
          id: customer.id,
          name: customer.name,
          photoUrl: customer.photoUrl,
          link: customer.link,
          createdAt: customer.createdAt
        }));
        setFeaturedCustomers(mapped);

        // Existing customers: collapsed by default (cleaner UI)
        const initialExpanded: Record<string, boolean> = {};
        mapped.forEach((customer, index) => {
          const key = customer.id || `customer-${index}`;
          initialExpanded[key] = false;
        });
        setExpandedCustomers(initialExpanded);
      }
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

  const handleAddFeaturedCustomer = () => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setFeaturedCustomers(prev => {
      const next = [...prev, { id: tempId, name: '', photoUrl: '', link: '' }];
      return next;
    });
    setExpandedCustomers(prev => ({
      ...prev,
      [tempId]: true
    }));
  };

  const handleUpdateFeaturedCustomer = (index: number, field: 'name' | 'photoUrl' | 'link', value: string) => {
    setFeaturedCustomers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveFeaturedCustomer = (index: number) => {
    setFeaturedCustomers(prev => {
      const toRemove = prev[index];
      const next = prev.filter((_, i) => i !== index);
      if (toRemove?.id) {
        setExpandedCustomers(expandedPrev => {
          const copy = { ...expandedPrev };
          delete copy[toRemove.id as string];
          return copy;
        });
      }
      return next;
    });
  };

  const toggleCustomerCollapse = (customerId: string | undefined) => {
    if (!customerId) return;
    setExpandedCustomers(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  const handleDesignerImageUpload = async (file: File, type: 'profile' | 'banner') => {
    if (!file) return;

    setUploadingImage(type);
    setImageUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload/designer-images', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      const url: string | undefined = result.data?.url;
      if (!url) {
        throw new Error('Upload failed: no URL returned');
      }

      if (type === 'profile') {
        handleInputChange('profileImageUrl', url);
        setProfileImagePreview(url);
      } else {
        handleInputChange('bannerUrl', url);
        setBannerPreview(url);
      }
    } catch (err: any) {
      console.error('Error uploading designer image:', err);
      setImageUploadError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDesignerFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('File size must be less than 5MB');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select a valid image file');
      return;
    }

    handleDesignerImageUpload(file, type);
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
      
      // Include featured customers in the request - preserve IDs for existing customers
      const submitData = {
        ...formData,
        featuredCustomers: featuredCustomers
          .filter(customer => customer.name.trim() !== '')
          .map(customer => ({
            ...(customer.id && { id: customer.id }),
            name: customer.name,
            photoUrl: customer.photoUrl,
            link: customer.link
          }))
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
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
    <form onSubmit={handleSubmit} className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 p-6">
        {/* Validation Errors - Full Width */}
        {validationErrors.length > 0 && (
          <div className="w-full">
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
          </div>
        )}

        {/* Left Column - Designer Branding (Profile Images) */}
        <div className="w-full lg:w-1/3 lg:sticky lg:top-6 lg:self-start">
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div className="flex items-center space-x-2 mb-2">
              <ImageIcon className="w-5 h-5 text-pink-600" />
              <h2 className="text-xl font-semibold text-gray-900">Designer Branding</h2>
            </div>
            <p className="text-xs text-gray-500">
              Upload your profile avatar and cover banner. These are shown on your public designer profile and in discovery pages.
            </p>

            {imageUploadError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                {imageUploadError}
              </div>
            )}

            <div className="space-y-6">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo / Avatar
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  This image will be used as your designer avatar across the platform.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                      {profileImagePreview ? (
                        <img
                          src={profileImagePreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-gray-500">
                          {formData.businessName?.charAt(0) || 'D'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleDesignerFileChange(e, 'profile')}
                        disabled={uploadingImage === 'profile' || loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadingImage === 'profile'
                          ? 'Uploading...'
                          : 'Recommended: square image, PNG/JPG/WebP, max 5MB'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Banner
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Large banner shown at the top of your public designer profile.
                </p>
                <div className="space-y-3">
                  <div className="w-full">
                    {bannerPreview ? (
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-28 md:h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-full h-28 md:h-32 rounded-lg border-2 border-dashed border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-1">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                          <p className="text-xs text-gray-500">No banner uploaded yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDesignerFileChange(e, 'banner')}
                      disabled={uploadingImage === 'banner' || loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadingImage === 'banner'
                        ? 'Uploading...'
                        : 'Recommended: 1200x400px or similar, PNG/JPG/WebP, max 5MB'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Main Form Sections */}
        <div className="w-full lg:w-2/3 space-y-6">
          {/* Header & Basic Information */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile ? 'Edit Designer Profile' : 'Create Designer Profile'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {profile
                    ? 'Update your designer profile information'
                    : 'Set up your designer profile to showcase your work'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-2">
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
          </section>

          {/* Specialties */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div className="flex items-center space-x-2 mb-2">
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
          </section>

          {/* Payout Details */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div className="flex items-center space-x-2 mb-2">
              <Save className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Payout Details</h3>
            </div>
            <p className="text-sm text-gray-600">
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
          </section>

          {/* Social Media */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div className="flex items-center space-x-2 mb-2">
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
          </section>

          {/* Featured Customers / Patrons */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Featured Customers & Patrons</h3>
            </div>

            <p className="text-sm text-gray-600">
              Showcase your special customers and patrons. Add their photo and a link to their profile or website.
            </p>

            <div className="space-y-4">
              {featuredCustomers.map((customer, index) => {
                const customerKey = customer.id || `customer-${index}`;
                const isExpanded = expandedCustomers[customerKey] ?? true;

                return (
                  <div key={customerKey} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                          {customer.photoUrl ? (
                            <img
                              src={customer.photoUrl}
                              alt={customer.name || `Customer ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{(customer.name || `C${index + 1}`).charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">
                            {customer.name || `Customer ${index + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCustomerCollapse(customerKey)}
                            className="inline-flex items-center text-[11px] text-gray-500 hover:text-gray-700 mt-0.5"
                          >
                            <span className="mr-1">
                              {isExpanded ? 'Hide details' : 'Show details'}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                            />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeaturedCustomer(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer Name *
                          </label>
                          <Input
                            value={customer.name}
                            onChange={(e) => handleUpdateFeaturedCustomer(index, 'name', e.target.value)}
                            placeholder="Enter customer name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer Photo
                          </label>
                          <ImageUpload
                            value={customer.photoUrl}
                            onChange={(url) => handleUpdateFeaturedCustomer(index, 'photoUrl', url)}
                            placeholder="Upload customer photo"
                            uploadType="profile"
                            entityId={profile?.id || 'temp'}
                            maxSize={5}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link (Optional)
                          </label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
                            <Input
                              value={customer.link || ''}
                              onChange={(e) => handleUpdateFeaturedCustomer(index, 'link', e.target.value)}
                              placeholder="https://customer-website.com or profile link"
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Link to customer's profile, website, or social media
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddFeaturedCustomer}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Featured Customer
              </Button>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-2">
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
        </div>
      </div>
    </form>
  );
}

// Default export for compatibility
export default DesignerProfileForm;

