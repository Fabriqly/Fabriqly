'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Store, MapPin, Phone, Mail, FileText, Clock, Image as ImageIcon, Tag, CreditCard, Package } from 'lucide-react';
import { BusinessDocument } from '@/types/applications';

interface ShopApplicationFormData {
  shopName: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
  };
  businessDocuments: BusinessDocument[];
  businessRegistrationNumber: string;
  taxId: string;
  specialties: string[];
  // Section E: Shop Profile & Branding
  profileBanner: string;
  shopLogo: string;
  tagline: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    tiktok: string;
    twitter: string;
    linkedin: string;
  };
  websiteUrl: string;
  // Section F: Categories & Tags
  shopCategory: string;
  serviceTags: string[];
  materialSpecialties: string[];
  // Section G: Payment & Transaction Details
  paymentMethods: string[];
  paymentAccountInfo: string;
  // Section H: Shop Policies
  returnPolicy: string;
  processingTime: string;
  shippingOptions: string[];
}

interface ShopApplicationFormProps {
  onCancel?: () => void;
}

export function ShopApplicationForm({ onCancel }: ShopApplicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingDocIndex, setUploadingDocIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<ShopApplicationFormData>({
    shopName: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contactInfo: {
      phone: '',
      email: ''
    },
    businessDocuments: [],
    businessRegistrationNumber: '',
    taxId: '',
    specialties: [],
    // Section E: Shop Profile & Branding
    profileBanner: '',
    shopLogo: '',
    tagline: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      tiktok: '',
      twitter: '',
      linkedin: ''
    },
    websiteUrl: '',
    // Section F: Categories & Tags
    shopCategory: '',
    serviceTags: [],
    materialSpecialties: [],
    // Section G: Payment & Transaction Details
    paymentMethods: [],
    paymentAccountInfo: '',
    // Section H: Shop Policies
    returnPolicy: '',
    processingTime: '',
    shippingOptions: []
  });

  const specialtyOptions = [
    'Screen Printing',
    'Digital Printing',
    'Embroidery',
    'Heat Transfer',
    'Sublimation',
    'DTG Printing',
    'Vinyl Printing',
    'Custom Merchandise'
  ];

  const shopCategories = [
    'Tailoring',
    'Printing',
    'Embroidery',
    'Merchandising',
    'Custom Apparel',
    'Fabric Store',
    'Design Studio',
    'Mixed Services'
  ];

  const serviceTagOptions = [
    'Custom Designs',
    'Same-day Service',
    'Eco-friendly',
    'Digital Printing',
    'Bulk Orders',
    'Rush Orders',
    'Gift Items',
    'Corporate Branding'
  ];

  const materialSpecialtyOptions = [
    'Cotton',
    'Polyester',
    'Canvas',
    'Denim',
    'Silk',
    'Linen',
    'Leather',
    'Synthetic Fabrics'
  ];

  const paymentMethodOptions = [
    'GCash',
    'PayMaya',
    'Bank Transfer',
    'Cash on Delivery',
    'Credit/Debit Card',
    'Over the Counter'
  ];

  const shippingOptionsList = [
    'Pickup',
    'Local Delivery',
    'Nationwide Shipping',
    'Courier Services',
    'Same-day Delivery'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ShopApplicationFormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => {
      const specialties = prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty];
      return { ...prev, specialties };
    });
  };

  const handleArrayToggle = (field: 'serviceTags' | 'materialSpecialties' | 'paymentMethods' | 'shippingOptions', value: string) => {
    setFormData(prev => {
      const array = prev[field];
      const newArray = array.includes(value)
        ? array.filter(item => item !== value)
        : [...array, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleImageUpload = async (file: File, type: 'banner' | 'logo') => {
    if (!file) return;

    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', type === 'banner' ? 'banner' : 'logo');

      const response = await fetch('/api/upload/shop-images', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      if (type === 'banner') {
        setFormData(prev => ({ ...prev, profileBanner: result.data.url }));
      } else {
        setFormData(prev => ({ ...prev, shopLogo: result.data.url }));
      }

    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    }
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

  const addDocumentSlot = () => {
    const newDoc: BusinessDocument = {
      id: `doc-${Date.now()}`,
      label: '',
      url: '',
      fileName: ''
    };
    setFormData(prev => ({
      ...prev,
      businessDocuments: [...prev.businessDocuments, newDoc]
    }));
  };

  const removeDocument = (docId: string) => {
    setFormData(prev => ({
      ...prev,
      businessDocuments: prev.businessDocuments.filter(doc => doc.id !== docId)
    }));
  };

  const updateDocumentLabel = (docId: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      businessDocuments: prev.businessDocuments.map(doc =>
        doc.id === docId ? { ...doc, label } : doc
      )
    }));
  };

  const handleFileUpload = async (file: File, docIndex: number) => {
    if (!file) return;

    setUploadingDocIndex(docIndex);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'permit');

      const response = await fetch('/api/upload/shop-images', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update the specific document with uploaded file info
      setFormData(prev => ({
        ...prev,
        businessDocuments: prev.businessDocuments.map((doc, idx) =>
          idx === docIndex
            ? { ...doc, url: result.data.url, fileName: file.name }
            : doc
        )
      }));

    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingDocIndex(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB for documents)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type - allow images and PDFs
      const allowedTypes = ['image/', 'application/pdf'];
      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        setError('Please select an image or PDF file');
        return;
      }

      handleFileUpload(file, docIndex);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.shopName || !formData.description) {
      setError('Shop name and description are required');
      setLoading(false);
      return;
    }

    if (formData.description.length < 20) {
      setError('Description must be at least 20 characters');
      setLoading(false);
      return;
    }

    if (!formData.address.street || !formData.address.city || !formData.address.country) {
      setError('Complete address is required (street, city, country)');
      setLoading(false);
      return;
    }

    if (!formData.contactInfo.phone || !formData.contactInfo.email) {
      setError('Phone and email are required');
      setLoading(false);
      return;
    }

    if (!formData.shopLogo) {
      setError('Shop logo is required');
      setLoading(false);
      return;
    }

    if (!formData.shopCategory) {
      setError('Shop category is required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/applications/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to my applications page with success message
        router.push('/my-applications?status=success&type=shop');
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Apply to Become a Shop Owner</h2>
          <p className="text-gray-600 mt-2">
            Fill out this application to start selling on Fabriqly. Your application will be reviewed by our admin team.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <Input
              label="Shop Name *"
              type="text"
              name="shopName"
              value={formData.shopName}
              onChange={handleInputChange}
              icon={<Store size={18} />}
              placeholder="Your shop name"
              required
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Shop Description * (min. 20 characters)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your shop, services, and what makes you unique..."
                required
              />
              <p className="text-xs text-gray-500">{formData.description.length} characters</p>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Shop Address *</h3>
            
            <Input
              label="Street Address"
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              icon={<MapPin size={18} />}
              placeholder="123 Main Street"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                placeholder="City"
                required
              />

              <Input
                label="State/Province"
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                placeholder="State"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ZIP/Postal Code"
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleInputChange}
                placeholder="12345"
              />

              <Input
                label="Country"
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={handleInputChange}
                placeholder="Country"
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information *</h3>
            
            <Input
              label="Phone Number"
              type="tel"
              name="contactInfo.phone"
              value={formData.contactInfo.phone}
              onChange={handleInputChange}
              icon={<Phone size={18} />}
              placeholder="+1 (555) 123-4567"
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="contactInfo.email"
              value={formData.contactInfo.email}
              onChange={handleInputChange}
              icon={<Mail size={18} />}
              placeholder="shop@example.com"
              required
            />
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Business Documents (optional)</h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-2">📋 Accepted Documents:</p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4">
                <li>• Business Permit / Mayor's Permit</li>
                <li>• DTI Registration (for sole proprietors)</li>
                <li>• SEC Registration (for corporations)</li>
                <li>• BIR Certificate of Registration (COR)</li>
                <li>• Barangay Clearance</li>
                <li>• Fire Safety Inspection Certificate</li>
                <li>• Any other valid business registration documents</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                💡 <strong>Tip:</strong> Providing business documents helps speed up the approval process
              </p>
            </div>

            {/* Document Upload Slots */}
            <div className="space-y-4">
              {formData.businessDocuments.map((doc, index) => (
                <div key={doc.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="space-y-3">
                    {/* Document Label */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Name/Type
                      </label>
                      <input
                        type="text"
                        value={doc.label}
                        onChange={(e) => updateDocumentLabel(doc.id, e.target.value)}
                        placeholder="e.g., DTI Registration, Business Permit, Mayor's Permit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    {/* File Upload */}
                    <div>
                      {doc.url ? (
                        <div className="flex items-start gap-3 p-3 bg-white border border-gray-300 rounded-lg">
                          {doc.url.toLowerCase().endsWith('.pdf') ? (
                            <FileText className="w-10 h-10 text-red-500 flex-shrink-0" />
                          ) : (
                            <img
                              src={doc.url}
                              alt={doc.label || 'Document preview'}
                              className="w-16 h-16 object-cover rounded border-2 border-gray-300"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.fileName}
                            </p>
                            <p className="text-xs text-green-600 mt-1">✓ Uploaded successfully</p>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              View document
                            </a>
                          </div>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(e, index)}
                            disabled={uploadingDocIndex === index}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {uploadingDocIndex === index 
                              ? 'Uploading...' 
                              : 'PDF or image (JPG, PNG, WebP) - Max 10MB'}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Remove Button */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove Document
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Document Button */}
              <button
                type="button"
                onClick={addDocumentSlot}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another Document
              </button>
            </div>

            {/* Additional Business Info */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <Input
                label="Business Registration Number"
                type="text"
                name="businessRegistrationNumber"
                value={formData.businessRegistrationNumber}
                onChange={handleInputChange}
                icon={<FileText size={18} />}
                placeholder="BRN-123456 or DTI Number"
                helpText="Your business registration or DTI number (if applicable)"
              />

              <Input
                label="Tax ID / TIN"
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                icon={<FileText size={18} />}
                placeholder="000-000-000-000"
                helpText="Your Tax Identification Number (if applicable)"
              />
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Services Offered</h3>
            <p className="text-sm text-gray-600">Select all services your shop provides</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specialtyOptions.map(specialty => (
                <label
                  key={specialty}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={() => handleSpecialtyToggle(specialty)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{specialty}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section E: Shop Profile & Branding */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Shop Profile & Branding</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Give your shop its identity and help it stand out in Explore pages
            </p>

            {/* Profile Banner */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Profile Banner (Recommended)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Shown as your shop's cover photo. Recommended size: 1200×400px
              </p>
              {formData.profileBanner ? (
                <div className="relative">
                  <img
                    src={formData.profileBanner}
                    alt="Profile Banner"
                    className="w-full h-40 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, profileBanner: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'banner');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-sm"
                />
              )}
            </div>

            {/* Shop Logo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Shop Logo * (Required)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Circular or square image. Recommended: 300×300px
              </p>
              {formData.shopLogo ? (
                <div className="relative inline-block">
                  <img
                    src={formData.shopLogo}
                    alt="Shop Logo"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, shopLogo: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'logo');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-sm"
                />
              )}
            </div>

            {/* Tagline */}
            <Input
              label="Tagline / Slogan"
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleInputChange}
              placeholder="e.g., Custom Tailoring with Passion"
              helpText="Short phrase (max 100 characters)"
              maxLength={100}
            />

            {/* Social Media Links */}
            <div className="space-y-3 pt-4">
              <label className="block text-sm font-medium text-gray-700">
                Social Media Links (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Helps users verify authenticity and engage directly
              </p>
              
              <Input
                label="Facebook"
                type="url"
                value={formData.socialMedia.facebook}
                onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                placeholder="https://facebook.com/yourshop"
              />
              <Input
                label="Instagram"
                type="url"
                value={formData.socialMedia.instagram}
                onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                placeholder="https://instagram.com/yourshop"
              />
              <Input
                label="TikTok"
                type="url"
                value={formData.socialMedia.tiktok}
                onChange={(e) => handleSocialMediaChange('tiktok', e.target.value)}
                placeholder="https://tiktok.com/@yourshop"
              />
            </div>

            {/* Website URL */}
            <Input
              label="Website URL"
              type="url"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              placeholder="https://yourshop.com"
              helpText="For existing shops with websites"
            />
          </div>

          {/* Section F: Categories & Tags */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Categories & Tags</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Makes your shop searchable and filterable in Explore
            </p>

            {/* Shop Category */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Shop Category * (Required)
              </label>
              <select
                name="shopCategory"
                value={formData.shopCategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              >
                <option value="">Select a category</option>
                {shopCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Tags */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Service Tags (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Select tags that describe your services
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {serviceTagOptions.map(tag => (
                  <label
                    key={tag}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceTags.includes(tag)}
                      onChange={() => handleArrayToggle('serviceTags', tag)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Material Specialties */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Material Specialties (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                What materials do you work with?
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {materialSpecialtyOptions.map(material => (
                  <label
                    key={material}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.materialSpecialties.includes(material)}
                      onChange={() => handleArrayToggle('materialSpecialties', material)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{material}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section G: Payment & Transaction Details */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Payment & Transaction Details</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Let customers know how they can pay you
            </p>

            {/* Payment Methods */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Preferred Payment Methods (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {paymentMethodOptions.map(method => (
                  <label
                    key={method}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.includes(method)}
                      onChange={() => handleArrayToggle('paymentMethods', method)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Account Info */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Account/Wallet Info (Optional)
              </label>
              <textarea
                name="paymentAccountInfo"
                value={formData.paymentAccountInfo}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g., GCash: 09XX-XXX-XXXX, BPI Account: XXX-XXXXXX-X"
              />
              <p className="text-xs text-gray-500">
                For future payouts (can be updated after approval)
              </p>
            </div>
          </div>

          {/* Section H: Shop Policies */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Shop Policies</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Let customers know how your shop operates
            </p>

            {/* Return Policy */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Return Policy (Optional)
              </label>
              <textarea
                name="returnPolicy"
                value={formData.returnPolicy}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g., Returns allowed within 7 days for defective items"
              />
            </div>

            {/* Processing Time */}
            <Input
              label="Processing Time"
              type="text"
              name="processingTime"
              value={formData.processingTime}
              onChange={handleInputChange}
              placeholder="e.g., 2-3 business days for standard orders"
              helpText="How long does it take to fulfill orders?"
            />

            {/* Shipping Options */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Shipping Options (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {shippingOptionsList.map(option => (
                  <label
                    key={option}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.shippingOptions.includes(option)}
                      onChange={() => handleArrayToggle('shippingOptions', option)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

