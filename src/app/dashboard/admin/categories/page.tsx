'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  FolderOpen,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { HierarchicalCategorySelector } from '@/components/categories/HierarchicalCategorySelector';
import { ImageUpload } from '@/components/ui/ImageUpload';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  parentId?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: '',
    iconUrl: '',
    isActive: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories?format=tree&includeChildren=true');
      const data = await response.json();
      
      if (response.ok) {
        setCategories(data.categories || []);
      } else {
        console.error('Error loading categories:', data.error);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Category name is required');
    }
    
    if (!formData.slug.trim()) {
      errors.push('Slug is required');
    }
    
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
    
    if (formData.iconUrl && !formData.iconUrl.startsWith('data:image/') && !/^https?:\/\/.+/.test(formData.iconUrl)) {
      errors.push('Icon must be a valid image file or HTTP/HTTPS URL');
    }
    
    return errors;
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          slug: '',
          parentId: '',
          iconUrl: '',
          isActive: true
        });
        loadCategories();
        alert('Category created successfully!');
      } else {
        console.error('Error creating category:', data.error);
        alert(data.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setEditingCategory(null);
        setFormData({
          name: '',
          description: '',
          slug: '',
          parentId: '',
          iconUrl: '',
          isActive: true
        });
        loadCategories();
        alert('Category updated successfully!');
      } else {
        console.error('Error updating category:', data.error);
        alert(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadCategories();
      } else {
        const data = await response.json();
        console.error('Error deleting category:', data.error);
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      slug: category.slug,
      parentId: category.parentId || '',
      iconUrl: category.iconUrl || '',
      isActive: category.isActive
    });
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <div key={category.id} className="border border-gray-200 rounded-lg mb-2">
        <div className="flex items-center justify-between p-4 bg-gray-50">
          <div className="flex items-center space-x-3">
            {category.children && category.children.length > 0 && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {expandedCategories.has(category.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            <FolderOpen className="h-5 w-5 text-gray-500" />
            <div>
              <div className="flex items-center space-x-3">
                {category.iconUrl && (
                  <img
                    src={category.iconUrl}
                    alt={category.name}
                    className="w-8 h-8 object-cover rounded-md"
                  />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span className={`px-2 py-1 rounded ${
                      category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => startEdit(category)}
              size="sm"
              variant="outline"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleDeleteCategory(category.id)}
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </div>
        
        {category.children && category.children.length > 0 && expandedCategories.has(category.id) && (
          <div className="pl-8 pr-4 pb-4">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage product categories
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingCategory) && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Category Name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      name: e.target.value,
                      slug: !editingCategory ? generateSlug(e.target.value) : prev.slug
                    }));
                  }}
                  required
                />
                <Input
                  label="Slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <HierarchicalCategorySelector
                  value={formData.parentId}
                  onChange={(categoryId) => setFormData(prev => ({ ...prev, parentId: categoryId }))}
                  placeholder="Select parent category (optional)"
                  showPath={true}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image/Icon
                </label>
                <ImageUpload
                  value={formData.iconUrl}
                  onChange={(url) => setFormData(prev => ({ ...prev, iconUrl: url }))}
                  placeholder="Upload category image"
                  maxSize={5}
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCategory(null);
                    setFormData({
                      name: '',
                      description: '',
                      slug: '',
                      parentId: '',
                      iconUrl: '',
                      isActive: true
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Categories ({filteredCategories.length})
            </h3>
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new category.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {renderCategoryTree(filteredCategories)}
              </div>
            )}
          </div>
      </div>
    </div>
    </AdminLayout>
  );
}