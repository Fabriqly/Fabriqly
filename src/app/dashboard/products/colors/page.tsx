'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { Color } from '@/types/enhanced-products';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

  const handleCreateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form data being submitted:', formData);
    
    // Validate form data before sending
    if (!formData.colorName || !formData.hexCode) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Ensure RGB code is generated
    const rgbCode = formData.rgbCode || hexToRgb(formData.hexCode);
    const submitData = {
      ...formData,
      rgbCode,
      isActive: formData.isActive !== false // Default to true if not specified
    };
    
    console.log('Data being sent to API:', submitData);
    
    try {
      const response = await fetch('/api/colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Color created successfully:', data);
        setColors(prev => [...prev, data.color]);
        setFormData({ colorName: '', hexCode: '', rgbCode: '' });
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        alert(error.error || 'Failed to create color');
      }
    } catch (error) {
      console.error('Error creating color:', error);
      alert('Failed to create color');
    }
  };

  const handleUpdateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingColor) return;

    try {
      const response = await fetch(`/api/colors/${editingColor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isActive: formData.isActive !== false // Default to true if not specified
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Color updated successfully:', data);
        setColors(prev => prev.map(color => 
          color.id === editingColor.id ? data.color : color
        ));
        setFormData({ colorName: '', hexCode: '', rgbCode: '', isActive: true });
        setEditingColor(null);
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        alert(error.error || 'Failed to update color');
      }
    } catch (error) {
      console.error('Error updating color:', error);
      alert('Failed to update color');
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
    const rgbCode = hexToRgb(hexCode);
    console.log('Hex changed:', hexCode, 'RGB generated:', rgbCode);
    setFormData(prev => ({
      ...prev,
      hexCode,
      rgbCode
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

  const startEdit = (color: Color) => {
    setEditingColor(color);
    setFormData({
      colorName: color.colorName,
      hexCode: color.hexCode,
      rgbCode: color.rgbCode,
      isActive: color.isActive
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingColor(null);
    setFormData({ colorName: '', hexCode: '', rgbCode: '', isActive: true });
    setShowCreateForm(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader user={user} />

      <div className="flex flex-1">
        {/* Dashboard Sidebar */}
        <DashboardSidebar user={user} />

        {/* Main Content */}
        <div className="flex-1">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">My Colors</h1>
                  <p className="mt-2 text-gray-600">Manage colors for your products</p>
                </div>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Color</span>
                </Button>
              </div>
            </div>

        {/* Create/Edit Color Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {editingColor ? 'Edit Color' : 'Create New Color'}
              </h3>
            </div>

            <form onSubmit={editingColor ? handleUpdateColor : handleCreateColor} className="space-y-4">
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

              {/* Active Status Checkbox - Only show when editing */}
              {editingColor && (
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
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingColor ? 'Update Color' : 'Create Color'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Colors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {colors.map((color) => (
            <div key={color.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{color.colorName}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(color)}
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
                  {color.businessOwnerId && (
                    <span className="text-xs text-gray-500">Your Color</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {colors.length === 0 && (
          <div className="text-center py-12">
            <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No colors found</h3>
            <p className="text-gray-500 mb-4">Create your first color to use in your products.</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Color
            </Button>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
