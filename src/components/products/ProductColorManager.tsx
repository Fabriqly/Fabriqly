'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ProductColor, 
  Color, 
  CreateProductColorData, 
  UpdateProductColorData 
} from '@/types/enhanced-products';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Palette,
  DollarSign,
  Package,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ProductColorManagerProps {
  productId: string;
  onColorChange?: () => void;
}

interface ProductColorWithDetails extends ProductColor {
  color: Color;
}

export function ProductColorManager({ productId, onColorChange }: ProductColorManagerProps) {
  const [productColors, setProductColors] = useState<ProductColorWithDetails[]>([]);
  const [availableColors, setAvailableColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingColor, setEditingColor] = useState<ProductColorWithDetails | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load product colors and available colors in parallel
      const [productColorsResponse, colorsResponse] = await Promise.all([
        fetch(`/api/products/${productId}/colors`),
        fetch('/api/colors?isActive=true')
      ]);

      const [productColorsData, colorsData] = await Promise.all([
        productColorsResponse.json(),
        colorsResponse.json()
      ]);

      if (productColorsResponse.ok) {
        setProductColors(productColorsData.productColors || []);
      } else {
        console.error('Failed to load product colors:', productColorsData);
        setProductColors([]);
      }

      if (colorsResponse.ok) {
        setAvailableColors(colorsData.colors || []);
      } else {
        console.error('Failed to load colors:', colorsData);
        setAvailableColors([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setProductColors([]);
      setAvailableColors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddColor = async (colorData: CreateProductColorData) => {
    try {
      const response = await fetch(`/api/products/${productId}/colors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(colorData),
      });

      if (response.ok) {
        await loadData();
        setShowAddForm(false);
        onColorChange?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add color');
      }
    } catch (error: any) {
      console.error('Error adding color:', error);
      alert(error.message || 'Failed to add color');
    }
  };

  const handleUpdateColor = async (colorId: string, colorData: UpdateProductColorData) => {
    try {
      const response = await fetch(`/api/products/${productId}/colors/${colorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(colorData),
      });

      if (response.ok) {
        await loadData();
        setEditingColor(null);
        onColorChange?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update color');
      }
    } catch (error: any) {
      console.error('Error updating color:', error);
      alert(error.message || 'Failed to update color');
    }
  };

  const handleRemoveColor = async (colorId: string) => {
    if (!confirm('Are you sure you want to remove this color from the product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/colors/${colorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadData();
        onColorChange?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove color');
      }
    } catch (error: any) {
      console.error('Error removing color:', error);
      alert(error.message || 'Failed to remove color');
    }
  };

  const getAvailableColorsForSelection = () => {
    const usedColorIds = productColors.map(pc => pc.colorId);
    return availableColors.filter(color => !usedColorIds.includes(color.id));
  };

  const getGlobalColors = () => {
    return availableColors.filter(color => !color.businessOwnerId);
  };

  const getCustomColors = () => {
    return availableColors.filter(color => color.businessOwnerId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading colors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Color Button */}
      <div className="flex justify-end">
        <Button 
          type="button"
          onClick={() => setShowAddForm(true)}
          disabled={getAvailableColorsForSelection().length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Color
        </Button>
      </div>

      {/* Add Color Form */}
      {showAddForm && (
        <AddColorForm
          availableColors={getAvailableColorsForSelection()}
          onSave={handleAddColor}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Colors List */}
      <div className="bg-white rounded-lg shadow-md">
        {productColors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Palette className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No colors added</h3>
            <p className="text-gray-600 mb-4">Add colors to make this product customizable</p>
            <Button type="button" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Color
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {productColors.map((productColor) => (
              <div key={productColor.id} className="p-6">
                {editingColor?.id === productColor.id ? (
                  <EditColorForm
                    productColor={productColor}
                    onSave={(data) => handleUpdateColor(productColor.colorId, data)}
                    onCancel={() => setEditingColor(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Color Swatch */}
                      <div 
                        className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                        style={{ backgroundColor: productColor.color.hexCode }}
                        title={productColor.color.colorName}
                      />

                      {/* Color Info */}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {productColor.color.colorName}
                        </h4>
                        <div className="text-sm text-gray-500">
                          {productColor.color.hexCode} • {productColor.color.rgbCode}
                        </div>
                      </div>
                    </div>

                    {/* Price and Stock Info */}
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {productColor.priceAdjustment > 0 ? '+' : ''}
                          ${productColor.priceAdjustment.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">Price Adjustment</div>
                      </div>

                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {productColor.stockQuantity !== undefined ? productColor.stockQuantity : '∞'}
                        </div>
                        <div className="text-xs text-gray-500">Stock</div>
                      </div>

                      <div className="flex items-center">
                        {productColor.isAvailable ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Unavailable
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingColor(productColor)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveColor(productColor.colorId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Add Color Form Component
interface AddColorFormProps {
  availableColors: Color[];
  onSave: (data: CreateProductColorData) => void;
  onCancel: () => void;
}

function AddColorForm({ availableColors, onSave, onCancel }: AddColorFormProps) {
  const [formData, setFormData] = useState<CreateProductColorData>({
    colorId: '',
    priceAdjustment: 0,
    isAvailable: true,
    stockQuantity: undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: keyof CreateProductColorData, value: any) => {
    setFormData((prev: CreateProductColorData) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Add Color to Product</h4>
        <p className="text-sm text-gray-600">Select a color and set pricing options</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Color *
          </label>
          <select
            value={formData.colorId}
            onChange={(e) => handleInputChange('colorId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Choose a color</option>
            
            {/* Global Colors */}
            {availableColors.filter(color => !color.businessOwnerId).length > 0 && (
              <optgroup label="🌍 Global Colors">
                {availableColors.filter(color => !color.businessOwnerId).map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.colorName} ({color.hexCode})
                  </option>
                ))}
              </optgroup>
            )}
            
            {/* Custom Colors */}
            {availableColors.filter(color => color.businessOwnerId).length > 0 && (
              <optgroup label="🎨 Custom Colors">
                {availableColors.filter(color => color.businessOwnerId).map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.colorName} ({color.hexCode})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Adjustment ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
              <Input
                type="number"
                step="0.01"
                value={formData.priceAdjustment}
                onChange={(e) => handleInputChange('priceAdjustment', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Additional cost for this color (can be negative for discounts)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
              <Input
                type="number"
                min="0"
                value={formData.stockQuantity || ''}
                onChange={(e) => handleInputChange('stockQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Leave empty for unlimited"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for unlimited stock
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isAvailable}
            onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            This color is available for purchase
          </span>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            <Save className="w-4 h-4 mr-2" />
            Add Color
          </Button>
        </div>
      </div>
    </div>
  );
}

// Edit Color Form Component
interface EditColorFormProps {
  productColor: ProductColorWithDetails;
  onSave: (data: UpdateProductColorData) => void;
  onCancel: () => void;
}

function EditColorForm({ productColor, onSave, onCancel }: EditColorFormProps) {
  const [formData, setFormData] = useState<UpdateProductColorData>({
    priceAdjustment: productColor.priceAdjustment,
    isAvailable: productColor.isAvailable,
    stockQuantity: productColor.stockQuantity
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: keyof UpdateProductColorData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center space-x-4 mb-4">
        <div 
          className="w-8 h-8 rounded-lg border border-gray-200"
          style={{ backgroundColor: productColor.color.hexCode }}
        />
        <div>
          <h4 className="font-medium text-gray-900">{productColor.color.colorName}</h4>
          <p className="text-sm text-gray-500">{productColor.color.hexCode}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Adjustment ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
              <Input
                type="number"
                step="0.01"
                value={formData.priceAdjustment}
                onChange={(e) => handleInputChange('priceAdjustment', parseFloat(e.target.value) || 0)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
              <Input
                type="number"
                min="0"
                value={formData.stockQuantity || ''}
                onChange={(e) => handleInputChange('stockQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Leave empty for unlimited"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isAvailable}
            onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            This color is available for purchase
          </span>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} size="sm">
            <X className="w-4 h-4" />
          </Button>
          <Button type="button" onClick={handleSubmit} size="sm">
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
