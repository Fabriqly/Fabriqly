import { BaseRepository, QueryFilter } from './BaseRepository';
import { Collections } from '@/services/firebase';
import { Dispute, DisputeFilters, DisputeStage, DisputeStatus } from '@/types/dispute';
import { Timestamp } from 'firebase-admin/firestore';

export class DisputeRepository extends BaseRepository<Dispute> {
  constructor() {
    super(Collections.DISPUTES);
  }

  /**
   * Find disputes by order ID
   */
  async findByOrderId(orderId: string): Promise<Dispute[]> {
    return this.findAll({
      filters: [{ field: 'orderId', operator: '==', value: orderId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  /**
   * Find disputes by customization request ID
   */
  async findByCustomizationRequestId(requestId: string): Promise<Dispute[]> {
    return this.findAll({
      filters: [{ field: 'customizationRequestId', operator: '==', value: requestId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  /**
   * Find disputes filed by a user
   */
  async findByFiledBy(userId: string, filters?: DisputeFilters): Promise<Dispute[]> {
    const queryFilters: QueryFilter[] = [
      { field: 'filedBy', operator: '==', value: userId }
    ];

    if (filters?.stage) {
      queryFilters.push({ field: 'stage', operator: '==', value: filters.stage });
    }
    if (filters?.status) {
      queryFilters.push({ field: 'status', operator: '==', value: filters.status });
    }
    if (filters?.category) {
      queryFilters.push({ field: 'category', operator: '==', value: filters.category });
    }

    return this.findAll({
      filters: queryFilters,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  /**
   * Find disputes where user is the accused party
   */
  async findByAccusedParty(userId: string, filters?: DisputeFilters): Promise<Dispute[]> {
    const queryFilters: QueryFilter[] = [
      { field: 'accusedParty', operator: '==', value: userId }
    ];

    if (filters?.stage) {
      queryFilters.push({ field: 'stage', operator: '==', value: filters.stage });
    }
    if (filters?.status) {
      queryFilters.push({ field: 'status', operator: '==', value: filters.status });
    }
    if (filters?.category) {
      queryFilters.push({ field: 'category', operator: '==', value: filters.category });
    }

    return this.findAll({
      filters: queryFilters,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  /**
   * Find disputes by stage
   */
  async findByStage(stage: DisputeStage, filters?: DisputeFilters): Promise<Dispute[]> {
    const queryFilters: QueryFilter[] = [
      { field: 'stage', operator: '==', value: stage }
    ];

    if (filters?.status) {
      queryFilters.push({ field: 'status', operator: '==', value: filters.status });
    }
    if (filters?.category) {
      queryFilters.push({ field: 'category', operator: '==', value: filters.category });
    }

    return this.findAll({
      filters: queryFilters,
      orderBy: { field: 'createdAt', direction: 'asc' } // Oldest first for admin queue
    });
  }

  /**
   * Find disputes pending admin review
   */
  async findPendingAdminReview(): Promise<Dispute[]> {
    return this.findAll({
      filters: [
        { field: 'stage', operator: '==', value: 'admin_review' },
        { field: 'status', operator: '==', value: 'open' }
      ],
      orderBy: { field: 'createdAt', direction: 'asc' }
    });
  }

  /**
   * Find expired negotiations (deadline passed, should escalate to admin)
   */
  async findExpiredNegotiations(): Promise<Dispute[]> {
    const now = Timestamp.now();
    return this.findAll({
      filters: [
        { field: 'stage', operator: '==', value: 'negotiation' },
        { field: 'status', operator: '==', value: 'open' },
        { field: 'negotiationDeadline', operator: '<=', value: now }
      ],
      orderBy: { field: 'negotiationDeadline', direction: 'asc' }
    });
  }

  /**
   * Find disputes where filing window has expired (for validation)
   */
  async findExpiredFilingWindow(): Promise<Dispute[]> {
    // This is used for validation checks, not for querying
    // The actual validation happens in the service layer
    return [];
  }

  /**
   * Find active disputes for an order or customization request
   */
  async findActiveDispute(orderId?: string, customizationRequestId?: string): Promise<Dispute | null> {
    const filters: QueryFilter[] = [
      { field: 'status', operator: '==', value: 'open' }
    ];

    if (orderId) {
      filters.push({ field: 'orderId', operator: '==', value: orderId });
    }
    if (customizationRequestId) {
      filters.push({ field: 'customizationRequestId', operator: '==', value: customizationRequestId });
    }

    const disputes = await this.findAll({
      filters,
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 1
    });

    return disputes.length > 0 ? disputes[0] : null;
  }

  /**
   * Get dispute statistics
   */
  async getStats(): Promise<{
    total: number;
    open: number;
    closed: number;
    negotiation: number;
    adminReview: number;
    resolved: number;
  }> {
    const allDisputes = await this.findAll();
    
    return {
      total: allDisputes.length,
      open: allDisputes.filter(d => d.status === 'open').length,
      closed: allDisputes.filter(d => d.status === 'closed').length,
      negotiation: allDisputes.filter(d => d.stage === 'negotiation').length,
      adminReview: allDisputes.filter(d => d.stage === 'admin_review').length,
      resolved: allDisputes.filter(d => d.stage === 'resolved').length
    };
  }
}






