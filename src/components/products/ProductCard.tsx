'use client';

import React, { useState, useEffect } from 'react';
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
  Send,
  X,
  ShoppingCart
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: Product & { category?: any; images?: any[] };
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onPublish?: (product: Product) => void;
  showActions?: boolean;
  variant?: 'management' | 'catalog' | 'customer';
  // When true, actions are rendered in a compact layout (ideal for grid cards)
  compactActions?: boolean;
}

export function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onPublish,
  showActions = true,
  variant = 'management',
  compactActions = false
}: ProductCardProps) {
  const statusColor = {
    draft: 'bg-orange-100 text-orange-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    out_of_stock: 'bg-red-100 text-red-800'
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  if (variant === 'customer') {
    const [showQuickView, setShowQuickView] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [productColors, setProductColors] = useState<any[]>([]);
    const [loadingColors, setLoadingColors] = useState(false);
    const { addItem } = useCart();
    const { data: session } = useSession();
    const router = useRouter();

    const handleAddToCart = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!session?.user) {
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (isAddingToCart || !product.businessOwnerId) return;

      setIsAddingToCart(true);
      try {
        await addItem({
          productId: product.id,
          quantity: 1,
          selectedVariants: {},
          selectedColorId: undefined,
          selectedColorName: undefined,
          colorPriceAdjustment: 0,
          businessOwnerId: product.businessOwnerId,
        });
      } catch (error) {
        console.error('Error adding to cart:', error);
      } finally {
        setIsAddingToCart(false);
      }
    };

    const loadProductColors = async () => {
      if (!product.id) return;
      setLoadingColors(true);
      try {
        const response = await fetch(`/api/products/${product.id}/colors`);
        if (response.ok) {
          const data = await response.json();
          setProductColors(data.productColors || []);
        }
      } catch (error) {
        console.error('Error loading product colors:', error);
      } finally {
        setLoadingColors(false);
      }
    };

    // Load colors when modal opens
    useEffect(() => {
      if (showQuickView) {
        loadProductColors();
      }
    }, [showQuickView]);

    return (
      <>
        <div className="bg-white rounded-lg shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full">
          <Link 
            href={`/products/${product.id}`}
            onClick={() => {
              // Store referrer page for breadcrumb navigation
              if (typeof window !== 'undefined') {
                const pathname = window.location.pathname;
                let referrer = 'products'; // default
                let referrerLabel = 'Products';
                let referrerPath = '/products';
                
                if (pathname.startsWith('/explore/merchandise')) {
                  referrer = 'merchandise';
                  referrerLabel = 'Merchandise';
                  referrerPath = '/explore/merchandise';
                } else if (pathname.startsWith('/explore/shops')) {
                  referrer = 'shops';
                  referrerLabel = 'Shops';
                  referrerPath = '/explore/shops';
                } else if (pathname.startsWith('/explore/designs')) {
                  referrer = 'designs';
                  referrerLabel = 'Designs';
                  referrerPath = '/explore/designs';
                } else if (pathname.startsWith('/explore')) {
                  referrer = 'explore';
                  referrerLabel = 'Explore';
                  referrerPath = '/explore';
                } else if (pathname.startsWith('/shops/')) {
                  // Extract shop username from path like /shops/username
                  const shopUsername = pathname.split('/')[2];
                  referrer = 'shop';
                  referrerLabel = 'Shop';
                  referrerPath = `/shops/${shopUsername}`;
                } else if (pathname.startsWith('/products')) {
                  referrer = 'products';
                  referrerLabel = 'Products';
                  referrerPath = '/products';
                }
                
                sessionStorage.setItem(`product_${product.id}_referrer`, referrer);
                sessionStorage.setItem(`product_${product.id}_referrerLabel`, referrerLabel);
                sessionStorage.setItem(`product_${product.id}_referrerPath`, referrerPath);
              }
            }}
          >
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              {primaryImage ? (
                <img
                  src={primaryImage.imageUrl}
                  alt={primaryImage.altText || product.name}
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
              
              {/* Custom Badge - Upper left of image */}
              {product.isCustomizable && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-white/80 backdrop-blur-sm text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow-sm">
                    Custom
                  </span>
                </div>
              )}

              {/* Discount badge - if applicable */}
              {(product as any).compareAtPrice && (product as any).compareAtPrice > product.price && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    -{Math.round((((product as any).compareAtPrice - product.price) / (product as any).compareAtPrice) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </Link>

        <div className="p-3 flex flex-col flex-1">
          {/* Product Name */}
          <Link 
            href={`/products/${product.id}`}
            onClick={() => {
              // Store referrer page for breadcrumb navigation
              if (typeof window !== 'undefined') {
                const pathname = window.location.pathname;
                let referrer = 'products'; // default
                let referrerLabel = 'Products';
                let referrerPath = '/products';
                
                if (pathname.startsWith('/explore/merchandise')) {
                  referrer = 'merchandise';
                  referrerLabel = 'Merchandise';
                  referrerPath = '/explore/merchandise';
                } else if (pathname.startsWith('/explore/shops')) {
                  referrer = 'shops';
                  referrerLabel = 'Shops';
                  referrerPath = '/explore/shops';
                } else if (pathname.startsWith('/explore/designs')) {
                  referrer = 'designs';
                  referrerLabel = 'Designs';
                  referrerPath = '/explore/designs';
                } else if (pathname.startsWith('/explore')) {
                  referrer = 'explore';
                  referrerLabel = 'Explore';
                  referrerPath = '/explore';
                } else if (pathname.startsWith('/shops/')) {
                  // Extract shop username from path like /shops/username
                  const shopUsername = pathname.split('/')[2];
                  referrer = 'shop';
                  referrerLabel = 'Shop';
                  referrerPath = `/shops/${shopUsername}`;
                } else if (pathname.startsWith('/products')) {
                  referrer = 'products';
                  referrerLabel = 'Products';
                  referrerPath = '/products';
                }
                
                sessionStorage.setItem(`product_${product.id}_referrer`, referrer);
                sessionStorage.setItem(`product_${product.id}_referrerLabel`, referrerLabel);
                sessionStorage.setItem(`product_${product.id}_referrerPath`, referrerPath);
              }
            }}
          >
            <h3 className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors mb-2 line-clamp-2 leading-tight">
              {product.name}
            </h3>
          </Link>

          {/* Tags - Always reserve space for consistent alignment */}
          <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
            {product.tags && product.tags.length > 0 ? (
              <>
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
              </>
            ) : (
              /* Empty space when no tags for consistent alignment */
              <div className="h-6" />
            )}
          </div>

          {/* Special offers */}
          {product.tags?.some(tag => tag.toLowerCase().includes('new')) && (
            <div className="mb-2">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                New User Exclusive
              </span>
            </div>
          )}

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between gap-2">
            {/* Price */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <span className="text-lg font-bold text-indigo-600">
                {formatPrice(product.price)}
              </span>
              {(product as any).compareAtPrice && (product as any).compareAtPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice((product as any).compareAtPrice)}
                </span>
              )}
            </div>
            
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stockQuantity === 0}
              className="flex-shrink-0 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-5 h-5" />
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
                    {primaryImage ? (
                      <img
                        src={primaryImage.imageUrl}
                        alt={primaryImage.altText || product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info - Right side with button pinned to bottom */}
                  <div className="flex flex-col h-full min-h-0">
                    <div className="space-y-4 flex-1">
                      <div>
                        <h3 id="quick-view-title" className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
                        <p className="text-gray-600">{product.description || product.shortDescription}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-3xl font-bold text-indigo-600">
                          {formatPrice(product.price)}
                        </span>
                        {(product as any).compareAtPrice && (product as any).compareAtPrice > product.price && (
                          <span className="text-lg text-gray-500 line-through">
                            {formatPrice((product as any).compareAtPrice)}
                          </span>
                        )}
                      </div>
                      
                      {/* Available Colors Section */}
                      {productColors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900">Available Colors</h4>
                          <div className="flex flex-wrap gap-2">
                            {productColors.map((productColor) => (
                              <button
                                key={productColor.colorId}
                                className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                style={{ backgroundColor: productColor.color?.hexCode || '#000000' }}
                                title={productColor.color?.colorName || 'Color'}
                                aria-label={`Color: ${productColor.color?.colorName || 'Unknown'}`}
                              >
                                {productColor.priceAdjustment !== 0 && (
                                  <span className="sr-only">
                                    {productColor.priceAdjustment > 0 ? '+' : ''}
                                    {formatPrice(productColor.priceAdjustment)}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                          {loadingColors && (
                            <p className="text-xs text-gray-500">Loading colors...</p>
                          )}
                        </div>
                      )}
                      
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* View Details Button - Pinned to bottom of right column */}
                    <div className="mt-auto pt-4">
                      <Link 
                        href={`/products/${product.id}`}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center px-4 py-3 rounded-lg font-medium transition-colors block"
                        onClick={() => setShowQuickView(false)}
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

  if (variant === 'catalog') {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        <Link 
          href={`/products/${product.id}`}
          onClick={() => {
            // Store referrer page for breadcrumb navigation
            if (typeof window !== 'undefined') {
              const pathname = window.location.pathname;
              let referrer = 'products'; // default
              let referrerLabel = 'Products';
              let referrerPath = '/products';
              
              if (pathname.startsWith('/explore/merchandise')) {
                referrer = 'merchandise';
                referrerLabel = 'Merchandise';
                referrerPath = '/explore/merchandise';
              } else if (pathname.startsWith('/explore/shops')) {
                referrer = 'shops';
                referrerLabel = 'Shops';
                referrerPath = '/explore/shops';
              } else if (pathname.startsWith('/explore/designs')) {
                referrer = 'designs';
                referrerLabel = 'Designs';
                referrerPath = '/explore/designs';
              } else if (pathname.startsWith('/explore')) {
                referrer = 'explore';
                referrerLabel = 'Explore';
                referrerPath = '/explore';
              } else if (pathname.startsWith('/shops/')) {
                // Extract shop username from path like /shops/username
                const shopUsername = pathname.split('/')[2];
                referrer = 'shop';
                referrerLabel = 'Shop';
                referrerPath = `/shops/${shopUsername}`;
              } else if (pathname.startsWith('/products')) {
                referrer = 'products';
                referrerLabel = 'Products';
                referrerPath = '/products';
              }
              
              sessionStorage.setItem(`product_${product.id}_referrer`, referrer);
              sessionStorage.setItem(`product_${product.id}_referrerLabel`, referrerLabel);
              sessionStorage.setItem(`product_${product.id}_referrerPath`, referrerPath);
            }
          }}
        >
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
          
          {/* Actions (header) */}
          {showActions && !compactActions && (
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

        {/* Actions (compact bar for grid view) */}
        {showActions && compactActions && (
          <div className="mb-4 -mt-2 flex flex-wrap items-center justify-end gap-2">
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