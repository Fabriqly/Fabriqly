export interface DashboardSummary {
  // Counts
  totalUsers: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCategories: number;
  
  // Revenue Metrics
  totalRevenue: number;
  todayRevenue: number;
  thisMonthRevenue: number;
  
  // Time-based Metrics
  newUsersToday: number;
  newOrdersToday: number;
  newProductsThisWeek: number;
  
  // Status Information
  lastUpdated: string;
  lastUpdatedBy: 'trigger' | 'scheduled' | 'manual';
  version: number;
  
  // Optional Analytics Snapshots
  userGrowthTrend?: 'up' | 'down' | 'stable';
  revenueTrend?: 'up' | 'down' | 'stable';
  topSellingCategory?: string;
  
  // Metadata
  creationDate: string;
  calculatedAt: string;
}

export interface SummaryOperation {
  type: 'user_created' | 'user_deleted' | 'product_created' | 'product_updated' | 'product_deleted' | 'order_created' | 'order_updated' | 'order_deleted';
  entityId: string;
  entityData?: any;
  timestamp: string;
}

export interface SummaryCacheMetadata {
  lastFullRefresh: string;
  incrementalUpdates: SummaryOperation[];
  cacheKey: string;
  ttl: number;
}
