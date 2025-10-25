import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';

// PUT /api/orders/[id]/to-ship - Mark order as ready to ship
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orderId = params.id;

    // Initialize services
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();
    const productRepository = new ProductRepository();
    const cacheService = new CacheService();
    const orderService = new OrderService(orderRepository, activityRepository, productRepository, cacheService);

    // Mark order as ready to ship
    const updatedOrder = await orderService.markOrderToShip(orderId, session.user.id);

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Order marked as ready to ship successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error marking order as ready to ship:', error);
    
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
