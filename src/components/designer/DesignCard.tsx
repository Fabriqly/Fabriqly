
'use client';

import React, { useState } from 'react';
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
  Trash2,
  X,
  User,
  Calendar
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
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatFileSize = (format: string) => {
    return format.toUpperCase();
  };

  if (variant === 'catalog') {
    const tagsCount = design.tags?.length || 0;

    return (
      <>
      <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
        {/* Top: Image & Status */}
        <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
          {design.thumbnailUrl ? (
            <img 
              src={design.thumbnailUrl} 
              alt={design.designName} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {design.isPublic ? (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold">Public</span>
            ) : (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-semibold">Private</span>
            )}
            {design.isFeatured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center">
                <Star className="w-3 h-3 mr-0.5 fill-current" />
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Middle: Content */}
        <div className="p-2.5 flex-1 flex flex-col">
          {/* Title & Type */}
          <div className="mb-2">
            <h3 className="font-bold text-slate-900 text-base mb-0.5 truncate">{design.designName}</h3>
            <p className="text-xs text-slate-500 mb-0.5 line-clamp-1">{design.description || 'No description'}</p>
            <p className="text-xs text-slate-400 font-mono truncate">Type: {design.designType} • {formatFileSize(design.fileFormat)}</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div className="bg-slate-50 rounded-lg p-1.5 text-center">
              <p className="text-xs font-semibold text-slate-600 mb-0.5">Views</p>
              <p className="text-xs font-bold text-slate-900">{design.viewCount}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-1.5 text-center">
              <p className="text-xs font-semibold text-slate-600 mb-0.5">Downloads</p>
              <p className="text-xs font-bold text-slate-900">{design.downloadCount}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-1.5 text-center">
              <p className="text-xs font-semibold text-slate-600 mb-0.5">Likes</p>
              <p className="text-xs font-bold text-slate-900">{design.likesCount}</p>
            </div>
          </div>

          {/* Price & Category */}
          <div className="mt-auto pt-2 border-t border-slate-100">
            <div className="mb-2">
              <p className="text-xs text-slate-500 mb-0.5">{design.category.categoryName}</p>
              <p className="text-lg font-bold text-indigo-600">
                {design.pricing?.isFree ? 'Free' : formatPrice(design.pricing?.price || 0)}
              </p>
            </div>

            {/* Tags - Single Row */}
            <div className="mb-2 flex flex-wrap gap-1">
              {design.tags && design.tags.length > 0 && (
                <>
                  {design.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium border border-blue-100"
                    >
                      {tag}
                    </span>
                  ))}
                  {design.tags.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                      +{design.tags.length - 3}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            {showActions && (
              <div className="flex gap-1.5">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(design);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(design);
                    }}
                    className="flex items-center justify-center bg-red-100 hover:bg-red-500 text-white w-8 h-8 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </>
    );
  }

  // List View - Matching ProductList ListCard styling
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Mobile View - Simplified Layout */}
      <div className="md:hidden p-3 flex items-center gap-3">
        {/* Image */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
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

        {/* Design Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-base mb-1 truncate">{design.designName}</h3>
          <p className="text-indigo-600 font-semibold text-base mb-1">
            {design.pricing?.isFree ? 'Free' : formatPrice(design.pricing?.price || 0)}
          </p>
          <p className="text-xs text-slate-400">
            Updated: {(() => {
              if (design.updatedAt instanceof Date) {
                return design.updatedAt.toLocaleDateString();
              } else if (design.updatedAt && typeof design.updatedAt === 'object' && 'toDate' in design.updatedAt) {
                return (design.updatedAt as any).toDate().toLocaleDateString();
              } else {
                return new Date().toLocaleDateString();
              }
            })()}
          </p>
        </div>

        {/* Status & Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            {design.isPublic ? (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold">Public</span>
            ) : (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-semibold">Private</span>
            )}
            {design.isFeatured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center">
                <Star className="w-3 h-3 mr-0.5 fill-current" />
                Featured
              </span>
            )}
          </div>
          {showActions && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(design)}
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(design)}
                  className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop View - Full Layout */}
      <div className="hidden md:flex p-3 items-center gap-4">
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
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
          <div className="absolute top-1 left-1 flex flex-col gap-1">
            {design.isPublic ? (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold">Public</span>
            ) : (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-semibold">Private</span>
            )}
            {design.isFeatured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center">
                <Star className="w-3 h-3 mr-0.5 fill-current" />
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Main Details Wrapper */}
        <div className="flex-1 min-w-0 flex flex-row items-center gap-4 w-full">
          {/* Info Section */}
          <div className="w-5/12">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 text-lg truncate">{design.designName}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-1 truncate">{design.description || 'No description'}</p>
            <p className="text-xs text-slate-400 font-mono truncate mb-1.5">Type: {design.designType} • {formatFileSize(design.fileFormat)}</p>
            
            {/* Category & Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium border border-blue-100">
                {design.category.categoryName}
              </span>
              {design.tags && design.tags.length > 0 && (
                <>
                  {design.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium border border-blue-100"
                    >
                      {tag}
                    </span>
                  ))}
                  {design.tags.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                      +{design.tags.length - 3}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="w-auto flex items-center justify-around gap-8">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Views</p>
              <p className="font-bold text-indigo-600">{design.viewCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Downloads</p>
              <p className="font-bold text-slate-900">{design.downloadCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Likes</p>
              <p className="font-bold text-slate-900">{design.likesCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Price</p>
              <p className="font-bold text-indigo-600">
                {design.pricing?.isFree ? 'Free' : formatPrice(design.pricing?.price || 0)}
              </p>
            </div>
          </div>

          {/* Stats Group - Gray Box */}
          <div className="w-auto">
            <div className="bg-slate-50 rounded-lg p-2 grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Views</p>
                <p className="text-sm font-bold text-slate-900">{design.viewCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Downloads</p>
                <p className="text-sm font-bold text-slate-900">{design.downloadCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">Likes</p>
                <p className="text-sm font-bold text-slate-900">{design.likesCount}</p>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          {showActions && (
            <div className="flex-1 flex items-center justify-center gap-3">
              {onEdit && (
                <button
                  onClick={() => onEdit(design)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(design)}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}