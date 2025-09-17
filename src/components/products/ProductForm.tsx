'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Product, 
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
  Settings
} from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { ProductColorManager } from './ProductColorManager';
import { ImageUploader } from './ImageUploader';

interface ProductFormProps {
  product?: Product;
  onSave?: (product: Product) => void;
  onCancel?: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showColorManagement, setShowColorManagement] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
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

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    
    // If editing existing product, populate form
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription || '',
        categoryId: product.categoryId,
        price: product.price,
        stockQuantity: product.stockQuantity,
        sku: product.sku,
        status: product.status,
        isCustomizable: product.isCustomizable,
        isDigital: product.isDigital,
        weight: product.weight,
        dimensions: product.dimensions,
        tags: product.tags,
        specifications: product.specifications || {},
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || ''
      });
    }
  }, [product]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (field: keyof CreateProductData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

  const handleAddSpecification = () => {
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
  };

  const handleRemoveSpecification = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return {
        ...prev,
        specifications: newSpecs
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';
      
      // Filter out undefined values before sending to API
      const cleanFormData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined)
      );
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanFormData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      const data = await response.json();
      const savedProduct = data.product;
      
      // If this is a new product and we have images to upload
      if (!product && uploadedImages.length > 0) {
        setCreatedProductId(savedProduct.id);
        // Images will be uploaded via the ImageUploader component
        // which will be enabled after product creation
      }
      
      if (onSave) {
        onSave(savedProduct);
      } else {
        router.push('/dashboard/products');
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="text-gray-600 mt-1">
            {product ? 'Update your product information' : 'Create a new product for your catalog'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
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

          {/* Pricing & Inventory */}
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

          {/* Product Options */}
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

          {/* Product Images */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
            </div>

            <div className="space-y-4">
              <ImageUploader
                productId={product?.id || createdProductId || ''}
                onImagesUploaded={(images) => {
                  setUploadedImages(prev => [...prev, ...images]);
                }}
                existingImages={uploadedImages}
                maxImages={5}
              />
              
              {!product && !createdProductId && (
                <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                  <p>💡 <strong>Tip:</strong> Save the product first to enable image uploads.</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Colors */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Product Colors</h3>
            </div>

            <div className="space-y-4">
              {(product?.id || createdProductId) ? (
                <div className="space-y-4">
                  <ProductColorManager
                    productId={product?.id || createdProductId || ''}
                    onColorChange={() => {
                      // Color changes are handled by the ProductColorManager component
                    }}
                  />
                  <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                    <p>💡 <strong>Need more colors?</strong> <a href="/dashboard/products/colors" className="text-blue-600 hover:text-blue-800 underline">Create new colors</a> to use in your products.</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 bg-purple-50 p-3 rounded-md">
                  <p>💡 <strong>Tip:</strong> Save the product first to manage colors.</p>
                  <p>• Add different color variants for your product</p>
                  <p>• Set different prices for each color if needed</p>
                  <p>• Manage stock quantities per color</p>
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

          {/* Specifications */}
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
                        <span className="text-gray-600">{value}</span>
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

          {/* SEO */}
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

          {/* Color Management - Only show for existing products */}
          {product && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Color Management</h3>
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
                  productId={product.id}
                  onColorChange={() => {
                    // Optionally refresh product data or show notification
                  }}
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              {product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
