
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DesignWithDetails } from '@/types/enhanced-products';
import { Button } from '@/components/ui/Button';
import { WatermarkedImage } from '@/components/ui/WatermarkedImage';
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
  variant?: 'portfolio' | 'catalog' | 'customer' | 'dashboard-grid' | 'dashboard-list';
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

  const formatDate = (date: any) => {
    try {
      if (!date) return 'N/A';
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  // Helper function to extract storage path from Supabase URL
  const extractStoragePath = (url: string): { path: string; bucket: string } | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const bucketIndex = pathParts.findIndex(part => part === 'public' || part === 'sign');
      if (bucketIndex === -1 || bucketIndex + 1 >= pathParts.length) {
        return null;
      }
      const bucket = pathParts[bucketIndex + 1];
      let path = pathParts.slice(bucketIndex + 2).join('/');

      // Ensure path includes "designs/" prefix if needed
      if ((bucket === 'designs' || bucket === 'designs-private') && !path.startsWith('designs/')) {
        if (/^\d+\//.test(path)) {
          path = `designs/${path}`;
        }
      }

      const isSignedUrl = pathParts.includes('sign');
      let actualBucket = bucket;
      if (!isSignedUrl) {
        if (bucket === 'designs' || bucket === 'products') {
          actualBucket = bucket + '-private';
        } else {
          actualBucket = bucket;
        }
      }
      return { path, bucket: actualBucket };
    } catch (e) {
      console.error('Error extracting storage path:', e);
      return null;
    }
  };

  // Convert image URLs to storage info for WatermarkedImage
  const getImageStorageInfo = (url: string | undefined) => {
    if (!url) return null;
    const storageInfo = extractStoragePath(url);
    if (storageInfo) {
      let finalPath = storageInfo.path;
      if ((storageInfo.bucket === 'designs-private' || storageInfo.bucket === 'designs') && !finalPath.startsWith('designs/')) {
        if (/^\d+\//.test(finalPath)) {
          finalPath = `designs/${finalPath}`;
        }
      }
      return {
        ...storageInfo,
        path: finalPath
      };
    }
    return null;
  };

  // Dashboard Grid View - Similar to ProductList GridCard
  if (variant === 'dashboard-grid') {
    return (
      <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
        {/* Top: Image & Status */}
        <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
          {design.thumbnailUrl ? (() => {
            const storageInfo = getImageStorageInfo(design.thumbnailUrl);
            if (storageInfo) {
              return (
                <WatermarkedImage
                  storagePath={storageInfo.path}
                  storageBucket={storageInfo.bucket}
                  designId={design.id}
                  isFree={design.pricing?.isFree}
                  designType={design.designType}
                  alt={design.designName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  fallbackSrc={design.thumbnailUrl}
                />
              );
            }
            return (
              <img 
                src={design.thumbnailUrl} 
                alt={design.designName} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
            );
          })() : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {design.isPublic && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold">Public</span>
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
              <p className="text-xs font-bold text-slate-900">{design.viewCount || 0}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-1.5 text-center">
              <p className="text-xs font-semibold text-slate-600 mb-0.5">Downloads</p>
              <p className="text-xs font-bold text-slate-900">{design.downloadCount || 0}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-1.5 text-center">
              <p className="text-xs font-semibold text-slate-600 mb-0.5">Likes</p>
              <p className="text-xs font-bold text-slate-900">{design.likesCount || 0}</p>
            </div>
          </div>

          {/* Price & Category */}
          <div className="mt-auto pt-2 border-t border-slate-100">
            <div className="mb-2">
              <p className="text-xs text-slate-500 mb-0.5">{design.category?.categoryName || 'Uncategorized'}</p>
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
    );
  }

  // Dashboard List View - Similar to ProductList ListCard (without duplication)
  if (variant === 'dashboard-list') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        {/* Mobile View - Simplified Layout */}
        <div className="md:hidden p-3 flex items-center gap-3">
          {/* Image */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
            {design.thumbnailUrl ? (() => {
              const storageInfo = getImageStorageInfo(design.thumbnailUrl);
              if (storageInfo) {
                return (
                  <WatermarkedImage
                    storagePath={storageInfo.path}
                    storageBucket={storageInfo.bucket}
                    designId={design.id}
                    alt={design.designName}
                    className="w-full h-full object-cover"
                    fallbackSrc={design.thumbnailUrl}
                  />
                );
              }
              return (
                <img src={design.thumbnailUrl} alt={design.designName} className="w-full h-full object-cover" />
              );
            })() : (
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
            <p className="text-xs text-slate-400">Updated: {formatDate(design.updatedAt)}</p>
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
            {design.thumbnailUrl ? (() => {
              const storageInfo = getImageStorageInfo(design.thumbnailUrl);
              if (storageInfo) {
                return (
                  <WatermarkedImage
                    storagePath={storageInfo.path}
                    storageBucket={storageInfo.bucket}
                    designId={design.id}
                    alt={design.designName}
                    className="w-full h-full object-cover"
                    fallbackSrc={design.thumbnailUrl}
                  />
                );
              }
              return (
                <img src={design.thumbnailUrl} alt={design.designName} className="w-full h-full object-cover" />
              );
            })() : (
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
                  {design.category?.categoryName || 'Uncategorized'}
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

            {/* Stats Section - Single display, no duplication */}
            <div className="w-auto flex items-center justify-around gap-8">
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Views</p>
                <p className="font-bold text-indigo-600">{design.viewCount || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Downloads</p>
                <p className="font-bold text-slate-900">{design.downloadCount || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Likes</p>
                <p className="font-bold text-slate-900">{design.likesCount || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Price</p>
                <p className="font-bold text-indigo-600">
                  {design.pricing?.isFree ? 'Free' : formatPrice(design.pricing?.price || 0)}
                </p>
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

  if (variant === 'catalog') {
    const [showQuickView, setShowQuickView] = useState(false);

    return (
      <div className="bg-white rounded-lg shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full">
        <Link href={`/explore/designs/${design.id}`}>
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            {design.thumbnailUrl ? (() => {
              const storageInfo = getImageStorageInfo(design.thumbnailUrl);
              if (storageInfo) {
                return (
                  <WatermarkedImage
                    storagePath={storageInfo.path}
                    storageBucket={storageInfo.bucket}
                    designId={design.id}
                    alt={design.designName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackSrc={design.thumbnailUrl}
                  />
                );
              }
              // Fallback to regular img if we can't extract storage info
              return (
                <img
                  src={design.thumbnailUrl}
                  alt={design.designName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    console.error('Design image failed to load:', design.thumbnailUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              );
            })() : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12" />
              </div>
            )}
            
            {/* Gradient Overlay - appears on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            {/* Public/Featured Badge - Upper left of image */}
            {design.isPublic && (
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-white/80 backdrop-blur-sm text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow-sm">
                  Public
                </span>
              </div>
            )}
            {design.isFeatured && (
              <div className="absolute top-2 right-2 z-10">
                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  Featured
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-3 flex flex-col flex-1">
          {/* Design Name */}
          <Link href={`/explore/designs/${design.id}`}>
            <h3 className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors mb-2 line-clamp-2 leading-tight">
              {design.designName}
            </h3>
          </Link>

          {/* Tags - Always reserve space for consistent alignment */}
          <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
            {design.tags && design.tags.length > 0 ? (
              <>
                {design.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {design.tags.length > 2 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                    +{design.tags.length - 2}
                  </span>
                )}
              </>
            ) : (
              /* Empty space when no tags for consistent alignment */
              <div className="h-6" />
            )}
          </div>

          {/* Price - Anchored to bottom */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            {/* Price */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <span className="text-lg font-bold text-indigo-600">
                {design.pricing?.isFree ? 'Free' : formatPrice(design.pricing?.price || 0)}
              </span>
            </div>
            
            {/* View Button */}
            <Link
              href={`/explore/designs/${design.id}`}
              className="flex-shrink-0 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="View design"
            >
              <Eye className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'customer') {
    return (
      <div className="bg-white rounded-lg shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full">
        <Link href={`/explore/designs/${design.id}`}>
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            {design.thumbnailUrl ? (() => {
              const storageInfo = getImageStorageInfo(design.thumbnailUrl);
              if (storageInfo) {
                return (
                  <WatermarkedImage
                    storagePath={storageInfo.path}
                    storageBucket={storageInfo.bucket}
                    designId={design.id}
                    alt={design.designName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackSrc={design.thumbnailUrl}
                  />
                );
              }
              // Fallback to regular img if we can't extract storage info
              return (
                <img
                  src={design.thumbnailUrl}
                  alt={design.designName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    console.error('Design image failed to load:', design.thumbnailUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              );
            })() : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12" />
              </div>
            )}
            
            {/* Gradient Overlay - appears on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            {/* Public/Featured Badge - Upper left of image */}
            {design.isPublic && (
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-white/80 backdrop-blur-sm text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow-sm">
                  Public
                </span>
              </div>
            )}
            {design.isFeatured && (
              <div className="absolute top-2 right-2 z-10">
                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  Featured
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-3 flex flex-col flex-1">
          {/* Design Name */}
          <Link href={`/explore/designs/${design.id}`}>
            <h3 className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors mb-2 line-clamp-2 leading-tight">
              {design.designName}
            </h3>
          </Link>

          {/* Tags - Always reserve space for consistent alignment */}
          <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
            {design.tags && design.tags.length > 0 ? (
              <>
                {design.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {design.tags.length > 2 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                    +{design.tags.length - 2}
                  </span>
                )}
              </>
            ) : (
              /* Empty space when no tags for consistent alignment */
              <div className="h-6" />
            )}
          </div>

          {/* Price - Anchored to bottom */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            {/* Price */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <span className="text-lg font-bold text-indigo-600">
                {design.pricing?.isFree ? 'Free' : formatPrice(design.pricing?.price || 0)}
              </span>
            </div>
            
            {/* View Button */}
            <Link
              href={`/explore/designs/${design.id}`}
              className="flex-shrink-0 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="View design"
            >
              <Eye className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Legacy portfolio variant (kept for backward compatibility)
  if (variant === 'portfolio') {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {design.thumbnailUrl ? (() => {
                  const storageInfo = getImageStorageInfo(design.thumbnailUrl);
                  if (storageInfo) {
                    return (
                      <WatermarkedImage
                        storagePath={storageInfo.path}
                        storageBucket={storageInfo.bucket}
                        designId={design.id}
                        alt={design.designName}
                        className="w-full h-full object-cover"
                        fallbackSrc={design.thumbnailUrl}
                      />
                    );
                  }
                  return (
                    <img
                      src={design.thumbnailUrl}
                      alt={design.designName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Design image failed to load:', design.thumbnailUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  );
                })() : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Design Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base mb-1 truncate">{design.designName}</h3>
            <p className="text-indigo-600 font-semibold text-base mb-1">
              {design.pricing?.isFree ? 'Free' : formatPrice(design.pricing?.price || 0)}
            </p>
            <p className="text-xs text-slate-400">
              Updated: {formatDate(design.updatedAt)}
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
      </div>
    );
  }

  // Default fallback (should not be reached with proper variant)
  return null;
}