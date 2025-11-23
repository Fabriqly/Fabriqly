'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
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
  X
} from 'lucide-react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { useAuth } from '@/hooks/useAuth';
import { ProductReviewSection } from '@/components/reviews/ProductReviewSection';
import { RatingDisplay } from '@/components/reviews/RatingDisplay';

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

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadProductColors();
      loadRatingStats();
    }
  }, [productId]);

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

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Handle ResponseBuilder structure: { success: true, data: product, meta: {...} }
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
    // Don't allow quantity changes if product is out of stock
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
    
    // Add variant price adjustments
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
      // Create a temporary cart item for buy now
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

      // Store the item in sessionStorage for bulk checkout
      const itemsToStore = [buyNowItem];
      sessionStorage.setItem('bulkCheckoutItems', JSON.stringify(itemsToStore));
      
      // Debug: Verify the item was stored
      const stored = sessionStorage.getItem('bulkCheckoutItems');
      console.log('Stored buy now items:', stored);
      
      // Navigate to checkout with bulk parameter
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
      // Fallback: copy to clipboard
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Package className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Customer Header */}
      <CustomerHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button and Breadcrumb */}
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button 
              onClick={() => router.push('/products')}
              className="hover:text-blue-600"
            >
              Products
            </button>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden relative">
              {currentImage ? (
                <img
                  src={currentImage.imageUrl}
                  alt={currentImage.altText || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-24 h-24" />
                </div>
              )}

              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {product.isCustomizable && (
                <div className="absolute top-4 left-4">
                  <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
                    Customizable
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      index === selectedImageIndex 
                        ? 'border-blue-600' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.altText || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-2 rounded-full ${
                      isFavorite 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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
                <span className="text-sm text-gray-500">SKU: {product.sku}</span>
              </div>

              <div className="text-3xl font-bold text-gray-900 mb-4">
                ${calculatePrice().toFixed(2)}
                {(Object.keys(selectedVariants).length > 0 || colorPriceAdjustment !== 0) && (
                  <span className="text-lg text-gray-500 ml-2">
                    (Base: ${product.price.toFixed(2)})
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Variants */}
            {Object.keys(groupedVariants).length > 0 && (
              <div className="space-y-4">
                {Object.entries(groupedVariants).map(([variantName, variants]) => (
                  <div key={variantName}>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {variantName}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantChange(variantName, variant.variantValue)}
                          className={`px-4 py-2 rounded-md border text-sm ${
                            selectedVariants[variantName] === variant.variantValue
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {variant.variantValue}
                          {variant.priceAdjustment !== 0 && (
                            <span className="ml-1 text-xs">
                              ({variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment.toFixed(2)})
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
              <ColorSelector
                productColors={productColors}
                selectedColorId={selectedColorId}
                onColorSelect={handleColorSelect}
                basePrice={product.price}
              />
            )}

            {/* Stock Status */}
            {product.stockQuantity === 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <X className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">Out of Stock</span>
                </div>
                <p className="text-red-600 text-sm mt-1">
                  This product is currently unavailable. Please check back later or contact us for restock updates.
                </p>
              </div>
            ) : product.stockQuantity <= 5 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">Low Stock</span>
                </div>
                <p className="text-yellow-600 text-sm mt-1">
                  Only {product.stockQuantity} left in stock. Order soon to avoid disappointment!
                </p>
              </div>
            ) : null}

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-900">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className={`p-2 ${product.stockQuantity === 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}`}
                    disabled={quantity <= 1 || product.stockQuantity === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <Input
                    type="number"
                    value={product.stockQuantity === 0 ? 0 : quantity}
                    onChange={(e) => {
                      if (product.stockQuantity === 0) return;
                      handleQuantityChange(parseInt(e.target.value) || 1);
                    }}
                    className={`w-16 text-center border-0 focus:ring-0 ${
                      product.stockQuantity === 0 ? 'bg-gray-100 text-gray-400' : ''
                    }`}
                    min="1"
                    max={product.stockQuantity}
                    disabled={product.stockQuantity === 0}
                    readOnly={product.stockQuantity === 0}
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className={`p-2 ${product.stockQuantity === 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}`}
                    disabled={quantity >= product.stockQuantity || product.stockQuantity === 0}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className={`text-sm ${product.stockQuantity === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {product.stockQuantity === 0 ? 'Out of stock' : `${product.stockQuantity} available`}
                </span>
              </div>

              <div className="space-y-3">
                {/* Customize Button - Only show if product is customizable */}
                {product.isCustomizable && (
                  <Button
                    onClick={() => router.push(`/products/${product.id}/customize`)}
                    disabled={product.stockQuantity === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    🎨 Customize This Product
                  </Button>
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
                    variant="outline"
                    className="flex-1"
                  >
                    {product.stockQuantity === 0 ? 'Out of Stock' : 'Buy Now'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Free shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Secure payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Easy returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
              <div className="space-y-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Owner Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Business:</span>
                <p className="text-gray-600">{product.businessOwner?.businessName || product.businessOwner?.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Contact:</span>
                <p className="text-gray-600">{product.businessOwner?.name}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Contact Seller
              </Button>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ProductReviewSection 
            productId={product.id}
            productName={product.name}
          />
        </div>
      </div>
    </div>
  );
}

