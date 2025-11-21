'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DesignWithDetails } from '@/types/enhanced-products';
import { Button } from '@/components/ui/Button';
import { 
  Download, 
  Heart, 
  Share2, 
  Eye, 
  Star, 
  Tag, 
  Calendar,
  User,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { DesignReviewSection } from '@/components/reviews/DesignReviewSection';

interface DesignDetailProps {
  design: DesignWithDetails;
  onLike?: (designId: string) => void;
  onDownload?: (designId: string) => void;
  onShare?: (designId: string) => void;
  isLiked?: boolean;
  showNavigation?: boolean;
  onClose?: () => void;
}

export function DesignDetail({
  design,
  onLike,
  onDownload,
  onShare,
  isLiked = false,
  showNavigation = true,
  onClose
}: DesignDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const images = [
    design.thumbnailUrl,
    design.previewUrl,
    design.designFileUrl
  ].filter(Boolean);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date: Date | string | any) => {
    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && date.toDate) {
      return date.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = async () => {
    if (!onDownload) return;
    
    setLoading(true);
    try {
      await onDownload(design.id);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!onLike) return;
    
    try {
      await onLike(design.id);
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleShare = async () => {
    if (!onShare) return;
    
    try {
      await onShare(design.id);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {showNavigation && (
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{design.designName}</h1>
        </div>
        
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
            {images[currentImageIndex] ? (
              <img
                src={images[currentImageIndex]}
                alt={design.designName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <FileText className="w-16 h-16" />
              </div>
            )}

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              {design.isFeatured && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </span>
              )}
              {design.pricing?.isFree && (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  Free
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className="flex space-x-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    index === currentImageIndex
                      ? 'border-blue-500'
                      : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${design.designName} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Design Information */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {design.designName}
              </h2>
              {!design.pricing?.isFree && design.pricing?.price && (
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(design.pricing.price)}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>by {design.designer.businessName}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(design.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
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
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <div className="text-gray-600">
              {showFullDescription ? (
                <p>{design.description}</p>
              ) : (
                <p>
                  {design.description.length > 200
                    ? `${design.description.substring(0, 200)}...`
                    : design.description}
                </p>
              )}
              {design.description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          {design.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {design.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Design Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Design Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium capitalize">{design.designType}</span>
              </div>
              <div>
                <span className="text-gray-600">Format:</span>
                <span className="ml-2 font-medium uppercase">{design.fileFormat}</span>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium">{design.category.categoryName}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">
                  {design.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <Button
              onClick={handleDownload}
              loading={loading}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>
                {design.pricing?.isFree ? 'Download Free' : 'Download'}
              </span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleLike}
              className={`flex items-center space-x-2 ${
                isLiked ? 'text-red-600 border-red-600' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </Button>
          </div>

          {/* Designer Info */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Designer</h3>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{design.designer.businessName}</h4>
                {design.designer.bio && (
                  <p className="text-sm text-gray-600 mt-1">{design.designer.bio}</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>{design.designer.portfolioStats.totalDesigns} designs</span>
                  <span>{design.designer.portfolioStats.totalDownloads} downloads</span>
                  {design.designer.isVerified && (
                    <span className="text-green-600 font-medium">Verified</span>
                  )}
                </div>
                {design.designer.website && (
                  <a
                    href={design.designer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mt-2"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <DesignReviewSection design={design} />
      </div>
    </div>
  );
}
