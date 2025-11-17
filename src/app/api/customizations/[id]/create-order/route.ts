import { NextRequest, NextResponse } from 'next/server';
import { CustomizationOrderService } from '@/services/CustomizationOrderService';
import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/customizations/[id]/create-order - Create order from customization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { shippingAddress } = body;

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Validate shipping address
    const requiredFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'zipCode', 'country', 'phone'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required address fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize services
    const customizationRepo = new CustomizationRepository();
    const orderRepo = new OrderRepository();
    const activityRepo = new ActivityRepository();
    const productRepo = new ProductRepository();
    const cacheService = new CacheService();
    
    const orderService = new OrderService(
      orderRepo,
      activityRepo,
      productRepo,
      cacheService
    );

    const customizationOrderService = new CustomizationOrderService(
      customizationRepo,
      orderService
    );

    const result = await customizationOrderService.createOrderFromCustomization(
      id,
      session.user.id,
      shippingAddress
    );

    return NextResponse.json({
      success: true,
      data: {
        orderId: result.orderId,
        message: 'Order created successfully! Production can now begin.'
      }
    });
  } catch (error: any) {
    console.error('Error creating order from customization:', error);
    
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Unauthorized') || error.message.includes('forbidden') ? 403 :
                   error.message.includes('must be') || error.message.includes('required') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create order' 
      },
      { status }
    );
  }
}

/**
 * GET /api/customizations/[id]/create-order - Get order for customization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const customizationRepo = new CustomizationRepository();
    const orderRepo = new OrderRepository();
    const activityRepo = new ActivityRepository();
    const productRepo = new ProductRepository();
    const cacheService = new CacheService();
    
    const orderService = new OrderService(
      orderRepo,
      activityRepo,
      productRepo,
      cacheService
    );

    const customizationOrderService = new CustomizationOrderService(
      customizationRepo,
      orderService
    );

    const order = await customizationOrderService.getOrderForCustomization(id);

    if (!order) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No order created yet for this customization'
      });
    }

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch order' 
      },
      { status: 500 }
    );
  }
}

