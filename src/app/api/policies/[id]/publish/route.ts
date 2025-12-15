import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { policyService } from '@/services/PolicyService';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/policies/[id]/publish - Publish a draft policy (admin only)
 * Archives previous published version automatically
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
    const policy = await policyService.publishPolicy(id, session.user.id);

    // Trigger ISR revalidation for the policy page
    const policyPathMap: Record<string, string> = {
      'terms': '/terms-and-conditions',
      'privacy': '/privacy-policy',
      'shipping': '/shipping-policy',
      'refund': '/refund-policy'
    };

    const path = policyPathMap[policy.type];
    if (path) {
      revalidatePath(path);
    }

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Policy published successfully'
    });
  } catch (error: any) {
    console.error('Error publishing policy:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to publish policy' 
      },
      { status: error.statusCode || 500 }
    );
  }
}

