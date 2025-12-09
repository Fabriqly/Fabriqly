'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { Color } from '@/types/enhanced-products';
import { Plus, Edit, Trash2, Palette, Globe, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface CreateColorData {
  colorName: string;
  hexCode: string;
  rgbCode: string;
  isActive?: boolean;
}

export default function BusinessColorsPage() {
  const { user } = useAuth(true);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [formData, setFormData] = useState<CreateColorData>({
    colorName: '',
    hexCode: '',
    rgbCode: '',
    isActive: true
  });

  useEffect(() => {
    if (user?.id) {
      loadColors();
    }
  }, [user?.id]);

  const loadColors = async () => {
    try {
      const response = await fetch('/api/colors');
      if (response.ok) {
        const data = await response.json();
        console.log('All colors from API:', data.colors);
        console.log('Current user ID:', user?.id);
        
        // Filter colors to show only those created by the current business owner
        const userColors = data.colors?.filter((color: Color) => {
          console.log('Color businessOwnerId:', color.businessOwnerId, 'User ID:', user?.id);
          return color.businessOwnerId === user?.id || !color.businessOwnerId;
        }) || [];
        
        console.log('Filtered colors:', userColors);
        setColors(userColors);
      } else {
        console.error('Failed to load colors:', response.status);
      }
    } catch (error) {
      console.error('Error loading colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGlobalColors = () => colors.filter(color => !color.businessOwnerId);
  const getCustomColors = () => colors.filter(color => color.businessOwnerId);

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

  const handleHexChange = (hex: string) => {
    // Ensure hex starts with #
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    
    // Convert hex to RGB
    const rgb = hexToRgb(hex);
    const rgbString = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
    
    setFormData(prev => ({
      ...prev,
      hexCode: hex,
      rgbCode: rgbString
    }));
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Skeleton Card Component
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={user} />
        <div className="flex flex-1">
          <DashboardSidebar user={user} />
          <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
              <div className="mb-8">
                <Link href="/dashboard/products">
                  <Button variant="outline" className="mb-4 flex items-center space-x-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Products</span>
                  </Button>
                </Link>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader user={user} />

      <div className="flex flex-1">
        {/* Dashboard Sidebar */}
        <DashboardSidebar user={user} />

        {/* Main Content */}
        <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="mb-8">
              <Link href="/dashboard/products">
                <Button variant="outline" className="mb-4 flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Products</span>
                </Button>
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Color Management</h1>
                  <p className="text-gray-600 mt-2">
                    Manage colors for your products. Use global colors for consistency or create custom colors for unique needs.
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Custom Color</span>
                </Button>
              </div>
            </div>

            {/* Create Color Form */}
            {showCreateForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Create Custom Color</h3>
                </div>

                <form onSubmit={handleCreateColor} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color Name *
                      </label>
                      <Input
                        value={formData.colorName}
                        onChange={(e) => setFormData(prev => ({ ...prev, colorName: e.target.value }))}
                        placeholder="e.g., Custom Navy Blue"
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

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
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
                      Create Custom Color
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Custom Colors Section */}
            <div className="mb-8 bg-white rounded-lg shadow-md border border-purple-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Your Custom Colors</h2>
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  {getCustomColors().length} colors
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Your private colors created for specific product needs. Only you can use these colors.
              </p>
              
              {getCustomColors().length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-purple-200 bg-purple-50 flex flex-col items-center justify-center min-h-[200px]">
                    <Palette className="w-8 h-8 text-purple-400 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1 text-center">No custom colors yet</h3>
                    <p className="text-xs text-gray-600 mb-3 text-center">Create your first custom color</p>
                    <Button onClick={() => setShowCreateForm(true)} size="sm">
                      <Plus className="w-3 h-3 mr-1" />
                      Create Color
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {getCustomColors().map((color) => (
                    <div key={color.id} className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
                      {/* Mobile Layout - Stacked */}
                      <div className="flex flex-col md:hidden space-y-3">
                        {/* Name Row with Actions */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">{color.colorName}</h3>
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
                        
                        {/* Color Preview Row */}
                        <div className="flex justify-center">
                          <div 
                            className="w-full aspect-square max-w-[80px] rounded-lg border border-gray-300 shadow-sm"
                            style={{ backgroundColor: color.hexCode }}
                          />
                        </div>
                        
                        {/* Hex and RGB Row */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-900">{color.hexCode}</p>
                          <p className="text-xs text-gray-500">{color.rgbCode}</p>
                        </div>
                      </div>

                      {/* Desktop Layout - Original */}
                      <div className="hidden md:block">
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Global Colors Section */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Global Colors</h2>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {getGlobalColors().length} colors
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                These colors are available to all business owners and provide consistency across the platform. 
                You can use them in your products without creating your own.
              </p>
              
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                {getGlobalColors().map((color) => (
                  <div key={color.id} className="bg-white rounded-lg shadow-md p-4 md:p-6">
                    {/* Mobile Layout - Stacked */}
                    <div className="flex flex-col md:hidden space-y-3">
                      {/* Name Row */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">{color.colorName}</h3>
                      </div>
                      
                      {/* Color Preview Row */}
                      <div className="flex justify-center">
                        <div 
                          className="w-full aspect-square max-w-[80px] rounded-lg border border-gray-300 shadow-sm"
                          style={{ backgroundColor: color.hexCode }}
                        />
                      </div>
                      
                      {/* Hex and RGB Row */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-900">{color.hexCode}</p>
                        <p className="text-xs text-gray-500">{color.rgbCode}</p>
                      </div>
                    </div>

                    {/* Desktop Layout - Original */}
                    <div className="hidden md:block">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{color.colorName}</h3>
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-gray-500">Global</span>
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
                            {color.isActive ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {colors.length === 0 && (
              <div className="text-center py-12">
                <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No colors available</h3>
                <p className="text-gray-600 mb-4">Start by creating your first custom color.</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Color
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}