import { BaseRepository, QueryFilter } from './BaseRepository';
import { Collections } from '@/services/firebase';
import { 
  CustomizationRequest, 
  CustomizationFilters,
  CustomizationStats 
} from '@/types/customization';
import { FirebaseAdminService } from '@/services/firebase-admin';

export class CustomizationRepository extends BaseRepository<CustomizationRequest> {
  constructor() {
    super(Collections.CUSTOMIZATION_REQUESTS);
  }

  /**
   * Find customization requests by customer ID
   */
  async findByCustomerId(customerId: string): Promise<CustomizationRequest[]> {
    return this.findAll({
      filters: [{ field: 'customerId', operator: '==', value: customerId }],
      orderBy: { field: 'requestedAt', direction: 'desc' }
    });
  }

  /**
   * Find customization requests by designer ID
   */
  async findByDesignerId(designerId: string): Promise<CustomizationRequest[]> {
    return this.findAll({
      filters: [{ field: 'designerId', operator: '==', value: designerId }],
      orderBy: { field: 'requestedAt', direction: 'desc' }
    });
  }

  /**
   * Find pending requests (not assigned to any designer yet)
   */
  async findPendingRequests(limit?: number): Promise<CustomizationRequest[]> {
    return this.findAll({
      filters: [
        { field: 'status', operator: '==', value: 'pending_designer_review' }
      ],
      orderBy: { field: 'requestedAt', direction: 'asc' },
      limit
    });
  }

  /**
   * Find requests by status
   */
  async findByStatus(status: string, limit?: number): Promise<CustomizationRequest[]> {
    return this.findAll({
      filters: [{ field: 'status', operator: '==', value: status }],
      orderBy: { field: 'requestedAt', direction: 'desc' },
      limit
    });
  }

  /**
   * Find requests awaiting customer approval
   */
  async findAwaitingApproval(customerId?: string): Promise<CustomizationRequest[]> {
    const filters: QueryFilter[] = [
      { field: 'status', operator: '==', value: 'awaiting_customer_approval' }
    ];
    
    if (customerId) {
      filters.push({ field: 'customerId', operator: '==', value: customerId });
    }

    return this.findAll({
      filters,
      orderBy: { field: 'completedAt', direction: 'desc' }
    });
  }

  /**
   * Find requests by product ID
   */
  async findByProductId(productId: string): Promise<CustomizationRequest[]> {
    return this.findAll({
      filters: [{ field: 'productId', operator: '==', value: productId }],
      orderBy: { field: 'requestedAt', direction: 'desc' }
    });
  }

  /**
   * Get customization statistics
   */
  async getStatistics(filters?: { customerId?: string; designerId?: string }): Promise<CustomizationStats> {
    const queryFilters: QueryFilter[] = [];
    
    if (filters?.customerId) {
      queryFilters.push({ field: 'customerId', operator: '==', value: filters.customerId });
    }
    
    if (filters?.designerId) {
      queryFilters.push({ field: 'designerId', operator: '==', value: filters.designerId });
    }

    const allRequests = await this.findAll({ filters: queryFilters });

    return {
      totalRequests: allRequests.length,
      pendingReview: allRequests.filter(r => r.status === 'pending_designer_review').length,
      inProgress: allRequests.filter(r => r.status === 'in_progress').length,
      awaitingApproval: allRequests.filter(r => r.status === 'awaiting_customer_approval').length,
      approved: allRequests.filter(r => r.status === 'approved' || r.status === 'ready_for_production').length,
      rejected: allRequests.filter(r => r.status === 'rejected').length,
      completed: allRequests.filter(r => r.status === 'completed').length,
      cancelled: allRequests.filter(r => r.status === 'cancelled').length,
    };
  }

  /**
   * Assign designer to a request
   */
  async assignDesigner(requestId: string, designerId: string, designerName: string): Promise<CustomizationRequest> {
    return this.update(requestId, {
      designerId,
      designerName,
      status: 'in_progress' as any,
      assignedAt: new Date() as any
    });
  }

  /**
   * Update request status
   */
  async updateStatus(requestId: string, status: string, additionalData?: any): Promise<CustomizationRequest> {
    const updateData: any = {
      status,
      ...additionalData
    };

    if (status === 'awaiting_customer_approval') {
      updateData.completedAt = new Date();
    } else if (status === 'approved') {
      updateData.approvedAt = new Date();
    }

    return this.update(requestId, updateData);
  }

  /**
   * Get designer's active requests count
   */
  async getDesignerActiveCount(designerId: string): Promise<number> {
    const activeRequests = await this.findAll({
      filters: [
        { field: 'designerId', operator: '==', value: designerId },
        { field: 'status', operator: 'in', value: ['in_progress', 'awaiting_customer_approval'] }
      ]
    });
    return activeRequests.length;
  }

  /**
   * Search requests with complex filters
   */
  async search(filters: CustomizationFilters): Promise<CustomizationRequest[]> {
    const queryFilters: QueryFilter[] = [];

    if (filters.customerId) {
      queryFilters.push({ field: 'customerId', operator: '==', value: filters.customerId });
    }

    if (filters.designerId) {
      queryFilters.push({ field: 'designerId', operator: '==', value: filters.designerId });
    }

    if (filters.productId) {
      queryFilters.push({ field: 'productId', operator: '==', value: filters.productId });
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryFilters.push({ field: 'status', operator: 'in', value: filters.status });
      } else {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status });
      }
    }

    // Always sort by most recent first - use requestedAt, fallback to createdAt
    const orderField = filters.sortBy || 'requestedAt';
    const orderDirection = filters.sortOrder || 'desc';

    // Fetch all matching records with proper sorting from Firestore
    // Note: Firestore query will sort by orderField, but we need to ensure
    // proper sorting by requestedAt (most recent first) with createdAt fallback
    const allResults = await this.findAll({
      filters: queryFilters,
      orderBy: { field: orderField, direction: orderDirection }
    });

    // Additional client-side sort to ensure proper ordering
    // Sort by requestedAt (most recent first), with createdAt as fallback, then updatedAt
    const sortedResults = allResults.sort((a, b) => {
      // Primary: requestedAt, fallback to createdAt, then updatedAt
      const dateA = a.requestedAt || a.createdAt || a.updatedAt;
      const dateB = b.requestedAt || b.createdAt || b.updatedAt;
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // Put items without date at end
      if (!dateB) return -1;
      
      // Convert to Date if needed (handle Firestore Timestamp)
      let timestampA: Date;
      let timestampB: Date;
      
      if (dateA.toDate && typeof dateA.toDate === 'function') {
        timestampA = dateA.toDate();
      } else if (dateA.seconds) {
        timestampA = new Date(dateA.seconds * 1000);
      } else {
        timestampA = new Date(dateA);
      }
      
      if (dateB.toDate && typeof dateB.toDate === 'function') {
        timestampB = dateB.toDate();
      } else if (dateB.seconds) {
        timestampB = new Date(dateB.seconds * 1000);
      } else {
        timestampB = new Date(dateB);
      }
      
      // Descending order (newest first) - most recent at top
      return timestampB.getTime() - timestampA.getTime();
    });

    // Apply offset and limit AFTER sorting
    const startIndex = filters.offset || 0;
    const endIndex = filters.limit ? startIndex + filters.limit : undefined;
    
    return sortedResults.slice(startIndex, endIndex);
  }
}

