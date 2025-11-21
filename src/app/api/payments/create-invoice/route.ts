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
    const { orderId, orderIds, totalAmount, paymentMethod } = body;
    
    console.log('Request body:', { orderId, orderIds, totalAmount, paymentMethod });

    // Support both single order and multiple orders
    const allOrderIds = orderIds || (orderId ? [orderId] : []);
    
    if (allOrderIds.length === 0) {
      console.log('No orderId provided');
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details for all orders
    const orderRepository = new OrderRepository();
    const orders = await Promise.all(
      allOrderIds.map(id => orderRepository.findById(id))
    );
    
    // Filter out null orders
    const validOrders = orders.filter(order => order !== null) as any[];
    
    if (validOrders.length === 0) {
      return NextResponse.json(
        { error: 'No valid orders found' },
        { status: 404 }
      );
    }

    // Verify all orders belong to the user
    for (const order of validOrders) {
      if (order.customerId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to access one or more orders' },
          { status: 403 }
        );
      }

      // Check if any order is already paid
      if (order.paymentStatus === 'paid') {
        return NextResponse.json(
          { error: 'One or more orders are already paid' },
          { status: 400 }
        );
      }
    }

    // Calculate total amount from all orders if not provided
    const calculatedTotal = totalAmount || validOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Create combined description
    const orderDescriptions = validOrders.map(o => `Order #${o.id.substring(0, 8)}`).join(', ');
    const description = validOrders.length === 1 
      ? `Payment for Order #${validOrders[0].id}`
      : `Payment for ${validOrders.length} orders (${orderDescriptions})`;

    // Prepare invoice data
    const invoiceData: CreateInvoiceData = {
      external_id: `orders_${allOrderIds.join('_')}_${Date.now()}`,
      amount: calculatedTotal,
      description: description,
      currency: 'PHP',
      success_redirect_url: `${process.env.NEXTAUTH_URL}/orders/success?orders=${allOrderIds.join(',')}`,
      failure_redirect_url: `${process.env.NEXTAUTH_URL}/orders/failed?orders=${allOrderIds.join(',')}`,
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

    // Update all orders with payment information
    await Promise.all(
      validOrders.map(order =>
        orderRepository.update(order.id, {
          paymentMethod: paymentMethod || 'xendit_invoice',
          paymentReference: invoice.id,
          paymentUrl: invoice.invoice_url,
          updatedAt: new Date(),
        })
      )
    );

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
      orders: validOrders.map(order => ({
        id: order.id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
      })),
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
