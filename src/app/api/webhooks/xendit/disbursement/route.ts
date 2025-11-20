import { NextRequest, NextResponse } from 'next/server';
import { xenditService } from '@/services/XenditService';
import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { Timestamp } from 'firebase-admin/firestore';
import { eventBus } from '@/events/EventBus';

/**
 * POST /api/webhooks/xendit/disbursement
 * Handle Xendit disbursement status callbacks
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature
    const signature = request.headers.get('x-callback-token');
    const rawBody = await request.text();

    if (!signature) {
      console.error('[DisbursementWebhook] Missing signature');
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify signature
    const isValid = xenditService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('[DisbursementWebhook] Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 2. Parse webhook data
    const data = JSON.parse(rawBody);
    console.log('[DisbursementWebhook] Received data:', {
      id: data.id,
      status: data.status,
      external_id: data.external_id,
    });

    const {
      id: disbursementId,
      external_id: externalId,
      status,
      amount,
      failure_code: failureCode,
    } = data;

    // 3. Find the customization request by external ID
    // External ID format: "designer-payout-{requestId}-{timestamp}" or "shop-payout-{requestId}-{timestamp}"
    const isDesignerPayout = externalId.startsWith('designer-payout-');
    const isShopPayout = externalId.startsWith('shop-payout-');

    if (!isDesignerPayout && !isShopPayout) {
      console.error('[DisbursementWebhook] Unknown external ID format:', externalId);
      return NextResponse.json(
        { success: false, error: 'Unknown external ID format' },
        { status: 400 }
      );
    }

    // Extract requestId from external ID
    const parts = externalId.split('-');
    if (parts.length < 4) {
      console.error('[DisbursementWebhook] Invalid external ID format:', externalId);
      return NextResponse.json(
        { success: false, error: 'Invalid external ID format' },
        { status: 400 }
      );
    }

    const requestId = parts[2]; // "designer-payout-{requestId}-{timestamp}"

    // 4. Get customization request
    const customizationRepo = new CustomizationRepository();
    const request = await customizationRepo.findById(requestId);

    if (!request || !request.paymentDetails) {
      console.error('[DisbursementWebhook] Request not found:', requestId);
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // 5. Update disbursement status based on type
    if (status === 'COMPLETED') {
      if (isDesignerPayout) {
        // Designer payout successful
        await customizationRepo.update(requestId, {
          paymentDetails: {
            ...request.paymentDetails,
            designerPayoutId: disbursementId,
            designerPaidAt: Timestamp.now() as any,
          } as any,
          updatedAt: Timestamp.now() as any,
        });

        // Emit event
        eventBus.emit('disbursement.designer.completed', {
          requestId,
          designerId: request.designerId,
          amount,
          disbursementId,
        });

        console.log('[DisbursementWebhook] Designer payout completed:', {
          requestId,
          designerId: request.designerId,
          amount,
        });
      } else if (isShopPayout) {
        // Shop payout successful
        await customizationRepo.update(requestId, {
          paymentDetails: {
            ...request.paymentDetails,
            shopPayoutId: disbursementId,
            shopPaidAt: Timestamp.now() as any,
          } as any,
          updatedAt: Timestamp.now() as any,
        });

        // Emit event
        eventBus.emit('disbursement.shop.completed', {
          requestId,
          shopId: request.printingShopId,
          amount,
          disbursementId,
        });

        console.log('[DisbursementWebhook] Shop payout completed:', {
          requestId,
          shopId: request.printingShopId,
          amount,
        });
      }
    } else if (status === 'FAILED') {
      // Handle failed disbursement
      console.error('[DisbursementWebhook] Disbursement failed:', {
        requestId,
        disbursementId,
        failureCode,
        type: isDesignerPayout ? 'designer' : 'shop',
      });

      // Emit failure event for admin notification
      eventBus.emit('disbursement.failed', {
        requestId,
        disbursementId,
        type: isDesignerPayout ? 'designer' : 'shop',
        failureCode,
        amount,
      });

      // TODO: Notify admin and recipient about failed disbursement
      // Could implement retry logic here
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error: any) {
    console.error('[DisbursementWebhook] Error processing webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for Xendit webhook verification)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Xendit Disbursement Webhook Endpoint',
    status: 'active',
  });
}




