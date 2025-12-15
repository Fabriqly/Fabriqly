import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { policyService } from '@/services/PolicyService';
import { PolicyType, PolicyStatus, CreatePolicyData } from '@/types/policy';

/**
 * GET /api/policies - Get all policies (admin only)
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as PolicyType | null;
    const status = searchParams.get('status') as PolicyStatus | null;

    const policies = await policyService.getAllPolicies(
      type || undefined,
      status || undefined
    );

    return NextResponse.json({
      success: true,
      data: policies
    });
  } catch (error: any) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch policies' 
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * POST /api/policies - Create new policy version/draft (admin only)
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
    const { type, title, content, status } = body;

    if (!type || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, content' },
        { status: 400 }
      );
    }

    const policyData: CreatePolicyData = {
      type,
      title,
      content,
      lastUpdatedBy: session.user.id,
      status: status || PolicyStatus.DRAFT
    };

    const policy = await policyService.createPolicy(policyData);

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Policy created successfully'
    });
  } catch (error: any) {
    console.error('Error creating policy:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create policy' 
      },
      { status: error.statusCode || 500 }
    );
  }
}

