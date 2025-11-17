import { NextRequest, NextResponse } from 'next/server';
import { CustomizationPaymentService } from '@/services/CustomizationPaymentService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const paymentService = new CustomizationPaymentService();

/**
 * POST /api/customizations/[id]/pricing - Create pricing agreement
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
    const { designFee, productCost, printingCost, paymentType, milestones } = body;

    // Validate required fields
    if (designFee === undefined || productCost === undefined || printingCost === undefined) {
      return NextResponse.json(
        { error: 'Design fee, product cost, and printing cost are required' },
        { status: 400 }
      );
    }

    if (!paymentType || !['upfront', 'half_payment', 'milestone'].includes(paymentType)) {
      return NextResponse.json(
        { error: 'Valid payment type is required' },
        { status: 400 }
      );
    }

    if (paymentType === 'milestone' && (!milestones || milestones.length === 0)) {
      return NextResponse.json(
        { error: 'Milestones are required for milestone payment type' },
        { status: 400 }
      );
    }

    const updatedRequest = await paymentService.createPricingAgreement(
      id,
      {
        designFee,
        productCost,
        printingCost,
        paymentType,
        milestones
      },
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: updatedRequest
    });
  } catch (error: any) {
    console.error('Error creating pricing:', error);
    
    const status = error.message === 'Customization request not found' ? 404 :
                   error.message.includes('Unauthorized') || error.message.includes('forbidden') ? 403 :
                   error.message.includes('must be in progress') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create pricing' 
      },
      { status }
    );
  }
}

/**
 * PATCH /api/customizations/[id]/pricing - Agree to pricing
 */
export async function PATCH(
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

    const updatedRequest = await paymentService.agreeToPricing(id, session.user.id);

    return NextResponse.json({
      success: true,
      data: updatedRequest
    });
  } catch (error: any) {
    console.error('Error agreeing to pricing:', error);
    
    const status = error.message === 'Customization request not found' ? 404 :
                   error.message.includes('Unauthorized') ? 403 :
                   error.message.includes('No pricing') || error.message.includes('already agreed') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to agree to pricing' 
      },
      { status }
    );
  }
}

