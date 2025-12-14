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

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const businessOwnerId = searchParams.get('businessOwnerId');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Initialize services
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();
    const productRepository = new ProductRepository();
    const cacheService = new CacheService();
    const orderService = new OrderService(orderRepository, activityRepository, productRepository, cacheService);

    // Build search options
    const searchOptions = {
      status,
      businessOwnerId: businessOwnerId || undefined,
      customerId: customerId || undefined,
      limit,
      offset,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const
    };

    // Non-admin users can only see their own orders
    if (session.user.role !== 'admin') {
      // Business owners see orders for their shop
      if (session.user.role === 'business_owner') {
        searchOptions.businessOwnerId = session.user.id;
      } else {
        // Customers see their own orders
        searchOptions.customerId = session.user.id;
      }
    }

    // Try to get cached orders first
    const cacheKey = `orders-${JSON.stringify(searchOptions)}-${session.user.id}`;
    const cached = await CacheService.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }

    const result = await orderService.getOrders(searchOptions, session.user.id);

    // Fetch product names and images for all order items
    const productIds = new Set<string>();
    result.orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId) {
          productIds.add(item.productId);
        }
      });
    });

    // Fetch all products and images in parallel
    const productMap = new Map<string, { name: string; images: any[] }>();
    await Promise.all(
      Array.from(productIds).map(async (productId) => {
        try {
          const product = await FirebaseAdminService.getDocument(Collections.PRODUCTS, productId);
          let productImages: any[] = [];
          
          // Fetch product images
          try {
            const allImages = await FirebaseAdminService.queryDocuments(
              Collections.PRODUCT_IMAGES,
              [{ field: 'productId', operator: '==' as const, value: productId }],
              { field: 'sortOrder', direction: 'asc' },
              1 // Only need first image for list view
            );
            productImages = (allImages || []).map((img: any) => ({
              id: img.id,
              imageUrl: img.imageUrl,
              altText: img.altText || '',
              isPrimary: img.isPrimary || false
            }));
          } catch (error) {
            console.error(`Error fetching images for product ${productId}:`, error);
          }
          
          if (product) {
            productMap.set(productId, {
              name: product.name || `Product ${productId.slice(-8)}`,
              images: productImages
            });
          }
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
          productMap.set(productId, {
            name: `Product ${productId.slice(-8)}`,
            images: []
          });
        }
      })
    );

    // Enrich orders with product names, images, and variant information
    const enrichedOrders = result.orders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const productData = productMap.get(item.productId);
        
        // Extract variant information from customizations
        const customizations = item.customizations || {};
        const selectedDesign = customizations.selectedDesign || (customizations.design ? { name: customizations.design, priceModifier: customizations.designPriceModifier || 0 } : undefined);
        const selectedSize = customizations.selectedSize || (customizations.size ? { name: customizations.size, priceModifier: customizations.sizePriceModifier || 0 } : undefined);
        const selectedColorId = customizations.colorId || customizations.selectedColorId;
        const selectedColorName = customizations.selectedColorName || customizations.colorName;
        
        // Create selectedVariants object excluding already extracted fields
        const selectedVariants: Record<string, any> = {};
        Object.keys(customizations).forEach(key => {
          if (!['selectedDesign', 'selectedSize', 'design', 'size', 'colorId', 'selectedColorId', 'selectedColorName', 'colorName', 'designPriceModifier', 'sizePriceModifier', 'customizationRequestId', 'designerName', 'printingShopName', 'designerFinalFileUrl'].includes(key)) {
            selectedVariants[key] = customizations[key];
          }
        });
        
        return {
          ...item,
          productName: productData?.name || `Product ${item.productId.slice(-8)}`,
          product: productData ? {
            id: item.productId,
            name: productData.name,
            images: productData.images
          } : undefined,
          selectedDesign,
          selectedSize,
          selectedColorId,
          selectedColorName,
          selectedVariants: Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined
        };
      })
    }));

    const response = { 
      orders: enrichedOrders,
      totalRevenue: result.totalRevenue,
      total: result.total,
      hasMore: result.hasMore
    };
    
    // Cache the response for 3 minutes (orders change moderately)
    await CacheService.set(cacheKey, response, 3 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Initialize services
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();
    const productRepository = new ProductRepository();
    const cacheService = new CacheService();
    const orderService = new OrderService(orderRepository, activityRepository, productRepository, cacheService);

    // Create order data
    const orderData = {
      customerId: session.user.id,
      businessOwnerId: body.businessOwnerId,
      items: body.items,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      shippingCost: body.shippingCost || 0,
      couponCode: body.couponCode || undefined // Include coupon code for discount application
    };

    console.log('[Orders API] Creating order with data:', {
      customerId: orderData.customerId,
      businessOwnerId: orderData.businessOwnerId,
      itemCount: orderData.items.length,
      couponCode: orderData.couponCode,
      shippingCost: orderData.shippingCost
    });

    const order = await orderService.createOrder(orderData);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
