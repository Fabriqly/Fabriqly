import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const businessOwnerId = searchParams.get('businessOwnerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query constraints
    const constraints = [];
    
    if (status) {
      constraints.push({ field: 'status', operator: '==' as const, value: status });
    }
    
    if (businessOwnerId) {
      constraints.push({ field: 'businessOwnerId', operator: '==' as const, value: businessOwnerId });
    }

    // Non-admin users can only see their own orders
    if (session.user.role !== 'admin') {
      constraints.push({ field: 'customerId', operator: '==' as const, value: session.user.id });
    }

    const orders = await FirebaseAdminService.queryDocuments(
      Collections.ORDERS,
      constraints,
      { field: 'createdAt', direction: 'desc' },
      limit
    );

    // Calculate total revenue for analytics
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0);
    }, 0);

    return NextResponse.json({ 
      orders,
      totalRevenue,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
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
    
    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: items' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = body.items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const tax = subtotal * 0.08; // 8% tax
    const shipping = body.shippingCost || 0;
    const totalAmount = subtotal + tax + shipping;

    const orderData = {
      customerId: session.user.id,
      businessOwnerId: body.businessOwnerId,
      items: body.items,
      subtotal,
      tax,
      shippingCost: shipping,
      totalAmount,
      status: 'pending',
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const order = await FirebaseAdminService.createDocument(
      Collections.ORDERS,
      orderData
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
