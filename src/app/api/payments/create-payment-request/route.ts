import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { xenditService, CreatePaymentRequestData, XenditPaymentMethod } from '../../../../services/XenditService';
import { OrderRepository } from '../../../../repositories/OrderRepository';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paymentMethod, cardToken, bankCode, ewalletChannel } = body;

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Order ID and payment method are required' },
        { status: 400 }
      );
    }

    // Get order details
    const orderRepository = new OrderRepository();
    const order = await orderRepository.getById(orderId);

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

    // Prepare payment method based on type
    let xenditPaymentMethod: XenditPaymentMethod;

    switch (paymentMethod) {
      case 'card':
        if (!cardToken) {
          return NextResponse.json(
            { error: 'Card token is required for card payments' },
            { status: 400 }
          );
        }
        xenditPaymentMethod = {
          type: 'card',
          card: {
            token_id: cardToken,
          },
        };
        break;

      case 'virtual_account':
        if (!bankCode) {
          return NextResponse.json(
            { error: 'Bank code is required for virtual account payments' },
            { status: 400 }
          );
        }
        xenditPaymentMethod = {
          type: 'virtual_account',
          virtual_account: {
            bank_code: bankCode,
          },
        };
        break;

      case 'ewallet':
        if (!ewalletChannel) {
          return NextResponse.json(
            { error: 'E-wallet channel is required for e-wallet payments' },
            { status: 400 }
          );
        }
        xenditPaymentMethod = {
          type: 'ewallet',
          ewallet: {
            channel_code: ewalletChannel,
            channel_properties: {
              success_redirect_url: `${process.env.NEXTAUTH_URL}/orders/success?orders=${order.id}`,
              failure_redirect_url: `${process.env.NEXTAUTH_URL}/orders/failed?order=${order.id}`,
              cancel_redirect_url: `${process.env.NEXTAUTH_URL}/checkout?order=${order.id}`,
            },
          },
        };
        break;

      case 'retail_outlet':
        if (!bankCode) {
          return NextResponse.json(
            { error: 'Retail outlet name is required for retail outlet payments' },
            { status: 400 }
          );
        }
        xenditPaymentMethod = {
          type: 'retail_outlet',
          retail_outlet: {
            retail_outlet_name: bankCode, // Using bankCode as retail outlet name
          },
        };
        break;

      case 'qr_code':
        xenditPaymentMethod = {
          type: 'qr_code',
          qr_code: {
            qr_code_type: 'QRIS',
          },
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid payment method' },
          { status: 400 }
        );
    }

    // Prepare payment request data
    const paymentRequestData: CreatePaymentRequestData = {
      amount: order.totalAmount,
      currency: 'IDR',
      payment_method: xenditPaymentMethod,
      reference_id: `order_${order.id}_${Date.now()}`,
      description: `Payment for Order #${order.id}`,
      customer: {
        given_names: order.shippingAddress.firstName,
        surname: order.shippingAddress.lastName,
        email: session.user.email || '',
        mobile_number: order.shippingAddress.phone,
        addresses: [{
          country: order.shippingAddress.country,
          street_line1: order.shippingAddress.address1,
          street_line2: order.shippingAddress.address2,
          city: order.shippingAddress.city,
          province_state: order.shippingAddress.state,
          postal_code: order.shippingAddress.zipCode,
        }],
      },
      success_redirect_url: `${process.env.NEXTAUTH_URL}/orders/success?orders=${order.id}`,
      failure_redirect_url: `${process.env.NEXTAUTH_URL}/orders/failed?order=${order.id}`,
      cancel_redirect_url: `${process.env.NEXTAUTH_URL}/checkout?order=${order.id}`,
      metadata: {
        orderId: order.id,
        customerId: order.customerId,
        businessOwnerId: order.businessOwnerId,
        paymentMethod: paymentMethod,
      },
    };

    // Create Xendit payment request
    const paymentRequest = await xenditService.createPaymentRequest(paymentRequestData);

    // Update order with payment information
    await orderRepository.update(order.id, {
      paymentMethod: paymentMethod,
      paymentReference: paymentRequest.id,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      paymentRequest: {
        id: paymentRequest.id,
        status: paymentRequest.status,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        reference_id: paymentRequest.reference_id,
        payment_method: paymentRequest.payment_method,
        created: paymentRequest.created,
        updated: paymentRequest.updated,
      },
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
      },
    });

  } catch (error: any) {
    console.error('Error creating payment request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
