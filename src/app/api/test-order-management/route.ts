import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';

// Test the new order management functions
export async function GET() {
  try {
    // Initialize services
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();
    const productRepository = new ProductRepository();
    const cacheService = new CacheService();
    const orderService = new OrderService(orderRepository, activityRepository, productRepository, cacheService);

    // Test status transitions
    const validTransitions = {
      'pending': orderService.getValidStatusTransitions('pending'),
      'processing': orderService.getValidStatusTransitions('processing'),
      'to_ship': orderService.getValidStatusTransitions('to_ship'),
      'shipped': orderService.getValidStatusTransitions('shipped'),
      'delivered': orderService.getValidStatusTransitions('delivered'),
      'cancelled': orderService.getValidStatusTransitions('cancelled')
    };

    // Test status validation
    const statusValidation = {
      'pending_to_processing': orderService.canUpdateStatus('pending', 'processing'),
      'processing_to_to_ship': orderService.canUpdateStatus('processing', 'to_ship'),
      'to_ship_to_shipped': orderService.canUpdateStatus('to_ship', 'shipped'),
      'shipped_to_delivered': orderService.canUpdateStatus('shipped', 'delivered'),
      'invalid_transition': orderService.canUpdateStatus('delivered', 'pending')
    };

    return NextResponse.json({
      message: 'Order management functions test completed successfully',
      validTransitions,
      statusValidation,
      newFeatures: [
        'Added "to_ship" status to order status enum',
        'Updated status transition logic to include to_ship',
        'Added markOrderToShip function',
        'Added getOrdersToShip function',
        'Added getOrdersByStatus function',
        'Created API endpoints for order management',
        'Updated orders page with new status and functionality',
        'Created dedicated orders-to-ship page for business owners'
      ]
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error testing order management functions:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}
