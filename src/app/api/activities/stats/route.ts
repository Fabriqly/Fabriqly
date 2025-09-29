import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { ActivityStats, ActivityType, ActivityPriority } from '@/types/activity';
import { CacheService } from '@/services/CacheService';

// GET /api/activities/stats - Get activity statistics
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
    const days = parseInt(searchParams.get('days') || '30');

    // Get all activities from the last N days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Try to get cached stats first
    const cacheKey = `activity-stats-${days}`;
    const cached = await CacheService.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }

    const activities = await FirebaseAdminService.queryDocuments(
      Collections.ACTIVITIES,
      [
        { field: 'status', operator: '==' as const, value: 'active' },
        { field: 'createdAt', operator: '>=' as const, value: cutoffDate }
      ],
      { field: 'createdAt', direction: 'desc' },
      500 // Reduced limit for stats
    );

    // Calculate statistics
    const stats: ActivityStats = {
      totalActivities: activities.length,
      activitiesByType: {} as Record<ActivityType, number>,
      activitiesByPriority: {} as Record<ActivityPriority, number>,
      recentActivityCount: 0,
      topActors: []
    };

    // Initialize counters
    const typeCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    const actorCounts: Record<string, { name: string; count: number }> = {};
    const recentCutoff = new Date();
    recentCutoff.setHours(recentCutoff.getHours() - 24);

    // Process activities
    activities.forEach((activity: any) => {
      // Count by type
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
      
      // Count by priority
      priorityCounts[activity.priority] = (priorityCounts[activity.priority] || 0) + 1;
      
      // Count recent activities (last 24 hours)
      if (activity.createdAt && activity.createdAt.toDate && activity.createdAt.toDate() > recentCutoff) {
        stats.recentActivityCount++;
      }
      
      // Count by actor
      if (activity.actorId) {
        if (!actorCounts[activity.actorId]) {
          actorCounts[activity.actorId] = { name: activity.actorName || 'Unknown', count: 0 };
        }
        actorCounts[activity.actorId].count++;
      }
    });

    // Convert to proper format
    stats.activitiesByType = typeCounts as Record<ActivityType, number>;
    stats.activitiesByPriority = priorityCounts as Record<ActivityPriority, number>;
    
    // Get top actors
    stats.topActors = Object.entries(actorCounts)
      .map(([actorId, data]) => ({
        actorId,
        actorName: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const response = { stats };
    
    // Cache the response for 5 minutes
    await CacheService.set(cacheKey, response, 5 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity statistics' },
      { status: 500 }
    );
  }
}

