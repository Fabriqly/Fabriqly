'use client';

import { useState, FormEvent } from 'react';
import { CreateShopProfileData, BusinessType } from '@/types/shop-profile';

interface ShopProfileFormProps {
  onSubmit: (data: CreateShopProfileData) => Promise<void>;
  initialData?: Partial<CreateShopProfileData>;
  isEditing?: boolean;
}

export default function ShopProfileForm({ onSubmit, initialData, isEditing = false }: ShopProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  
  // Image preview states
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.branding?.logoUrl || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialData?.branding?.bannerUrl || null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.branding?.thumbnailUrl || null);
  
  // Form state
  const [formData, setFormData] = useState<CreateShopProfileData>({
    shopName: initialData?.shopName || '',
    username: initialData?.username || '',
    businessOwnerName: initialData?.businessOwnerName || '',
    contactInfo: {
      email: initialData?.contactInfo?.email || '',
      phone: initialData?.contactInfo?.phone || '',
    },
    location: {
      city: initialData?.location?.city || '',
      province: initialData?.location?.province || '',
      fullAddress: initialData?.location?.fullAddress || '',
      country: initialData?.location?.country || 'Philippines',
    },
    branding: {
      logoUrl: initialData?.branding?.logoUrl || '',
      bannerUrl: initialData?.branding?.bannerUrl || '',
      thumbnailUrl: initialData?.branding?.thumbnailUrl || '',
      tagline: initialData?.branding?.tagline || '',
    },
    businessDetails: {
      businessType: initialData?.businessDetails?.businessType || 'individual',
      operatingHours: initialData?.businessDetails?.operatingHours,
      registeredBusinessId: initialData?.businessDetails?.registeredBusinessId || '',
      taxId: initialData?.businessDetails?.taxId || '',
    },
    description: initialData?.description || '',
    specialties: initialData?.specialties || [],
    supportedProductCategories: initialData?.supportedProductCategories || [],
    customizationPolicy: {
      turnaroundTime: initialData?.customizationPolicy?.turnaroundTime || '',
      revisionsAllowed: initialData?.customizationPolicy?.revisionsAllowed || 2,
      rushOrderAvailable: initialData?.customizationPolicy?.rushOrderAvailable || false,
      customInstructions: initialData?.customizationPolicy?.customInstructions || '',
    },
    socialMedia: {
      facebook: initialData?.socialMedia?.facebook || '',
      instagram: initialData?.socialMedia?.instagram || '',
      tiktok: initialData?.socialMedia?.tiktok || '',
      twitter: initialData?.socialMedia?.twitter || '',
    },
    website: initialData?.website || '',
  });

  const [specialtyInput, setSpecialtyInput] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...(prev[keys[0] as keyof CreateShopProfileData] as any),
            [keys[1]]: value
          }
        };
      }
      return prev;
    });
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties?.includes(specialtyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...(prev.specialties || []), specialtyInput.trim()]
      }));
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties?.filter(s => s !== specialty) || []
    }));
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'banner' | 'thumbnail') => {
    if (!file) return;

    setUploadingImage(type);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload/shop-images', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update form data with the uploaded image URL
      handleInputChange(`branding.${type}Url`, result.data.url);

      // Update preview
      if (type === 'logo') setLogoPreview(result.data.url);
      if (type === 'banner') setBannerPreview(result.data.url);
      if (type === 'thumbnail') setThumbnailPreview(result.data.url);

    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      handleImageUpload(file, type);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save shop profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Shop Name *</label>
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => handleInputChange('shopName', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username / Handle *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="yourshop"
              pattern="[a-zA-Z0-9_-]+"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Only letters, numbers, hyphens, and underscores allowed</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Business Owner Name *</label>
            <input
              type="text"
              value={formData.businessOwnerName}
              onChange={(e) => handleInputChange('businessOwnerName', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address *</label>
            <input
              type="email"
              value={formData.contactInfo.email}
              onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.contactInfo.phone}
              onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+63 912 345 6789"
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Location</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={formData.location?.city}
                onChange={(e) => handleInputChange('location.city', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Province</label>
              <input
                type="text"
                value={formData.location?.province}
                onChange={(e) => handleInputChange('location.province', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Full Address</label>
            <textarea
              value={formData.location?.fullAddress}
              onChange={(e) => handleInputChange('location.fullAddress', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Branding */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Branding</h2>
        
        <div className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Shop Logo</label>
            <div className="flex items-start gap-4">
              {logoPreview && (
                <div className="flex-shrink-0">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  disabled={uploadingImage === 'logo'}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {uploadingImage === 'logo' ? 'Uploading...' : 'PNG, JPG, WebP or GIF (max 5MB)'}
                </p>
              </div>
            </div>
          </div>

          {/* Banner Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Shop Banner / Cover Image</label>
            <div className="space-y-2">
              {bannerPreview && (
                <div className="w-full">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'banner')}
                  disabled={uploadingImage === 'banner'}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {uploadingImage === 'banner' ? 'Uploading...' : 'Recommended size: 1200x400px (max 5MB)'}
                </p>
              </div>
            </div>
          </div>

          {/* Thumbnail Upload (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail (Optional)</label>
            <div className="flex items-start gap-4">
              {thumbnailPreview && (
                <div className="flex-shrink-0">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'thumbnail')}
                  disabled={uploadingImage === 'thumbnail'}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {uploadingImage === 'thumbnail' ? 'Uploading...' : 'Square image for shop cards (max 5MB)'}
                </p>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium mb-1">Tagline / Motto</label>
            <input
              type="text"
              value={formData.branding?.tagline}
              onChange={(e) => handleInputChange('branding.tagline', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your shop's motto"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.branding?.tagline?.length || 0}/100 characters</p>
          </div>
        </div>
      </section>

      {/* Business Details */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Business Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Business Type *</label>
            <select
              value={formData.businessDetails.businessType}
              onChange={(e) => handleInputChange('businessDetails.businessType', e.target.value as BusinessType)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="individual">Individual</option>
              <option value="msme">MSME</option>
              <option value="printing_partner">Printing Partner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Registered Business ID / Permit</label>
            <input
              type="text"
              value={formData.businessDetails.registeredBusinessId}
              onChange={(e) => handleInputChange('businessDetails.registeredBusinessId', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional for verified sellers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tax ID</label>
            <input
              type="text"
              value={formData.businessDetails.taxId}
              onChange={(e) => handleInputChange('businessDetails.taxId', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>
        </div>
      </section>

      {/* Shop Description */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Shop Description</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">About the Shop *</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              placeholder="Describe what your shop offers..."
              required
              minLength={20}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Specialties / Niches</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Custom Shirts, Mugs, Tote Bags"
              />
              <button
                type="button"
                onClick={addSpecialty}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.specialties?.map((specialty, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-2"
                >
                  {specialty}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(specialty)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Supported Product Categories */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Supported Product Categories *</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select the types of products your shop offers. This helps customers find you.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['T-Shirts', 'Hoodies', 'Caps', 'Mugs', 'Tumblers', 'Tote Bags', 'Stickers', 'Keychains', 'Posters', 'Banners', 'Business Cards', 'Phone Cases'].map((category) => (
            <label key={category} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.supportedProductCategories?.includes(category)}
                onChange={(e) => {
                  const current = formData.supportedProductCategories || [];
                  const newCategories = e.target.checked
                    ? [...current, category]
                    : current.filter(c => c !== category);
                  handleInputChange('supportedProductCategories', newCategories);
                }}
                className="rounded"
              />
              <span className="text-sm">{category}</span>
            </label>
          ))}
        </div>
        
        {formData.supportedProductCategories && formData.supportedProductCategories.length > 0 && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              ✓ Selected {formData.supportedProductCategories.length} {formData.supportedProductCategories.length === 1 ? 'category' : 'categories'}
            </p>
          </div>
        )}
        
        {(!formData.supportedProductCategories || formData.supportedProductCategories.length === 0) && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              ⚠ Please select at least one product category
            </p>
          </div>
        )}
      </section>

      {/* Customization Policy */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Customization Policy</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Turnaround Time</label>
            <input
              type="text"
              value={formData.customizationPolicy?.turnaroundTime}
              onChange={(e) => handleInputChange('customizationPolicy.turnaroundTime', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 3-5 business days"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Revisions Allowed</label>
            <input
              type="number"
              value={formData.customizationPolicy?.revisionsAllowed}
              onChange={(e) => handleInputChange('customizationPolicy.revisionsAllowed', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="10"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.customizationPolicy?.rushOrderAvailable}
              onChange={(e) => handleInputChange('customizationPolicy.rushOrderAvailable', e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm font-medium">Rush Order Available</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Custom Instructions</label>
            <textarea
              value={formData.customizationPolicy?.customInstructions}
              onChange={(e) => handleInputChange('customizationPolicy.customInstructions', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Any specific rules or instructions for customization"
            />
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Social Media & External Links</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Facebook</label>
            <input
              type="url"
              value={formData.socialMedia?.facebook}
              onChange={(e) => handleInputChange('socialMedia.facebook', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://facebook.com/yourshop"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <input
              type="url"
              value={formData.socialMedia?.instagram}
              onChange={(e) => handleInputChange('socialMedia.instagram', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://instagram.com/yourshop"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">TikTok</label>
            <input
              type="url"
              value={formData.socialMedia?.tiktok}
              onChange={(e) => handleInputChange('socialMedia.tiktok', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://tiktok.com/@yourshop"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Shop Profile' : 'Create Shop Profile'}
        </button>
      </div>
    </form>
  );
}


