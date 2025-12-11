import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CartRepository } from '@/repositories/CartRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { CacheService } from '@/services/CacheService';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(ResponseBuilder.error('Authentication required'), { status: 401 });
    }

    const { itemId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 0) {
      return NextResponse.json(ResponseBuilder.error('Invalid quantity'), { status: 400 });
    }

    // First, get the current cart to find the item
    const cartRepository = new CartRepository();
    const currentCart = await cartRepository.findByUserId(session.user.id);
    
    if (!currentCart) {
      return NextResponse.json(ResponseBuilder.error('Cart not found'), { status: 404 });
    }

    // Find the item to get product information
    const cartItem = currentCart.items.find(item => item.id === itemId);
    if (!cartItem) {
      return NextResponse.json(ResponseBuilder.error('Item not found in cart'), { status: 404 });
    }

    // Validate stock availability if quantity > 0
    if (quantity > 0) {
      const productRepository = new ProductRepository();
      const product = await productRepository.findById(cartItem.productId);
      
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
    }

    const cart = await cartRepository.updateItemQuantity(session.user.id, itemId, quantity);

    // Refresh product images for all cart items (same logic as GET /api/cart)
    const { FirebaseAdminService } = await import('@/services/firebase-admin');
    const { Collections } = await import('@/services/firebase');
    
    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        try {
          // Fetch fresh product images
          const allImages = await FirebaseAdminService.queryDocuments(
            Collections.PRODUCT_IMAGES,
            [], // No constraints to avoid index requirements
            { field: 'sortOrder', direction: 'asc' }
          );
          
          const productImages = allImages.filter(img => img.productId === item.productId) || [];
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

    // Invalidate cache after cart update
    const cacheKey = `cart-${session.user.id}`;
    await CacheService.invalidate(cacheKey);

    return NextResponse.json(ResponseBuilder.success(updatedCart));
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(ResponseBuilder.error('Failed to update cart item'), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(ResponseBuilder.error('Authentication required'), { status: 401 });
    }

    const { itemId } = await params;

    const cartRepository = new CartRepository();
    const cart = await cartRepository.removeItemFromCart(session.user.id, itemId);

    // Refresh product images for all cart items (same logic as GET /api/cart)
    const { FirebaseAdminService } = await import('@/services/firebase-admin');
    const { Collections } = await import('@/services/firebase');
    
    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        try {
          // Fetch fresh product images
          const allImages = await FirebaseAdminService.queryDocuments(
            Collections.PRODUCT_IMAGES,
            [], // No constraints to avoid index requirements
            { field: 'sortOrder', direction: 'asc' }
          );
          
          const productImages = allImages.filter(img => img.productId === item.productId) || [];
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

    // Invalidate cache after cart update
    const cacheKey = `cart-${session.user.id}`;
    await CacheService.invalidate(cacheKey);

    return NextResponse.json(ResponseBuilder.success(updatedCart));
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(ResponseBuilder.error('Failed to remove cart item'), { status: 500 });
  }
}
