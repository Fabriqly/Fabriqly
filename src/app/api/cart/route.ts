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

    // Try to get cached cart first
    const cacheKey = `cart-${session.user.id}`;
    const cached = await CacheService.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }

    // Refresh product images for all cart items (with limits)
    const { FirebaseAdminService } = await import('@/services/firebase-admin');
    const { Collections } = await import('@/services/firebase');
    
    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        try {
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
        } catch (error) {
          console.error(`Error refreshing images for product ${item.productId}:`, error);
          return item; // Return original item if image refresh fails
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
    const { productId, quantity, selectedVariants = {}, selectedColorId, colorPriceAdjustment = 0, businessOwnerId } = body;

    // Validate required fields
    if (!productId || !quantity || !businessOwnerId) {
      return NextResponse.json(ResponseBuilder.error('Missing required fields: productId, quantity, businessOwnerId'), { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json(ResponseBuilder.error('Quantity must be greater than 0'), { status: 400 });
    }

    // Fetch product details
    const productRepository = new ProductRepository();
    const product = await productRepository.findById(productId);

    if (!product) {
      return NextResponse.json(ResponseBuilder.error('Product not found'), { status: 404 });
    }

    // Fetch product images with limit
    let images: any[] = [];
    try {
      const { FirebaseAdminService } = await import('@/services/firebase-admin');
      const { Collections } = await import('@/services/firebase');
      
      const allImages = await FirebaseAdminService.queryDocuments(
        Collections.PRODUCT_IMAGES,
        [{ field: 'productId', operator: '==' as const, value: productId }],
        { field: 'sortOrder', direction: 'asc' },
        10 // Limit to 10 images per product
      );
      
      images = allImages || [];
      console.log(`Product ${productId} images:`, images);
    } catch (error) {
      console.error(`Error fetching images for product ${productId}:`, error);
    }

    // Calculate unit price
    let unitPrice = product.price + colorPriceAdjustment;
    
    // Add variant price adjustments (if variants exist)
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

    // Prepare cart item
    const cartItem = {
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
      colorPriceAdjustment,
      unitPrice,
      totalPrice: unitPrice * quantity,
      businessOwnerId
    };

    // Add to cart
    const cartRepository = new CartRepository();
    const cart = await cartRepository.addItemToCart(session.user.id, cartItem);

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

    return NextResponse.json(ResponseBuilder.success(cart));
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(ResponseBuilder.error('Failed to clear cart'), { status: 500 });
  }
}
