import { NextRequest, NextResponse } from 'next/server';
import { xenditService } from '../../../../services/XenditService';
import { OrderRepository } from '../../../../repositories/OrderRepository';
import { ActivityRepository } from '../../../../repositories/ActivityRepository';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-callback-token') || '';

    // Verify webhook signature
    if (!xenditService.verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhookData = JSON.parse(body);
    console.log('Received Xendit webhook:', webhookData);

    // Handle different webhook events
    switch (webhookData.event) {
      case 'invoice.paid':
        await handleInvoicePaid(webhookData.data);
        break;
      
      case 'invoice.expired':
        await handleInvoiceExpired(webhookData.data);
        break;
      
      case 'payment_request.succeeded':
        await handlePaymentRequestSucceeded(webhookData.data);
        break;
      
      case 'payment_request.failed':
        await handlePaymentRequestFailed(webhookData.data);
        break;
      
      default:
        console.log('Unhandled webhook event:', webhookData.event);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleInvoicePaid(invoiceData: any) {
  try {
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();

    // Find order by external_id
    const externalId = invoiceData.external_id;
    const orderId = externalId.split('_')[1]; // Extract order ID from external_id

    if (!orderId) {
      console.error('Could not extract order ID from external_id:', externalId);
      return;
    }

    const order = await orderRepository.getById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }

    // Update order payment status
    await orderRepository.updatePaymentStatus(orderId, 'paid');
    await orderRepository.updateOrderStatus(orderId, 'processing');

    // Log activity
    await activityRepository.create({
      type: 'payment_completed',
      title: 'Payment Completed',
      description: `Payment received for Order #${orderId}`,
      priority: 'high',
      status: 'active',
      targetId: orderId,
      actorId: order.customerId,
      metadata: {
        orderId: orderId,
        invoiceId: invoiceData.id,
        amount: invoiceData.amount,
        paymentMethod: 'xendit_invoice',
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('Invoice paid successfully for order:', orderId);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

async function handleInvoiceExpired(invoiceData: any) {
  try {
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();

    // Find order by external_id
    const externalId = invoiceData.external_id;
    const orderId = externalId.split('_')[1];

    if (!orderId) {
      console.error('Could not extract order ID from external_id:', externalId);
      return;
    }

    const order = await orderRepository.getById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }

    // Update order payment status
    await orderRepository.updatePaymentStatus(orderId, 'failed');
    await orderRepository.updateOrderStatus(orderId, 'cancelled');

    // Log activity
    await activityRepository.create({
      type: 'payment_expired',
      title: 'Payment Expired',
      description: `Payment invoice expired for Order #${orderId}`,
      priority: 'medium',
      status: 'active',
      targetId: orderId,
      actorId: order.customerId,
      metadata: {
        orderId: orderId,
        invoiceId: invoiceData.id,
        amount: invoiceData.amount,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('Invoice expired for order:', orderId);
  } catch (error) {
    console.error('Error handling invoice expired:', error);
  }
}

async function handlePaymentRequestSucceeded(paymentData: any) {
  try {
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();

    // Find order by reference_id
    const referenceId = paymentData.reference_id;
    const orderId = referenceId.split('_')[1];

    if (!orderId) {
      console.error('Could not extract order ID from reference_id:', referenceId);
      return;
    }

    const order = await orderRepository.getById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }

    // Update order payment status
    await orderRepository.updatePaymentStatus(orderId, 'paid');
    await orderRepository.updateOrderStatus(orderId, 'processing');

    // Log activity
    await activityRepository.create({
      type: 'payment_completed',
      title: 'Payment Completed',
      description: `Payment completed for Order #${orderId}`,
      priority: 'high',
      status: 'active',
      targetId: orderId,
      actorId: order.customerId,
      metadata: {
        orderId: orderId,
        paymentRequestId: paymentData.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.payment_method?.type || 'unknown',
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('Payment request succeeded for order:', orderId);
  } catch (error) {
    console.error('Error handling payment request succeeded:', error);
  }
}

async function handlePaymentRequestFailed(paymentData: any) {
  try {
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();

    // Find order by reference_id
    const referenceId = paymentData.reference_id;
    const orderId = referenceId.split('_')[1];

    if (!orderId) {
      console.error('Could not extract order ID from reference_id:', referenceId);
      return;
    }

    const order = await orderRepository.getById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }

    // Update order payment status
    await orderRepository.updatePaymentStatus(orderId, 'failed');

    // Log activity
    await activityRepository.create({
      type: 'payment_failed',
      title: 'Payment Failed',
      description: `Payment failed for Order #${orderId}`,
      priority: 'high',
      status: 'active',
      targetId: orderId,
      actorId: order.customerId,
      metadata: {
        orderId: orderId,
        paymentRequestId: paymentData.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.payment_method?.type || 'unknown',
        failureReason: paymentData.failure_reason || 'Unknown',
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('Payment request failed for order:', orderId);
  } catch (error) {
    console.error('Error handling payment request failed:', error);
  }
}
