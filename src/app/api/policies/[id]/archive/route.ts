import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { policyService } from '@/services/PolicyService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/policies/[id]/archive - Archive a policy (admin only)
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
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const policy = await policyService.archivePolicy(id, session.user.id);

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Policy archived successfully'
    });
  } catch (error: any) {
    console.error('Error archiving policy:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to archive policy' 
      },
      { status: error.statusCode || 500 }
    );
  }
}

