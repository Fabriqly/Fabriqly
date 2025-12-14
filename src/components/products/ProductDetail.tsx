'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { 
  ProductWithDetails, 
  ProductVariant 
} from '@/types/products';
import { ColorSelector } from './ColorSelector';
import { ProductColorWithDetails } from './ProductColorManager';
import { 
  ArrowLeft,
  Heart,
  Share2,
  ShoppingCart,
  Star,
  Package,
  Truck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Image as ImageIcon,
  AlertTriangle,
  X,
  Store,
  MessageSquare,
  Info
} from 'lucide-react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { useAuth } from '@/hooks/useAuth';
import { ProductReviewSection } from '@/components/reviews/ProductReviewSection';
import { RatingDisplay } from '@/components/reviews/RatingDisplay';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { Review } from '@/types/firebase';
import { WatermarkedImage } from '@/components/ui/WatermarkedImage';
import { ShopMessageModal } from '@/components/messaging/ShopMessageModal';

export function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [productColors, setProductColors] = useState<ProductColorWithDetails[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [colorPriceAdjustment, setColorPriceAdjustment] = useState<number>(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [shopProfile, setShopProfile] = useState<any>(null);
  const [shopLogoError, setShopLogoError] = useState(false);
  const [shopRating, setShopRating] = useState<{ average: number; total: number } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadProductColors();
      loadRatingStats();
      loadReviews();
    }
  }, [productId]);

  useEffect(() => {
    // Check if user has reviewed when reviews or user changes
    if (user?.id && reviews.length > 0) {
      const userReview = reviews.find((r) => r.customerId === user.id);
      setHasUserReviewed(!!userReview);
    } else if (!user?.id) {
      setHasUserReviewed(false);
    }
  }, [user?.id, reviews]);

  useEffect(() => {
    if (product) {
      loadShopProfile();
    }
  }, [product?.shop?.username, product?.shopId, product?.businessOwnerId]);

  useEffect(() => {
    if (shopProfile?.id) {
      loadShopRating();
    }
  }, [shopProfile?.id]);

  useEffect(() => {
    // Handle keyboard navigation for lightbox
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxImage) {
        if (e.key === 'Escape') {
          setLightboxImage(null);
        } else if (e.key === 'ArrowLeft') {
          const newIndex = lightboxIndex > 0 ? lightboxIndex - 1 : lightboxImages.length - 1;
          setLightboxIndex(newIndex);
          setLightboxImage(lightboxImages[newIndex]);
        } else if (e.key === 'ArrowRight') {
          const newIndex = lightboxIndex < lightboxImages.length - 1 ? lightboxIndex + 1 : 0;
          setLightboxIndex(newIndex);
          setLightboxImage(lightboxImages[newIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, lightboxIndex, lightboxImages]);

  const loadRatingStats = async () => {
    try {
      const response = await fetch(`/api/reviews/average?type=product&targetId=${productId}`);
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
      const response = await fetch(`/api/reviews?productId=${productId}&reviewType=product`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data || []);
        // Check if user has already reviewed
        if (user?.id) {
          const userReview = data.data?.find((r: Review) => r.customerId === user.id);
          setHasUserReviewed(!!userReview);
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      
      if (response.ok) {
        setProduct(data.data);
      } else {
        setError(data.error || 'Product not found');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (product?.stockQuantity === 0) {
      return;
    }
    
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity || 1)) {
      setQuantity(newQuantity);
    }
  };

  const loadProductColors = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/colors`);
      if (response.ok) {
        const data = await response.json();
        setProductColors(data.productColors || []);
      }
    } catch (error) {
      console.error('Error loading product colors:', error);
    }
  };

  const loadShopProfile = async () => {
    if (!product) return;
    
    try {
      let response;
      let data;
      
      // Try by username first (most reliable)
      if (product.shop?.username) {
        response = await fetch(`/api/shop-profiles/username/${product.shop.username}`);
        data = await response.json();
        if (data.success && data.data) {
          console.log('Shop profile loaded by username:', data.data);
          setShopProfile(data.data);
          setShopLogoError(false); // Reset logo error when new profile loads
          return;
        }
      }
      
      // Try by shopId if available
      if (product.shopId) {
        response = await fetch(`/api/shop-profiles/${product.shopId}`);
        data = await response.json();
        if (data.success && data.data) {
          console.log('Shop profile loaded by shopId:', data.data);
          setShopProfile(data.data);
          setShopLogoError(false);
          return;
        }
      }
      
      // Try by businessOwnerId (userId) as fallback
      if (product.businessOwnerId) {
        response = await fetch(`/api/shop-profiles/user/${product.businessOwnerId}`);
        data = await response.json();
        if (data.success && data.data) {
          console.log('Shop profile loaded by userId:', data.data);
          setShopProfile(data.data);
          setShopLogoError(false);
          return;
        }
      }
      
      console.log('No shop profile found for product:', product.id);
    } catch (error) {
      console.error('Error loading shop profile:', error);
    }
  };

  const loadShopRating = async () => {
    if (!shopProfile?.id) return;
    
    try {
      const response = await fetch(`/api/reviews/average?type=shop&targetId=${shopProfile.id}`);
      const data = await response.json();
      
      if (data.success) {
        setShopRating({
          average: data.data.average || 0,
          total: data.data.total || 0
        });
        console.log('Shop rating loaded:', data.data);
      }
    } catch (error) {
      console.error('Error loading shop rating:', error);
    }
  };

  const handleColorSelect = (colorId: string, priceAdjustment: number) => {
    setSelectedColorId(colorId);
    setColorPriceAdjustment(priceAdjustment);
  };

  const handleVariantChange = (variantName: string, variantValue: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: variantValue
    }));
  };

  const calculatePrice = () => {
    if (!product) return 0;
    
    let totalPrice = product.price + colorPriceAdjustment;
    
    Object.entries(selectedVariants).forEach(([variantName, variantValue]) => {
      const variant = product.variants.find(
        v => v.variantName === variantName && v.variantValue === variantValue
      );
      if (variant) {
        totalPrice += variant.priceAdjustment;
      }
    });
    
    return totalPrice;
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    try {
      const buyNowItem = {
        id: `buy-now-${Date.now()}`,
        productId: product.id,
        product: {
          id: product.id,
          name: product.name,
          images: product.images || [],
        },
        quantity,
        unitPrice: calculatePrice(),
        totalPrice: calculatePrice() * quantity,
        selectedVariants,
        selectedColorId,
        colorPriceAdjustment,
        businessOwnerId: product.businessOwnerId,
      };

      const itemsToStore = [buyNowItem];
      sessionStorage.setItem('bulkCheckoutItems', JSON.stringify(itemsToStore));
      router.push('/checkout?bulk=true');
    } catch (error) {
      console.error('Error with buy now:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const openLightbox = (imageUrl: string, allImages: string[], index: number) => {
    setLightboxImages(allImages);
    setLightboxIndex(index);
    setLightboxImage(imageUrl);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  const nextLightboxImage = () => {
    if (lightboxImages.length === 0) return;
    if (lightboxIndex < lightboxImages.length - 1) {
      const newIndex = lightboxIndex + 1;
      setLightboxIndex(newIndex);
      setLightboxImage(lightboxImages[newIndex]);
    } else {
      setLightboxIndex(0);
      setLightboxImage(lightboxImages[0]);
    }
  };

  const prevLightboxImage = () => {
    if (lightboxImages.length === 0) return;
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1;
      setLightboxIndex(newIndex);
      setLightboxImage(lightboxImages[newIndex]);
    } else {
      const newIndex = lightboxImages.length - 1;
      setLightboxIndex(newIndex);
      setLightboxImage(lightboxImages[newIndex]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CustomerHeader user={user} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="mb-6 space-y-4">
            <div className="h-10 w-32 bg-slate-200 rounded-md animate-pulse"></div>
            <div className="h-4 w-64 bg-slate-200 rounded-md animate-pulse"></div>
          </div>

          {/* Product Hero Section Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
            {/* Left Column - Images Skeleton */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Image Skeleton */}
              <div className="aspect-[3/2] max-h-[400px] bg-slate-200 rounded-xl animate-pulse"></div>
              
              {/* Thumbnail Images Skeleton */}
              <div className="flex flex-row gap-2 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-20 rounded-lg bg-slate-200 animate-pulse flex-shrink-0"></div>
                ))}
              </div>
            </div>

            {/* Right Column - Product Details Skeleton */}
            <div className="lg:col-span-5 space-y-6">
              {/* Title Skeleton */}
              <div className="space-y-3">
                <div className="h-8 w-3/4 bg-slate-200 rounded-md animate-pulse"></div>
                <div className="h-4 w-1/2 bg-slate-200 rounded-md animate-pulse"></div>
              </div>

              {/* Price Skeleton */}
              <div className="h-10 w-32 bg-slate-200 rounded-md animate-pulse"></div>

              {/* Description Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-200 rounded-md animate-pulse"></div>
                <div className="h-4 w-full bg-slate-200 rounded-md animate-pulse"></div>
                <div className="h-4 w-3/4 bg-slate-200 rounded-md animate-pulse"></div>
              </div>

              {/* Variants Skeleton */}
              <div className="space-y-4">
                <div className="h-5 w-24 bg-slate-200 rounded-md animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-20 bg-slate-200 rounded-md animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Color Selection Skeleton */}
              <div className="space-y-2">
                <div className="h-5 w-16 bg-slate-200 rounded-md animate-pulse"></div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-full bg-slate-200 animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Quantity and Actions Skeleton */}
              <div className="space-y-4">
                <div className="h-10 w-48 bg-slate-200 rounded-md animate-pulse"></div>
                <div className="flex space-x-4">
                  <div className="flex-1 h-12 bg-slate-200 rounded-md animate-pulse"></div>
                  <div className="flex-1 h-12 bg-slate-200 rounded-md animate-pulse"></div>
                </div>
              </div>

              {/* Features Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-5 w-24 bg-slate-200 rounded-md animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Seller Information Skeleton */}
          <div className="mb-12 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 rounded-md animate-pulse"></div>
                  <div className="h-4 w-24 bg-slate-200 rounded-md animate-pulse"></div>
                </div>
              </div>
              <div className="h-10 w-28 bg-slate-200 rounded-md animate-pulse"></div>
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="mb-12">
            <div className="border-b border-slate-200 mb-6">
              <div className="flex space-x-8">
                <div className="h-6 w-40 bg-slate-200 rounded-md animate-pulse"></div>
                <div className="h-6 w-32 bg-slate-200 rounded-md animate-pulse"></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-slate-100">
                    <div className="h-4 w-32 bg-slate-200 rounded-md animate-pulse"></div>
                    <div className="h-4 w-24 bg-slate-200 rounded-md animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 mb-4">
            <Package className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
          <p className="text-sm text-slate-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const currentImage = product.images[selectedImageIndex];
  const groupedVariants = product.variants.reduce((acc, variant) => {
    if (!acc[variant.variantName]) {
      acc[variant.variantName] = [];
    }
    acc[variant.variantName].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  // Get breadcrumb information from sessionStorage or determine from context
  const getBreadcrumbInfo = () => {
    if (typeof window === 'undefined') {
      return { label: 'Products', path: '/products' };
    }

    // Try to get from sessionStorage first
    const referrer = sessionStorage.getItem(`product_${productId}_referrer`);
    const referrerLabel = sessionStorage.getItem(`product_${productId}_referrerLabel`);
    const referrerPath = sessionStorage.getItem(`product_${productId}_referrerPath`);

    if (referrer && referrerLabel && referrerPath) {
      return { label: referrerLabel, path: referrerPath };
    }

    // Fallback: determine from document.referrer or default
    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const referrerPathname = referrerUrl.pathname;
        const referrerQuery = referrerUrl.searchParams.get('q') || referrerUrl.searchParams.get('query') || '';
        
        if (referrerPathname === '/search' || referrerPathname.startsWith('/search')) {
          const searchPath = referrerQuery ? `/search?q=${encodeURIComponent(referrerQuery)}` : '/search';
          return { label: 'Search', path: searchPath };
        } else if (referrerPathname.startsWith('/explore/merchandise')) {
          return { label: 'Merchandise', path: '/explore/merchandise' };
        } else if (referrerPathname.startsWith('/explore/shops')) {
          return { label: 'Shops', path: '/explore/shops' };
        } else if (referrerPathname.startsWith('/explore/designs')) {
          return { label: 'Designs', path: '/explore/designs' };
        } else if (referrerPathname.startsWith('/explore')) {
          return { label: 'Explore', path: '/explore' };
        } else if (referrerPathname.startsWith('/shops/')) {
          const shopUsername = referrerPathname.split('/')[2];
          return { label: 'Shop', path: `/shops/${shopUsername}` };
        }
      } catch (e) {
        // Invalid URL, use default
      }
    }

    // Default fallback
    return { label: 'Products', path: '/products' };
  };

  const breadcrumbInfo = getBreadcrumbInfo();

  // Collect all review images for lightbox
  const allReviewImages = reviews
    .filter(review => review.images && review.images.length > 0)
    .flatMap(review => review.images || []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Customer Header - Preserved as is */}
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
            <span className="text-slate-900 font-medium">{product.name}</span>
          </nav>
        </div>

        {/* Product Hero Section - 12 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          {/* Left Column - Images (Span 7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Image */}
            <div className="aspect-[3/2] max-h-[400px] bg-white rounded-xl overflow-hidden relative border border-slate-200">
              {currentImage ? (
                currentImage.storagePath && currentImage.storageBucket ? (
                  <WatermarkedImage
                    storagePath={currentImage.storagePath}
                    storageBucket={currentImage.storageBucket}
                    productId={product.id}
                    alt={currentImage.altText || product.name}
                    className="w-full h-full object-contain"
                    fallbackSrc={currentImage.imageUrl}
                  />
                ) : (
                  <img
                    src={currentImage.imageUrl}
                    alt={currentImage.altText || product.name}
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-24 h-24" />
                </div>
              )}

              {product.images.length > 1 && (
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

              {product.isCustomizable && (
                <div className="absolute top-4 left-4">
                  <span className="bg-indigo-600 text-white text-sm px-3 py-1 rounded-full">
                    Customizable
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Images - Always visible for layout consistency */}
            <div className="flex flex-row gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    index === selectedImageIndex 
                      ? 'border-indigo-600 ring-2 ring-indigo-200' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {image.storagePath && image.storageBucket ? (
                    <WatermarkedImage
                      storagePath={image.storagePath}
                      storageBucket={image.storageBucket}
                      productId={product.id}
                      alt={image.altText || product.name}
                      className="w-full h-full object-cover"
                      fallbackSrc={image.imageUrl}
                    />
                  ) : (
                    <img
                      src={image.imageUrl}
                      alt={image.altText || product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Product Details (Span 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{product.name}</h1>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-2 rounded-full transition-colors ${
                      isFavorite 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
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
                <span className="text-sm text-slate-600">SKU: {product.sku}</span>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-slate-900">
                  ₱{calculatePrice().toFixed(2)}
                </div>
                {(Object.keys(selectedVariants).length > 0 || colorPriceAdjustment !== 0) && (
                  <div className="text-sm text-slate-600 mt-1">
                    Base: ₱{product.price.toFixed(2)}
                    {colorPriceAdjustment !== 0 && (
                      <span className="ml-2 text-indigo-600">
                        {colorPriceAdjustment > 0 ? '+' : ''}₱{colorPriceAdjustment.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.shortDescription || product.description}
              </p>
            </div>

            {/* Variants */}
            {Object.keys(groupedVariants).length > 0 && (
              <div className="space-y-4">
                {Object.entries(groupedVariants).map(([variantName, variants]) => (
                  <div key={variantName}>
                    <h4 className="text-sm font-medium text-slate-900 mb-2">
                      {variantName}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantChange(variantName, variant.variantValue)}
                          className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                            selectedVariants[variantName] === variant.variantValue
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {variant.variantValue}
                          {variant.priceAdjustment !== 0 && (
                            <span className="ml-1 text-xs">
                              ({variant.priceAdjustment > 0 ? '+' : ''}₱{variant.priceAdjustment.toFixed(2)})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Color Selection */}
            {productColors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Color</h4>
                <ColorSelector
                  productColors={productColors}
                  selectedColorId={selectedColorId}
                  onColorSelect={handleColorSelect}
                  basePrice={product.price}
                />
                {colorPriceAdjustment !== 0 && selectedColorId && (
                  <div className="mt-2 text-sm text-slate-600">
                    <span className="text-indigo-600 font-medium">
                      {colorPriceAdjustment > 0 ? '+' : ''}₱{colorPriceAdjustment.toFixed(2)}
                    </span>
                    {' '}color adjustment
                  </div>
                )}
              </div>
            )}

            {/* Stock Status */}
            {product.stockQuantity === 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <X className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Out of Stock</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  This product is currently unavailable.
                </p>
              </div>
            ) : product.stockQuantity <= 5 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Low Stock</span>
                </div>
                <p className="text-sm text-yellow-600 mt-1">
                  Only {product.stockQuantity} left in stock.
                </p>
              </div>
            ) : null}

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-slate-900">Quantity:</label>
                <div className="flex items-center border border-slate-200 rounded-md">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className={`p-2 ${product.stockQuantity === 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-50'}`}
                    disabled={quantity <= 1 || product.stockQuantity === 0}
                  >
                    <Minus className="w-4 h-4 text-slate-700" />
                  </button>
                  <Input
                    type="number"
                    value={product.stockQuantity === 0 ? 0 : quantity}
                    onChange={(e) => {
                      if (product.stockQuantity === 0) return;
                      handleQuantityChange(parseInt(e.target.value) || 1);
                    }}
                    className={`w-16 text-center border-0 focus:ring-0 text-sm ${
                      product.stockQuantity === 0 ? 'bg-slate-100 text-slate-400' : ''
                    }`}
                    min="1"
                    max={product.stockQuantity}
                    disabled={product.stockQuantity === 0}
                    readOnly={product.stockQuantity === 0}
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className={`p-2 ${product.stockQuantity === 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-50'}`}
                    disabled={quantity >= product.stockQuantity || product.stockQuantity === 0}
                  >
                    <Plus className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
                <span className={`text-sm ${product.stockQuantity === 0 ? 'text-red-500' : 'text-slate-600'}`}>
                  {product.stockQuantity === 0 ? 'Out of stock' : `${product.stockQuantity} available`}
                </span>
              </div>

              <div className="space-y-3">
                {product.isCustomizable && (
                  <>
                    {/* Helper Text with Info Icon */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-0.5">
                      <span>Don't have a design yet?</span>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                          <p className="mb-1 font-semibold">Need a Design?</p>
                          <p className="mb-2">If you don't have a design ready, you can click the Customize button below to hire a professional designer from our platform to create one for you.</p>
                          <p>You can also visit the Designers page to browse and view their profiles!</p>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        // Store selected options in sessionStorage for the customize page
                        sessionStorage.setItem(`product_${product.id}_variants`, JSON.stringify(selectedVariants));
                        sessionStorage.setItem(`product_${product.id}_color`, selectedColorId);
                        sessionStorage.setItem(`product_${product.id}_colorAdjustment`, colorPriceAdjustment.toString());
                        
                        // Navigate with URL params as well
                        const params = new URLSearchParams();
                        if (Object.keys(selectedVariants).length > 0) {
                          params.set('variants', JSON.stringify(selectedVariants));
                        }
                        if (selectedColorId) {
                          params.set('color', selectedColorId);
                        }
                        
                        const queryString = params.toString();
                        router.push(`/products/${product.id}/customize${queryString ? `?${queryString}` : ''}`);
                      }}
                      disabled={product.stockQuantity === 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      🎨 Customize This Product
                    </Button>
                  </>
                )}
                
                <div className="flex space-x-4">
                  <AddToCartButton
                    product={product}
                    quantity={quantity}
                    selectedVariants={selectedVariants}
                    selectedColorId={selectedColorId}
                    selectedColorName={productColors.find(pc => pc.colorId === selectedColorId)?.color.colorName}
                    colorPriceAdjustment={colorPriceAdjustment}
                    businessOwnerId={product.businessOwnerId}
                    className="flex-1"
                    disabled={product.stockQuantity === 0}
                  />
                  <Button
                    onClick={handleBuyNow}
                    disabled={product.stockQuantity === 0}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {product.stockQuantity === 0 ? 'Out of Stock' : 'Buy Now'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span className="text-sm text-slate-600">Free shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span className="text-sm text-slate-600">Secure payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <span className="text-sm text-slate-600">Easy returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Information Section */}
        {product.businessOwner && (
          <div className="mb-12 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {shopProfile?.branding?.logoUrl && !shopLogoError ? (
                  <img
                    src={shopProfile.branding.logoUrl}
                    alt={shopProfile.shopName || product.businessOwner.businessName || product.businessOwner.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                    onError={() => setShopLogoError(true)}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Store className="w-8 h-8 text-indigo-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {shopProfile?.shopName || product.businessOwner.businessName || product.businessOwner.name}
                  </h3>
                  {shopProfile && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-slate-600">
                        {shopRating 
                          ? shopRating.average.toFixed(1)
                          : (shopProfile?.ratings?.averageRating ?? 0).toFixed(1)
                        }
                        {(() => {
                          const total = shopRating?.total ?? shopProfile?.ratings?.totalReviews ?? 0;
                          return total > 0 && (
                            <span className="text-slate-500 ml-1">
                              ({total} {total === 1 ? 'review' : 'reviews'})
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const username = shopProfile?.username || product.shop?.username;
                    if (username) {
                      router.push(`/shops/${username}`);
                    }
                  }}
                  disabled={!shopProfile?.username && !product.shop?.username}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Store className="w-4 h-4 mr-2" />
                  View Shop
                </Button>
                {user && (shopProfile?.userId || product.businessOwnerId) && (
                  <Button
                    onClick={() => setShowMessageModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Shop
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs System */}
        <div className="mb-12">
          {/* Tab Headers */}
          <div className="border-b border-slate-200 mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-4 px-1 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'specs'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                Product Specifications
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
            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Specifications Table (2/3) */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-bold border-l-4 border-indigo-600 pl-2 mb-4 text-slate-900">
                    Specifications
                  </h3>
                  {product.specifications && Object.keys(product.specifications).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-slate-100 last:border-b-0">
                          <span className="text-sm font-medium text-slate-700">{key}:</span>
                          <span className="text-sm text-slate-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-700">Material:</span>
                        <span className="text-sm text-slate-600">Premium Quality</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-700">Weight:</span>
                        <span className="text-sm text-slate-600">{product.weight ? `${product.weight}g` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-sm font-medium text-slate-700">Fit:</span>
                        <span className="text-sm text-slate-600">Regular</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Tags & CTA (1/3) */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Tags Cloud */}
                  {product.tags && product.tags.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold border-l-4 border-indigo-600 pl-2 mb-3 text-slate-900">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
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

                  {/* Contact for Customization CTA */}
                  {product.isCustomizable && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-indigo-900 mb-2">Need Customization?</h4>
                      <p className="text-sm text-indigo-700 mb-3">
                        Contact us for personalized options and custom designs.
                      </p>
                      <Button
                        onClick={() => {
                          // Store selected options in sessionStorage for the customize page
                          sessionStorage.setItem(`product_${product.id}_variants`, JSON.stringify(selectedVariants));
                          sessionStorage.setItem(`product_${product.id}_color`, selectedColorId);
                          sessionStorage.setItem(`product_${product.id}_colorAdjustment`, colorPriceAdjustment.toString());
                          router.push(`/products/${product.id}/customize`);
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact for Customization
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold border-l-4 border-indigo-600 pl-2 text-slate-900">
                    Customer Reviews
                  </h3>
                  {user && !hasUserReviewed && !showReviewForm && (
                    <Button
                      onClick={() => setShowReviewForm(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Write a Review
                    </Button>
                  )}
                </div>

                {showReviewForm && (
                  <div className="mb-6 border border-indigo-200 rounded-lg p-6 bg-indigo-50">
                    <ReviewForm
                      reviewType="product"
                      targetId={productId}
                      targetName={product?.productName || 'Product'}
                      onSuccess={() => {
                        setShowReviewForm(false);
                        loadReviews();
                        loadRatingStats();
                      }}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-semibold text-sm">
                                {review.customerName?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {review.customerName || 'Anonymous'}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <RatingDisplay rating={review.rating} size="sm" showNumber={false} />
                                <span className="text-xs text-slate-500">
                                  {review.createdAt?.toDate ? 
                                    new Date(review.createdAt.toDate()).toLocaleDateString() : 
                                    'Unknown date'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{review.comment}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 max-w-md">
                            {review.images.map((imageUrl, index) => {
                              const globalIndex = allReviewImages.indexOf(imageUrl);
                              const safeIndex = globalIndex >= 0 ? globalIndex : 0;
                              return (
                                <button
                                  key={index}
                                  onClick={() => openLightbox(imageUrl, allReviewImages, safeIndex)}
                                  className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-300 transition-colors"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Review image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    {!showReviewForm && (
                      <>
                        <p className="text-sm text-slate-600 mb-4">No reviews yet. Be the first to review!</p>
                        {user && (
                          <Button
                            onClick={() => setShowReviewForm(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Write the First Review
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 text-white transition-colors"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>
            
            {lightboxImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevLightboxImage();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 text-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextLightboxImage();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 text-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <img
              src={lightboxImage}
              alt="Review image"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {lightboxImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Shop Modal */}
      {showMessageModal && (shopProfile?.userId || product?.businessOwnerId) && (
        <ShopMessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          shopOwnerId={shopProfile?.userId || product?.businessOwnerId || ''}
          shopOwnerName={shopProfile?.shopName || product?.businessOwner?.businessName || product?.businessOwner?.name || 'Shop Owner'}
          shopId={shopProfile?.id}
        />
      )}
      
      <ScrollToTop />
    </div>
  );
}
