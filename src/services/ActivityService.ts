import { ActivityRepository } from '@/repositories/ActivityRepository';
import { Activity } from '@/types/activity';

export interface ActivityFilters {
  actorId?: string;
  targetId?: string;
  targetType?: string;
  type?: string;
  types?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical' | string[];
  status?: 'active' | 'inactive' | 'archived' | string[];
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ActivityStats {
  total: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  recentCount: number;
}

export class ActivityService {
  private activityRepository: ActivityRepository;

  constructor() {
    this.activityRepository = new ActivityRepository();
  }

  async createActivity(activityData: Omit<Activity, 'id'>): Promise<Activity> {
    return this.activityRepository.create(activityData);
  }

  async getActivity(activityId: string): Promise<Activity | null> {
    return this.activityRepository.findById(activityId);
  }

  async getActivities(filters?: ActivityFilters, limit?: number): Promise<Activity[]> {
    if (filters) {
      return this.getFilteredActivities(filters, limit);
    }

    return this.activityRepository.findRecentActivities(limit || 50);
  }

  async getActivitiesWithPagination(
    filters: ActivityFilters, 
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Activity>> {
    return this.activityRepository.findWithPagination(filters, pagination);
  }

  async getActivitiesByActor(actorId: string, limit: number = 20): Promise<Activity[]> {
    return this.activityRepository.getActivitiesByActor(actorId, limit);
  }

  async getActivitiesByTarget(targetId: string, targetType: string, limit: number = 20): Promise<Activity[]> {
    return this.activityRepository.getActivitiesByTarget(targetId, targetType, limit);
  }

  async getActivitiesByType(type: string): Promise<Activity[]> {
    return this.activityRepository.findByType(type);
  }

  async getActivitiesByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): Promise<Activity[]> {
    return this.activityRepository.findByPriority(priority);
  }

  async getActivitiesByStatus(status: 'active' | 'inactive' | 'archived'): Promise<Activity[]> {
    return this.activityRepository.findByStatus(status);
  }

  async getRecentActivities(limit: number = 50): Promise<Activity[]> {
    return this.activityRepository.findRecentActivities(limit);
  }

  async getHighPriorityActivities(): Promise<Activity[]> {
    return this.activityRepository.getHighPriorityActivities();
  }

  async getActivitiesByDateRange(startDate: Date, endDate: Date): Promise<Activity[]> {
    return this.activityRepository.findActivitiesByDateRange(startDate, endDate);
  }

  async getActivityStats(): Promise<ActivityStats> {
    return this.activityRepository.getActivityStats();
  }

  async updateActivity(activityId: string, updateData: Partial<Activity>): Promise<Activity> {
    return this.activityRepository.update(activityId, updateData);
  }

  async deleteActivity(activityId: string): Promise<void> {
    await this.activityRepository.delete(activityId);
  }

  async archiveOldActivities(daysOld: number = 30): Promise<number> {
    return this.activityRepository.archiveOldActivities(daysOld);
  }

  async searchActivities(searchTerm: string): Promise<Activity[]> {
    return this.activityRepository.searchActivities(searchTerm);
  }

  private async getFilteredActivities(filters: ActivityFilters, limit?: number): Promise<Activity[]> {
    const { actorId, targetId, targetType, type, priority, status, startDate, endDate } = filters;

    // If we have specific filters, use the appropriate repository methods
    if (actorId) {
      return this.activityRepository.getActivitiesByActor(actorId, limit || 20);
    }

    if (targetId && targetType) {
      return this.activityRepository.getActivitiesByTarget(targetId, targetType, limit || 20);
    }

    if (type) {
      return this.activityRepository.findByType(type);
    }

    if (priority && !Array.isArray(priority)) {
      return this.activityRepository.findByPriority(priority as 'low' | 'medium' | 'high' | 'critical');
    }

    if (status && !Array.isArray(status)) {
      return this.activityRepository.findByStatus(status as 'active' | 'inactive' | 'archived');
    }

    if (startDate && endDate) {
      return this.activityRepository.findActivitiesByDateRange(startDate, endDate);
    }

    // Default to recent activities
    return this.activityRepository.findRecentActivities(limit || 50);
  }

  // Helper methods for common activity creation patterns
  async logProductActivity(
    type: string,
    productId: string,
    actorId: string,
    metadata: Record<string, any>
  ): Promise<Activity> {
    return this.createActivity({
      type: type as any,
      title: this.getProductActivityTitle(type),
      description: this.getProductActivityDescription(type, metadata),
      priority: 'low',
      status: 'active',
      actorId,
      targetId: productId,
      targetType: 'product',
      targetName: metadata.productName || 'Unknown Product',
      metadata,
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    });
  }

  async logCategoryActivity(
    type: string,
    categoryId: string,
    actorId: string,
    metadata: Record<string, any>
  ): Promise<Activity> {
    return this.createActivity({
      type: type as any,
      title: this.getCategoryActivityTitle(type),
      description: this.getCategoryActivityDescription(type, metadata),
      priority: 'low',
      status: 'active',
      actorId,
      targetId: categoryId,
      targetType: 'category',
      targetName: metadata.categoryName || 'Unknown Category',
      metadata,
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    });
  }

  async logUserActivity(
    type: string,
    userId: string,
    actorId: string,
    metadata: Record<string, any>
  ): Promise<Activity> {
    return this.createActivity({
      type: type as any,
      title: this.getUserActivityTitle(type),
      description: this.getUserActivityDescription(type, metadata),
      priority: 'low',
      status: 'active',
      actorId,
      targetId: userId,
      targetType: 'user',
      targetName: metadata.email || 'Unknown User',
      metadata,
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    });
  }

  private getProductActivityTitle(type: string): string {
    const titles: Record<string, string> = {
      'product_created': 'Product Created',
      'product_updated': 'Product Updated',
      'product_deleted': 'Product Deleted',
      'product_status_changed': 'Product Status Changed',
      'product_stock_updated': 'Product Stock Updated'
    };
    return titles[type] || 'Product Activity';
  }

  private getProductActivityDescription(type: string, metadata: Record<string, any>): string {
    const productName = metadata.productName || 'Product';
    
    switch (type) {
      case 'product_created':
        return `Product "${productName}" has been created`;
      case 'product_updated':
        return `Product "${productName}" has been updated`;
      case 'product_deleted':
        return `Product "${productName}" has been deleted`;
      case 'product_status_changed':
        return `Product "${productName}" status changed from ${metadata.oldStatus} to ${metadata.newStatus}`;
      case 'product_stock_updated':
        return `Product "${productName}" stock updated from ${metadata.oldStock} to ${metadata.newStock}`;
      default:
        return `Product "${productName}" activity`;
    }
  }

  private getCategoryActivityTitle(type: string): string {
    const titles: Record<string, string> = {
      'category_created': 'Category Created',
      'category_updated': 'Category Updated',
      'category_deleted': 'Category Deleted'
    };
    return titles[type] || 'Category Activity';
  }

  private getCategoryActivityDescription(type: string, metadata: Record<string, any>): string {
    const categoryName = metadata.categoryName || 'Category';
    
    switch (type) {
      case 'category_created':
        return `Category "${categoryName}" has been created`;
      case 'category_updated':
        return `Category "${categoryName}" has been updated`;
      case 'category_deleted':
        return `Category "${categoryName}" has been deleted`;
      default:
        return `Category "${categoryName}" activity`;
    }
  }

  private getUserActivityTitle(type: string): string {
    const titles: Record<string, string> = {
      'user_created': 'User Created',
      'user_updated': 'User Updated',
      'user_deleted': 'User Deleted',
      'user_role_updated': 'User Role Updated',
      'user_verified': 'User Verified',
      'user_profile_updated': 'User Profile Updated'
    };
    return titles[type] || 'User Activity';
  }

  private getUserActivityDescription(type: string, metadata: Record<string, any>): string {
    const email = metadata.email || 'User';
    
    switch (type) {
      case 'user_created':
        return `User "${email}" has been created`;
      case 'user_updated':
        return `User "${email}" has been updated`;
      case 'user_deleted':
        return `User "${email}" has been deleted`;
      case 'user_role_updated':
        return `User "${email}" role changed from ${metadata.oldRole} to ${metadata.newRole}`;
      case 'user_verified':
        return `User "${email}" has been verified`;
      case 'user_profile_updated':
        return `User "${email}" profile has been updated`;
      default:
        return `User "${email}" activity`;
    }
  }
}
