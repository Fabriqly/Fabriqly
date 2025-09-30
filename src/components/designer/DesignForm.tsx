'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Design, 
  CreateDesignData, 
  UpdateDesignData,
  Category 
} from '@/types/enhanced-products';
import { 
  Save, 
  X, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  DollarSign,
  Tag,
  Eye,
  Download,
  Star
} from 'lucide-react';
import { SupabaseStorageService, StorageBuckets } from '@/lib/supabase-storage';
import { CategorySelector } from '@/components/products/CategorySelector';

interface DesignFormProps {
  design?: Design;
  onSave?: (design: Design) => void;
  onCancel?: () => void;
}

export function DesignForm({ design, onSave, onCancel }: DesignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDesignData>({
    designName: '',
    description: '',
    categoryId: '',
    designFileUrl: '',
    thumbnailUrl: '',
    previewUrl: '',
    designType: 'template',
    fileFormat: 'png',
    tags: [],
    isPublic: true,
    pricing: {
      isFree: true,
      currency: 'USD'
    }
  });

  const [tagInput, setTagInput] = useState('');

  // Load categories on mount
  useEffect(() => {
    // If editing existing design, populate form
    if (design) {
      setFormData({
        designName: design.designName,
        description: design.description,
        categoryId: design.categoryId,
        designFileUrl: design.designFileUrl,
        thumbnailUrl: design.thumbnailUrl,
        previewUrl: design.previewUrl || '',
        designType: design.designType,
        fileFormat: design.fileFormat,
        tags: design.tags,
        isPublic: design.isPublic,
        pricing: design.pricing || { isFree: true, currency: 'USD' }
      });
    }
  }, [design]);

  const handleInputChange = (field: keyof CreateDesignData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePricingChange = (field: keyof NonNullable<CreateDesignData['pricing']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing!,
        [field]: value
      }
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };


  const handleFileUpload = async (file: File, type: 'design' | 'thumbnail' | 'preview') => {
    try {
      console.log(`Starting ${type} upload:`, file.name, file.size, file.type);
      setLoading(true);
      
      // Upload via server-side API to avoid RLS issues
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch('/api/designs/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      
      console.log(`Upload result for ${type}:`, result.data);
      
      if (type === 'design') {
        handleInputChange('designFileUrl', result.data.url);
      } else if (type === 'thumbnail') {
        handleInputChange('thumbnailUrl', result.data.url);
      } else if (type === 'preview') {
        handleInputChange('previewUrl', result.data.url);
      }
      
      console.log(`${type} uploaded successfully:`, result.data.url);
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      alert(`Failed to upload ${type}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = design ? `/api/designs/${design.id}` : '/api/designs';
      const method = design ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save design');
      }

      const data = await response.json();
      
      if (onSave) {
        onSave(data.design);
      } else {
        router.push('/dashboard/designs');
      }
    } catch (error: any) {
      console.error('Error saving design:', error);
      alert(error.message || 'Failed to save design');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {design ? 'Edit Design' : 'Upload New Design'}
          </h2>
          <p className="text-gray-600 mt-1">
            {design ? 'Update your design information' : 'Share your creative work with the community'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Design Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design Name *
                </label>
                <Input
                  value={formData.designName}
                  onChange={(e) => handleInputChange('designName', e.target.value)}
                  placeholder="Enter design name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <CategorySelector
                  value={formData.categoryId}
                  onChange={(categoryId) => handleInputChange('categoryId', categoryId)}
                  placeholder="Select a category"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your design, inspiration, and any special features"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design Type
                </label>
                <select
                  value={formData.designType}
                  onChange={(e) => handleInputChange('designType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="template">Template</option>
                  <option value="custom">Custom</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Format
                </label>
                <select
                  value={formData.fileFormat}
                  onChange={(e) => handleInputChange('fileFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="svg">SVG</option>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="pdf">PDF</option>
                  <option value="ai">AI</option>
                  <option value="psd">PSD</option>
                </select>
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Upload className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Design Files</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload main design file</p>
                  <input
                    type="file"
                    accept=".svg,.png,.jpg,.pdf,.ai,.psd"
                    onChange={(e) => {
                      console.log('Design file input changed:', e.target.files);
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], 'design');
                      }
                    }}
                    className="hidden"
                    id="design-file"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('design-file')?.click()}
                  >
                    Choose File
                  </Button>
                  {formData.designFileUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600">✓ File uploaded</p>
                      {formData.designFileUrl.match(/\.(jpg|jpeg|png|gif|svg)$/i) && (
                        <img 
                          src={formData.designFileUrl} 
                          alt="Design preview" 
                          className="mt-2 max-w-full h-32 object-contain border rounded"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload thumbnail</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      console.log('Thumbnail file input changed:', e.target.files);
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], 'thumbnail');
                      }
                    }}
                    className="hidden"
                    id="thumbnail-file"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('thumbnail-file')?.click()}
                  >
                    Choose File
                  </Button>
                  {formData.thumbnailUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600">✓ Thumbnail uploaded</p>
                      <img 
                        src={formData.thumbnailUrl} 
                        alt="Thumbnail preview" 
                        className="mt-2 max-w-full h-32 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload preview</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      console.log('Preview file input changed:', e.target.files);
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], 'preview');
                      }
                    }}
                    className="hidden"
                    id="preview-file"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('preview-file')?.click()}
                  >
                    Choose File
                  </Button>
                  {formData.previewUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600">✓ Preview uploaded</p>
                      <img 
                        src={formData.previewUrl} 
                        alt="Preview" 
                        className="mt-2 max-w-full h-32 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.pricing?.isFree}
                  onChange={(e) => handlePricingChange('isFree', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  This design is free to download
                </span>
              </label>

              {!formData.pricing?.isFree && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricing?.price || ''}
                        onChange={(e) => handlePricingChange('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.pricing?.currency || 'USD'}
                      onChange={(e) => handlePricingChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Tag className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
            </div>

            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add Tag
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-orange-600 hover:text-orange-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Eye className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Visibility</h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Make this design public (visible to everyone)
                </span>
              </label>
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
              {design ? 'Update Design' : 'Upload Design'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
