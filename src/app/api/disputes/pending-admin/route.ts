import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DisputeRepository } from '@/repositories/DisputeRepository';

/**
 * GET /api/disputes/pending-admin - Get disputes pending admin review (admin only)
 */
export async function GET(request: NextRequest) {
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
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const disputeRepo = new DisputeRepository();
    const disputes = await disputeRepo.findPendingAdminReview();

    return NextResponse.json({
      success: true,
      data: disputes
    });
  } catch (error: any) {
    console.error('Error fetching pending disputes:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch pending disputes' 
      },
      { status: 500 }
    );
  }
}






