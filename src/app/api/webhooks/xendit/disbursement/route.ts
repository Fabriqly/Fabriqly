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
    console.log('[DisbursementWebhook] Received data:', JSON.stringify(data, null, 2));

    // Handle different webhook formats:
    // 1. Payouts v2: { event: "payout.succeeded", data: {...} }
    // 2. Batch Disbursement: { disbursements: [...], ... }
    // 3. Single Disbursement: { id, status, external_id, ... }

    let disbursementData: any;
    let status: string;
    let disbursementId: string;
    let externalId: string;
    let amount: number;
    let failureCode: string | undefined;

    if (data.event && data.data) {
      // Payouts v2 format
      console.log('[DisbursementWebhook] Processing Payouts v2 format');
      disbursementData = data.data;
      status = disbursementData.status === 'SUCCEEDED' ? 'COMPLETED' : disbursementData.status;
      disbursementId = disbursementData.id;
      externalId = disbursementData.reference_id || disbursementData.external_id;
      amount = disbursementData.amount;
      failureCode = disbursementData.failure_code;
    } else if (data.disbursements && Array.isArray(data.disbursements)) {
      // Batch Disbursement format - process first disbursement
      console.log('[DisbursementWebhook] Processing Batch Disbursement format');
      disbursementData = data.disbursements[0];
      status = disbursementData.status === 'COMPLETED' ? 'COMPLETED' : disbursementData.status;
      disbursementId = disbursementData.id;
      externalId = disbursementData.external_id;
      amount = disbursementData.amount;
      failureCode = disbursementData.failure_code;
    } else {
      // Single Disbursement format
      console.log('[DisbursementWebhook] Processing Single Disbursement format');
      disbursementData = data;
      status = data.status;
      disbursementId = data.id;
      externalId = data.external_id;
      amount = data.amount;
      failureCode = data.failure_code;
    }

    console.log('[DisbursementWebhook] Parsed data:', {
      disbursementId,
      externalId,
      status,
      amount,
      failureCode,
    });

    // 3. Find the customization request by external ID
    // External ID format: "designer-payout-{requestId}-{timestamp}" or "shop-payout-{requestId}-{timestamp}"
    // OR for Payouts v2: reference_id might be the external_id
    const isDesignerPayout = externalId?.startsWith('designer-payout-');
    const isShopPayout = externalId?.startsWith('shop-payout-');

    // Check if this is a test webhook
    const isTestWebhook = 
      !externalId ||
      externalId === 'disb-1234567890' ||
      externalId === '1' ||
      // UUID format (Payouts v2 test webhooks)
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(externalId);

    if (!externalId || (!isDesignerPayout && !isShopPayout)) {
      if (isTestWebhook) {
        console.log('[DisbursementWebhook] Test webhook received, skipping processing');
        return NextResponse.json({
          success: true,
          message: 'Test webhook received',
        });
      }
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
    const customizationRequest = await customizationRepo.findById(requestId);

    if (!customizationRequest || !customizationRequest.paymentDetails) {
      console.error('[DisbursementWebhook] Request not found:', requestId);
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // 5. Update disbursement status based on type
    if (status === 'COMPLETED' || status === 'SUCCEEDED') {
      if (isDesignerPayout) {
        // Designer payout successful
        await customizationRepo.update(requestId, {
          paymentDetails: {
            ...customizationRequest.paymentDetails,
            designerPayoutId: disbursementId,
            designerPaidAt: Timestamp.now() as any,
          } as any,
          updatedAt: Timestamp.now() as any,
        });

        // Emit event
        eventBus.emit('disbursement.designer.completed', {
          requestId,
          designerId: customizationRequest.designerId,
          amount,
          disbursementId,
        });

        console.log('[DisbursementWebhook] Designer payout completed:', {
          requestId,
          designerId: customizationRequest.designerId,
          amount,
        });
      } else if (isShopPayout) {
        // Shop payout successful
        await customizationRepo.update(requestId, {
          paymentDetails: {
            ...customizationRequest.paymentDetails,
            shopPayoutId: disbursementId,
            shopPaidAt: Timestamp.now() as any,
          } as any,
          updatedAt: Timestamp.now() as any,
        });

        // Emit event
        eventBus.emit('disbursement.shop.completed', {
          requestId,
          shopId: customizationRequest.printingShopId,
          amount,
          disbursementId,
        });

        console.log('[DisbursementWebhook] Shop payout completed:', {
          requestId,
          shopId: customizationRequest.printingShopId,
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







