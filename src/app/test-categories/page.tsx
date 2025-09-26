'use client';

import React, { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  level?: number;
  path?: string[];
}

export default function TestCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.log('Categories loaded:', data.categories);
      } else {
        setError(data.error || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = (category: Category, depth: number = 0) => {
    const indent = '  '.repeat(depth);
    return (
      <div key={category.id} style={{ marginLeft: `${depth * 20}px` }}>
        <div className="p-2 border-b border-gray-200">
          <div className="font-medium">{category.name}</div>
          {category.description && (
            <div className="text-sm text-gray-500">{category.description}</div>
          )}
          <div className="text-xs text-gray-400">
            ID: {category.id} | Level: {category.level} | Parent: {category.parentId || 'None'}
          </div>
          {category.path && (
            <div className="text-xs text-blue-500">
              Path: {category.path.join(' > ')}
            </div>
          )}
        </div>
        {category.children && category.children.map(child => renderCategory(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Test Categories</h1>
          <div className="text-center">Loading categories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Test Categories</h1>
          <div className="text-red-600">Error: {error}</div>
          <button 
            onClick={loadCategories}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Categories</h1>
        <div className="mb-4">
          <button 
            onClick={loadCategories}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Category Hierarchy</h2>
            <p className="text-sm text-gray-600">
              Total categories: {categories.length}
            </p>
          </div>
          
          <div className="p-4">
            {categories.length === 0 ? (
              <div className="text-gray-500">No categories found</div>
            ) : (
              categories.map(category => renderCategory(category))
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Raw Data</h3>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(categories, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
