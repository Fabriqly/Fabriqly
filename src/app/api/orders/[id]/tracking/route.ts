import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';

// GET /api/orders/[id]/tracking - Get order tracking information
export async function GET(
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

    const { id: orderId } = await params;

    // Initialize services
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();
    const productRepository = new ProductRepository();
    const cacheService = new CacheService();
    const orderService = new OrderService(orderRepository, activityRepository, productRepository, cacheService);

    const order = await orderService.getOrder(orderId, session.user.id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate tracking information based on order status
    const trackingInfo = {
      orderId: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      shippingAddress: order.shippingAddress,
      timeline: generateTrackingTimeline(order),
      carrier: order.carrier || 'Standard Shipping',
      lastUpdated: order.updatedAt
    };

    return NextResponse.json({ tracking: trackingInfo });
  } catch (error) {
    console.error('Error fetching tracking information:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id]/tracking - Update tracking information
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

    const { id: orderId } = await params;
    const body = await request.json();
    const { trackingNumber, carrier, estimatedDelivery } = body;

    // Initialize services
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();
    const productRepository = new ProductRepository();
    const cacheService = new CacheService();
    const orderService = new OrderService(orderRepository, activityRepository, productRepository, cacheService);

    // Prepare update data
    const updateData: any = {};

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (carrier) {
      updateData.carrier = carrier;
    }

    if (estimatedDelivery) {
      updateData.estimatedDelivery = new Date(estimatedDelivery);
    }

    const updatedOrder = await orderService.updateOrder(orderId, updateData, session.user.id);

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Tracking information updated'
    });
  } catch (error) {
    console.error('Error updating tracking information:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate tracking timeline
function generateTrackingTimeline(order: any) {
  const timeline = [];
  const createdAt = new Date(order.createdAt);
  const updatedAt = new Date(order.updatedAt);

  // Order placed
  timeline.push({
    status: 'Order Placed',
    date: createdAt,
    description: 'Your order has been placed successfully',
    completed: true
  });

  // Order confirmed
  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'Order Confirmed',
      date: new Date(createdAt.getTime() + 30 * 60 * 1000), // 30 minutes later
      description: 'Your order has been confirmed and is being prepared',
      completed: true
    });
  }

  // Processing
  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'Processing',
      date: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      description: 'Your order is being processed and prepared for shipment',
      completed: true
    });
  }

  // Shipped
  if (['shipped', 'delivered'].includes(order.status)) {
    timeline.push({
      status: 'Shipped',
      date: updatedAt,
      description: order.trackingNumber 
        ? `Your order has been shipped. Tracking: ${order.trackingNumber}`
        : 'Your order has been shipped',
      completed: true
    });
  }

  // Delivered
  if (order.status === 'delivered') {
    timeline.push({
      status: 'Delivered',
      date: updatedAt,
      description: 'Your order has been delivered successfully',
      completed: true
    });
  }

  // Cancelled
  if (order.status === 'cancelled') {
    timeline.push({
      status: 'Cancelled',
      date: updatedAt,
      description: 'Your order has been cancelled',
      completed: true
    });
  }

  return timeline;
}
