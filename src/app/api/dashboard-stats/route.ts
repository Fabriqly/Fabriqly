import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { CacheService } from '@/services/CacheService';
import { DashboardSummaryService } from '@/services/DashboardSummaryService';

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
    
    const cacheKey = `dashboard-stats-${period}`;

    // Get dashboard summary instead of querying all collections
    const summary = await DashboardSummaryService.getSummary();
    
    if (!summary) {
      console.log('No summary found, refreshing...');
      await DashboardSummaryService.refreshSummary();
      const freshSummary = await DashboardSummaryService.getSummary();
      
      if (!freshSummary) {
        throw new Error('Failed to create dashboard summary');
      }
      
      return await generateDashboardResponse(freshSummary, period);
    }

    return await generateDashboardResponse(summary, period);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateDashboardResponse(summary: any, period: string) {
  try {
    const cacheKey = `dashboard-stats-${period}`;
    
    // Calculate the comparison date based on period
    const comparisonDate = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    comparisonDate.setDate(comparisonDate.getDate() - days);

    const currentStats = {
      totalUsers: summary.totalUsers,
      totalProducts: summary.totalProducts,
      totalCategories: summary.totalCategories,
      totalOrders: summary.totalOrders,
      totalRevenue: summary.totalRevenue,
      activeProducts: summary.activeProducts,
      pendingOrders: summary.pendingOrders
    };

    // Get historical data for comparison
    const historicalResult = await getHistoricalData(comparisonDate, period);
    const { snapshot: historicalData, hasHistorical, searchDate } = historicalResult;

    // Calculate percentage changes
    const { percentageChanges, simulatedData } = calculatePercentageChanges(currentStats, historicalData, hasHistorical);

    const response = {
      current: currentStats,
      historical: historicalData,
      percentageChanges,
      period,
      comparisonDate: comparisonDate.toISOString().split('T')[0],
      actualComparisonDate: searchDate,
      hasHistorical,
      lastUpdated: summary.lastUpdated,
      dataSource: 'summary' // Indicate we're using summary data
    };

    // Save current snapshot for future percentage calculations
    await saveCurrentSnapshot(currentStats);

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
async function getHistoricalData(comparisonDate: Date, period: string): Promise<{ snapshot: DashboardSnapshot | null, hasHistorical: boolean, searchDate: string }> {
  try {
    const dateString = comparisonDate.toISOString().split('T')[0];
    
    try {
      // Try to query the collection - this will fail if collection doesn't exist
      let snapshots = await FirebaseAdminService.queryDocuments(
        Collections.DASHBOARD_SNAPSHOTS,
        [{ field: 'date', operator: '==' as const, value: dateString }]
      );

      // If no exact match, get the closest previous date (Option 3)
      let hasHistorical = true;
      let searchDate = dateString;
      
      if (snapshots.length === 0) {
        snapshots = await FirebaseAdminService.queryDocuments(
          Collections.DASHBOARD_SNAPSHOTS,
          [{ field: 'date', operator: '<=' as const, value: dateString }],
          { field: 'date', direction: 'desc' },
          1
        );
        
        // If we found older data, mark as "approximate comparison"
        if (snapshots.length > 0) {
          searchDate = snapshots[0].date;
          // Don't override hasHistorical - we do have data, even if from a different date
        } else {
          hasHistorical = false;
        }
      }

      return {
        snapshot: snapshots.length > 0 ? snapshots[0] as DashboardSnapshot : null,
        hasHistorical,
        searchDate
      };
      
    } catch (collectionError) {
      console.log('⚠️ dashboardSnapshots collection does not exist');
      return {
        snapshot: null,
        hasHistorical: false,
        searchDate: dateString
      };
    }
    
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return {
      snapshot: null,
      hasHistorical: false,
      searchDate: comparisonDate.toISOString().split('T')[0]
    };
  }
}

// Helper function to calculate percentage changes
function calculatePercentageChanges(current: any, historical: DashboardSnapshot | null, hasHistorical: boolean = true) {
  if (!historical || !hasHistorical) {
    // Option 2: Return special "comparison not available" values instead of 0%
    return {
      percentageChanges: {
        totalUsers: { value: null, type: 'unavailable', label: 'No comparison data' },
        totalProducts: { value: null, type: 'unavailable', label: 'No comparison data' },
        totalCategories: { value: null, type: 'unavailable', label: 'No comparison data' },
        totalOrders: { value: null, type: 'unavailable', label: 'No comparison data' },
        totalRevenue: { value: null, type: 'unavailable', label: 'No comparison data' },
        activeProducts: { value: null, type: 'unavailable', label: 'No comparison data' },
        pendingOrders: { value: null, type: 'unavailable', label: 'No comparison data' }
      },
      simulatedData: null
    };
  }
    
  const calculateChange = (currentVal: number, historicalVal: number, fieldName: string) => {
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

  const percentageChanges = {
    totalUsers: calculateChange(current.totalUsers, historical.totalUsers, 'Users'),
    totalProducts: calculateChange(current.totalProducts, historical.totalProducts, 'Products'),
    totalCategories: calculateChange(current.totalCategories, historical.totalCategories, 'Categories'),
    totalOrders: calculateChange(current.totalOrders, historical.totalOrders, 'Orders'),
    totalRevenue: calculateChange(current.totalRevenue, historical.totalRevenue, 'Revenue'),
    activeProducts: calculateChange(current.activeProducts, historical.activeProducts, 'Active Products'),
    pendingOrders: calculateChange(current.pendingOrders, historical.pendingOrders, 'Pending Orders')
  };

  return { percentageChanges, simulatedData: null };
}

// Helper function to save current snapshot
async function saveCurrentSnapshot(stats: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
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

    try {
      // Check if snapshot already exists for today
      const existingSnapshots = await FirebaseAdminService.queryDocuments(
        Collections.DASHBOARD_SNAPSHOTS,
        [{ field: 'date', operator: '==' as const, value: today }]
      );

      if (existingSnapshots.length > 0) {
        // Update existing snapshot
        console.log('📸 Updating existing snapshot for', today);
        await FirebaseAdminService.updateDocument(
          Collections.DASHBOARD_SNAPSHOTS,
          existingSnapshots[0].id,
          snapshotData
        );
      } else {
        // Create new snapshot
        console.log('📸 Creating new snapshot for', today);
        await FirebaseAdminService.createDocument(
          Collections.DASHBOARD_SNAPSHOTS,
          snapshotData
        );
      }
      
      console.log('✅ Snapshot saved successfully');
      
    } catch (collectionError) {
      console.log('⚠️ dashboardSnapshots collection will be created on first document write');
      // Create new snapshot - this will create the collection automatically
      await FirebaseAdminService.createDocument(
        Collections.DASHBOARD_SNAPSHOTS,
        snapshotData
      );
      console.log('✅ Created dashboardSnapshots collection and first snapshot');
    }
    
  } catch (error) {
    console.error('Error saving dashboard snapshot:', error);
    // Don't fail the main request if snapshot saving fails
  }
}
