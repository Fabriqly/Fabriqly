import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DisputeService } from '@/services/DisputeService';
import { UpdateDisputeData } from '@/types/dispute';

const disputeService = new DisputeService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/disputes/[id] - Get dispute details
 */
export async function GET(
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
    const dispute = await disputeService.getDisputeWithDetails(id);

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Check permissions (user must be involved or admin)
    if (session.user.role !== 'admin' && 
        dispute.filedBy !== session.user.id && 
        dispute.accusedParty !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view disputes you are involved in' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dispute
    });
  } catch (error: any) {
    console.error('Error fetching dispute:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch dispute' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/disputes/[id] - Update dispute
 */
export async function PATCH(
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
    const updateData: UpdateDisputeData = body;

    // Only admins can update dispute directly
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can update disputes directly' },
        { status: 403 }
      );
    }

    const { DisputeRepository } = await import('@/repositories/DisputeRepository');
    const disputeRepo = new DisputeRepository();
    const dispute = await disputeRepo.update(id, updateData);

    return NextResponse.json({
      success: true,
      data: dispute
    });
  } catch (error: any) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update dispute' 
      },
      { status: error.statusCode || 500 }
    );
  }
}






