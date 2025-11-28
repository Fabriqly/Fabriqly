import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DisputeService } from '@/services/DisputeService';

const disputeService = new DisputeService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/disputes/[id]/partial-refund - Offer partial refund (accused party)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
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
    const { amount, percentage } = body;

    if (!amount && !percentage) {
      return NextResponse.json(
        { error: 'Either amount or percentage is required' },
        { status: 400 }
      );
    }

    const dispute = await disputeService.offerPartialRefund(
      id,
      session.user.id,
      amount,
      percentage
    );

    return NextResponse.json({
      success: true,
      data: dispute,
      message: 'Partial refund offer submitted'
    });
  } catch (error: any) {
    console.error('Error offering partial refund:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to offer partial refund' 
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/disputes/[id]/partial-refund - Accept or reject partial refund offer
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
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
    const { action } = body; // 'accept' or 'reject'

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    let dispute;
    if (action === 'accept') {
      dispute = await disputeService.acceptPartialRefund(id, session.user.id);
    } else {
      dispute = await disputeService.rejectPartialRefund(id, session.user.id);
    }

    return NextResponse.json({
      success: true,
      data: dispute,
      message: `Partial refund offer ${action}ed`
    });
  } catch (error: any) {
    console.error(`Error ${action}ing partial refund:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || `Failed to ${action} partial refund` 
      },
      { status: error.statusCode || 500 }
    );
  }
}






