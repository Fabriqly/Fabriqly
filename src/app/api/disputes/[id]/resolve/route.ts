import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DisputeService } from '@/services/DisputeService';
import { DisputeResolutionData } from '@/types/dispute';

const disputeService = new DisputeService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/disputes/[id]/resolve - Admin resolves dispute
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can resolve disputes' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const resolution: DisputeResolutionData = {
      outcome: body.outcome,
      reason: body.reason,
      partialRefundAmount: body.partialRefundAmount,
      issueStrike: body.issueStrike || false,
      adminNotes: body.adminNotes
    };

    if (!resolution.outcome || !resolution.reason) {
      return NextResponse.json(
        { error: 'Outcome and reason are required' },
        { status: 400 }
      );
    }

    const dispute = await disputeService.resolveDispute(id, resolution, session.user.id);

    return NextResponse.json({
      success: true,
      data: dispute,
      message: 'Dispute resolved successfully'
    });
  } catch (error: any) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to resolve dispute' 
      },
      { status: error.statusCode || 500 }
    );
  }
}






