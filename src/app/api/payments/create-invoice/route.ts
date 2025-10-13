import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { xenditService, CreateInvoiceData } from '../../../../services/XenditService';
import { OrderRepository } from '../../../../repositories/OrderRepository';
import { Order } from '../../../../types/firebase';

export async function POST(request: NextRequest) {
  try {
    console.log('Invoice creation request received');
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('No session found, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('Session found for user:', session.user?.email);

    const body = await request.json();
    const { orderId, paymentMethod } = body;
    
    console.log('Request body:', { orderId, paymentMethod });

    if (!orderId) {
      console.log('No orderId provided');
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details
    const orderRepository = new OrderRepository();
    const order = await orderRepository.findById(orderId);
    
    console.log('Order found:', !!order);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to the user
    if (order.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this order' },
        { status: 403 }
      );
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Prepare invoice data (simplified for now)
    // Note: Using PHP currency as IDR needs to be enabled in Xendit dashboard first
    const invoiceData: CreateInvoiceData = {
      external_id: `order_${order.id}_${Date.now()}`,
      amount: order.totalAmount,
      description: `Payment for Order #${order.id}`,
      currency: 'PHP', // Changed from IDR - enable IDR in Xendit dashboard to use Indonesian Rupiah
      success_redirect_url: `${process.env.NEXTAUTH_URL}/orders/success?orders=${order.id}`,
      failure_redirect_url: `${process.env.NEXTAUTH_URL}/orders/failed?order=${order.id}`,
    };

    console.log('Creating invoice with data:', {
      external_id: invoiceData.external_id,
      amount: invoiceData.amount,
      description: invoiceData.description,
      currency: invoiceData.currency
    });

    // Create Xendit invoice
    const invoice = await xenditService.createInvoice(invoiceData);
    
    console.log('Invoice created:', invoice.id);

    // Update order with payment information
    await orderRepository.update(order.id, {
      paymentMethod: paymentMethod || 'xendit_invoice',
      paymentReference: invoice.id,
      paymentUrl: invoice.invoice_url,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        external_id: invoice.external_id,
        status: invoice.status,
        amount: invoice.amount,
        currency: invoice.currency,
        invoice_url: invoice.invoice_url,
        expiry_date: invoice.expiry_date,
        available_banks: invoice.available_banks,
        available_retail_outlets: invoice.available_retail_outlets,
        available_ewallets: invoice.available_ewallets,
        available_qr_codes: invoice.available_qr_codes,
        available_direct_debits: invoice.available_direct_debits,
        available_paylaters: invoice.available_paylaters,
      },
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
      },
    });

  } catch (error: any) {
    console.error('Error creating payment invoice:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment invoice',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
