import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { escrowService } from '@/services/EscrowService';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { eventBus } from '@/events/EventBus';
import { AppError } from '@/errors/AppError';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/customizations/[id]/approve-design
 * Customer approves the final design, triggering automatic designer payout
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: customizationId } = await params;
    const { messageId } = await request.json();

    // 2. Get customization request
    const customizationRepo = new CustomizationRepository();
    const customizationRequest = await customizationRepo.findById(customizationId);

    if (!customizationRequest) {
      return NextResponse.json(
        { success: false, error: 'Customization request not found' },
        { status: 404 }
      );
    }

    // 3. Verify user is the customer
    if (customizationRequest.customerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the customer can approve the design' },
        { status: 403 }
      );
    }

    // 4. Verify status is awaiting approval
    if (customizationRequest.status !== 'awaiting_customer_approval') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot approve design in current status: ${customizationRequest.status}`,
        },
        { status: 400 }
      );
    }

    // 5. Get the message with final design attachment
    let finalDesignUrl: string | undefined;
    if (messageId) {
      try {
        const message = await FirebaseAdminService.getDocument(Collections.MESSAGES, messageId);
        if (message && message.attachments && message.attachments.length > 0) {
          const finalDesign = message.attachments.find((att: any) => att.isFinalDesign);
          if (finalDesign) {
            finalDesignUrl = finalDesign.url;
          }
        }
      } catch (error) {
        console.error('Error fetching message:', error);
      }
    }

    // Fallback to designer's uploaded final file
    if (!finalDesignUrl && customizationRequest.designerFinalFile) {
      finalDesignUrl = customizationRequest.designerFinalFile.url;
    }

    // 6. Update customization status to 'ready_for_production'
    await customizationRepo.update(customizationId, {
      status: 'ready_for_production',
      approvedAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
    });

    // 7. Release designer payment from escrow
    // If payout fails, log error but don't block approval
    let payoutSuccess = false;
    let payoutError: string | null = null;
    
    console.log('[ApproveDesign] Attempting to release designer payment...');
    try {
      await escrowService.releaseDesignerPayment(customizationId);
      console.log('[ApproveDesign] Designer payment released successfully');
      payoutSuccess = true;
    } catch (error: any) {
      console.error('[ApproveDesign] Failed to release designer payment:', error);
      payoutError = error.message || 'Unknown error';
      // Don't throw error - approval should succeed even if payout fails
      // Admin can manually process payout later if needed
      eventBus.emit('customization.payout.failed', {
        requestId: customizationId,
        error: payoutError,
        designerId: customizationRequest.designerId
      });
    }

    // 8. Fire events
    eventBus.emit('customization.design.approved', {
      requestId: customizationId,
      customerId: customizationRequest.customerId,
      designerId: customizationRequest.designerId,
      finalDesignUrl,
    });

    // 9. Notify shop owner (if shop is assigned)
    if (customizationRequest.printingShopId) {
      eventBus.emit('customization.ready_for_production', {
        requestId: customizationId,
        shopId: customizationRequest.printingShopId,
        finalDesignUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: payoutSuccess 
        ? 'Design approved successfully. Designer payment has been processed.'
        : 'Design approved successfully. Payout processing failed - admin will handle manually.',
      data: {
        status: 'ready_for_production',
        finalDesignUrl,
        payoutProcessed: payoutSuccess,
        payoutError: payoutError,
      },
    });
  } catch (error: any) {
    console.error('[ApproveDesign] Error:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to approve design', details: error.message },
      { status: 500 }
    );
  }
}







