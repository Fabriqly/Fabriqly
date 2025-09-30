
'use client';

import React from 'react';
import Link from 'next/link';
import { DesignWithDetails } from '@/types/enhanced-products';
import { Button } from '@/components/ui/Button';
import { 
  Eye, 
  Download, 
  Heart, 
  Star,
  Image as ImageIcon,
  FileText,
  DollarSign,
  Tag,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';

interface DesignCardProps {
  design: DesignWithDetails;
  onEdit?: (design: DesignWithDetails) => void;
  onDelete?: (design: DesignWithDetails) => void;
  showActions?: boolean;
  variant?: 'portfolio' | 'catalog';
}

export function DesignCard({ 
  design, 
  onEdit, 
  onDelete, 
  showActions = true,
  variant = 'portfolio'
}: DesignCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatFileSize = (format: string) => {
    return format.toUpperCase();
  };

  if (variant === 'catalog') {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        <Link href={`/designs/${design.id}`}>
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            {design.thumbnailUrl ? (
              <img
                src={design.thumbnailUrl}
                alt={design.designName}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12" />
              </div>
            )}
            
            {design.isFeatured && (
              <div className="absolute top-2 left-2">
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </span>
              </div>
            )}

            {design.pricing?.isFree && (
              <div className="absolute top-2 right-2">
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  Free
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-4">
          <Link href={`/designs/${design.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
              {design.designName}
            </h3>
          </Link>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {design.description}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{design.viewCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Download className="w-4 h-4" />
                <span>{design.downloadCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{design.likesCount}</span>
              </div>
            </div>

            {!design.pricing?.isFree && design.pricing?.price && (
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(design.pricing.price)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              by {design.designer.businessName}
            </span>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {formatFileSize(design.fileFormat)}
              </span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                {design.designType}
              </span>
            </div>
          </div>

          {design.tags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-1">
                {design.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
                {design.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{design.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {design.thumbnailUrl ? (
                <img
                  src={design.thumbnailUrl}
                  alt={design.designName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {design.designName}
                </h3>
                {design.isFeatured && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Featured
                  </span>
                )}
                {design.isPublic ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Public
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    Private
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-2">
                Slug: {design.designSlug}
              </p>

              <p className="text-gray-600 text-sm line-clamp-2">
                {design.description}
              </p>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit?.(design)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Edit design"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete?.(design)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete design"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {design.viewCount}
            </div>
            <div className="text-sm text-gray-500">Views</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {design.downloadCount}
            </div>
            <div className="text-sm text-gray-500">Downloads</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {design.likesCount}
            </div>
            <div className="text-sm text-gray-500">Likes</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {design.pricing?.isFree ? 'Free' : formatPrice(design.pricing?.price || 0)}
            </div>
            <div className="text-sm text-gray-500">Price</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Category: {design.category.categoryName}</span>
            <span className="text-blue-600 font-medium">{design.designType}</span>
            <span className="text-purple-600 font-medium">{formatFileSize(design.fileFormat)}</span>
          </div>
          
          <span>
            Updated: {(() => {
              if (design.updatedAt instanceof Date) {
                return design.updatedAt.toLocaleDateString();
              } else if (design.updatedAt && typeof design.updatedAt === 'object' && 'toDate' in design.updatedAt) {
                return (design.updatedAt as any).toDate().toLocaleDateString();
              } else {
                return new Date().toLocaleDateString();
              }
            })()}
          </span>
        </div>

        {design.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-1">
              {design.tags.map((tag, index) => (
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