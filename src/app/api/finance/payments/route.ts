import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FinanceService } from '@/services/FinanceService';

const financeService = new FinanceService();

/**
 * GET /api/finance/payments - Get payment history for the authenticated user
 * Query params:
 * - status: pending, success, failed, refunded
 * - type: customization, order
 * - dateFrom: ISO date string
 * - dateTo: ISO date string
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
    const userId = session.user.id;
    const role = session.user.role;

    // Only allow designers, business owners, and customers
    if (role !== 'designer' && role !== 'business_owner' && role !== 'customer') {
      return NextResponse.json(
        { error: 'Payment history is only available for designers, business owners, and customers' },
        { status: 403 }
      );
    }

    const filters: any = {};
    
    const status = searchParams.get('status');
    if (status) {
      filters.status = status;
    }

    const type = searchParams.get('type');
    if (type && (type === 'customization' || type === 'order')) {
      filters.type = type;
    }

    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }

    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }

    const payments = await financeService.getPaymentHistory(
      userId,
      role as 'designer' | 'business_owner' | 'customer',
      filters
    );
    
    return NextResponse.json({
      success: true,
      data: payments
    });
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

