import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DisputeService } from '@/services/DisputeService';

const disputeService = new DisputeService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/disputes/[id]/cancel - Cancel dispute (filer cancels)
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
    const dispute = await disputeService.cancelDispute(id, session.user.id);

    return NextResponse.json({
      success: true,
      data: dispute,
      message: 'Dispute cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling dispute:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to cancel dispute' 
      },
      { status: error.statusCode || 500 }
    );
  }
}






