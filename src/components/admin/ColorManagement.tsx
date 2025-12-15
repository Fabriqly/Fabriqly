'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Color, CreateColorData, UpdateColorData } from '@/types/enhanced-products';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Palette,
  Globe,
  User,
  Eye,
  EyeOff,
  Search
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface ColorManagementProps {
  onColorChange?: () => void;
}

// Helper function to format timestamps (now receiving JavaScript Date objects from API)
const formatTimestamp = (timestamp: any): string => {
  try {
    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    
    // If it's a string or number, try to convert
    if (timestamp) {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString();
    }
    
    return 'Unknown';
  } catch (error) {
    console.error('Error formatting timestamp:', error, 'input:', timestamp);
    return 'Invalid Date';
  }
};

// ColorForm component for adding/editing colors
interface ColorFormProps {
  color?: Color;
  onSave: (data: CreateColorData | UpdateColorData) => Promise<void>;
  onCancel: () => void;
  title: string;
}

function ColorForm({ color, onSave, onCancel, title }: ColorFormProps) {
  const [formData, setFormData] = useState({
    colorName: color?.colorName || '',
    hexCode: color?.hexCode || '#000000',
    rgbCode: color?.rgbCode || 'rgb(0, 0, 0)',
    isActive: color?.isActive !== false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.colorName.trim()) {
      newErrors.colorName = 'Color name is required';
    }

    if (!formData.hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
      newErrors.hexCode = 'Invalid hex code format';
    }

    if (!formData.rgbCode.match(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/)) {
      newErrors.rgbCode = 'Invalid RGB format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleHexChange = (hex: string) => {
    setFormData(prev => ({
      ...prev,
      hexCode: hex,
      rgbCode: hexToRgb(hex)
    }));
  };

  const handleRgbChange = (rgb: string) => {
    setFormData(prev => ({
      ...prev,
      rgbCode: rgb,
      hexCode: rgbToHex(rgb)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSave(formData);
    }
  };

  const rgbToHex = (rgb: string): string => {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '#000000';
    
    const [, r, g, b] = match;
    return '#' + [r, g, b]
      .map(x => parseInt(x).toString(16).padStart(2, '0'))
      .join('');
  };

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'rgb(0, 0, 0)';
    
    return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Button variant="ghost" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Color Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Name *
            </label>
            <Input
              value={formData.colorName}
              onChange={(e) => setFormData(prev => ({ ...prev, colorName: e.target.value }))}
              placeholder="Enter color name"
              className={errors.colorName ? 'border-red-500' : ''}
            />
            {errors.colorName && (
              <p className="text-red-500 text-xs mt-1">{errors.colorName}</p>
            )}
          </div>

          {/* Color Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Preview
            </label>
            <div 
              className="w-full h-10 rounded-md border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: formData.hexCode }}
            />
          </div>

          {/* Hex Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hex Code *
            </label>
            <Input
              value={formData.hexCode}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
              className={errors.hexCode ? 'border-red-500' : ''}
            />
            {errors.hexCode && (
              <p className="text-red-500 text-xs mt-1">{errors.hexCode}</p>
            )}
          </div>

          {/* RGB Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RGB Code *
            </label>
            <Input
              value={formData.rgbCode}
              onChange={(e) => handleRgbChange(e.target.value)}
              placeholder="rgb(0, 0, 0)"
              className={errors.rgbCode ? 'border-red-500' : ''}
            />
            {errors.rgbCode && (
              <p className="text-red-500 text-xs mt-1">{errors.rgbCode}</p>
            )}
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">
            Active (available for use)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            {color ? 'Update Color' : 'Create Color'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ColorManagement({ onColorChange }: ColorManagementProps) {
  const [colors, setColors] = useState<Color[]>([]);
  const [filteredColors, setFilteredColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'global' | 'custom'>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadColors();
  }, []);

  useEffect(() => {
    filterColors();
  }, [colors, searchTerm, filterType, showInactive]);

  const loadColors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/colors');
      const data = await response.json();
      
      if (response.ok) {
        setColors(data.colors || []);
      } else {
        console.error('Failed to load colors:', data);
        setColors([]);
      }
    } catch (error) {
      console.error('Error loading colors:', error);
      setColors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterColors = () => {
    let filtered = colors.filter(color => {
      // Search filter
      const matchesSearch = color.colorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          color.hexCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Type filter
      if (filterType === 'global' && color.businessOwnerId) return false;
      if (filterType === 'custom' && !color.businessOwnerId) return false;

      // Active/inactive filter
      if (!showInactive && !color.isActive) return false;

      return true;
    });

    // Sort by creation date, newest first
    filtered.sort((a, b) => {
      const getTime = (timestamp: any): number => {
        try {
          if (timestamp instanceof Date) {
            return timestamp.getTime();
          }
          if (timestamp) {
            return new Date(timestamp).getTime();
          }
          return 0;
        } catch {
          return 0;
        }
      };
      return getTime(b.createdAt) - getTime(a.createdAt);
    });
    
    setFilteredColors(filtered);
  };

  const handleCreateColor = async (colorData: CreateColorData | UpdateColorData) => {
    try {
      const response = await fetch('/api/colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(colorData),
      });

      if (response.ok) {
        await loadColors();
        setShowAddForm(false);
        onColorChange?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create color');
      }
    } catch (error: any) {
      console.error('Error creating color:', error);
      alert(error.message || 'Failed to create color');
    }
  };

  const handleUpdateColor = async (colorId: string, colorData: UpdateColorData) => {
    try {
      const response = await fetch(`/api/colors/${colorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(colorData),
      });

      if (response.ok) {
        await loadColors();
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

  const handleDeleteColor = async (colorId: string) => {
    if (!confirm('Are you sure you want to delete this color? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/colors/${colorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadColors();
        onColorChange?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete color');
      }
    } catch (error: any) {
      console.error('Error deleting color:', error);
      alert(error.message || 'Failed to delete color');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedColors.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedColors.size} colors? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/colors/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ colorIds: Array.from(selectedColors) }),
      });

      const result = await response.json();

      if (response.ok) {
        await loadColors();
        setSelectedColors(new Set());
        onColorChange?.();
        alert(`Bulk delete completed: ${result.results.deleted.length} deleted, ${result.results.errors.length} errors`);
      } else {
        throw new Error(result.error || 'Failed to delete colors');
      }
    } catch (error: any) {
      console.error('Error bulk deleting colors:', error);
      alert(error.message || 'Failed to delete colors');
    }
  };

  const handleSelectColor = (colorId: string, selected: boolean) => {
    const newSelected = new Set(selectedColors);
    if (selected) {
      newSelected.add(colorId);
    } else {
      newSelected.delete(colorId);
    }
    setSelectedColors(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedColors(new Set(filteredColors.map(c => c.id)));
    } else {
      setSelectedColors(new Set());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading colors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Color Management</h2>
          <p className="text-gray-600 mt-1">Manage colors available for products</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Color
          </Button>
          {selectedColors.size > 0 && (
            <Button 
              variant="outline" 
              onClick={handleBulkDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedColors.size})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search colors..."
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Colors</option>
            <option value="global">Global Colors</option>
            <option value="custom">Custom Colors</option>
          </select>

          {/* Show Inactive Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show inactive</span>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColors.size === filteredColors.length && filteredColors.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Select all</span>
            </div>
            <span className="text-sm text-gray-600">
              {filteredColors.length} of {colors.length} colors
              {selectedColors.size > 0 && ` • ${selectedColors.size} selected`}
            </span>
          </div>
        </div>
      </div>

      {/* Add Color Form */}
      {showAddForm && (
        <ColorForm
          onSave={handleCreateColor}
          onCancel={() => setShowAddForm(false)}
          title="Add New Color"
        />
      )}

      {/* Colors Grid */}
      {editingColor && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <ColorForm
            color={editingColor}
            onSave={(data) => handleUpdateColor(editingColor.id, data)}
            onCancel={() => setEditingColor(null)}
            title="Edit Color"
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        {filteredColors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Palette className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {colors.length === 0 ? 'No colors found' : 'No colors match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {colors.length === 0 
                ? 'Create your first color to get started'
                : 'Try adjusting your search or filters'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredColors.map((color) => (
              <div key={color.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
                {/* Mobile Layout - Stacked */}
                <div className="flex flex-col md:hidden space-y-3">
                  {/* Color Name with Checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedColors.has(color.id)}
                      onChange={(e) => handleSelectColor(color.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <h3 className="text-sm font-semibold text-gray-900">{color.colorName}</h3>
                  </div>
                  
                  {/* Color Preview */}
                  <div className="flex justify-center">
                    <div 
                      className="w-full aspect-square max-w-[80px] rounded-lg border border-gray-300 shadow-sm"
                      style={{ backgroundColor: color.hexCode }}
                    />
                  </div>
                  
                  {/* Hex and RGB */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-900">{color.hexCode}</p>
                    <p className="text-xs text-gray-500">{color.rgbCode}</p>
                  </div>

                  {/* Badges and Actions */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex flex-wrap gap-1">
                      {color.businessOwnerId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                          <User className="w-3 h-3 mr-1" />
                          Custom
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                          <Globe className="w-3 h-3 mr-1" />
                          Global
                        </span>
                      )}
                      {color.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                          <Eye className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingColor(color)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteColor(color.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:block">
                  {/* Color Name with Checkbox */}
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={selectedColors.has(color.id)}
                      onChange={(e) => handleSelectColor(color.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">{color.colorName}</h3>
                  </div>

                  {/* Color Preview and Info */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg border border-gray-300 shadow-sm"
                        style={{ backgroundColor: color.hexCode }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{color.hexCode}</p>
                        <p className="text-sm text-gray-500">{color.rgbCode}</p>
                      </div>
                    </div>

                    {/* Badges and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {color.businessOwnerId ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            <User className="w-3 h-3 mr-1" />
                            Custom
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            <Globe className="w-3 h-3 mr-1" />
                            Global
                          </span>
                        )}
                        {color.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingColor(color)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteColor(color.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
