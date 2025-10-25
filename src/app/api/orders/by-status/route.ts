import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';

// GET /api/orders/by-status - Get orders by status
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
    const status = searchParams.get('status') as 'pending' | 'processing' | 'to_ship' | 'shipped' | 'delivered' | 'cancelled';
    const businessOwnerId = searchParams.get('businessOwnerId');

    if (!status) {
      return NextResponse.json(
        { error: 'Status parameter is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();
    const productRepository = new ProductRepository();
    const cacheService = new CacheService();
    const orderService = new OrderService(orderRepository, activityRepository, productRepository, cacheService);

    // Get orders by status
    const orders = await orderService.getOrdersByStatus(
      status, 
      businessOwnerId || undefined, 
      session.user.id
    );

    return NextResponse.json({ 
      orders,
      count: orders.length,
      status
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching orders by status:', error);
    
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
