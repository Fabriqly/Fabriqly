import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FinanceService, TimeRange } from '@/services/FinanceService';

const financeService = new FinanceService();

/**
 * GET /api/finance - Get finance summary for the authenticated user
 * Query params:
 * - timeRange: 7d, 30d, 90d, 1y, all (default: all)
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
    const timeRange = (searchParams.get('timeRange') || 'all') as TimeRange;
    const userId = session.user.id;
    const role = session.user.role;

    if (role === 'designer') {
      const finance = await financeService.getDesignerFinance(userId, timeRange);
      return NextResponse.json({
        success: true,
        data: finance
      });
    } else if (role === 'business_owner') {
      const finance = await financeService.getBusinessOwnerFinance(userId, timeRange);
      return NextResponse.json({
        success: true,
        data: finance
      });
    } else {
      return NextResponse.json(
        { error: 'Finance data is only available for designers and business owners' },
        { status: 403 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching finance data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

