import { NextRequest, NextResponse } from 'next/server';
import { xenditService } from '../../../../services/XenditService';
import { OrderRepository } from '../../../../repositories/OrderRepository';
import { ActivityRepository } from '../../../../repositories/ActivityRepository';
import { CustomizationPaymentService } from '../../../../services/CustomizationPaymentService';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-callback-token') || '';

    console.log('[Xendit Webhook] Received');

    // Verify webhook signature
    if (!xenditService.verifyWebhookSignature(body, signature)) {
      console.error('[Xendit Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhookData = JSON.parse(body);
    console.log('[Xendit Webhook] Verified -', {
      id: webhookData.id,
      external_id: webhookData.external_id,
      status: webhookData.status || webhookData.event,
      amount: webhookData.amount
    });

    // Xendit sends different formats for different webhook types:
    // 1. Invoice webhooks: direct invoice data with "status" field
    // 2. Payment Request webhooks: wrapped with "event" and "data" fields
    
    if (webhookData.event) {
      // New format with event wrapper (Payment Requests)
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
          console.log('[Xendit Webhook] Unhandled event:', webhookData.event);
      }
    } else if (webhookData.status) {
      // Invoice webhook format (direct invoice data)
      if (webhookData.status === 'PAID') {
        await handleInvoicePaid(webhookData);
      } else if (webhookData.status === 'EXPIRED') {
        await handleInvoiceExpired(webhookData);
      } else {
        console.log('[Xendit Webhook] Unhandled invoice status:', webhookData.status);
      }
    } else {
      console.log('[Xendit Webhook] Unknown format');
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
    const externalId = invoiceData.external_id;
    console.log('[Invoice Paid]', {
      invoice_id: invoiceData.id,
      external_id: externalId,
      amount: invoiceData.amount
    });

    // Check if this is a customization payment
    // Format: "customization-{requestId}-{timestamp}"
    if (externalId.startsWith('customization-')) {
      console.log('[Invoice Paid] Processing customization payment');
      
      const customizationPaymentService = new CustomizationPaymentService();
      await customizationPaymentService.handlePaymentWebhook(
        invoiceData.id,
        'PAID',
        invoiceData.amount
      );
      
      console.log('[Invoice Paid] Customization payment processed successfully');
      return;
    }

    // Handle regular order payment
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();

    // Check if this is a multiple orders payment (format: orders_{id1}_{id2}_..._{timestamp})
    // or single order payment (format: order_{id}_{timestamp})
    let orderIds: string[] = [];
    
    if (externalId.startsWith('orders_')) {
      // Multiple orders: orders_{id1}_{id2}_..._{timestamp}
      const parts = externalId.split('_');
      // Remove 'orders' prefix and last part (timestamp)
      orderIds = parts.slice(1, -1);
    } else if (externalId.startsWith('order_')) {
      // Single order: order_{id}_{timestamp}
      const parts = externalId.split('_');
      orderIds = [parts[1]]; // Extract order ID
    } else {
      console.error('Could not parse order ID(s) from external_id:', externalId);
      return;
    }

    if (orderIds.length === 0) {
      console.error('No order IDs found in external_id:', externalId);
      return;
    }

    // Get all orders
    const orders = await Promise.all(
      orderIds.map(id => orderRepository.findById(id))
    );

    // Filter out null orders
    const validOrders = orders.filter(order => order !== null) as any[];

    if (validOrders.length === 0) {
      console.error('No valid orders found for IDs:', orderIds);
      return;
    }

    // Update all orders payment status
    const { CacheService } = await import('@/services/CacheService');
    const { ProductService } = await import('@/services/ProductService');
    const { ProductRepository } = await import('@/repositories/ProductRepository');
    const { CategoryRepository } = await import('@/repositories/CategoryRepository');
    
    const productRepository = new ProductRepository();
    const categoryRepository = new CategoryRepository();
    const productService = new ProductService(productRepository, categoryRepository, activityRepository);
    
    await Promise.all(
      validOrders.map(async (order) => {
        console.log(`[Invoice Paid] Updating order ${order.id} payment status to paid`);
        
        // Check if inventory was already decremented (to avoid double-decrementing)
        // We'll check if order status is already 'processing' or payment status is already 'paid'
        const currentOrder = await orderRepository.findById(order.id);
        const alreadyProcessed = currentOrder?.paymentStatus === 'paid' || currentOrder?.status === 'processing';
        
        if (!alreadyProcessed) {
          // Decrement inventory for each item in the order
          if (order.items && order.items.length > 0) {
            console.log(`[Invoice Paid] Decrementing inventory for order ${order.id}`);
            await Promise.all(
              order.items.map(async (item: any) => {
                try {
                  const result = await productService.decrementStock(
                    item.productId,
                    item.quantity,
                    order.id
                  );
                  if (!result) {
                    console.error(`[Invoice Paid] Failed to decrement stock for product ${item.productId} in order ${order.id}`);
                  }
                } catch (error) {
                  console.error(`[Invoice Paid] Error decrementing stock for product ${item.productId}:`, error);
                  // Continue processing other items even if one fails
                }
              })
            );
          }
        } else {
          console.log(`[Invoice Paid] Order ${order.id} already processed, skipping inventory decrement`);
        }
        
        await orderRepository.updatePaymentStatus(order.id, 'paid');
        await orderRepository.updateOrderStatus(order.id, 'processing');
        
        // Clear cache for this order
        await CacheService.invalidate(`order:${order.id}`);
        await CacheService.invalidate(`orders:customer:${order.customerId}`);
        await CacheService.invalidate(`orders:business:${order.businessOwnerId}`);

        // Log activity for each order
        await activityRepository.create({
          type: 'payment_completed',
          title: 'Payment Completed',
          description: `Payment received for Order #${order.id}`,
          priority: 'high',
          status: 'active',
          targetId: order.id,
          actorId: order.customerId,
          metadata: {
            orderId: order.id,
            invoiceId: invoiceData.id,
            amount: invoiceData.amount,
            paymentMethod: 'xendit_invoice',
            isMultipleOrders: validOrders.length > 1,
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Send payment confirmation emails (non-blocking)
        try {
          const { EmailService } = await import('@/services/EmailService');
          const orderAmount = invoiceData.amount / validOrders.length; // Split amount if multiple orders
          EmailService.sendPaymentReceivedEmail(
            order.id,
            order.customerId,
            order.businessOwnerId,
            orderAmount
          ).catch((emailError) => {
            console.error(`Error sending payment email for order ${order.id}:`, emailError);
          });
        } catch (emailError) {
          console.error(`Error setting up payment email for order ${order.id}:`, emailError);
          // Don't fail payment processing if email fails
        }
        
        console.log(`[Invoice Paid] Order ${order.id} updated successfully`);
      })
    );

    console.log('[Invoice Paid] All order payment(s) processed:', orderIds);
  } catch (error) {
    console.error('[Invoice Paid] Error:', error);
  }
}

async function handleInvoiceExpired(invoiceData: any) {
  try {
    const externalId = invoiceData.external_id;
    console.log('[Invoice Expired]', { external_id: externalId });

    // Check if this is a customization payment
    if (externalId.startsWith('customization-')) {
      const customizationPaymentService = new CustomizationPaymentService();
      await customizationPaymentService.handlePaymentWebhook(
        invoiceData.id,
        'EXPIRED',
        invoiceData.amount
      );
      console.log('[Invoice Expired] Customization payment processed');
      return;
    }

    // Otherwise, handle as regular order payment
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();

    // Find order by external_id
    const orderId = externalId.split('_')[1];

    if (!orderId) {
      console.error('Could not extract order ID from external_id:', externalId);
      return;
    }

    const order = await orderRepository.findById(orderId);
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

    console.log('[Invoice Expired] Order processed:', orderId);
  } catch (error) {
    console.error('[Invoice Expired] Error:', error);
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

    const order = await orderRepository.findById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }

    // Check if inventory was already decremented (to avoid double-decrementing)
    const alreadyProcessed = order.paymentStatus === 'paid' || order.status === 'processing';
    
    if (!alreadyProcessed) {
      // Decrement inventory for each item in the order
      if (order.items && order.items.length > 0) {
        console.log(`[Payment Request] Decrementing inventory for order ${orderId}`);
        const { ProductService } = await import('@/services/ProductService');
        const { ProductRepository } = await import('@/repositories/ProductRepository');
        const { CategoryRepository } = await import('@/repositories/CategoryRepository');
        
        const productRepository = new ProductRepository();
        const categoryRepository = new CategoryRepository();
        const productService = new ProductService(productRepository, categoryRepository, activityRepository);
        
        await Promise.all(
          order.items.map(async (item: any) => {
            try {
              const result = await productService.decrementStock(
                item.productId,
                item.quantity,
                order.id
              );
              if (!result) {
                console.error(`[Payment Request] Failed to decrement stock for product ${item.productId} in order ${orderId}`);
              }
            } catch (error) {
              console.error(`[Payment Request] Error decrementing stock for product ${item.productId}:`, error);
              // Continue processing other items even if one fails
            }
          })
        );
      }
    } else {
      console.log(`[Payment Request] Order ${orderId} already processed, skipping inventory decrement`);
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

    console.log('[Payment Request] Order payment succeeded:', orderId);
  } catch (error) {
    console.error('[Payment Request] Error:', error);
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

    const order = await orderRepository.findById(orderId);
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

    console.log('[Payment Request] Order payment failed:', orderId);
  } catch (error) {
    console.error('[Payment Request] Error:', error);
  }
}
