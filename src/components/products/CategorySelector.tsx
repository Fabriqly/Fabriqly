'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/types/products';
import { ChevronDown, Check, ChevronRight, Folder, FolderOpen } from 'lucide-react';

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

interface CategoryNode extends Category {
  children?: CategoryNode[];
}

export function CategorySelector({ 
  value, 
  onChange, 
  placeholder = "Select a category",
  required = false,
  disabled = false
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories?format=tree&includeChildren=true');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const findCategoryById = (nodes: CategoryNode[], id: string): CategoryNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findCategoryById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedCategory = findCategoryById(categories, value);
  
  const flattenCategories = (nodes: CategoryNode[]): CategoryNode[] => {
    const result: CategoryNode[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.children) {
        result.push(...flattenCategories(node.children));
      }
    }
    return result;
  };

  const filteredCategories = searchTerm 
    ? flattenCategories(categories).filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : categories;

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchTerm('');
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

  const renderCategoryNode = (node: CategoryNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.id === value;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => handleSelect(node.id)}
        >
          {hasChildren ? (
            <button
              type="button"
              className="mr-2 p-1 hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
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
                <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 mr-2 text-gray-400" />
              )
            ) : (
              <div className="w-4 h-4 mr-2" />
            )}
            
            <div className="flex-1">
              <div className="font-medium">{node.name}</div>
              {node.description && (
                <div className="text-sm text-gray-500">{node.description}</div>
              )}
            </div>

            {isSelected && (
              <Check className="w-4 h-4 text-blue-600" />
            )}
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

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  if (loading) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
        <span className="text-gray-500">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedCategory || value === '' ? 'text-gray-900' : 'text-gray-500'}>
            {selectedCategory ? selectedCategory.name : value === '' ? 'All Categories' : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {/* All Categories Option */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                value === '' ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
            >
              <div>
                <div className="font-medium">All Categories</div>
                <div className="text-sm text-gray-500">Show products from all categories</div>
              </div>
              {value === '' && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>

            {filteredCategories.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? 'No categories found' : 'No categories available'}
              </div>
            ) : (
              searchTerm ? (
                // Show flat list when searching
                filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelect(category.id)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                      category.id === value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-gray-500">{category.description}</div>
                      )}
                      {category.path && category.path.length > 1 && (
                        <div className="text-xs text-gray-400">
                          {category.path.join(' > ')}
                        </div>
                      )}
                    </div>
                    {category.id === value && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))
              ) : (
                // Show hierarchical tree when not searching
                filteredCategories.map(category => renderCategoryNode(category))
              )
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
}

