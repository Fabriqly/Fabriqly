import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';
import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';

// POST /api/orders/[id]/reject - Reject order (shop owner only)
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

    // Only business owners can reject orders
    if (session.user.role !== 'business_owner') {
      return NextResponse.json(
        { error: 'Only shop owners can reject orders' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { rejectionReason } = body;

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

    // Verify order belongs to this shop owner
    if (order.businessOwnerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only reject orders for your own shop' },
        { status: 403 }
      );
    }

    // Only allow rejection of pending or processing orders
    if (order.status !== 'pending' && order.status !== 'processing') {
      return NextResponse.json(
        { error: `Cannot reject order with status: ${order.status}` },
        { status: 400 }
      );
    }

    // Update order status to cancelled
    await orderService.updateOrderStatus(id, 'cancelled', session.user.id);

    // If this is a customization order, clear printingShopId to allow shop reselection
    const customizationRequestId = order.items?.[0]?.customizations?.customizationRequestId;
    if (customizationRequestId) {
      const customizationRepo = new CustomizationRepository();
      const customizationRequest = await customizationRepo.findById(customizationRequestId);
      
      if (customizationRequest) {
        await customizationRepo.update(customizationRequestId, {
          printingShopId: null,
          printingShopName: null,
          status: 'approved', // Reset to approved so customer can select new shop
          designerNotes: rejectionReason ? 
            `${customizationRequest.designerNotes || ''}\n\n[Order Rejected by Shop] ${rejectionReason}`.trim() : 
            customizationRequest.designerNotes,
          updatedAt: Timestamp.now() as any
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order rejected successfully. Customer can now select a different shop.',
      data: {
        orderId: id,
        status: 'cancelled'
      }
    });
  } catch (error: any) {
    console.error('Error rejecting order:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to reject order' 
      },
      { status: 500 }
    );
  }
}

