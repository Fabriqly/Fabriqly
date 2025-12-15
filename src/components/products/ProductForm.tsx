'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
  import { useRouter } from 'next/navigation';
  import { useSession } from 'next-auth/react';
  import { Button } from '@/components/ui/Button';
  import { Input } from '@/components/ui/Input';
  import { 
    Product, 
  ProductWithDetails,
    CreateProductData, 
    UpdateProductData, 
    Category,
    ProductStatus,
    ProductVariantOption
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
  Send,
  Plus,
  Trash2
  } from 'lucide-react';
  import { CategorySelector } from './CategorySelector';
  import { ProductColorManager } from './ProductColorManager';
  import { ProductVariantManager } from './ProductVariantManager';
  import { ImageUploader } from './ImageUploader';

  interface ProductFormProps {
  productId?: string;
  onSave?: (product: ProductWithDetails) => void;
    onCancel?: () => void;
  }

// Break down the form into smaller components for better maintainability
const BasicInfoSection = ({ formData, handleInputChange, categories, shops, loadingShops }: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center space-x-2 mb-6">
      <Package className="w-5 h-5 text-blue-600" />
      <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
    </div>
    <div className="space-y-6">

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shop (Optional)
                  </label>
                  {loadingShops ? (
                    <div className="text-sm text-gray-500">Loading shops...</div>
                  ) : (
                    <select
                      value={formData.shopId || ''}
                      onChange={(e) => handleInputChange('shopId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No shop (personal product)</option>
                      {shops.map((shop: any) => (
                        <option key={shop.id} value={shop.id}>
                          {shop.shopName} (@{shop.username})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Associate this product with one of your shops or keep it as a personal product
                  </p>
                </div>
              </div>
    </div>
  </div>
);

const PricingInventorySection = ({ formData, handleInputChange }: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center space-x-2 mb-6">
      <DollarSign className="w-5 h-5 text-green-600" />
      <h3 className="text-lg font-bold text-gray-900">Pricing & Inventory</h3>
    </div>
    <div className="space-y-6">

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price *
        </label>
        <Input
          type="number"
          value={formData.price === 0 ? '' : formData.price}
          onChange={(e) => {
            const val = e.target.value;
            handleInputChange('price', val === '' ? 0 : parseFloat(val) || 0);
          }}
          onBlur={(e) => {
            if (e.target.value === '') {
              handleInputChange('price', 0);
            }
          }}
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
          value={formData.stockQuantity === 0 ? '' : formData.stockQuantity}
          onChange={(e) => {
            const val = e.target.value;
            handleInputChange('stockQuantity', val === '' ? 0 : parseInt(val) || 0);
          }}
          onBlur={(e) => {
            if (e.target.value === '') {
              handleInputChange('stockQuantity', 0);
            }
          }}
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
  </div>
);

const ProductOptionsSection = ({ formData, handleInputChange }: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center space-x-2 mb-6">
      <Settings className="w-5 h-5 text-purple-600" />
      <h3 className="text-lg font-bold text-gray-900">Product Options</h3>
    </div>
    <div className="space-y-6">

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
  </div>
);

const TagsSection = ({ formData, handleInputChange, tagInput, setTagInput, handleAddTag, handleRemoveTag }: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center space-x-2 mb-6">
      <Tag className="w-5 h-5 text-orange-600" />
      <h3 className="text-lg font-bold text-gray-900">Tags</h3>
    </div>
    <div className="space-y-6">

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
  </div>
);

const SpecificationsSection = ({ formData, handleInputChange, specKey, setSpecKey, specValue, setSpecValue, handleAddSpecification, handleRemoveSpecification }: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center space-x-2 mb-6">
      <FileText className="w-5 h-5 text-indigo-600" />
      <h3 className="text-lg font-bold text-gray-900">Specifications</h3>
    </div>
    <div className="space-y-6">

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
  </div>
);

const VariantsSection = ({ 
  formData, 
  handleInputChange, 
  handleAddDesign, 
  handleRemoveDesign, 
  handleUpdateDesign,
  handleAddSize, 
  handleRemoveSize, 
  handleUpdateSize 
}: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center space-x-2 mb-6">
      <Settings className="w-5 h-5 text-indigo-600" />
      <h3 className="text-lg font-bold text-gray-900">Product Variants</h3>
    </div>
    <div className="space-y-6">
      {/* Design Variants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Design Variants
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDesign}
            className="flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Design</span>
          </Button>
        </div>
        
        <div className="space-y-2">
          {formData.designs && formData.designs.length > 0 ? (
            formData.designs.map((design: ProductVariantOption, index: number) => (
              <div key={design.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    value={design.name}
                    onChange={(e) => handleUpdateDesign(index, 'name', e.target.value)}
                    placeholder="Design name (e.g., Sunset Vibe)"
                    className="bg-white"
                  />
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={design.priceModifier === 0 ? '' : design.priceModifier}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateDesign(index, 'priceModifier', val === '' ? 0 : parseFloat(val) || 0);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          handleUpdateDesign(index, 'priceModifier', 0);
                        }
                      }}
                      placeholder="Extra price (₱)"
                      className="bg-white pl-9"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveDesign(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No design variants added yet</p>
          )}
        </div>
      </div>

      {/* Size Variants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Size Variants
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSize}
            className="flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Size</span>
          </Button>
        </div>
        
        <div className="space-y-2">
          {formData.sizes && formData.sizes.length > 0 ? (
            formData.sizes.map((size: ProductVariantOption, index: number) => (
              <div key={size.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    value={size.name}
                    onChange={(e) => handleUpdateSize(index, 'name', e.target.value)}
                    placeholder="Size name (e.g., XL)"
                    className="bg-white"
                  />
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={size.priceModifier === 0 ? '' : size.priceModifier}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateSize(index, 'priceModifier', val === '' ? 0 : parseFloat(val) || 0);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          handleUpdateSize(index, 'priceModifier', 0);
                        }
                      }}
                      placeholder="Extra price (₱)"
                      className="bg-white pl-9"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveSize(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No size variants added yet</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const SEOSection = ({ formData, handleInputChange }: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center space-x-2 mb-6">
      <Settings className="w-5 h-5 text-teal-600" />
      <h3 className="text-lg font-bold text-gray-900">SEO Settings</h3>
    </div>
    <div className="space-y-6">

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
  </div>
);

export function ProductForm({ productId, onSave, onCancel }: ProductFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(!!productId);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [showColorManagement, setShowColorManagement] = useState(false);
  const [showVariantManagement, setShowVariantManagement] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [isDraftCreated, setIsDraftCreated] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | undefined>(productId);
  const [pendingColors, setPendingColors] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    price: 0,
    stockQuantity: 0,
    sku: '',
    shopId: '',
    status: 'draft', // Default to draft for new products
    isCustomizable: false,
    isDigital: false,
    tags: [],
    designs: [],
    sizes: [],
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
        shopId: productData.shopId || '',
        status: productData.status || 'draft',
        isCustomizable: productData.isCustomizable || false,
        isDigital: productData.isDigital || false,
        tags: productData.tags || [],
        designs: productData.designs || [],
        sizes: productData.sizes || [],
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

  const loadUserShops = useCallback(async () => {
    if (!session?.user?.id) {
      console.log('No user session available for loading shops');
      return;
    }

    setLoadingShops(true);
    try {
      // Use the user-specific endpoint to get only the current user's shop
      const response = await fetch(`/api/shop-profiles/user/${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        // If user has a shop, add it to the shops array
        if (data.success && data.data) {
          // Only include approved shops
          if (data.data.approvalStatus === 'approved') {
            setShops([data.data]);
          } else {
            console.log('User shop is not approved yet:', data.data.approvalStatus);
            setShops([]);
          }
        } else {
          setShops([]);
        }
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      setShops([]);
    } finally {
      setLoadingShops(false);
    }
  }, [session?.user?.id]);

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
  }, [isEditMode, currentProductId, loadProduct, loadCategories]);

  // Load user shops when session is available
  useEffect(() => {
    if (session?.user?.id) {
      loadUserShops();
    }
  }, [session?.user?.id, loadUserShops]);

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

  // Variant handlers
  const handleAddDesign = useCallback(() => {
    const newDesign: ProductVariantOption = {
      id: `design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      priceModifier: 0
    };
    setFormData(prev => ({
      ...prev,
      designs: [...(prev.designs || []), newDesign]
    }));
  }, []);

  const handleRemoveDesign = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      designs: prev.designs?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const handleUpdateDesign = useCallback((index: number, field: 'name' | 'priceModifier', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      designs: prev.designs?.map((design, i) => 
        i === index ? { ...design, [field]: value } : design
      ) || []
    }));
  }, []);

  const handleAddSize = useCallback(() => {
    const newSize: ProductVariantOption = {
      id: `size-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      priceModifier: 0
    };
    setFormData(prev => ({
      ...prev,
      sizes: [...(prev.sizes || []), newSize]
    }));
  }, []);

  const handleRemoveSize = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const handleUpdateSize = useCallback((index: number, field: 'name' | 'priceModifier', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes?.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      ) || []
    }));
  }, []);

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

      // Clean the data to prevent Firebase fieldPath errors
      const draftData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        status: 'draft' as ProductStatus,
        price: formData.price || 0,
        stockQuantity: formData.stockQuantity || 0,
        isCustomizable: formData.isCustomizable || false,
        isDigital: formData.isDigital || false,
      };

      // Only include optional fields if they have values
      if (formData.shortDescription?.trim()) {
        draftData.shortDescription = formData.shortDescription.trim();
      }
      if (formData.sku?.trim()) {
        draftData.sku = formData.sku.trim();
      }
      if (formData.shopId?.trim()) {
        draftData.shopId = formData.shopId.trim();
      }
      if (formData.weight && formData.weight > 0) {
        draftData.weight = formData.weight;
      }
      if (formData.tags && formData.tags.length > 0) {
        draftData.tags = formData.tags.filter(tag => tag.trim().length > 0);
      }
      // Clean specifications to remove empty keys and invalid field paths
      if (formData.specifications && Object.keys(formData.specifications).length > 0) {
        const cleanedSpecs: Record<string, any> = {};
        for (const [key, value] of Object.entries(formData.specifications)) {
          // Only include non-empty keys (Firestore doesn't allow empty field paths)
          if (key && key.trim().length > 0 && value !== undefined && value !== null && value !== '') {
            // Validate key doesn't contain invalid characters for Firestore field paths
            // Firestore field paths can contain letters, numbers, and underscores, but not dots at the start
            const validKey = key.trim().replace(/^\.+/, '').replace(/[^a-zA-Z0-9_]/g, '_');
            if (validKey.length > 0) {
              cleanedSpecs[validKey] = value;
            }
          }
        }
        if (Object.keys(cleanedSpecs).length > 0) {
          draftData.specifications = cleanedSpecs;
        }
      }
      if (formData.seoTitle?.trim()) {
        draftData.seoTitle = formData.seoTitle.trim();
      }
      if (formData.seoDescription?.trim()) {
        draftData.seoDescription = formData.seoDescription.trim();
      }
      if (formData.designs && Array.isArray(formData.designs) && formData.designs.length > 0) {
        draftData.designs = formData.designs;
      }
      if (formData.sizes && Array.isArray(formData.sizes) && formData.sizes.length > 0) {
        draftData.sizes = formData.sizes;
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle different error response formats
        let errorMessage = 'Failed to create draft product';
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.error.code) {
            errorMessage = errorData.error.code;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        console.error('Draft creation failed:', errorMessage, 'Full response:', errorData);
        throw new Error(errorMessage);
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
      // But explicitly include designs and sizes even if empty arrays
      const cleanFormData = Object.fromEntries(
        Object.entries(formData).filter(([key, value]) => {
          // Always include designs and sizes, even if empty arrays
          if (key === 'designs' || key === 'sizes') {
            return true;
          }
          // Filter out undefined and empty strings for other fields
          return value !== undefined && value !== '';
        })
      );
      
      // Ensure designs and sizes are always included (as arrays, even if empty)
      if (!cleanFormData.designs) {
        cleanFormData.designs = [];
      }
      if (!cleanFormData.sizes) {
        cleanFormData.sizes = [];
      }
      
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
        // Handle different error response formats
        let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} product`;
        if (data.error) {
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error.message) {
            errorMessage = data.error.message;
          } else if (data.error.code) {
            errorMessage = data.error.code;
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
        console.error('Product operation failed:', errorMessage, 'Full response:', data);
        throw new Error(errorMessage);
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

      const data = await response.json();
      
      if (!response.ok) {
        // Handle different error response formats
        let errorMessage = 'Failed to publish product';
        if (data.error) {
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error.message) {
            errorMessage = data.error.message;
          } else if (data.error.code) {
            errorMessage = data.error.code;
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
        console.error('Publish failed:', errorMessage, 'Full response:', data);
        throw new Error(errorMessage);
      }
      // The API returns { product: updatedProduct, message: '...' }
      const updatedProduct = data.product || data.data;
      
      if (!updatedProduct) {
        console.error('No product data in response:', data);
        throw new Error('Invalid response: product data not found');
      }
      
      console.log('Product published successfully:', updatedProduct.id);
      
      // Update local state
      setFormData(prev => ({ ...prev, status: 'active' }));
      
      if (onSave) {
        onSave(updatedProduct);
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
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

          {/* Split View Layout */}
          <div className="flex flex-col lg:flex-row gap-6 p-6 overflow-x-hidden">
            {/* Left Column - Image Upload and Product Colors (Sticky on Desktop, Hidden on Mobile) */}
            <div className="hidden lg:block w-full lg:w-1/3 lg:sticky lg:top-6 lg:self-start space-y-6 max-w-full overflow-x-hidden">
              {/* Product Images Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Product Images</h3>
                </div>

                <div className="space-y-4">
                  <ImageUploader
                    productId={currentProductId || ''}
                    onImagesUploaded={(images) => {
                      setUploadedImages(images);
                    }}
                    existingImages={uploadedImages}
                    maxImages={5}
                    onCreateDraft={createDraftProduct}
                    disabled={!formData.name.trim() || !formData.description.trim() || !formData.categoryId}
                  />
                  
                  {!currentProductId && !isDraftCreated && (
                    <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 p-3 rounded-md">
                      <p className="flex items-start">
                        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Tip:</strong> Fill in the basic information and save to enable image uploads, or upload images will create a draft product automatically.</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Colors Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full max-w-full overflow-x-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Product Colors</h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      // If no productId exists, create a draft first
                      if (!currentProductId) {
                        try {
                          const draftId = await createDraftProduct();
                          if (draftId) {
                            setCurrentProductId(draftId);
                            setIsDraftCreated(true);
                            setShowColorManagement(true);
                          } else {
                            alert('Please fill in name, description, and category to enable color management.');
                            return;
                          }
                        } catch (error: any) {
                          alert(error.message || 'Failed to create draft product');
                          return;
                        }
                      } else {
                        setShowColorManagement(!showColorManagement);
                      }
                    }}
                  >
                    {showColorManagement ? 'Hide' : 'Manage'}
                  </Button>
                </div>

                {showColorManagement && currentProductId && (
                  <div className="mt-4 w-full">
                    <ProductColorManager
                      productId={currentProductId}
                      onColorChange={() => {
                        // Optionally refresh product data or show notification
                      }}
                    />
                  </div>
                )}

                {showColorManagement && !currentProductId && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    <p>Creating draft product...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Form Details (Scrollable) */}
            <div className="w-full lg:w-2/3 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
            <BasicInfoSection 
              formData={formData} 
              handleInputChange={handleInputChange} 
              categories={categories}
              shops={shops}
              loadingShops={loadingShops}
            />

            <PricingInventorySection 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />

            <ProductOptionsSection 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />


            <TagsSection 
              formData={formData}
              handleInputChange={handleInputChange}
              tagInput={tagInput}
              setTagInput={setTagInput}
              handleAddTag={handleAddTag}
              handleRemoveTag={handleRemoveTag}
            />

            <VariantsSection
              formData={formData}
              handleInputChange={handleInputChange}
              handleAddDesign={handleAddDesign}
              handleRemoveDesign={handleRemoveDesign}
              handleUpdateDesign={handleUpdateDesign}
              handleAddSize={handleAddSize}
              handleRemoveSize={handleRemoveSize}
              handleUpdateSize={handleUpdateSize}
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

            {/* Mobile Only - Image Upload Section (Placed at the end) */}
            <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Product Images</h3>
              </div>

              <div className="space-y-4">
                <ImageUploader
                  productId={currentProductId || ''}
                  onImagesUploaded={(images) => {
                    setUploadedImages(images);
                  }}
                  existingImages={uploadedImages}
                  maxImages={5}
                  onCreateDraft={createDraftProduct}
                  disabled={!formData.name.trim() || !formData.description.trim() || !formData.categoryId}
                />
                
                {!currentProductId && !isDraftCreated && (
                  <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 p-3 rounded-md">
                    <p className="flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Tip:</strong> Fill in the basic information and save to enable image uploads, or upload images will create a draft product automatically.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

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
    </div>
    );
  }