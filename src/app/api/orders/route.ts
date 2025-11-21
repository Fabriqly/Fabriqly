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

    // Fetch product names for all order items
    const productIds = new Set<string>();
    result.orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId) {
          productIds.add(item.productId);
        }
      });
    });

    // Fetch all products in parallel
    const productMap = new Map<string, string>();
    await Promise.all(
      Array.from(productIds).map(async (productId) => {
        try {
          const product = await FirebaseAdminService.getDocument(Collections.PRODUCTS, productId);
          if (product) {
            productMap.set(productId, product.name || `Product ${productId.slice(-8)}`);
          }
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
          productMap.set(productId, `Product ${productId.slice(-8)}`);
        }
      })
    );

    // Enrich orders with product names
    const enrichedOrders = result.orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        productName: productMap.get(item.productId) || `Product ${item.productId.slice(-8)}`
      }))
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
      shippingCost: body.shippingCost || 0
    };

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
