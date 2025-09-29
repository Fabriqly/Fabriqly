import { FirebaseAdminService } from './firebase-admin';
import { Collections } from './firebase';
import { DashboardSummary, SummaryOperation } from '@/types/dashboard-summary';
import { CacheService } from './CacheService';

export class DashboardSummaryService {
  private static readonly SUMMARY_DOC_ID = 'live-summary';
  private static readonly CACHE_KEY = 'dashboard-summary';
  private static readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  /**
   * Get the current dashboard summary (from cache or database)
   */
  static async getSummary(): Promise<DashboardSummary | null> {
    try {
      // Try cache first
      const cached = await CacheService.get(this.CACHE_KEY);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const summary = await this.fetchFromDatabase();
      
      // Cache the result
      if (summary) {
        await CacheService.set(this.CACHE_KEY, summary, this.CACHE_TTL);
      }
      
      return summary;
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return null;
    }
  }

  /**
   * Trigger a full summary refresh
   */
  static async refreshSummary(): Promise<DashboardSummary> {
    console.log('🔄 Refreshing dashboard summary...');
    
    try {
      const summary = await this.calculateFullSummary();
      
      // Save to database
      await this.saveSummary(summary);
      
      // Update cache
      await CacheService.set(this.CACHE_KEY, summary, this.CACHE_TTL);
      
      console.log('✅ Dashboard summary refreshed:', {
        users: summary.totalUsers,
        products: summary.totalProducts,
        orders: summary.totalOrders,
        revenue: summary.totalRevenue
      });
      
      return summary;
    } catch (error) {
      console.error('❌ Error refreshing summary:', error);
      throw error;
    }
  }

  /**
   * Incrementally update summary for a specific operation
   */
  static async updateForOperation(operation: SummaryOperation): Promise<void> {
    try {
      const currentSummary = await this.getSummary();
      
      if (!currentSummary) {
        // If no summary exists, do a full refresh
        await this.refreshSummary();
        return;
      }

      const updatedSummary = await this.applyIncrementalUpdate(currentSummary, operation);
      
      // Save updated summary
      await this.saveSummary(updatedSummary);
      
      // Update cache
      await CacheService.set(this.CACHE_KEY, updatedSummary, this.CACHE_TTL);
      
      console.log(`📈 Updated summary after ${operation.type}:`, updatedSummary);
    } catch (error) {
      console.error('Error in incremental update:', error);
      // Fallback to full refresh
      await this.refreshSummary();
    }
  }

  /**
   * Calculate full summary from all collections
   */
  private static async calculateFullSummary(): Promise<DashboardSummary> {
    console.log('📊 Calculating full summary from collections...');
    
    // Get current counts with optimized queries
    const [users, products, orders, categories] = await Promise.all([
      FirebaseAdminService.queryDocuments(Collections.USERS, [], { field: 'createdAt', direction: 'desc' }, 2000), // Increased limit for accurate count
      FirebaseAdminService.queryDocuments(Collections.PRODUCTS, [], { field: 'createdAt', direction: 'desc' }, 2000),
      FirebaseAdminService.queryDocuments(Collections.ORDERS, [], { field: 'createdAt', direction: 'desc' }, 2000),
      FirebaseAdminService.queryDocuments(Collections.PRODUCT_CATEGORIES, [], { field: 'createdAt', direction: 'desc' }, 200)
    ]);

    // Calculate metrics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const calcMetrics = {
      totalUsers: users.length,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalCategories: categories.length,
      
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      todayRevenue: orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= today;
      }).reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      thisMonthRevenue: orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= thisMonth;
      }).reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      
      newUsersToday: users.filter(u => {
        const userDate = new Date(u.createdAt);
        return userDate >= today;
      }).length,
      newOrdersToday: orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= today;
      }).length,
      newProductsThisWeek: products.filter(p => {
        const productDate = new Date(p.createdAt);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return productDate >= weekAgo;
      }).length,
    };

    return {
      ...calcMetrics,
      lastUpdated: now.toISOString(),
      lastUpdatedBy: 'scheduled',
      version: 1,
      creationDate: now.toISOString(),
      calculatedAt: now.toISOString()
    };
  }

  /**
   * Apply incremental update for a single operation
   */
  private static async applyIncrementalUpdate(summary: DashboardSummary, operation: SummaryOperation): Promise<DashboardSummary> {
    const updated = { ...summary };
    updated.lastUpdated = new Date().toISOString();
    updated.lastUpdatedBy = 'trigger';
    updated.version += 1;

    switch (operation.type) {
      case 'user_created':
        updated.totalUsers += 1;
        updated.newUsersToday += 1;
        break;
      case 'user_deleted':
        updated.totalUsers = Math.max(0, updated.totalUsers - 1);
        break;
      case 'product_created':
        updated.totalProducts += 1;
        if (operation.entityData?.status === 'active') {
          updated.activeProducts += 1;
        }
        updated.newProductsThisWeek += 1;
        break;
      case 'product_updated':
        if (operation.entityData?.status === 'active' && !summary.activeProducts) {
          updated.activeProducts += 1;
        } else if (operation.entityData?.status !== 'active' && summary.activeProducts > 0) {
          updated.activeProducts = Math.max(0, updated.activeProducts - 1);
        }
        break;
      case 'product_deleted':
        updated.totalProducts = Math.max(0, updated.totalProducts - 1);
        updated.activeProducts = Math.max(0, updated.activeProducts - 1);
        break;
      case 'order_created':
        updated.totalOrders += 1;
        updated.newOrdersToday += 1;
        if (operation.entityData?.status === 'pending') {
          updated.pendingOrders += 1;
        }
        if (operation.entityData?.totalAmount) {
          const amount = operation.entityData.totalAmount;
          updated.totalRevenue += amount;
          updated.todayRevenue += amount;
          updated.thisMonthRevenue += amount;
        }
        break;
      case 'order_updated':
        if (operation.entityData?.status === 'pending' && summary.pendingOrders <= summary.totalOrders) {
          updated.pendingOrders += 1;
        } else if (operation.entityData?.status === 'completed' && summary.pendingOrders > 0) {
          updated.pendingOrders = Math.max(0, updated.pendingOrders - 1);
        }
        break;
      case 'order_deleted':
        updated.totalOrders = Math.max(0, updated.totalOrders - 1);
        updated.pendingOrders = Math.max(0, updated.pendingOrders - 1);
        break;
    }

    return updated;
  }

  /**
   * Fetch summary from database
   */
  private static async fetchFromDatabase(): Promise<DashboardSummary | null> {
    try {
      const doc = await FirebaseAdminService.getById('dashboard-summary', this.SUMMARY_DOC_ID);
      return doc as DashboardSummary;
    } catch (error) {
      console.error('Error fetching summary from database:', error);
      return null;
    }
  }

  /**
   * Save summary to database
   */
  private static async saveSummary(summary: DashboardSummary): Promise<void> {
    try {
      // First check if document exists
      const existing = await FirebaseAdminService.getById('dashboard-summary', this.SUMMARY_DOC_ID);
      
      if (existing) {
        // Update existing document
        await FirebaseAdminService.updateDocument('dashboard-summary', this.SUMMARY_DOC_ID, summary);
      } else {
        // Create new document
        await FirebaseAdminService.createDocument('dashboard-summary', {
          id: this.SUMMARY_DOC_ID,
          ...summary
        });
      }
    } catch (error) {
      console.error('Error saving summary:', error);
      throw error;
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  static async clearCache(): Promise<void> {
    await CacheService.delete(this.CACHE_KEY);
  }

  /**
   * Get summary statistics for debugging
   */
  static async getDebugInfo(): Promise<any> {
    const summary = await this.getSummary();
    const cached = await CacheService.get(this.CACHE_KEY);
    
    return {
      summaryExists: !!summary,
      cacheExists: !!cached,
      lastUpdated: summary?.lastUpdated,
      version: summary?.version,
      cacheSize: cached ? JSON.stringify(cached).length : 0
    };
  }
}
