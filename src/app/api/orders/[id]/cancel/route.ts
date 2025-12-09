import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';

// POST /api/orders/[id]/cancel - Cancel order (customer only, pending orders only)
export async function POST(
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

    // Initialize services
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();
    const productRepository = new ProductRepository();
    const cacheService = new CacheService();
    const orderService = new OrderService(orderRepository, activityRepository, productRepository, cacheService);

    // Get order
    const order = await orderService.getOrder(id, session.user.id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only customer can cancel their own orders
    if (order.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only cancel your own orders' },
        { status: 403 }
      );
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.` },
        { status: 400 }
      );
    }

    // Cancel the order
    await orderService.updateOrderStatus(id, 'cancelled', session.user.id);

    // If payment was made, trigger refund (this would integrate with payment service)
    if (order.paymentStatus === 'paid' && order.paymentMethod === 'xendit') {
      // TODO: Integrate with Xendit refund API
      // For now, just update payment status to refunded
      await orderRepository.update(id, {
        paymentStatus: 'refunded'
      });
      
      console.log(`[Order Cancel] Order ${id} was paid. Refund should be processed.`);
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully. Refund will be processed if payment was made.',
      data: {
        orderId: id,
        status: 'cancelled'
      }
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to cancel order' 
      },
      { status: 500 }
    );
  }
}




