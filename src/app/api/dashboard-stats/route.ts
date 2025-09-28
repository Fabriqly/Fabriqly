import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { CacheService } from '@/services/CacheService';

interface DashboardSnapshot {
  id?: string;
  date: string; // YYYY-MM-DD format
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  pendingOrders: number;
  createdAt: Date;
}

// GET /api/dashboard-stats - Get current stats with real percentage changes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d

    // Calculate the comparison date based on period
    const comparisonDate = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    comparisonDate.setDate(comparisonDate.getDate() - days);

    // Try to get cached data first
    const cacheKey = `dashboard-stats-${period}`;
    const cached = await CacheService.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }

    // Load current data directly from database with limits
    const [users, products, categories, orders] = await Promise.all([
      FirebaseAdminService.queryDocuments(Collections.USERS, [], { field: 'createdAt', direction: 'desc' }, 1000),
      FirebaseAdminService.queryDocuments(Collections.PRODUCTS, [], { field: 'createdAt', direction: 'desc' }, 1000),
      FirebaseAdminService.queryDocuments(Collections.PRODUCT_CATEGORIES, [], { field: 'createdAt', direction: 'desc' }, 100),
      FirebaseAdminService.queryDocuments(Collections.ORDERS, [], { field: 'createdAt', direction: 'desc' }, 1000)
    ]);

    // Calculate current stats
    const currentStats = {
      totalUsers: users.length,
      totalProducts: products.length,
      totalCategories: categories.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0),
      activeProducts: products.filter((p: any) => p.status === 'active').length,
      pendingOrders: orders.filter((o: any) => o.status === 'pending').length
    };

    // Get historical data for comparison
    const historicalData = await getHistoricalData(comparisonDate);

    // Calculate percentage changes
    const percentageChanges = calculatePercentageChanges(currentStats, historicalData);

    // Save current snapshot for future comparisons
    await saveCurrentSnapshot(currentStats);

    const response = {
      current: currentStats,
      changes: percentageChanges,
      period,
      comparisonDate: comparisonDate.toISOString().split('T')[0]
    };

    // Cache the response for 5 minutes
    await CacheService.set(cacheKey, response, 5 * 60 * 1000);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get historical data
async function getHistoricalData(comparisonDate: Date): Promise<DashboardSnapshot | null> {
  try {
    const dateString = comparisonDate.toISOString().split('T')[0];
    
    // Try to get exact date first
    let snapshots = await FirebaseAdminService.queryDocuments(
      Collections.DASHBOARD_SNAPSHOTS,
      [{ field: 'date', operator: '==' as const, value: dateString }]
    );

    // If no exact match, get the closest previous date
    if (snapshots.length === 0) {
      snapshots = await FirebaseAdminService.queryDocuments(
        Collections.DASHBOARD_SNAPSHOTS,
        [{ field: 'date', operator: '<=' as const, value: dateString }],
        { field: 'date', direction: 'desc' },
        1
      );
    }

    return snapshots.length > 0 ? snapshots[0] as DashboardSnapshot : null;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return null;
  }
}

// Helper function to calculate percentage changes
function calculatePercentageChanges(current: any, historical: DashboardSnapshot | null) {
  if (!historical) {
    // If no historical data, return neutral values
    return {
      totalUsers: { value: 0, type: 'neutral' },
      totalProducts: { value: 0, type: 'neutral' },
      totalCategories: { value: 0, type: 'neutral' },
      totalOrders: { value: 0, type: 'neutral' },
      totalRevenue: { value: 0, type: 'neutral' },
      activeProducts: { value: 0, type: 'neutral' },
      pendingOrders: { value: 0, type: 'neutral' }
    };
  }

  const calculateChange = (currentVal: number, historicalVal: number) => {
    if (historicalVal === 0) {
      return currentVal > 0 ? { value: 100, type: 'positive' as const } : { value: 0, type: 'neutral' as const };
    }
    
    const change = ((currentVal - historicalVal) / historicalVal) * 100;
    const roundedChange = Math.round(change);
    
    return {
      value: Math.abs(roundedChange),
      type: roundedChange > 0 ? 'positive' as const : roundedChange < 0 ? 'negative' as const : 'neutral' as const
    };
  };

  return {
    totalUsers: calculateChange(current.totalUsers, historical.totalUsers),
    totalProducts: calculateChange(current.totalProducts, historical.totalProducts),
    totalCategories: calculateChange(current.totalCategories, historical.totalCategories),
    totalOrders: calculateChange(current.totalOrders, historical.totalOrders),
    totalRevenue: calculateChange(current.totalRevenue, historical.totalRevenue),
    activeProducts: calculateChange(current.activeProducts, historical.activeProducts),
    pendingOrders: calculateChange(current.pendingOrders, historical.pendingOrders)
  };
}

// Helper function to save current snapshot
async function saveCurrentSnapshot(stats: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if snapshot already exists for today
    const existingSnapshots = await FirebaseAdminService.queryDocuments(
      Collections.DASHBOARD_SNAPSHOTS,
      [{ field: 'date', operator: '==' as const, value: today }]
    );

    const snapshotData: DashboardSnapshot = {
      date: today,
      totalUsers: stats.totalUsers,
      totalProducts: stats.totalProducts,
      totalCategories: stats.totalCategories,
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      activeProducts: stats.activeProducts,
      pendingOrders: stats.pendingOrders,
      createdAt: new Date()
    };

    if (existingSnapshots.length > 0) {
      // Update existing snapshot
      await FirebaseAdminService.updateDocument(
        Collections.DASHBOARD_SNAPSHOTS,
        existingSnapshots[0].id,
        snapshotData
      );
    } else {
      // Create new snapshot
      await FirebaseAdminService.createDocument(
        Collections.DASHBOARD_SNAPSHOTS,
        snapshotData
      );
    }
  } catch (error) {
    console.error('Error saving dashboard snapshot:', error);
    // Don't fail the main request if snapshot saving fails
  }
}
