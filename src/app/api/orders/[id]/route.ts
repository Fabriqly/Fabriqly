import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Initialize services
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();
    const productRepository = new ProductRepository();
    const cacheService = new CacheService();
    const orderService = new OrderService(orderRepository, activityRepository, productRepository, cacheService);

    // Get order (bypass cache to ensure fresh data)
    const order = await orderService.getOrder(id, session.user.id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Clear cache to ensure fresh data on next request
    await CacheService.invalidate(`order:${id}`);

    // Enrich order items with product information
    const enrichedItems = await Promise.all(
      (order.items || []).map(async (item) => {
        try {
          // Fetch product details
          const product = await productRepository.findById(item.productId);
          
          // Fetch product images
          let productImages: any[] = [];
          try {
            const allImages = await FirebaseAdminService.queryDocuments(
              Collections.PRODUCT_IMAGES,
              [{ field: 'productId', operator: '==' as const, value: item.productId }],
              { field: 'sortOrder', direction: 'asc' },
              10 // Limit to 10 images
            );
            productImages = (allImages || []).map((img: any) => ({
              id: img.id,
              imageUrl: img.imageUrl,
              altText: img.altText || '',
              isPrimary: img.isPrimary || false
            }));
          } catch (error) {
            console.error(`Error fetching images for product ${item.productId}:`, error);
          }

          // Extract variant information from customizations
          const customizations = item.customizations || {};
          const selectedDesign = customizations.selectedDesign || (customizations.design ? { name: customizations.design, priceModifier: customizations.designPriceModifier || 0 } : undefined);
          const selectedSize = customizations.selectedSize || (customizations.size ? { name: customizations.size, priceModifier: customizations.sizePriceModifier || 0 } : undefined);
          const selectedColorId = customizations.colorId || customizations.selectedColorId;
          const selectedColorName = customizations.selectedColorName || customizations.colorName;
          
          // Create selectedVariants object excluding already extracted fields
          const selectedVariants: Record<string, any> = {};
          Object.keys(customizations).forEach(key => {
            if (!['selectedDesign', 'selectedSize', 'design', 'size', 'colorId', 'selectedColorId', 'selectedColorName', 'colorName', 'designPriceModifier', 'sizePriceModifier'].includes(key)) {
              selectedVariants[key] = customizations[key];
            }
          });

          return {
            ...item,
            productName: product?.name || `Product ${item.productId.slice(-8)}`,
            product: product ? {
              id: product.id,
              name: product.name,
              price: product.price,
              sku: product.sku,
              images: productImages
            } : undefined,
            selectedDesign,
            selectedSize,
            selectedColorId,
            selectedColorName,
            selectedVariants: Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity
          };
        } catch (error) {
          console.error(`Error enriching item ${item.productId}:`, error);
          return {
            ...item,
            productName: `Product ${item.productId.slice(-8)}`,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity
          };
        }
      })
    );

    // Serialize Firestore Timestamps to ISO strings for JSON compatibility
    const serializedOrder = {
      ...order,
      statusHistory: order.statusHistory?.map(h => ({
        ...h,
        timestamp: h.timestamp?.toDate ? h.timestamp.toDate().toISOString() : h.timestamp
      })),
      createdAt: order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : order.createdAt,
      updatedAt: order.updatedAt?.toDate ? order.updatedAt.toDate().toISOString() : order.updatedAt,
      items: enrichedItems
    };

    return NextResponse.json({ order: serializedOrder });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    
    if (error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message || 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
