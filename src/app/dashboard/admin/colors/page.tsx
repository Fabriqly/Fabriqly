'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Color } from '@/types/enhanced-products';
import { Plus, Edit, Trash2, Palette, Database } from 'lucide-react';
import { GLOBAL_COLORS } from '@/lib/global-colors';

interface CreateColorData {
  colorName: string;
  hexCode: string;
  rgbCode: string;
  isActive?: boolean;
}

export default function ColorsManagementPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [colorType, setColorType] = useState<'global' | 'custom'>('global');
  const [formData, setFormData] = useState<CreateColorData>({
    colorName: '',
    hexCode: '',
    rgbCode: '',
    isActive: true
  });

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      const response = await fetch('/api/colors');
      if (response.ok) {
        const data = await response.json();
        setColors(data.colors || []);
      }
    } catch (error) {
      console.error('Error loading colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGlobalColors = () => colors.filter(color => !color.businessOwnerId);
  const getCustomColors = () => colors.filter(color => color.businessOwnerId);

  const handleSeedGlobalColors = async () => {
    if (!confirm('This will create all standard global colors. Continue?')) return;
    
    setLoading(true);
    try {
      const createdColors = [];
      
      for (const colorData of GLOBAL_COLORS) {
        // Check if color already exists
        const exists = colors.some(color => 
          color.colorName.toLowerCase() === colorData.colorName.toLowerCase() ||
          color.hexCode.toLowerCase() === colorData.hexCode.toLowerCase()
        );
        
        if (!exists) {
          try {
            const response = await fetch('/api/colors', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...colorData,
                isActive: true
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              createdColors.push(data.color);
            }
          } catch (error) {
            console.error(`Error creating color ${colorData.colorName}:`, error);
          }
        }
      }
      
      if (createdColors.length > 0) {
        setColors(prev => [...prev, ...createdColors]);
        alert(`Successfully created ${createdColors.length} global colors!`);
      } else {
        alert('All global colors already exist.');
      }
    } catch (error) {
      console.error('Error seeding colors:', error);
      alert('Failed to seed global colors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setColors(prev => [...prev, data.color]);
        setFormData({ colorName: '', hexCode: '', rgbCode: '', isActive: true });
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create color');
      }
    } catch (error) {
      console.error('Error creating color:', error);
      alert('Failed to create color');
    }
  };

  const handleDeleteColor = async (colorId: string) => {
    if (!confirm('Are you sure you want to delete this color?')) return;

    try {
      const response = await fetch(`/api/colors/${colorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setColors(prev => prev.filter(color => color.id !== colorId));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete color');
      }
    } catch (error) {
      console.error('Error deleting color:', error);
      alert('Failed to delete color');
    }
  };

  const handleHexChange = (hexCode: string) => {
    setFormData(prev => ({
      ...prev,
      hexCode,
      rgbCode: hexToRgb(hexCode)
    }));
  };

  const hexToRgb = (hex: string): string => {
    // Remove # if present and ensure it's 6 characters
    const cleanHex = hex.replace('#', '');
    
    // Handle both 3 and 6 character hex codes
    let fullHex = cleanHex;
    if (cleanHex.length === 3) {
      // Convert #000 to #000000
      fullHex = cleanHex.split('').map(char => char + char).join('');
    }
    
    if (fullHex.length !== 6) {
      return '';
    }
    
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading colors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Color Management</h1>
              <p className="mt-2 text-gray-600">Manage available colors for products</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Color</span>
              </Button>
              <Button
                onClick={handleSeedGlobalColors}
                variant="outline"
                className="flex items-center space-x-2"
                disabled={loading}
              >
                <Database className="w-4 h-4" />
                <span>Seed Global Colors</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Create Color Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Create New Color</h3>
            </div>

            <form onSubmit={handleCreateColor} className="space-y-4">
              {/* Color Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="global"
                      checked={colorType === 'global'}
                      onChange={(e) => setColorType(e.target.value as 'global' | 'custom')}
                      className="mr-2"
                    />
                    <span className="text-sm">🌍 Global Color (Available to all business owners)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="custom"
                      checked={colorType === 'custom'}
                      onChange={(e) => setColorType(e.target.value as 'global' | 'custom')}
                      className="mr-2"
                    />
                    <span className="text-sm">🎨 Custom Color (Private to specific business owner)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Name *
                  </label>
                  <Input
                    value={formData.colorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, colorName: e.target.value }))}
                    placeholder="e.g., Navy Blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hex Code *
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={formData.hexCode}
                      onChange={(e) => handleHexChange(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                      required
                    />
                    <div 
                      className="w-10 h-10 rounded border border-gray-300"
                      style={{ backgroundColor: formData.hexCode || '#ffffff' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RGB Code
                  </label>
                  <Input
                    value={formData.rgbCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, rgbCode: e.target.value }))}
                    placeholder="rgb(0, 0, 0)"
                    readOnly
                  />
                </div>
              </div>

              {/* Active Status Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  This color is active and available for use
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ colorName: '', hexCode: '', rgbCode: '', isActive: true });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Color
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Global Colors Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🌍 Global Colors</h2>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {getGlobalColors().length} colors
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Global colors are available to all business owners and provide consistency across the platform.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getGlobalColors().map((color) => (
              <div key={color.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{color.colorName}</h3>
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

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      color.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {color.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">Global</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Colors Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🎨 Custom Colors</h2>
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              {getCustomColors().length} colors
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Custom colors created by business owners for their specific needs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getCustomColors().map((color) => (
              <div key={color.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{color.colorName}</h3>
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

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      color.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {color.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">Custom</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {colors.length === 0 && (
          <div className="text-center py-12">
            <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No colors found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first color.</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Color
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
