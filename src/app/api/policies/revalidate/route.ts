import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { PolicyType } from '@/types/policy';

/**
 * POST /api/policies/revalidate - Trigger on-demand ISR revalidation (admin only)
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Policy type is required' },
        { status: 400 }
      );
    }

    const policyPathMap: Record<PolicyType, string> = {
      [PolicyType.TERMS]: '/terms-and-conditions',
      [PolicyType.PRIVACY]: '/privacy-policy',
      [PolicyType.SHIPPING]: '/shipping-policy',
      [PolicyType.REFUND]: '/refund-policy'
    };

    const path = policyPathMap[type as PolicyType];
    if (!path) {
      return NextResponse.json(
        { error: 'Invalid policy type' },
        { status: 400 }
      );
    }

    // Revalidate the specific policy page
    revalidatePath(path);

    return NextResponse.json({
      success: true,
      message: `Policy page revalidated: ${path}`
    });
  } catch (error: any) {
    console.error('Error revalidating policy:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to revalidate policy' 
      },
      { status: error.statusCode || 500 }
    );
  }
}

