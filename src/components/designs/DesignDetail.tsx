'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DesignWithDetails } from '@/types/enhanced-products';
import { Button } from '@/components/ui/Button';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { RatingDisplay } from '@/components/reviews/RatingDisplay';
import { Review } from '@/types/firebase';
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
  X,
  ArrowLeft,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { DesignReviewSection } from '@/components/reviews/DesignReviewSection';
import { useAuth } from '@/hooks/useAuth';
import { WatermarkedImage } from '@/components/ui/WatermarkedImage';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';
import { ShoppingCart, Check, LogIn, CreditCard } from 'lucide-react';

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
  const { user } = useAuth();
  const { data: session } = useSession();
  const { addItem, isItemInCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // Helper function to extract storage path from Supabase URL
  const extractStoragePath = (url: string): { path: string; bucket: string } | null => {
    try {
      // Supabase URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      // or: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?...
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p); // Remove empty strings
      
      // Find the bucket index (usually after 'public' or 'sign')
      const bucketIndex = pathParts.findIndex(part => part === 'public' || part === 'sign');
      if (bucketIndex === -1 || bucketIndex + 1 >= pathParts.length) {
        return null;
      }
      
      const bucket = pathParts[bucketIndex + 1];
      let path = pathParts.slice(bucketIndex + 2).join('/');
      
      // IMPORTANT: Do NOT remove "designs/" or "products/" prefix from path
      // These are actual folder names in the bucket structure, not bucket name prefixes
      // Files are uploaded with folder: "designs/{timestamp}" so the path is "designs/1765198037779/1765198037779.jpg"
      // The Edge Function needs the full path including the "designs/" folder prefix
      
      // Only remove bucket name if it's actually a duplicate (shouldn't happen with current upload structure)
      // e.g., if path is "designs-private/designs/..." and bucket is "designs-private", remove the duplicate
      if (path.startsWith(bucket + '/')) {
        path = path.substring(bucket.length + 1);
        console.log(`Removed duplicate bucket prefix, new path: ${path}`);
      }
      
      // Determine the actual bucket
      // If it's a signed URL, it's definitely private
      // If it's public URL, check if bucket name contains '-private'
      const isSignedUrl = pathParts.includes('sign');
      let actualBucket = bucket;
      
      // If it's a public URL but we want watermarking, try private bucket first
      // But also allow fallback to public bucket
      if (!isSignedUrl) {
        // For designs, try private bucket first, but we'll fallback in WatermarkedImage
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
    
    // Try to extract path from URL
    const storageInfo = extractStoragePath(url);
    if (storageInfo) {
      // Ensure path includes "designs/" prefix if it's missing
      // Some older files might be stored without the prefix
      let finalPath = storageInfo.path;
      if (storageInfo.bucket === 'designs-private' || storageInfo.bucket === 'designs') {
        // If path doesn't start with "designs/" and looks like a timestamp path, add it
        if (!finalPath.startsWith('designs/') && /^\d+\//.test(finalPath)) {
          finalPath = `designs/${finalPath}`;
          console.log(`[DesignDetail] Added designs/ prefix: ${storageInfo.path} -> ${finalPath}`);
        }
      }
      
      console.log(`[DesignDetail] Storage info: bucket=${storageInfo.bucket}, path=${finalPath}, originalUrl=${url.substring(0, 100)}...`);
      
      return {
        ...storageInfo,
        path: finalPath
      };
    }
    
    // If we can't extract, assume it's in designs-private bucket
    // Extract filename from URL
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      if (fileName) {
        // Try to find the folder structure from the URL
        const folderIndex = pathParts.findIndex(part => part === 'designs');
        if (folderIndex !== -1 && folderIndex + 1 < pathParts.length) {
          const folder = pathParts.slice(folderIndex + 1, -1).join('/');
          return {
            path: folder ? `${folder}/${fileName}` : fileName,
            bucket: 'designs-private' // Default to private bucket
          };
        }
      }
    } catch (e) {
      // URL parsing failed
    }
    
    return null;
  };

  const images = [
    design.thumbnailUrl,
    design.previewUrl,
    design.designFileUrl
  ].filter(Boolean);

  useEffect(() => {
    loadRatingStats();
    loadReviews();
  }, [design.id]);

  const loadRatingStats = async () => {
    try {
      const response = await fetch(`/api/reviews/average?type=design&targetId=${design.id}`);
      const data = await response.json();
      
      if (data.success) {
        setAverageRating(data.data.average || 0);
        setTotalReviews(data.data.total || 0);
      }
    } catch (error) {
      console.error('Error loading rating stats:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?designId=${design.id}&reviewType=design`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  // Check if user has purchased this design
  useEffect(() => {
    const checkPurchase = async () => {
      if (!user?.id || !design.id) return;
      
      try {
        const response = await fetch(`/api/purchases/verify?designId=${design.id}`);
        if (response.ok) {
          const data = await response.json();
          setHasPurchased(data.hasPurchased || false);
        }
      } catch (error) {
        console.error('Error checking purchase status:', error);
      }
    };
    
    checkPurchase();
  }, [user?.id, design.id]);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // If purchased, use the download API for clean image
      if (hasPurchased) {
        const response = await fetch(`/api/download/design/${design.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.downloadUrl) {
            // Fetch the file as a blob to force download
            const fileResponse = await fetch(data.downloadUrl);
            if (fileResponse.ok) {
              const blob = await fileResponse.blob();
              
              // Get file extension from design or URL
              const extension = design.fileFormat || 'png';
              
              // Create blob URL and trigger download
              const blobUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = `${design.designName}.${extension}`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Clean up blob URL
              window.URL.revokeObjectURL(blobUrl);
              return;
            } else {
              alert('Failed to download file');
            }
          }
        }
      }
      
      // For free designs or if download API fails, use the original download handler
      if (onDownload) {
        await onDownload(design.id);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (isAddingToCart || design.pricing?.isFree) return;

    setIsAddingToCart(true);
    try {
      await addItem({
        itemType: 'design',
        designId: design.id,
        quantity: 1,
        designerId: design.designerId,
      });
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000);
    } catch (error) {
      console.error('Error adding design to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (design.pricing?.isFree) return;

    // Add to cart and redirect to checkout
    await handleAddToCart();
    router.push('/checkout');
  };

  const isDesignInCart = design.id ? isItemInCart(design.id, {}, undefined, undefined, undefined) : false;

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

  // Get breadcrumb information
  const getBreadcrumbInfo = () => {
    if (typeof window === 'undefined') {
      return { label: 'Designs', path: '/explore/designs' };
    }

    const referrer = sessionStorage.getItem(`design_${design.id}_referrer`);
    const referrerLabel = sessionStorage.getItem(`design_${design.id}_referrerLabel`);
    const referrerPath = sessionStorage.getItem(`design_${design.id}_referrerPath`);

    if (referrer && referrerLabel && referrerPath) {
      return { label: referrerLabel, path: referrerPath };
    }

    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const referrerPathname = referrerUrl.pathname;
        
        if (referrerPathname.startsWith('/explore/designs')) {
          return { label: 'Designs', path: '/explore/designs' };
        } else if (referrerPathname.startsWith('/explore')) {
          return { label: 'Explore', path: '/explore' };
        }
      } catch (e) {
        // Invalid URL, use default
      }
    }

    return { label: 'Designs', path: '/explore/designs' };
  };

  const breadcrumbInfo = getBreadcrumbInfo();
  const currentImage = images[currentImageIndex];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Customer Header */}
      <CustomerHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button and Breadcrumb */}
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-4 flex items-center space-x-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
          
          <nav className="flex items-center space-x-2 text-sm">
            <button 
              onClick={() => router.push(breadcrumbInfo.path)}
              className="text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {breadcrumbInfo.label}
            </button>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-medium">{design.designName}</span>
          </nav>
        </div>

        {/* Design Hero Section - 12 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          {/* Left Column - Images (Span 7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Image */}
            <div className="aspect-[3/2] max-h-[400px] bg-white rounded-xl overflow-hidden relative border border-slate-200">
              {currentImage ? (() => {
                const storageInfo = getImageStorageInfo(currentImage);
                if (storageInfo) {
                  return (
                    <WatermarkedImage
                      storagePath={storageInfo.path}
                      storageBucket={storageInfo.bucket}
                      designId={design.id}
                      isFree={design.pricing?.isFree}
                      designType={design.designType}
                      alt={design.designName}
                      className="w-full h-full object-contain"
                      fallbackSrc={currentImage}
                    />
                  );
                }
                // Fallback to regular img if we can't extract storage info
                return (
                  <img
                    src={currentImage}
                    alt={design.designName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Design image failed to load:', currentImage);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                );
              })() : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-24 h-24" />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg border border-slate-200"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg border border-slate-200"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col space-y-2">
                {design.isFeatured && (
                  <span className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Featured
                  </span>
                )}
                {design.pricing?.isFree && (
                  <span className="bg-green-600 text-white text-sm px-3 py-1 rounded-full">
                    Free
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex flex-row gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      index === currentImageIndex 
                        ? 'border-indigo-600 ring-2 ring-indigo-200' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {(() => {
                      const storageInfo = getImageStorageInfo(image);
                      if (storageInfo) {
                        return (
                          <WatermarkedImage
                            storagePath={storageInfo.path}
                            storageBucket={storageInfo.bucket}
                            designId={design.id}
                            isFree={design.pricing?.isFree}
                            designType={design.designType}
                            alt={`${design.designName} ${index + 1}`}
                            className="w-full h-full object-cover"
                            fallbackSrc={image}
                          />
                        );
                      }
                      return (
                        <img
                          src={image}
                          alt={`${design.designName} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Thumbnail image failed to load:', image);
                          }}
                        />
                      );
                    })()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Design Details (Span 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{design.designName}</h1>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLike}
                    className={`p-2 rounded-full transition-colors ${
                      isLiked 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <RatingDisplay 
                  rating={averageRating} 
                  totalReviews={totalReviews}
                  size="md"
                  showNumber={true}
                  showTotal={true}
                />
                <span className="text-sm text-slate-600">Format: {design.fileFormat.toUpperCase()}</span>
              </div>

              <div className="mb-4">
                {design.pricing?.isFree ? (
                  <div className="text-3xl font-bold text-green-600">Free</div>
                ) : design.pricing?.price ? (
                  <div className="text-3xl font-bold text-slate-900">
                    {formatPrice(design.pricing.price)}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-slate-600 leading-relaxed">{design.description}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm text-slate-600">
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

            {/* Actions */}
            <div className="space-y-3">
              {design.pricing?.isFree ? (
                // Free design - show download button
                <Button
                  onClick={handleDownload}
                  loading={loading}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Free
                </Button>
              ) : hasPurchased ? (
                // Purchased design - show download button for clean image
                <Button
                  onClick={handleDownload}
                  loading={loading}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Original
                </Button>
              ) : (
                // Paid design - show Buy Now and Add to Cart buttons
                <>
                  <Button
                    onClick={handleBuyNow}
                    disabled={isAddingToCart || isDesignInCart}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isAddingToCart ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy Now
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || isDesignInCart}
                    variant="outline"
                    className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  >
                    {isAddedToCart ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Added to Cart
                      </>
                    ) : isDesignInCart ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        In Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Designer Info - Compact Design */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start gap-3 mb-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {design.designer.businessName}
                    </h3>
                    {design.designer.isVerified && (
                      <span className="text-xs text-green-600 font-medium whitespace-nowrap">Verified</span>
                    )}
                  </div>
                  
                  {design.designer.bio && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2">{design.designer.bio}</p>
                  )}
                  
                  {/* Stats - Inline */}
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="whitespace-nowrap">{design.designer.portfolioStats.totalDesigns} designs</span>
                    <span className="whitespace-nowrap">{design.designer.portfolioStats.totalDownloads} downloads</span>
                  </div>
                </div>
              </div>
              
              {/* Button - Full Width, Spans Entire Card */}
              <Link
                href={`/explore/designers/${design.designer.id}`}
                className="flex items-center justify-center w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs System */}
        <div className="mb-12">
          {/* Tab Headers */}
          <div className="border-b border-slate-200 mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-4 px-1 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'details'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                Design Details
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 px-1 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                Customer Reviews ({totalReviews})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Details (2/3) */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-bold border-l-4 border-indigo-600 pl-2 mb-4 text-slate-900">
                    Design Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-700">Type:</span>
                      <span className="text-sm text-slate-600 capitalize">{design.designType}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-700">Format:</span>
                      <span className="text-sm text-slate-600 uppercase">{design.fileFormat}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-700">Category:</span>
                      <span className="text-sm text-slate-600">{design.category.categoryName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-700">Status:</span>
                      <span className="text-sm text-slate-600">
                        {design.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-700">Created:</span>
                      <span className="text-sm text-slate-600">{formatDate(design.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Tags (1/3) */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Tags Cloud */}
                  {design.tags && design.tags.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold border-l-4 border-indigo-600 pl-2 mb-3 text-slate-900">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {design.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <DesignReviewSection design={design} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
