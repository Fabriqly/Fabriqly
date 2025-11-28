
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
    const [showQuickView, setShowQuickView] = useState(false);

    return (
      <>
      <div className="bg-white rounded-lg shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full">
        <Link 
          href={`/explore/designs/${design.id}`}
          onClick={() => {
            // Store referrer page for breadcrumb navigation
            if (typeof window !== 'undefined') {
              const pathname = window.location.pathname;
              let referrer = 'designs';
              let referrerLabel = 'Designs';
              let referrerPath = '/explore/designs';
              
              if (pathname.startsWith('/explore/designs')) {
                referrer = 'designs';
                referrerLabel = 'Designs';
                referrerPath = '/explore/designs';
              } else if (pathname.startsWith('/explore')) {
                referrer = 'explore';
                referrerLabel = 'Explore';
                referrerPath = '/explore';
              }
              
              sessionStorage.setItem(`design_${design.id}_referrer`, referrer);
              sessionStorage.setItem(`design_${design.id}_referrerLabel`, referrerLabel);
              sessionStorage.setItem(`design_${design.id}_referrerPath`, referrerPath);
            }
          }}
        >
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
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
            
            {/* Gradient Overlay - appears on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            {/* Quick View Button - slides up on hover */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuickView(true);
                }}
                className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
              >
                <Eye className="w-4 h-4" />
                Quick View
              </button>
            </div>
            
            {/* Featured Badge - Upper left of image */}
            {design.isFeatured && (
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-white/80 backdrop-blur-sm text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow-sm flex items-center">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </span>
              </div>
            )}

            {/* Free Badge - Upper right of image */}
            {design.pricing?.isFree && (
              <div className="absolute top-2 right-2 z-10">
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                  Free
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-3 flex flex-col flex-1">
          {/* Design Name */}
          <Link 
            href={`/explore/designs/${design.id}`}
            onClick={() => {
              // Store referrer page for breadcrumb navigation
              if (typeof window !== 'undefined') {
                const pathname = window.location.pathname;
                let referrer = 'designs';
                let referrerLabel = 'Designs';
                let referrerPath = '/explore/designs';
                
                if (pathname.startsWith('/explore/designs')) {
                  referrer = 'designs';
                  referrerLabel = 'Designs';
                  referrerPath = '/explore/designs';
                } else if (pathname.startsWith('/explore')) {
                  referrer = 'explore';
                  referrerLabel = 'Explore';
                  referrerPath = '/explore';
                }
                
                sessionStorage.setItem(`design_${design.id}_referrer`, referrer);
                sessionStorage.setItem(`design_${design.id}_referrerLabel`, referrerLabel);
                sessionStorage.setItem(`design_${design.id}_referrerPath`, referrerPath);
              }
            }}
          >
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

          {/* Designer Name */}
          <div className="mb-2">
            <span className="text-xs text-gray-500">
              by {design.designer.businessName}
            </span>
          </div>

          {/* Price and Download */}
          <div className="flex items-center justify-between gap-2 mt-auto">
            {/* Price */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {design.pricing?.isFree ? (
                <span className="text-lg font-bold text-green-600">
                  Free
                </span>
              ) : design.pricing?.price ? (
                <span className="text-lg font-bold text-indigo-600">
                  {formatPrice(design.pricing.price)}
                </span>
              ) : (
                <span className="text-lg font-bold text-indigo-600">
                  Free
                </span>
              )}
            </div>
            
            {/* Download Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Navigate to design detail page for download
                window.location.href = `/explore/designs/${design.id}`;
              }}
              className="flex-shrink-0 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Download design"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {showQuickView && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQuickView(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-title"
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Only close button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-end z-10">
              <button
                onClick={() => setShowQuickView(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Image */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {design.thumbnailUrl ? (
                    <img
                      src={design.thumbnailUrl}
                      alt={design.designName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-16 h-16" />
                    </div>
                  )}
                </div>
                
                {/* Design Info - Right side with button pinned to bottom */}
                <div className="flex flex-col h-full min-h-0">
                  <div className="space-y-4 flex-1">
                    <div>
                      <h3 id="quick-view-title" className="text-2xl font-bold text-gray-900 mb-2">{design.designName}</h3>
                      <p className="text-gray-600">{design.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {design.pricing?.isFree ? (
                        <span className="text-3xl font-bold text-green-600">Free</span>
                      ) : design.pricing?.price ? (
                        <span className="text-3xl font-bold text-indigo-600">
                          {formatPrice(design.pricing.price)}
                        </span>
                      ) : (
                        <span className="text-3xl font-bold text-indigo-600">Free</span>
                      )}
                    </div>

                    {/* Designer Info */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>by {design.designer.businessName}</span>
                    </div>

                    {/* Design Details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{design.designType}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Format:</span>
                        <span className="font-medium uppercase">{formatFileSize(design.fileFormat)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{design.category.categoryName}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600 pt-2 border-t border-gray-200">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{design.viewCount} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span>{design.downloadCount} downloads</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{design.likesCount} likes</span>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    {design.tags && design.tags.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {design.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View Details Button - Pinned to bottom of right column */}
                  <div className="mt-auto pt-4">
                    <Link 
                      href={`/explore/designs/${design.id}`}
                      onClick={() => {
                        setShowQuickView(false);
                        // Store referrer page for breadcrumb navigation
                        if (typeof window !== 'undefined') {
                          const pathname = window.location.pathname;
                          let referrer = 'designs';
                          let referrerLabel = 'Designs';
                          let referrerPath = '/explore/designs';
                          
                          if (pathname.startsWith('/explore/designs')) {
                            referrer = 'designs';
                            referrerLabel = 'Designs';
                            referrerPath = '/explore/designs';
                          } else if (pathname.startsWith('/explore')) {
                            referrer = 'explore';
                            referrerLabel = 'Explore';
                            referrerPath = '/explore';
                          }
                          
                          sessionStorage.setItem(`design_${design.id}_referrer`, referrer);
                          sessionStorage.setItem(`design_${design.id}_referrerLabel`, referrerLabel);
                          sessionStorage.setItem(`design_${design.id}_referrerPath`, referrerPath);
                        }
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center px-4 py-3 rounded-lg font-medium transition-colors block"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
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

        {design.tags && Array.isArray(design.tags) && design.tags.length > 0 && (
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