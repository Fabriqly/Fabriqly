'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HierarchicalCategorySelector } from './HierarchicalCategorySelector';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { 
  Category, 
  CreateCategoryData, 
  UpdateCategoryData 
} from '@/types/enhanced-products';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Folder, 
  FolderOpen,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface CategoryManagementProps {
  onCategoryChange?: () => void;
}

interface CategoryNode extends Category {
  children?: CategoryNode[];
  expanded?: boolean;
}

export function CategoryManagement({ onCategoryChange }: CategoryManagementProps) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories?format=tree&includeChildren=true');
      const data = await response.json();
      
      // Handle the new standardized response structure
      if (data.success && data.data) {
        // New ResponseBuilder format: { success: true, data: { categories: [...] } }
        setCategories(data.data.categories || []);
      } else if (data.categories) {
        // Legacy format: { categories: [...] }
        setCategories(data.categories || []);
      } else if (Array.isArray(data)) {
        // Direct array response
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCategories();
        onCategoryChange?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleCategorySaved = () => {
    setEditingCategory(null);
    setShowCreateForm(false);
    loadCategories();
    onCategoryChange?.();
  };

  const renderCategoryNode = (node: CategoryNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="border-b border-gray-100 last:border-b-0">
        <div
          className="flex items-center py-3 px-4 hover:bg-gray-50"
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          {hasChildren ? (
            <button
              className="mr-2 p-1 hover:bg-gray-200 rounded"
              onClick={() => toggleExpanded(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}

          <div className="flex items-center flex-1">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-5 h-5 mr-3 text-blue-500" />
              ) : (
                <Folder className="w-5 h-5 mr-3 text-gray-400" />
              )
            ) : (
              <div className="w-5 h-5 mr-3" />
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                {node.iconUrl && (
                  <img
                    src={node.iconUrl}
                    alt={node.categoryName}
                    className="w-6 h-6 object-cover rounded"
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900">{node.categoryName}</div>
                  <div className="text-sm text-gray-500">
                    {node.description || 'No description'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                node.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {node.isActive ? 'Active' : 'Inactive'}
              </span>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingCategory(node)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteCategory(node.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
          <p className="text-gray-600">
            Manage hierarchical product categories
          </p>
        </div>

        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          onSave={handleCategorySaved}
          onCancel={() => {
            setEditingCategory(null);
            setShowCreateForm(false);
          }}
        />
      )}

      {/* Categories Tree */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Folder className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first category</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Category
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map(category => renderCategoryNode(category))}
          </div>
        )}
      </div>
    </div>
  );
}

// Category Form Component
interface CategoryFormProps {
  category?: Category | null;
  onSave?: () => void;
  onCancel?: () => void;
}

function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryData>({
    categoryName: '',
    description: '',
    slug: '',
    iconUrl: '',
    parentCategoryId: undefined,
    isActive: true
  });

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
    
    if (category) {
      setFormData({
        categoryName: category.categoryName,
        description: category.description || '',
        slug: category.slug,
        iconUrl: category.iconUrl || '',
        parentCategoryId: category.parentCategoryId,
        isActive: category.isActive
      });
    }
  }, [category]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories?format=flat');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (field: keyof CreateCategoryData, value: any) => {
    setFormData((prev: CreateCategoryData) => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = category ? `/api/categories/${category.id}` : '/api/categories';
      const method = category ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save category');
      }

      onSave?.();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(error.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {category ? 'Edit Category' : 'Create New Category'}
        </h3>
        <p className="text-gray-600 mt-1">
          {category ? 'Update category information' : 'Add a new category to the hierarchy'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <Input
              value={formData.categoryName}
              onChange={(e) => {
                handleInputChange('categoryName', e.target.value);
                if (!category) {
                  handleInputChange('slug', generateSlug(e.target.value));
                }
              }}
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <Input
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              placeholder="category-slug"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Category description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parent Category
          </label>
          <HierarchicalCategorySelector
            value={formData.parentCategoryId || ''}
            onChange={(categoryId) => handleInputChange('parentCategoryId', categoryId || undefined)}
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
            onChange={(url) => handleInputChange('iconUrl', url)}
            placeholder="Upload category image"
            maxSize={5}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Category is active
          </span>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            <Save className="w-4 h-4 mr-2" />
            {category ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </div>
  );
}
