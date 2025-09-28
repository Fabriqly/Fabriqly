import { BaseRepository, QueryFilter } from './BaseRepository';
import { Collections } from '@/services/firebase';
import { Activity } from '@/types/activity';
import { ActivityFilters, PaginationOptions, PaginatedResult } from '@/services/ActivityService';

export class ActivityRepository extends BaseRepository<Activity> {
  constructor() {
    super(Collections.ACTIVITIES);
  }

  async findByActor(actorId: string): Promise<Activity[]> {
    return this.findAll({
      filters: [{ field: 'actorId', operator: '==', value: actorId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByTarget(targetId: string, targetType?: string): Promise<Activity[]> {
    const filters: QueryFilter[] = [
      { field: 'targetId', operator: '==', value: targetId }
    ];

    if (targetType) {
      filters.push({ field: 'targetType', operator: '==', value: targetType });
    }

    return this.findAll({
      filters,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByType(type: string): Promise<Activity[]> {
    return this.findAll({
      filters: [{ field: 'type', operator: '==', value: type }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): Promise<Activity[]> {
    return this.findAll({
      filters: [{ field: 'priority', operator: '==', value: priority }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByStatus(status: 'active' | 'inactive' | 'archived'): Promise<Activity[]> {
    return this.findAll({
      filters: [{ field: 'status', operator: '==', value: status }]
    });
  }

  async findRecentActivities(limit: number = 50): Promise<Activity[]> {
    return this.findAll({
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    });
  }

  async findActivitiesByDateRange(startDate: Date, endDate: Date): Promise<Activity[]> {
    return this.findAll({
      filters: [
        { field: 'createdAt', operator: '>=', value: startDate },
        { field: 'createdAt', operator: '<=', value: endDate }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async getActivityStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
    recentCount: number;
  }> {
    const allActivities = await this.findAll();
    const recentActivities = await this.findRecentActivities(100);
    
    const stats = {
      total: allActivities.length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recentCount: recentActivities.length
    };

    // Count by type, priority, and status
    allActivities.forEach(activity => {
      // Count by type
      const type = activity.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by priority
      const priority = activity.priority || 'unknown';
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

      // Count by status
      const status = activity.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    return stats;
  }

  async getActivitiesByActor(actorId: string, limit: number = 20): Promise<Activity[]> {
    return this.findAll({
      filters: [{ field: 'actorId', operator: '==', value: actorId }],
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    });
  }

  async getActivitiesByTarget(targetId: string, targetType: string, limit: number = 20): Promise<Activity[]> {
    return this.findAll({
      filters: [
        { field: 'targetId', operator: '==', value: targetId },
        { field: 'targetType', operator: '==', value: targetType }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    });
  }

  async getHighPriorityActivities(): Promise<Activity[]> {
    return this.findAll({
      filters: [
        { field: 'priority', operator: 'in', value: ['high', 'critical'] },
        { field: 'status', operator: '==', value: 'active' }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async archiveOldActivities(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldActivities = await this.findAll({
      filters: [
        { field: 'createdAt', operator: '<', value: cutoffDate },
        { field: 'status', operator: '==', value: 'active' }
      ]
    });

    // Archive activities in batches
    const batchSize = 100;
    let archivedCount = 0;

    for (let i = 0; i < oldActivities.length; i += batchSize) {
      const batch = oldActivities.slice(i, i + batchSize);
      const updates = batch.map(activity => ({
        id: activity.id,
        data: { status: 'archived' as const }
      }));

      await this.batchUpdate(updates);
      archivedCount += batch.length;
    }

    return archivedCount;
  }

  async searchActivities(searchTerm: string): Promise<Activity[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a simplified implementation - in production, you'd use Algolia or similar
    const filters: QueryFilter[] = [];

    return this.findAll({ 
      filters,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findWithPagination(
    filters: ActivityFilters, 
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Activity>> {
    const queryFilters: QueryFilter[] = [];

    // Build filters
    if (filters.actorId) {
      queryFilters.push({ field: 'actorId', operator: '==', value: filters.actorId });
    }

    if (filters.targetId) {
      queryFilters.push({ field: 'targetId', operator: '==', value: filters.targetId });
    }

    if (filters.targetType) {
      queryFilters.push({ field: 'targetType', operator: '==', value: filters.targetType });
    }

    if (filters.type) {
      queryFilters.push({ field: 'type', operator: '==', value: filters.type });
    }

    if (filters.types && filters.types.length > 0) {
      queryFilters.push({ field: 'type', operator: 'in', value: filters.types });
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        queryFilters.push({ field: 'priority', operator: 'in', value: filters.priority });
      } else {
        queryFilters.push({ field: 'priority', operator: '==', value: filters.priority });
      }
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryFilters.push({ field: 'status', operator: 'in', value: filters.status });
      } else {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status });
      }
    }

    if (filters.startDate) {
      queryFilters.push({ field: 'createdAt', operator: '>=', value: filters.startDate });
    }

    if (filters.endDate) {
      queryFilters.push({ field: 'createdAt', operator: '<=', value: filters.endDate });
    }

    // Get total count for pagination
    const totalQuery = await this.findAll({
      filters: queryFilters,
      orderBy: { field: pagination.sortBy, direction: pagination.sortOrder }
    });
    const total = totalQuery.length;

    // Get paginated results - we need to get all results and slice them
    // since BaseRepository doesn't support offset
    const allData = await this.findAll({
      filters: queryFilters,
      orderBy: { field: pagination.sortBy, direction: pagination.sortOrder }
    });
    
    // Apply pagination manually
    const data = allData.slice(pagination.offset, pagination.offset + pagination.limit);

    return {
      data,
      pagination: {
        limit: pagination.limit,
        offset: pagination.offset,
        total,
        hasMore: pagination.offset + pagination.limit < total
      }
    };
  }
}
