'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductVariant } from '@/types/products';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  Ruler
} from 'lucide-react';

interface ProductVariantManagerProps {
  productId: string;
  onVariantChange?: () => void;
}

interface VariantFormData {
  variantName: string;
  variantValue: string;
  priceAdjustment: number;
  stock: number;
  sku: string;
  isActive: boolean;
}

const COMMON_VARIANT_NAMES = ['Size', 'Material', 'Style', 'Finish', 'Type'];
const COMMON_SIZE_VALUES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const COMMON_MATERIAL_VALUES = ['Cotton', 'Polyester', 'Blend', 'Leather', 'Canvas', 'Denim'];

export function ProductVariantManager({ productId, onVariantChange }: ProductVariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<VariantFormData>({
    variantName: 'Size',
    variantValue: '',
    priceAdjustment: 0,
    stock: 0,
    sku: '',
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (productId) {
      loadVariants();
    }
  }, [productId]);

  const loadVariants = async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/variants`);
      const data = await response.json();

      if (response.ok) {
        setVariants(data.variants || []);
      } else {
        console.error('Failed to load variants:', data);
        setVariants([]);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = async () => {
    if (!formData.variantName.trim() || !formData.variantValue.trim()) {
      alert('Please fill in variant name and value');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/products/${productId}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadVariants();
        setShowAddForm(false);
        resetForm();
        onVariantChange?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add variant');
      }
    } catch (error: any) {
      console.error('Error adding variant:', error);
      alert(error.message || 'Failed to add variant');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVariant = async () => {
    if (!editingVariant || !formData.variantName.trim() || !formData.variantValue.trim()) {
      alert('Please fill in variant name and value');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/products/${productId}/variants/${editingVariant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadVariants();
        setEditingVariant(null);
        resetForm();
        onVariantChange?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update variant');
      }
    } catch (error: any) {
      console.error('Error updating variant:', error);
      alert(error.message || 'Failed to update variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const response = await fetch(`/api/products/${productId}/variants/${variantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadVariants();
        onVariantChange?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete variant');
      }
    } catch (error: any) {
      console.error('Error deleting variant:', error);
      alert(error.message || 'Failed to delete variant');
    }
  };

  const resetForm = () => {
    setFormData({
      variantName: 'Size',
      variantValue: '',
      priceAdjustment: 0,
      stock: 0,
      sku: '',
      isActive: true
    });
  };

  const startEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      variantName: variant.variantName,
      variantValue: variant.variantValue,
      priceAdjustment: variant.priceAdjustment,
      stock: variant.stock,
      sku: variant.sku || '',
      isActive: variant.isActive
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingVariant(null);
    resetForm();
    setShowAddForm(false);
  };

  const getSuggestedValues = (variantName: string): string[] => {
    if (variantName.toLowerCase() === 'size') {
      return COMMON_SIZE_VALUES;
    }
    if (variantName.toLowerCase() === 'material') {
      return COMMON_MATERIAL_VALUES;
    }
    return [];
  };

  const suggestedValues = getSuggestedValues(formData.variantName);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Ruler className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Product Variants & Sizes</h3>
        </div>
        {!showAddForm && !editingVariant && (
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Variant
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingVariant) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              {editingVariant ? 'Edit Variant' : 'Add New Variant'}
            </h4>
            <Button
              onClick={cancelEdit}
              variant="outline"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variant Name *
              </label>
              <select
                value={formData.variantName}
                onChange={(e) => setFormData(prev => ({ ...prev, variantName: e.target.value, variantValue: '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COMMON_VARIANT_NAMES.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="custom">Custom...</option>
              </select>
              {formData.variantName === 'custom' && (
                <Input
                  value={formData.variantName}
                  onChange={(e) => setFormData(prev => ({ ...prev, variantName: e.target.value }))}
                  placeholder="Enter variant name"
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variant Value *
              </label>
              {suggestedValues.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={formData.variantValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, variantValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select or type...</option>
                    {suggestedValues.map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                  <Input
                    value={formData.variantValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, variantValue: e.target.value }))}
                    placeholder="Or enter custom value"
                    className="mt-2"
                  />
                </div>
              ) : (
                <Input
                  value={formData.variantValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, variantValue: e.target.value }))}
                  placeholder="e.g., Large, Red, Cotton"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Adjustment (₱)
              </label>
              <Input
                type="number"
                value={formData.priceAdjustment}
                onChange={(e) => setFormData(prev => ({ ...prev, priceAdjustment: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Additional cost (positive) or discount (negative)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU (Optional)
              </label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="Product variant code"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={cancelEdit}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={editingVariant ? handleUpdateVariant : handleAddVariant}
              size="sm"
              disabled={saving || !formData.variantName.trim() || !formData.variantValue.trim()}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingVariant ? 'Update' : 'Add'} Variant
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No variants added yet. Click "Add Variant" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{variant.variantName}</p>
                  <p className="text-xs text-gray-500">Type</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{variant.variantValue}</p>
                  <p className="text-xs text-gray-500">Value</p>
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    {variant.priceAdjustment > 0 ? '+' : ''}₱{variant.priceAdjustment.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Price Adjustment</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{variant.stock}</p>
                  <p className="text-xs text-gray-500">Stock</p>
                </div>
                <div className="flex items-center gap-2">
                  {variant.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </span>
                  )}
                  {variant.sku && (
                    <span className="text-xs text-gray-500">SKU: {variant.sku}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  onClick={() => startEdit(variant)}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDeleteVariant(variant.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {variants.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Variants</p>
              <p className="text-lg font-bold text-gray-900">{variants.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Stock</p>
              <p className="text-lg font-bold text-gray-900">
                {variants.reduce((sum, v) => sum + v.stock, 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Active Variants</p>
              <p className="text-lg font-bold text-green-600">
                {variants.filter(v => v.isActive).length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Variant Types</p>
              <p className="text-lg font-bold text-gray-900">
                {new Set(variants.map(v => v.variantName)).size}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

