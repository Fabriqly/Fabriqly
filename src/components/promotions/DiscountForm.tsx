'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Discount, CreateDiscountData, DiscountType, DiscountScope } from '@/types/promotion';
import { Product } from '@/types/products';
import { Category } from '@/types/products';
import { X, Search, Check, Loader2 } from 'lucide-react';

interface DiscountFormProps {
  discount?: Discount | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DiscountForm({ discount, onClose, onSuccess }: DiscountFormProps) {
  const [formData, setFormData] = useState<CreateDiscountData>({
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    scope: 'order',
    targetIds: [],
    minOrderAmount: undefined,
    maxDiscountAmount: undefined,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [categorySearchResults, setCategorySearchResults] = useState<Category[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showCategorySearch, setShowCategorySearch] = useState(false);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [searchingCategories, setSearchingCategories] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  // Load products and categories when editing
  useEffect(() => {
    const loadSelectedItems = async () => {
      if (discount && discount.targetIds && discount.targetIds.length > 0) {
        if (discount.scope === 'product') {
          // Fetch product details for selected IDs
          try {
            const products = await Promise.all(
              discount.targetIds.map(async (id) => {
                try {
                  const response = await fetch(`/api/products/${id}`);
                  const data = await response.json();
                  if (response.ok && data.success) {
                    return data.data;
                  }
                  return null;
                } catch {
                  return null;
                }
              })
            );
            setSelectedProducts(products.filter(Boolean) as Product[]);
          } catch (error) {
            console.error('Error loading selected products:', error);
          }
        } else if (discount.scope === 'category') {
          // Fetch category details for selected IDs
          try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            if (response.ok && data.success) {
              const allCategories = data.data.categories || [];
              const selected = allCategories.filter((cat: Category) => 
                discount.targetIds?.includes(cat.id)
              );
              setSelectedCategories(selected);
            }
          } catch (error) {
            console.error('Error loading selected categories:', error);
          }
        }
      }
    };

    loadSelectedItems();
  }, [discount]);

  useEffect(() => {
    if (discount) {
      // Helper function to convert various date formats to YYYY-MM-DD
      const formatDateForInput = (date: any): string => {
        if (!date) return new Date().toISOString().split('T')[0];
        
        // If it's already a Date object
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        
        // If it's a Firestore Timestamp (has toDate method)
        if (date && typeof date.toDate === 'function') {
          return date.toDate().toISOString().split('T')[0];
        }
        
        // If it's a string, try to parse it
        if (typeof date === 'string') {
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
        }
        
        // If it's an object with seconds (Firestore Timestamp format)
        if (date && typeof date.seconds === 'number') {
          return new Date(date.seconds * 1000).toISOString().split('T')[0];
        }
        
        // Fallback to current date
        return new Date().toISOString().split('T')[0];
      };

      setFormData({
        name: discount.name,
        description: discount.description || '',
        type: discount.type,
        value: discount.value,
        scope: discount.scope,
        targetIds: discount.targetIds || [],
        minOrderAmount: discount.minOrderAmount,
        maxDiscountAmount: discount.maxDiscountAmount,
        startDate: formatDateForInput(discount.startDate),
        endDate: formatDateForInput(discount.endDate),
        usageLimit: discount.usageLimit,
      });
    }
  }, [discount]);

  // Update targetIds when selected products/categories change
  useEffect(() => {
    if (formData.scope === 'product') {
      const ids = selectedProducts.map(p => p.id);
      if (JSON.stringify(ids) !== JSON.stringify(formData.targetIds || [])) {
        setFormData(prev => ({
          ...prev,
          targetIds: ids
        }));
      }
    } else if (formData.scope === 'category') {
      const ids = selectedCategories.map(c => c.id);
      if (JSON.stringify(ids) !== JSON.stringify(formData.targetIds || [])) {
        setFormData(prev => ({
          ...prev,
          targetIds: ids
        }));
      }
    }
  }, [selectedProducts, selectedCategories]);

  // Clear selections when scope changes
  useEffect(() => {
    if (formData.scope !== 'product') {
      setSelectedProducts([]);
      setProductSearchTerm('');
      setShowProductSearch(false);
    }
    if (formData.scope !== 'category') {
      setSelectedCategories([]);
      setCategorySearchTerm('');
      setShowCategorySearch(false);
    }
  }, [formData.scope]);

  // Search products
  useEffect(() => {
    if (productSearchTerm.length > 0 && showProductSearch) {
      const searchProducts = async () => {
        setSearchingProducts(true);
        try {
          const response = await fetch(`/api/products?search=${encodeURIComponent(productSearchTerm)}&limit=10&status=active`);
          const data = await response.json();
          if (response.ok && data.success) {
            setProductSearchResults(data.data.products || []);
          } else {
            setProductSearchResults([]);
          }
        } catch (error) {
          console.error('Error searching products:', error);
          setProductSearchResults([]);
        } finally {
          setSearchingProducts(false);
        }
      };

      const timeoutId = setTimeout(searchProducts, 300); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      setProductSearchResults([]);
    }
  }, [productSearchTerm, showProductSearch]);

  // Load all categories for category search
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    if (formData.scope === 'category' && allCategories.length === 0) {
      const loadCategories = async () => {
        setSearchingCategories(true);
        try {
          const response = await fetch('/api/categories?includeInactive=false');
          const data = await response.json();
          if (response.ok && data.success) {
            const categories = data.data.categories || [];
            setAllCategories(categories);
            setCategorySearchResults(categories);
          } else {
            setCategorySearchResults([]);
          }
        } catch (error) {
          console.error('Error loading categories:', error);
          setCategorySearchResults([]);
        } finally {
          setSearchingCategories(false);
        }
      };

      loadCategories();
    }
  }, [formData.scope, allCategories.length]);

  // Filter categories by search term
  useEffect(() => {
    if (formData.scope === 'category' && allCategories.length > 0) {
      if (categorySearchTerm.length === 0) {
        setCategorySearchResults(allCategories);
      } else {
        const filtered = allCategories.filter(cat => 
          (cat.categoryName || cat.name || '').toLowerCase().includes(categorySearchTerm.toLowerCase())
        );
        setCategorySearchResults(filtered);
      }
    }
  }, [categorySearchTerm, allCategories, formData.scope]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate targetIds for product/category scopes
    if ((formData.scope === 'product' || formData.scope === 'category') && 
        (!formData.targetIds || formData.targetIds.length === 0)) {
      setError(`${formData.scope === 'product' ? 'Product' : 'Category'} IDs are required for ${formData.scope}-level discounts`);
      setLoading(false);
      return;
    }

    try {
      const url = discount ? `/api/discounts/${discount.id}` : '/api/discounts';
      const method = discount ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to save discount');
      }
    } catch (error) {
      console.error('Error saving discount:', error);
      setError('Failed to save discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {discount ? 'Edit Discount' : 'Create Discount'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as DiscountType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value *
              </label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                required
                min={0}
                step={formData.type === 'percentage' ? 1 : 0.01}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scope *
            </label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as DiscountScope })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="order">Order Level</option>
              <option value="product">Product Level</option>
              <option value="category">Category Level</option>
              <option value="shipping">Shipping</option>
            </select>
          </div>

          {(formData.scope === 'product' || formData.scope === 'category') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.scope === 'product' ? 'Select Products' : 'Select Categories'} *
              </label>
              
              {/* Selected Items Display */}
              {(formData.scope === 'product' ? selectedProducts.length > 0 : selectedCategories.length > 0) && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {(formData.scope === 'product' ? selectedProducts : selectedCategories).map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {formData.scope === 'product' 
                        ? (item as Product).name 
                        : ((item as Category).categoryName || (item as Category).name)}
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.scope === 'product') {
                            setSelectedProducts(prev => prev.filter(p => p.id !== item.id));
                          } else {
                            setSelectedCategories(prev => prev.filter(c => c.id !== item.id));
                          }
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    value={formData.scope === 'product' ? productSearchTerm : categorySearchTerm}
                    onChange={(e) => {
                      if (formData.scope === 'product') {
                        setProductSearchTerm(e.target.value);
                        setShowProductSearch(true);
                      } else {
                        setCategorySearchTerm(e.target.value);
                        setShowCategorySearch(true);
                      }
                    }}
                    onFocus={() => {
                      if (formData.scope === 'product') {
                        setShowProductSearch(true);
                        if (productSearchTerm.length > 0) {
                          // Trigger search if there's a search term
                        }
                      } else {
                        setShowCategorySearch(true);
                        // Show all categories when focused (if not already loaded)
                        if (allCategories.length === 0 && !searchingCategories) {
                          const loadCategories = async () => {
                            setSearchingCategories(true);
                            try {
                              const response = await fetch('/api/categories?includeInactive=false');
                              const data = await response.json();
                              if (response.ok && data.success) {
                                const categories = data.data.categories || [];
                                setAllCategories(categories);
                                setCategorySearchResults(categories);
                              }
                            } catch (error) {
                              console.error('Error loading categories:', error);
                            } finally {
                              setSearchingCategories(false);
                            }
                          };
                          loadCategories();
                        }
                      }
                    }}
                    placeholder={formData.scope === 'product' 
                      ? 'Search products by name...' 
                      : 'Search categories by name...'}
                    className="pl-10"
                  />
                  {(formData.scope === 'product' ? searchingProducts : searchingCategories) && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {((formData.scope === 'product' && showProductSearch && productSearchResults.length > 0) ||
                  (formData.scope === 'category' && showCategorySearch && categorySearchResults.length > 0)) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {(formData.scope === 'product' ? productSearchResults : categorySearchResults).map((item) => {
                      const isSelected = formData.scope === 'product'
                        ? selectedProducts.some(p => p.id === item.id)
                        : selectedCategories.some(c => c.id === item.id);
                      
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (formData.scope === 'product') {
                              const product = item as Product;
                              if (!selectedProducts.some(p => p.id === product.id)) {
                                setSelectedProducts(prev => [...prev, product]);
                              }
                              setProductSearchTerm('');
                              setShowProductSearch(false);
                            } else {
                              const category = item as Category;
                              if (!selectedCategories.some(c => c.id === category.id)) {
                                setSelectedCategories(prev => [...prev, category]);
                              }
                              setCategorySearchTerm('');
                              setShowCategorySearch(false);
                            }
                          }}
                          disabled={isSelected}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between ${
                            isSelected ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''
                          }`}
                        >
                          <span>
                            {formData.scope === 'product' 
                              ? (item as Product).name 
                              : ((item as Category).categoryName || (item as Category).name)}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No Results Message */}
                {((formData.scope === 'product' && showProductSearch && productSearchTerm.length > 0 && productSearchResults.length === 0 && !searchingProducts) ||
                  (formData.scope === 'category' && showCategorySearch && categorySearchTerm.length > 0 && categorySearchResults.length === 0 && !searchingCategories)) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-sm text-gray-500">
                    No {formData.scope === 'product' ? 'products' : 'categories'} found
                  </div>
                )}
              </div>

              {/* Click outside to close dropdown */}
              {(showProductSearch || showCategorySearch) && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => {
                    setShowProductSearch(false);
                    setShowCategorySearch(false);
                  }}
                />
              )}

              {formData.targetIds && formData.targetIds.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {formData.targetIds.length} {formData.scope === 'product' ? 'product' : 'category'}(ies) selected
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Amount
              </label>
              <Input
                type="number"
                value={formData.minOrderAmount || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                min={0}
                step={0.01}
              />
            </div>

            {formData.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Discount Amount
                </label>
                <Input
                  type="number"
                  value={formData.maxDiscountAmount || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  min={0}
                  step={0.01}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usage Limit
            </label>
            <Input
              type="number"
              value={formData.usageLimit || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                usageLimit: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              min={1}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : discount ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

