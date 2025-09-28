'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types/products';
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
  product: Product & { category?: any; images?: any[] };
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onPublish?: (product: Product) => void;
  showActions?: boolean;
  variant?: 'management' | 'catalog';
}

export function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onPublish,
  showActions = true,
  variant = 'management'
}: ProductCardProps) {
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

  // Get the primary image or first image
  const getPrimaryImage = () => {
    if (!product.images || product.images.length === 0) return null;
    
    // Find primary image first
    const primaryImg = product.images.find((img: any) => img.isPrimary);
    if (primaryImg) return primaryImg;
    
    // Fall back to first image
    return product.images[0];
  };

  const primaryImage = getPrimaryImage();

  if (variant === 'catalog') {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <div className="aspect-w-16 aspect-h-12 bg-gray-200">
            {primaryImage ? (
              <img
                src={primaryImage.thumbnailUrl || primaryImage.imageUrl}
                alt={primaryImage.altText || product.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-48 bg-gray-200 flex items-center justify-center ${primaryImage ? 'hidden' : ''}`}>
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
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
                  src={primaryImage.thumbnailUrl || primaryImage.imageUrl}
                  alt={primaryImage.altText || product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${primaryImage ? 'hidden' : ''}`}>
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
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
            <span>
              Category: {product.category ? (product.category.categoryName || product.category.name || 'Unknown') : 'No Category'}
            </span>
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