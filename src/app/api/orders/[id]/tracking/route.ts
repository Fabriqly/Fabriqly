import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';

// PUT /api/orders/[id]/tracking - Add tracking number to order
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
    const { trackingNumber, carrier } = body;

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
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

    // Add tracking number
    const order = await orderService.addTrackingNumber(
      id,
      trackingNumber,
      carrier,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Tracking number added successfully'
    });
  } catch (error: any) {
    console.error('Error adding tracking number:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to add tracking number' 
      },
      { status: 500 }
    );
  }
}
