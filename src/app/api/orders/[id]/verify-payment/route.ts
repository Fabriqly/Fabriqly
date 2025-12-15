import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderRepository } from '@/repositories/OrderRepository';
import { xenditService } from '@/services/XenditService';

/**
 * POST /api/orders/[id]/verify-payment
 * Manually verify payment status by checking Xendit invoice status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const orderRepository = new OrderRepository();
    const order = await orderRepository.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this order
    if (order.customerId !== session.user.id && 
        order.businessOwnerId !== session.user.id && 
        session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to access this order' },
        { status: 403 }
      );
    }

    // Check if order has a payment reference
    if (!order.paymentReference) {
      return NextResponse.json({
        success: false,
        error: 'Order does not have a payment reference',
        paymentStatus: order.paymentStatus
      });
    }

    // Get invoice status from Xendit
    try {
      const invoice = await xenditService.getInvoice(order.paymentReference);
      
      console.log(`[Verify Payment] Invoice status for order ${id}:`, {
        invoiceId: invoice.id,
        status: invoice.status,
        currentOrderStatus: order.paymentStatus
      });

      // If invoice is paid but order status is still pending, update it
      if (invoice.status === 'PAID' && order.paymentStatus === 'pending') {
        console.log(`[Verify Payment] Invoice is paid but order status is pending. Updating order ${id}...`);
        
        // Import webhook handler to reuse the payment processing logic
        const { OrderRepository: OrderRepo } = await import('@/repositories/OrderRepository');
        const { ActivityRepository } = await import('@/repositories/ActivityRepository');
        const { CacheService } = await import('@/services/CacheService');
        const { Timestamp } = await import('firebase-admin/firestore');
        
        const orderRepo = new OrderRepository();
        const activityRepo = new ActivityRepository();
        
        // Update payment status
        await orderRepo.updatePaymentStatus(id, 'paid');
        
        // Check if this is a design-only order
        const isDesignOnlyOrder = order.items.every((item: any) => 
          item.itemType === 'design' || (item.designId && !item.productId)
        );
        
        if (isDesignOnlyOrder) {
          // Mark as delivered
          await orderRepo.updateOrderStatus(id, 'delivered');
          
          // Add status history entry
          const now = new Date();
          const statusHistory = order.statusHistory || [];
          statusHistory.push({
            status: 'delivered',
            timestamp: { seconds: Math.floor(now.getTime() / 1000), nanoseconds: 0 } as any,
            updatedBy: 'system'
          });
          await orderRepo.update(id, {
            statusHistory,
            updatedAt: now
          });
          
          // Record designer earnings
          if (order.businessOwnerId) {
            try {
              const { FirebaseAdminService } = await import('@/services/firebase-admin');
              const { Collections } = await import('@/services/firebase');
              
              const designerProfiles = await FirebaseAdminService.queryDocuments(
                Collections.DESIGNER_PROFILES,
                [{ field: 'userId', operator: '==', value: order.businessOwnerId }]
              );
              
              if (designerProfiles.length > 0) {
                const designerProfile = designerProfiles[0];
                const designEarnings = order.totalAmount;
                
                // Check if earnings record already exists
                const existingEarnings = await FirebaseAdminService.queryDocuments(
                  Collections.DESIGNER_EARNINGS,
                  [{ field: 'orderId', operator: '==', value: id }]
                );
                
                if (existingEarnings.length === 0) {
                  const earningsData = {
                    designerId: designerProfile.id,
                    designerUserId: order.businessOwnerId,
                    orderId: id,
                    amount: designEarnings,
                    orderTotal: order.totalAmount,
                    itemCount: order.items.length,
                    status: 'paid',
                    paidAt: Timestamp.now(),
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                  };
                  
                  await FirebaseAdminService.createDocument(
                    Collections.DESIGNER_EARNINGS,
                    earningsData
                  );
                  
                  console.log(`[Verify Payment] Earnings recorded for designer ${designerProfile.id}: ${designEarnings}`);
                }
              }
            } catch (earningsError) {
              console.error(`[Verify Payment] Error recording designer earnings:`, earningsError);
            }
          }
        } else {
          // Product orders go to processing
          await orderRepo.updateOrderStatus(id, 'processing');
        }
        
        // Clear cache
        await CacheService.invalidate(`order:${id}`);
        await CacheService.invalidate(`orders:customer:${order.customerId}`);
        await CacheService.invalidate(`orders:business:${order.businessOwnerId}`);
        
        // Log activity
        await activityRepo.create({
          type: 'payment_completed',
          title: 'Payment Verified',
          description: `Payment verified for Order #${id}`,
          priority: 'high',
          status: 'active',
          targetId: id,
          actorId: session.user.id,
          metadata: {
            orderId: id,
            invoiceId: invoice.id,
            amount: invoice.amount,
            paymentMethod: 'manual_verification',
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        
        // Refresh order data
        const updatedOrder = await orderRepository.findById(id);
        
        return NextResponse.json({
          success: true,
          message: 'Payment verified and order updated',
          invoiceStatus: invoice.status,
          orderStatus: updatedOrder?.status,
          paymentStatus: updatedOrder?.paymentStatus,
          wasUpdated: true
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Payment status checked',
        invoiceStatus: invoice.status,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        wasUpdated: false
      });
      
    } catch (invoiceError: any) {
      console.error(`[Verify Payment] Error checking invoice status:`, invoiceError);
      return NextResponse.json({
        success: false,
        error: 'Failed to verify payment status',
        details: invoiceError.message,
        paymentStatus: order.paymentStatus
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

