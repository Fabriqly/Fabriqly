'use client';

import React from 'react';
import Link from 'next/link';
import { ProductWithDetails } from '@/types/products';
import { Button } from '@/components/ui/Button';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  Tag,
  Image as ImageIcon,
  MoreVertical,
  Send
} from 'lucide-react';

interface ProductCardProps {
  product: ProductWithDetails;
  onEdit?: (product: ProductWithDetails) => void;
  onDelete?: (product: ProductWithDetails) => void;
  onPublish?: (product: ProductWithDetails) => void;
  showActions?: boolean;
  variant?: 'management' | 'catalog' | 'customer';
}

export function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onPublish,
  showActions = true,
  variant = 'management'
}: ProductCardProps) {
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const statusColor = {
    draft: 'bg-orange-100 text-orange-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    out_of_stock: 'bg-red-100 text-red-800'
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date: any) => {
    try {
      if (!date) return 'No date available';
      
      // Handle Firestore Timestamp (should now be converted to Date)
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      
      // Handle regular Date object or timestamp
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'No date available';
      }
      
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'No date available';
    }
  };

  if (variant === 'customer') {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
        <Link href={`/products/${product.id}`}>
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            {primaryImage ? (
              <img
                src={primaryImage.imageUrl}
                alt={primaryImage.altText || product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12" />
              </div>
            )}
            
            {/* Discount badge - if applicable */}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <div className="absolute top-2 left-2">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-3">
          {/* Product Name */}
          <Link href={`/products/${product.id}`}>
            <h3 className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors mb-2 line-clamp-2 leading-tight">
              {product.name}
            </h3>
          </Link>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {product.tags.length > 2 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                  +{product.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-indigo-600">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
            
            {/* Special badges */}
            <div className="flex items-center space-x-1">
              {product.isCustomizable && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  Custom
                </span>
              )}
            </div>
          </div>

          {/* Special offers */}
          {product.tags?.some(tag => tag.toLowerCase().includes('new')) && (
            <div className="mt-2">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                New User Exclusive
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'catalog') {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <div className="aspect-w-16 aspect-h-12 bg-gray-200">
            {primaryImage ? (
              <img
                src={primaryImage.imageUrl}
                alt={primaryImage.altText || product.name}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
        </Link>
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {product.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[product.status]}`}>
              {product.status}
            </span>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.shortDescription || product.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-green-600">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-gray-500">
              {product.stockQuantity} in stock
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            {/* Product Image */}
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {primaryImage ? (
                <img
                  src={primaryImage.imageUrl}
                  alt={primaryImage.altText || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {product.name}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[product.status]}`}>
                  {product.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-500 mb-1">
                SKU: {product.sku}
              </p>
              
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.shortDescription || product.description}
              </p>
            </div>
          </div>
          
          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-2">
              {product.status === 'draft' && onPublish && (
                <Button
                  size="sm"
                  onClick={() => onPublish(product)}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-3 h-3" />
                  <span>Publish</span>
                </Button>
              )}
              
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(product)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </Button>
              )}
              
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(product)}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(product.price)}
            </div>
            <div className="text-sm text-gray-500">Price</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {product.stockQuantity}
            </div>
            <div className="text-sm text-gray-500">Stock</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {product.images?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Images</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {product.tags?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Tags</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Category: {product.category?.name || 'No Category'}</span>
            {product.isCustomizable && (
              <span className="text-blue-600 font-medium">Customizable</span>
            )}
            {product.isDigital && (
              <span className="text-purple-600 font-medium">Digital</span>
            )}
          </div>
          
          <span>
            Updated: {formatDate(product.updatedAt)}
          </span>
        </div>

        {product.tags?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-1">
              {product.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}