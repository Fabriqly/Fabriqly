import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardSummaryService } from '@/services/DashboardSummaryService';

// POST /api/admin/refresh-summary - Manually trigger summary refresh
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🔄 Admin triggered summary refresh...');
    const summary = await DashboardSummaryService.refreshSummary();
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard summary refreshed successfully',
      summary: {
        totalUsers: summary.totalUsers,
        totalProducts: summary.totalProducts,
        totalOrders: summary.totalOrders,
        totalRevenue: summary.totalRevenue,
        activeProducts: summary.activeProducts,
        pendingOrders: summary.pendingOrders,
        lastUpdated: summary.lastUpdated,
        version: summary.version
      }
    });

  } catch (error) {
    console.error('Error refreshing summary:', error);
    return NextResponse.json(
      { error: 'Failed to refresh dashboard summary' },
      { status: 500 }
    );
  }
}

// GET /api/admin/refresh-summary - Get summary status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const summary = await DashboardSummaryService.getSummary();
    const debugInfo = await DashboardSummaryService.getDebugInfo();
    
    return NextResponse.json({
      summary: summary ? {
        totalUsers: summary.totalUsers,
        totalProducts: summary.totalProducts,
        totalOrders: summary.totalOrders,
        totalRevenue: summary.totalRevenue,
        activeProducts: summary.activeProducts,
        pendingOrders: summary.pendingOrders,
        lastUpdated: summary.lastUpdated,
        version: summary.version,
        lastUpdatedBy: summary.lastUpdatedBy
      } : null,
      debug: debugInfo
    });

  } catch (error) {
    console.error('Error getting summary status:', error);
    return NextResponse.json(
      { error: 'Failed to get summary status' },
      { status: 500 }
    );
  }
}
