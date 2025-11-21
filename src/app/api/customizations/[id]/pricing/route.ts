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

/**
 * DELETE /api/customizations/[id]/pricing - Reject pricing and request new proposal
 */
export async function DELETE(
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
    const body = await request.json().catch(() => ({}));
    const { rejectionReason } = body;

    const { CustomizationRepository } = await import('@/repositories/CustomizationRepository');
    const { Timestamp } = await import('firebase-admin/firestore');
    
    const customizationRepo = new CustomizationRepository();
    const requestData = await customizationRepo.findById(id);

    if (!requestData) {
      return NextResponse.json(
        { success: false, error: 'Customization request not found' },
        { status: 404 }
      );
    }

    // Verify user is the customer
    if (requestData.customerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the customer can reject pricing' },
        { status: 403 }
      );
    }

    // Verify pricing agreement exists
    if (!requestData.pricingAgreement) {
      return NextResponse.json(
        { success: false, error: 'No pricing agreement to reject' },
        { status: 400 }
      );
    }

    // Update status to awaiting_pricing and clear pricing agreement
    await customizationRepo.update(id, {
      status: 'awaiting_pricing',
      pricingAgreement: null,
      designerNotes: rejectionReason ? 
        `${requestData.designerNotes || ''}\n\n[Pricing Rejected] ${rejectionReason}`.trim() : 
        requestData.designerNotes,
      updatedAt: Timestamp.now() as any
    });

    return NextResponse.json({
      success: true,
      message: 'Pricing rejected. Designer can now submit a new pricing proposal.'
    });
  } catch (error: any) {
    console.error('Error rejecting pricing:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to reject pricing' 
      },
      { status: 500 }
    );
  }
}

