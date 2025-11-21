import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';

// PUT /api/orders/[id]/status - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'processing', 'to_ship', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Initialize services
    const orderRepo = new OrderRepository();
    const activityRepo = new ActivityRepository();
    const productRepo = new ProductRepository();
    const cacheService = new CacheService();
    
    const orderService = new OrderService(
      orderRepo,
      activityRepo,
      productRepo,
      cacheService
    );

    // Get current order to validate payment status
    const currentOrder = await orderRepo.findById(id);
    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate payment before allowing status change to shipped/delivered
    if ((status === 'shipped' || status === 'delivered') && currentOrder.paymentStatus !== 'paid') {
      return NextResponse.json(
        { 
          error: 'Order must be paid before it can be marked as shipped or delivered',
          paymentStatus: currentOrder.paymentStatus
        },
        { status: 400 }
      );
    }

    // Update order status
    const order = await orderService.updateOrderStatus(
      id,
      status as any,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: order,
      message: `Order status updated to ${status}`
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update order status' 
      },
      { status: 500 }
    );
  }
}
