import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FinanceService, TimeRange } from '@/services/FinanceService';

const financeService = new FinanceService();

/**
 * GET /api/finance/analytics - Get revenue analytics for the authenticated user
 * Query params:
 * - timeRange: 7d, 30d, 90d, 1y, all (default: 30d)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') || '30d') as TimeRange;
    const userId = session.user.id;
    const role = session.user.role;

    if (role !== 'designer' && role !== 'business_owner') {
      return NextResponse.json(
        { error: 'Analytics are only available for designers and business owners' },
        { status: 403 }
      );
    }

    const analytics = await financeService.getRevenueAnalytics(userId, role, timeRange);
    
    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Error fetching finance analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

