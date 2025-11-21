import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';

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

    // Serialize Firestore Timestamps to ISO strings for JSON compatibility
    const serializedOrder = {
      ...order,
      statusHistory: order.statusHistory?.map(h => ({
        ...h,
        timestamp: h.timestamp?.toDate ? h.timestamp.toDate().toISOString() : h.timestamp
      })),
      createdAt: order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : order.createdAt,
      updatedAt: order.updatedAt?.toDate ? order.updatedAt.toDate().toISOString() : order.updatedAt
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
