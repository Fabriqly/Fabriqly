import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CartRepository } from '@/repositories/CartRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { AddToCartRequest, CartResponse } from '@/types/cart';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { CacheService } from '@/services/CacheService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(ResponseBuilder.error('Authentication required'), { status: 401 });
    }

    // Try to get cached cart first (BEFORE database fetch)
    const cacheKey = `cart-${session.user.id}`;
    const cached = await CacheService.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }

    const cartRepository = new CartRepository();
    const cart = await cartRepository.findByUserId(session.user.id);

    if (!cart) {
      // Return empty cart
      return NextResponse.json(ResponseBuilder.success({
        id: '',
        userId: session.user.id,
        items: [],
        totalItems: 0,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    }

    // Refresh product images and design storage info for all cart items
    const { FirebaseAdminService } = await import('@/services/firebase-admin');
    const { Collections } = await import('@/services/firebase');
    const { DesignRepository } = await import('@/repositories/DesignRepository');
    
    // Helper function to extract storage info (same as in POST)
    const extractStorageInfo = (url: string | undefined): { path: string; bucket: string } | null => {
      if (!url) return null;
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
    
    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        try {
          if (item.itemType === 'design' && item.designId) {
            // Refresh design storage info
            const designRepository = new DesignRepository();
            const design = await designRepository.findById(item.designId);
            
            if (design) {
              // Extract storage info from design
              const storageInfo = extractStorageInfo(design.thumbnailUrl) || extractStorageInfo((design as any).designFileUrl);
              
              return {
                ...item,
                design: {
                  ...item.design,
                  id: design.id,
                  name: design.designName,
                  price: item.design?.price || design.pricing?.price || 0,
                  designType: design.designType,
                  thumbnailUrl: design.thumbnailUrl,
                  storagePath: storageInfo?.path || item.design?.storagePath,
                  storageBucket: storageInfo?.bucket || item.design?.storageBucket
                }
              };
            }
            return item;
          } else if (item.itemType === 'product' && item.productId) {
            // Fetch fresh product images with limit
            const allImages = await FirebaseAdminService.queryDocuments(
              Collections.PRODUCT_IMAGES,
              [{ field: 'productId', operator: '==' as const, value: item.productId }],
              { field: 'sortOrder', direction: 'asc' },
              10 // Limit to 10 images per product
            );
            
            const productImages = allImages || [];
            console.log(`Refreshing images for product ${item.productId}:`, productImages);
            
            return {
              ...item,
              product: {
                ...item.product,
                images: productImages.map(img => ({
                  id: img.id,
                  imageUrl: img.imageUrl,
                  altText: img.altText || '',
                  isPrimary: img.isPrimary || false
                }))
              }
            };
          }
          return item;
        } catch (error) {
          console.error(`Error refreshing item ${item.id}:`, error);
          return item; // Return original item if refresh fails
        }
      })
    );

    const updatedCart = {
      ...cart,
      items: updatedItems
    };

    const response = ResponseBuilder.success(updatedCart);
    
    // Cache the response for 2 minutes (cart changes frequently)
    await CacheService.set(cacheKey, response, 2 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(ResponseBuilder.error('Failed to fetch cart'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(ResponseBuilder.error('Authentication required'), { status: 401 });
    }

    const body: AddToCartRequest = await request.json();
    const { productId, designId, itemType, quantity, selectedVariants = {}, selectedColorId, selectedColorName, colorPriceAdjustment = 0, selectedDesign, selectedSize, businessOwnerId, designerId } = body;

    // Validate item type
    if (!itemType || !['product', 'design'].includes(itemType)) {
      return NextResponse.json(ResponseBuilder.error('Invalid itemType. Must be "product" or "design"'), { status: 400 });
    }

    // Validate required fields based on item type
    if (itemType === 'product') {
      if (!productId || !quantity || !businessOwnerId) {
        return NextResponse.json(ResponseBuilder.error('Missing required fields: productId, quantity, businessOwnerId'), { status: 400 });
      }
    } else if (itemType === 'design') {
      if (!designId || !quantity || !designerId) {
        return NextResponse.json(ResponseBuilder.error('Missing required fields: designId, quantity, designerId'), { status: 400 });
      }
    }

    if (quantity <= 0) {
      return NextResponse.json(ResponseBuilder.error('Quantity must be greater than 0'), { status: 400 });
    }

    // Handle design items
    if (itemType === 'design') {
      const { DesignRepository } = await import('@/repositories/DesignRepository');
      const designRepository = new DesignRepository();
      const design = await designRepository.findById(designId);

      if (!design) {
        return NextResponse.json(ResponseBuilder.error('Design not found'), { status: 404 });
      }

      // Check if design is active and public
      if (!design.isActive || !design.isPublic) {
        return NextResponse.json(ResponseBuilder.error(`Design "${design.designName}" is not available`), { status: 400 });
      }

      // Check if design is free (free designs don't need to be purchased)
      if (design.pricing?.isFree) {
        return NextResponse.json(ResponseBuilder.error('Free designs cannot be added to cart. Use the download button instead.'), { status: 400 });
      }

      // Calculate unit price
      const unitPrice = design.pricing?.price || 0;

      // Extract storage path and bucket from thumbnailUrl
      // Helper function to extract storage info from Supabase URL
      const extractStorageInfo = (url: string | undefined): { path: string; bucket: string } | null => {
        if (!url) return null;
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(p => p);
          
          // Find bucket index - could be after 'public', 'sign', or 'object'
          const bucketIndex = pathParts.findIndex((part, idx) => {
            return part === 'public' || part === 'sign' || (part === 'object' && idx + 1 < pathParts.length);
          });
          
          if (bucketIndex === -1 || bucketIndex + 1 >= pathParts.length) {
            console.warn('Could not find bucket in URL:', url);
            return null;
          }
          
          const bucket = pathParts[bucketIndex + 1];
          let path = pathParts.slice(bucketIndex + 2).join('/');
          
          // Handle different URL formats
          // Format 1: /storage/v1/object/public/designs/123/123.jpg
          // Format 2: /storage/v1/object/sign/designs-private/designs/123/123.jpg?...
          
          // Ensure path includes "designs/" prefix if needed
          if ((bucket === 'designs' || bucket === 'designs-private') && !path.startsWith('designs/')) {
            // If path starts with a timestamp-like pattern (digits/), add designs/ prefix
            if (/^\d+\//.test(path)) {
              path = `designs/${path}`;
            }
          }
          
          const isSignedUrl = pathParts.includes('sign');
          let actualBucket = bucket;
          
          // For public URLs, we need to use the private bucket for watermarking
          if (!isSignedUrl) {
            if (bucket === 'designs' || bucket === 'products') {
              actualBucket = bucket + '-private';
            } else if (!bucket.endsWith('-private')) {
              // If it's already a private bucket, keep it
              actualBucket = bucket;
            }
          } else {
            // For signed URLs, the bucket is already correct
            actualBucket = bucket;
          }
          
          console.log('Extracted storage info:', { url, bucket, path, actualBucket, isSignedUrl });
          return { path, bucket: actualBucket };
        } catch (e) {
          console.error('Error extracting storage path from URL:', url, e);
          return null;
        }
      };

      const storageInfo = extractStorageInfo(design.thumbnailUrl) || extractStorageInfo((design as any).designFileUrl);
      
      // Log storage info extraction for debugging
      console.log('Design storage info extraction:', {
        designId: design.id,
        thumbnailUrl: design.thumbnailUrl,
        designFileUrl: (design as any).designFileUrl,
        extractedStorageInfo: storageInfo
      });

      // Prepare cart item for design
      // Designs are digital products - quantity should always be 1
      const designQuantity = 1;
      const cartItem = {
        itemType: 'design' as const,
        designId,
        design: {
          id: design.id,
          name: design.designName,
          price: unitPrice,
          designType: design.designType,
          thumbnailUrl: design.thumbnailUrl,
          storagePath: storageInfo?.path || undefined,
          storageBucket: storageInfo?.bucket || undefined
        },
        quantity: designQuantity, // Always 1 for designs
        selectedVariants: {},
        unitPrice,
        totalPrice: unitPrice * designQuantity, // Always 1x price for designs
        designerId: design.designerId // Use designerId from design object
      };
      
      console.log('Cart item prepared:', {
        designId: cartItem.designId,
        hasStoragePath: !!cartItem.design.storagePath,
        hasStorageBucket: !!cartItem.design.storageBucket,
        storagePath: cartItem.design.storagePath,
        storageBucket: cartItem.design.storageBucket,
        thumbnailUrl: cartItem.design.thumbnailUrl
      });

      // Add to cart
      const cartRepository = new CartRepository();
      const cart = await cartRepository.addItemToCart(session.user.id, cartItem);

      // Invalidate cache after cart update
      const cacheKey = `cart-${session.user.id}`;
      await CacheService.invalidate(cacheKey);

      return NextResponse.json(ResponseBuilder.success(cart));
    }

    // Handle product items (existing logic)
    // Fetch product details
    const productRepository = new ProductRepository();
    const product = await productRepository.findById(productId!);

    if (!product) {
      return NextResponse.json(ResponseBuilder.error('Product not found'), { status: 404 });
    }

    // Check if product is active
    if (product.status !== 'active') {
      return NextResponse.json(ResponseBuilder.error(`Product "${product.name}" is no longer available (product is ${product.status})`), { status: 400 });
    }

    // Check stock availability
    if (product.stockQuantity < quantity) {
      return NextResponse.json(ResponseBuilder.error(`Insufficient stock. Available: ${product.stockQuantity}, Requested: ${quantity}`), { status: 400 });
    }

    // Fetch product images and color information
    let images: any[] = [];
    let colorName = selectedColorName;
    
    try {
      const { FirebaseAdminService } = await import('@/services/firebase-admin');
      const { Collections } = await import('@/services/firebase');
      
      // Fetch images and color info in parallel
      const [allImages, colorData] = await Promise.all([
        FirebaseAdminService.queryDocuments(
          Collections.PRODUCT_IMAGES,
          [{ field: 'productId', operator: '==' as const, value: productId }],
          { field: 'sortOrder', direction: 'asc' },
          10 // Limit to 10 images per product
        ),
        selectedColorId ? FirebaseAdminService.getDocument(Collections.COLORS, selectedColorId) : null
      ]);
      
      images = allImages || [];
      if (colorData && !colorName) {
        colorName = colorData.colorName;
      }
      
      console.log(`Product ${productId} images:`, images);
      console.log(`Color info for ${selectedColorId}:`, colorData);
    } catch (error) {
      console.error(`Error fetching images/color for product ${productId}:`, error);
    }

    // Calculate unit price
    let unitPrice = product.price + colorPriceAdjustment;
    
    // Add design price modifier
    if (selectedDesign && selectedDesign.price) {
      unitPrice += selectedDesign.price;
    }
    
    // Add size price modifier
    if (selectedSize && selectedSize.price) {
      unitPrice += selectedSize.price;
    }
    
    // Legacy variant support (for old products using ProductVariant system)
    if ((product as any).variants) {
      Object.entries(selectedVariants).forEach(([variantName, variantValue]) => {
        const variant = (product as any).variants?.find(
          (v: any) => v.variantName === variantName && v.variantValue === variantValue
        );
        if (variant) {
          unitPrice += variant.priceAdjustment;
        }
      });
    }

    // Prepare cart item for product
    const cartItem = {
      itemType: 'product' as const,
      productId,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        sku: product.sku,
        images: images.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          altText: img.altText || '',
          isPrimary: img.isPrimary || false
        }))
      },
      quantity,
      selectedVariants,
      selectedColorId: selectedColorId || undefined,
      selectedColorName: colorName || undefined,
      colorPriceAdjustment,
      selectedDesign: selectedDesign || undefined,
      selectedSize: selectedSize || undefined,
      unitPrice,
      totalPrice: unitPrice * quantity,
      businessOwnerId
    };

    // Add to cart
    const cartRepository = new CartRepository();
    const cart = await cartRepository.addItemToCart(session.user.id, cartItem);

    // Invalidate cache after cart update
    const cacheKey = `cart-${session.user.id}`;
    await CacheService.invalidate(cacheKey);

    return NextResponse.json(ResponseBuilder.success(cart));
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json(ResponseBuilder.error('Failed to add item to cart'), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(ResponseBuilder.error('Authentication required'), { status: 401 });
    }

    const cartRepository = new CartRepository();
    const cart = await cartRepository.clearCart(session.user.id);

    // Invalidate cache after cart update
    const cacheKey = `cart-${session.user.id}`;
    await CacheService.invalidate(cacheKey);

    return NextResponse.json(ResponseBuilder.success(cart));
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(ResponseBuilder.error('Failed to clear cart'), { status: 500 });
  }
}
