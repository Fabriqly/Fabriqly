import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DisputeService } from '@/services/DisputeService';

const disputeService = new DisputeService();

/**
 * POST /api/disputes/check-eligibility - Check if user can file dispute
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, customizationRequestId } = body;

    if (!orderId && !customizationRequestId) {
      return NextResponse.json(
        { error: 'Either orderId or customizationRequestId is required' },
        { status: 400 }
      );
    }

    const eligibility = await disputeService.canFileDispute(
      orderId,
      customizationRequestId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: eligibility
    });
  } catch (error: any) {
    console.error('Error checking eligibility:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to check eligibility' 
      },
      { status: 500 }
    );
  }
}






