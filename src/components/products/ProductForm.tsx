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
  Loader2
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="pl-8"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isCustomizable}
                      onChange={(e) => handleInputChange('isCustomizable', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Allow customers to customize this product
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isDigital}
                      onChange={(e) => handleInputChange('isDigital', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      This is a digital product
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight || ''}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || undefined)}
                    placeholder="0.0"
                  />
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
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add Tag
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Button type="button" onClick={handleAddSpecification} variant="outline">
                    Add Spec
                  </Button>
                </div>

                {Object.keys(formData.specifications || {}).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(formData.specifications || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <div className="flex items-center space-x-2">
                <span className="text-gray-600">{value as string}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecification(key)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
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
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">SEO Settings</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <Input
                    value={formData.seoTitle}
                    onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                    placeholder="SEO optimized title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    value={formData.seoDescription}
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

  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    price: 0,
    stockQuantity: 0,
    sku: '',
    status: 'active',
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

  const isEditMode = !!productId;

  // Load product data if editing
  useEffect(() => {
    if (productId) {
      loadProduct();
    } else {
      setLoadingProduct(false);
    }
    loadCategories();
  }, [productId]);

  const loadProduct = useCallback(async () => {
    setLoadingProduct(true);
    setError(null);
    
    try {
      console.log('Loading product:', productId);
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load product');
      }
      
      const productData = data.product;
      console.log('Product loaded:', productData);
      
      setProduct(productData);
      
      // Populate form with existing data
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        shortDescription: productData.shortDescription || '',
        categoryId: productData.categoryId || '',
        price: productData.price || 0,
        stockQuantity: productData.stockQuantity || 0,
        sku: productData.sku || '',
        status: productData.status || 'active',
        isCustomizable: productData.isCustomizable || false,
        isDigital: productData.isDigital || false,
        weight: productData.weight,
        dimensions: productData.dimensions,
        tags: productData.tags || [],
        specifications: productData.specifications || {},
        seoTitle: productData.seoTitle || '',
        seoDescription: productData.seoDescription || ''
      });
      
      // Set uploaded images from existing product
      if (productData.images && productData.images.length > 0) {
        setUploadedImages(productData.images);
      }
      
    } catch (error: any) {
      console.error('Error loading product:', error);
      setError(error.message || 'Failed to load product');
    } finally {
      setLoadingProduct(false);
    }
  }, [productId]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const handleInputChange = useCallback((field: keyof CreateProductData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEditMode ? `/api/products/${productId}` : '/api/products';
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

      const savedProduct = data.product;
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
  }, [formData, isEditMode, productId, onSave, router]);

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

  // Error state for product fetch
  if (error && isEditMode && !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Product</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={loadProduct}>
              Try Again
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-gray-600 mt-1">
                {isEditMode ? 'Update your product information' : 'Create a new product for your catalog'}
              </p>
            </div>
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

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
                productId={productId || ''}
                onImagesUploaded={(images) => {
                  setUploadedImages(prev => [...prev, ...images]);
                }}
                existingImages={uploadedImages}
                maxImages={5}
              />
              
              {!productId && (
                <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                  <p>Note: Save the product first to enable image uploads.</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Colors - Only show for existing products */}
          {productId && (
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
                  productId={productId}
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
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              <Button type="submit" loading={loading}>
                <Save className="w-4 h-4 mr-2" />
              {isEditMode ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }