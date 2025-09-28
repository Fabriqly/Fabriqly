'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
  import { useRouter } from 'next/navigation';
  import { Button } from '@/components/ui/Button';
  import { Input } from '@/components/ui/Input';
  import { 
    Product, 
  ProductWithDetails,
    CreateProductData, 
    UpdateProductData, 
    Category,
    ProductStatus 
  } from '@/types/products';
  import { 
    Save, 
    X, 
    Upload, 
    Image as ImageIcon, 
    Package, 
    DollarSign,
    Tag,
    FileText,
  Settings,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Eye,
  Send
  } from 'lucide-react';
  import { CategorySelector } from './CategorySelector';
  import { ProductColorManager } from './ProductColorManager';
  import { ImageUploader } from './ImageUploader';

  interface ProductFormProps {
  productId?: string;
  onSave?: (product: ProductWithDetails) => void;
    onCancel?: () => void;
  }

// Break down the form into smaller components for better maintainability
const BasicInfoSection = ({ formData, handleInputChange, categories }: any) => (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                  </label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Product code (auto-generated if empty)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <Input
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Brief description for product cards"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed product description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
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
);

const PricingInventorySection = ({ formData, handleInputChange }: any) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2 mb-4">
      <DollarSign className="w-5 h-5 text-green-600" />
      <h3 className="text-lg font-semibold text-gray-900">Pricing & Inventory</h3>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price *
        </label>
        <Input
          type="number"
          value={formData.price}
          onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stock Quantity *
        </label>
        <Input
          type="number"
          value={formData.stockQuantity}
          onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
          placeholder="0"
          min="0"
          required
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Weight (kg)
        </label>
        <Input
          type="number"
          value={formData.weight || ''}
          onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || null)}
          placeholder="0.0"
          min="0"
          step="0.1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value as ProductStatus)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>
    </div>
  </div>
);

const ProductOptionsSection = ({ formData, handleInputChange }: any) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2 mb-4">
      <Settings className="w-5 h-5 text-purple-600" />
      <h3 className="text-lg font-semibold text-gray-900">Product Options</h3>
    </div>

    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="isCustomizable"
          checked={formData.isCustomizable}
          onChange={(e) => handleInputChange('isCustomizable', e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isCustomizable" className="text-sm font-medium text-gray-700">
          Allow customization
        </label>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="isDigital"
          checked={formData.isDigital}
          onChange={(e) => handleInputChange('isDigital', e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isDigital" className="text-sm font-medium text-gray-700">
          Digital product
        </label>
      </div>
    </div>
  </div>
);

const TagsSection = ({ formData, handleInputChange, tagInput, setTagInput, handleAddTag, handleRemoveTag }: any) => (
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
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTag();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAddTag}
          disabled={!tagInput.trim()}
        >
          Add
        </Button>
      </div>

      {formData.tags && formData.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(index)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

const SpecificationsSection = ({ formData, handleInputChange, specKey, setSpecKey, specValue, setSpecValue, handleAddSpecification, handleRemoveSpecification }: any) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2 mb-4">
      <FileText className="w-5 h-5 text-indigo-600" />
      <h3 className="text-lg font-semibold text-gray-900">Specifications</h3>
    </div>

    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={specKey}
          onChange={(e) => setSpecKey(e.target.value)}
          placeholder="Specification name"
        />
        <Input
          value={specValue}
          onChange={(e) => setSpecValue(e.target.value)}
          placeholder="Specification value"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleAddSpecification}
        disabled={!specKey.trim() || !specValue.trim()}
      >
        Add Specification
      </Button>

      {formData.specifications && Object.keys(formData.specifications).length > 0 && (
        <div className="space-y-2">
          {Object.entries(formData.specifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">
                <strong>{key}:</strong> {value as string}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveSpecification(key)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const SEOSection = ({ formData, handleInputChange }: any) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2 mb-4">
      <Settings className="w-5 h-5 text-teal-600" />
      <h3 className="text-lg font-semibold text-gray-900">SEO Settings</h3>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SEO Title
        </label>
        <Input
          value={formData.seoTitle || ''}
          onChange={(e) => handleInputChange('seoTitle', e.target.value)}
          placeholder="SEO optimized title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SEO Description
        </label>
        <textarea
          value={formData.seoDescription || ''}
          onChange={(e) => handleInputChange('seoDescription', e.target.value)}
          placeholder="SEO optimized description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>
    </div>
  </div>
);

export function ProductForm({ productId, onSave, onCancel }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(!!productId);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showColorManagement, setShowColorManagement] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [isDraftCreated, setIsDraftCreated] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | undefined>(productId);

  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    price: 0,
    stockQuantity: 0,
    sku: '',
    status: 'draft', // Default to draft for new products
    isCustomizable: false,
    isDigital: false,
    tags: [],
    specifications: {},
    seoTitle: '',
    seoDescription: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  const isEditMode = !!currentProductId;

  const loadProduct = useCallback(async () => {
    setLoadingProduct(true);
    setError(null);
    
    try {
      console.log('Loading product:', currentProductId);
      const response = await fetch(`/api/products/${currentProductId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load product');
      }
      
      const data = await response.json();
      debugApiResponse(data, 'loadProduct');
      
      const productData = data.data;
      
      if (!productData) {
        throw new Error('Product data not found in response');
      }
      
      console.log('Product loaded:', productData);
      
      setProduct(productData);
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        shortDescription: productData.shortDescription || '',
        categoryId: productData.categoryId || '',
        price: productData.price || 0,
        stockQuantity: productData.stockQuantity || 0,
        sku: productData.sku || '',
        status: productData.status || 'draft',
        isCustomizable: productData.isCustomizable || false,
        isDigital: productData.isDigital || false,
        tags: productData.tags || [],
        specifications: productData.specifications || {},
        seoTitle: productData.seoTitle || '',
        seoDescription: productData.seoDescription || ''
      });
      
      setUploadedImages(productData.images || []);
    } catch (error: any) {
      console.error('Error loading product:', error);
      setError(error.message || 'Failed to load product');
    } finally {
      setLoadingProduct(false);
    }
  }, [currentProductId]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  // Update currentProductId when productId prop changes
  useEffect(() => {
    setCurrentProductId(productId);
  }, [productId]);

  // Load product data if editing
  useEffect(() => {
    if (isEditMode && currentProductId) {
      loadProduct();
    } else {
      setLoadingProduct(false);
    }
    loadCategories();
  }, [isEditMode, currentProductId]);

  const handleInputChange = useCallback((field: keyof CreateProductData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  }, [tagInput]);

  const handleRemoveTag = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const handleAddSpecification = useCallback(() => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey.trim()]: specValue.trim()
        }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  }, [specKey, specValue]);

  const handleRemoveSpecification = useCallback((key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return {
        ...prev,
        specifications: newSpecs
      };
    });
  }, []);

  // Debug helper for API responses
  const debugApiResponse = (response: any, context: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response (${context}):`, response);
    }
  };

  // Create draft product for image uploads
  const createDraftProduct = useCallback(async () => {
    if (isDraftCreated || currentProductId) return currentProductId;

    try {
      // Validate minimum required fields for draft
      if (!formData.name.trim() || !formData.description.trim() || !formData.categoryId) {
        throw new Error('Please fill in name, description, and category to enable image uploads');
      }

      const draftData = {
        ...formData,
        status: 'draft' as ProductStatus,
        price: formData.price || 0,
        stockQuantity: formData.stockQuantity || 0
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create draft product');
      }

      const data = await response.json();
      debugApiResponse(data, 'createDraftProduct');
      
      // Handle ResponseBuilder structure: { success: true, data: product, meta: {...} }
      const draftProduct = data.data;
      
      if (!draftProduct || !draftProduct.id) {
        throw new Error('Invalid response: Product ID not found');
      }
      
      console.log('Draft product created:', draftProduct.id);
      setIsDraftCreated(true);
      setCurrentProductId(draftProduct.id); // Update the current product ID
      
      return draftProduct.id;
    } catch (error: any) {
      console.error('Error creating draft product:', error);
      setError(error.message || 'Failed to create draft product');
      return null;
    }
  }, [formData, isDraftCreated, currentProductId]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEditMode ? `/api/products/${currentProductId}` : '/api/products';
      const method = isEditMode ? 'PUT' : 'POST';
      
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Product name is required');
      }
      
      if (!formData.description.trim()) {
        throw new Error('Product description is required');
      }
      
      if (!formData.categoryId) {
        throw new Error('Please select a category');
      }
      
      if (formData.price < 0) {
        throw new Error('Price must be a positive number');
      }
      
      // Filter out undefined values and prepare clean data
      const cleanFormData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined && value !== '')
      );
      
      console.log(`${isEditMode ? 'Updating' : 'Creating'} product:`, cleanFormData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanFormData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      }

      const savedProduct = data.data;
      console.log(`Product ${isEditMode ? 'updated' : 'created'} successfully:`, savedProduct.id);
      
      if (onSave) {
        onSave(savedProduct);
      } else {
        router.push('/dashboard/products');
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error);
      setError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  }, [formData, isEditMode, currentProductId, onSave, router]);

  // Publish draft product
  const handlePublish = useCallback(async () => {
    if (!currentProductId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${currentProductId}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish product');
      }

      const data = await response.json();
      console.log('Product published successfully:', data.data.id);
      
      // Update local state
      setFormData(prev => ({ ...prev, status: 'active' }));
      
      if (onSave) {
        onSave(data.data);
      } else {
        router.push('/dashboard/products');
      }
    } catch (error: any) {
      console.error('Error publishing product:', error);
      setError(error.message || 'Failed to publish product');
    } finally {
      setLoading(false);
    }
  }, [currentProductId, onSave, router]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/dashboard/products');
    }
  }, [onCancel, router]);

  // Loading state for product fetch
  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Product' : 'Create Product'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEditMode ? 'Update your product information' : 'Add a new product to your catalog'}
                  </p>
                </div>
              </div>
              
              {product?.status === 'draft' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    Draft
                  </span>
                  <Button
                    onClick={handlePublish}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4" />
                    <span>Publish</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <BasicInfoSection 
              formData={formData} 
              handleInputChange={handleInputChange} 
              categories={categories} 
            />

            <PricingInventorySection 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />

            <ProductOptionsSection 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />

            {/* Product Images */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
              </div>

              <div className="space-y-4">
                <ImageUploader
                  productId={currentProductId || ''}
                  onImagesUploaded={(images) => {
                    setUploadedImages(prev => [...prev, ...images]);
                  }}
                  existingImages={uploadedImages}
                  maxImages={5}
                  onCreateDraft={createDraftProduct}
                />
                
                {!currentProductId && !isDraftCreated && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                    <p>💡 <strong>Tip:</strong> Fill in the basic information above and save to enable image uploads, or upload images will create a draft product automatically.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Colors - Only show for existing products */}
            {currentProductId && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Product Colors</h3>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowColorManagement(!showColorManagement)}
                    >
                      {showColorManagement ? 'Hide Colors' : 'Manage Colors'}
                    </Button>
                  </div>

                  {showColorManagement && (
                    <ProductColorManager
                    productId={currentProductId}
                      onColorChange={() => {
                        // Optionally refresh product data or show notification
                      }}
                    />
                  )}
                </div>
              )}

            <TagsSection 
              formData={formData}
              handleInputChange={handleInputChange}
              tagInput={tagInput}
              setTagInput={setTagInput}
              handleAddTag={handleAddTag}
              handleRemoveTag={handleRemoveTag}
            />

            <SpecificationsSection 
              formData={formData}
              handleInputChange={handleInputChange}
              specKey={specKey}
              setSpecKey={setSpecKey}
              specValue={specValue}
              setSpecValue={setSpecValue}
              handleAddSpecification={handleAddSpecification}
              handleRemoveSpecification={handleRemoveSpecification}
            />

            <SEOSection 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isEditMode ? 'Update Product' : 'Save Product'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }