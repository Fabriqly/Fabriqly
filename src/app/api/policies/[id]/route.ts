import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { policyService } from '@/services/PolicyService';
import { UpdatePolicyData } from '@/types/policy';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/policies/[id] - Get specific policy (admin only)
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const policy = await policyService.getPolicyById(id);

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: policy
    });
  } catch (error: any) {
    console.error('Error fetching policy:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch policy' 
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/policies/[id] - Update policy (admin only, only works for drafts)
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, status } = body;

    const updateData: UpdatePolicyData = {
      lastUpdatedBy: session.user.id
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;

    const policy = await policyService.updatePolicy(id, updateData);

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Policy updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating policy:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update policy' 
      },
      { status: error.statusCode || 500 }
    );
  }
}

