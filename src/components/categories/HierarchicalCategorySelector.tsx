'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/types/enhanced-products';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

interface HierarchicalCategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showPath?: boolean;
}

interface CategoryNode extends Category {
  children?: CategoryNode[];
  expanded?: boolean;
}

export function HierarchicalCategorySelector({ 
  value, 
  onChange, 
  placeholder = "Select a category",
  required = false,
  disabled = false,
  showPath = true
}: HierarchicalCategorySelectorProps) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const handleSelectNone = () => {
    onChange('');
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
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
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(node.id);
            } else {
              handleSelect(node.id);
            }
          }}
        >
          {hasChildren ? (
            <button
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
              {showPath && node.path && node.path.length > 1 && (
                <div className="text-xs text-gray-500">
                  {node.path.join(' > ')}
                </div>
              )}
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
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedCategory || value === '' ? 'text-gray-900' : 'text-gray-500'}>
            {selectedCategory ? (
              <div>
                <div>{selectedCategory.name}</div>
                {showPath && selectedCategory.path && selectedCategory.path.length > 1 && (
                  <div className="text-xs text-gray-500">
                    {selectedCategory.path.join(' > ')}
                  </div>
                )}
              </div>
            ) : value === '' ? (
              <div>
                <div>None (Parent Category)</div>
                <div className="text-xs text-gray-500">Top-level category</div>
              </div>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
          <div className="py-2">
            {/* None option for parent category */}
            <div
              className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer ${
                value === '' ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
              onClick={handleSelectNone}
            >
              <div className="w-6 mr-2" />
              <div className="flex-1">
                <div className="font-medium">None (Parent Category)</div>
                <div className="text-xs text-gray-500">Create as a top-level category</div>
              </div>
            </div>
            
            {categories.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No categories available
              </div>
            ) : (
              categories.map(category => renderCategoryNode(category))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
