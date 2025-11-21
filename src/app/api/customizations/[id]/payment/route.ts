import { NextRequest, NextResponse } from 'next/server';
import { CustomizationPaymentService } from '@/services/CustomizationPaymentService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const paymentService = new CustomizationPaymentService();

/**
 * POST /api/customizations/[id]/payment - Process payment
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
    const { amount, paymentMethod, milestoneId } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    const updatedRequest = await paymentService.processPayment(
      id,
      session.user.id,
      {
        amount,
        paymentMethod,
        milestoneId
      }
    );

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: 'Payment initiated successfully'
    });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    
    const status = error.message === 'Customization request not found' ? 404 :
                   error.message.includes('Unauthorized') ? 403 :
                   error.message.includes('amount') || error.message.includes('milestone') || error.message.includes('Pricing must') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to process payment' 
      },
      { status }
    );
  }
}

/**
 * GET /api/customizations/[id]/payment - Get payment status
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

    const paymentStatus = await paymentService.getPaymentStatus(id);

    if (!paymentStatus) {
      return NextResponse.json(
        { error: 'Payment details not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: paymentStatus
    });
  } catch (error: any) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch payment status' 
      },
      { status: 500 }
    );
  }
}

