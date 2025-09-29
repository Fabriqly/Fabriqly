import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CacheService } from '@/services/CacheService';

// POST /api/admin/clear-dashboard-cache - Clear all dashboard-related caches
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🗑️ Clearing dashboard caches...');
    
    // Clear all dashboard-related cached data
    const cacheKeysToClear = [
      'dashboard-summary',
      'dashboard-stats-7d',
      'dashboard-stats-30d', 
      'dashboard-stats-90d',
      'analytics-7d',
      'analytics-30d',
      'analytics-90d'
    ];

    const clearedCaches = [];
    
    for (const key of cacheKeysToClear) {
      try {
        await CacheService.delete(key);
        clearedCaches.push(key);
        console.log(`✅ Cleared cache: ${key}`);
      } catch (error) {
        console.warn(`⚠️ Failed to clear cache ${key}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard caches cleared successfully',
      clearedCaches,
      clearedCount: clearedCaches.length
    });

  } catch (error) {
    console.error('Error clearing dashboard cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear dashboard cache' },
      { status: 500 }
    );
  }
}
