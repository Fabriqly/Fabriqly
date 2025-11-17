import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { CustomizationRequest, ProductionDetails, ProductionStatus } from '@/types/customization';
import { Timestamp } from 'firebase/firestore';
import { eventBus } from '@/events/EventBus';
import { AppError } from '@/errors/AppError';

export interface StartProductionData {
  estimatedCompletionDate: Date;
  materials?: string;
  notes?: string;
}

export interface UpdateProductionData {
  status?: ProductionStatus;
  estimatedCompletionDate?: Date;
  materials?: string;
  notes?: string;
  qualityCheckPassed?: boolean;
  qualityCheckNotes?: string;
}

export class ProductionService {
  private customizationRepo: CustomizationRepository;

  constructor() {
    this.customizationRepo = new CustomizationRepository();
  }

  /**
   * Business owner confirms production
   */
  async confirmProduction(
    requestId: string,
    businessOwnerId: string,
    data: StartProductionData
  ): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    // Verify business owner owns the selected shop
    if (!request.printingShopId) {
      throw AppError.badRequest('No printing shop selected');
    }

    const { FirebaseAdminService } = await import('./firebase-admin');
    const { Collections } = await import('./firebase');
    const shop = await FirebaseAdminService.getDocument(Collections.SHOP_PROFILES, request.printingShopId);
    
    if (!shop || shop.ownerId !== businessOwnerId) {
      throw AppError.forbidden('You do not own this printing shop');
    }

    if (request.status !== 'approved') {
      throw AppError.badRequest('Request must be approved before starting production');
    }

    // Check payment status
    if (request.paymentDetails) {
      const requiresFullPayment = request.paymentDetails.paymentType === 'upfront';
      const requiresHalfPayment = request.paymentDetails.paymentType === 'half_payment';

      if (requiresFullPayment && request.paymentDetails.paymentStatus !== 'fully_paid') {
        throw AppError.badRequest('Full payment is required before production');
      }

      if (requiresHalfPayment && request.paymentDetails.paidAmount < request.paymentDetails.totalAmount * 0.5) {
        throw AppError.badRequest('At least 50% payment is required before production');
      }
    }

    const productionDetails: ProductionDetails = {
      status: 'confirmed',
      confirmedAt: Timestamp.now(),
      estimatedCompletionDate: Timestamp.fromDate(data.estimatedCompletionDate),
      materials: data.materials,
      notes: data.notes
    };

    const updatedRequest = await this.customizationRepo.update(requestId, {
      status: 'in_production' as any,
      productionDetails: productionDetails as any,
      updatedAt: Timestamp.now() as any
    });

    // Emit event
    await eventBus.emit('customization.production.confirmed', {
      requestId,
      customerId: request.customerId,
      shopId: request.printingShopId,
      estimatedCompletion: data.estimatedCompletionDate
    });

    return updatedRequest;
  }

  /**
   * Start production
   */
  async startProduction(
    requestId: string,
    businessOwnerId: string
  ): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    // Verify business owner owns the shop
    if (!request.printingShopId) {
      throw AppError.badRequest('No printing shop selected');
    }

    const { FirebaseAdminService } = await import('./firebase-admin');
    const { Collections } = await import('./firebase');
    const shop = await FirebaseAdminService.getDocument(Collections.SHOP_PROFILES, request.printingShopId);
    
    if (!shop || shop.ownerId !== businessOwnerId) {
      throw AppError.forbidden('You do not own this printing shop');
    }

    if (!request.productionDetails || request.productionDetails.status !== 'confirmed') {
      throw AppError.badRequest('Production must be confirmed first');
    }

    const updatedProductionDetails: ProductionDetails = {
      ...request.productionDetails,
      status: 'in_progress',
      startedAt: Timestamp.now()
    };

    const updatedRequest = await this.customizationRepo.update(requestId, {
      productionDetails: updatedProductionDetails as any,
      updatedAt: Timestamp.now() as any
    });

    // Emit event
    await eventBus.emit('customization.production.started', {
      requestId,
      customerId: request.customerId,
      shopId: request.printingShopId
    });

    return updatedRequest;
  }

  /**
   * Update production status
   */
  async updateProduction(
    requestId: string,
    businessOwnerId: string,
    data: UpdateProductionData
  ): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    // Verify business owner owns the shop
    if (!request.printingShopId) {
      throw AppError.badRequest('No printing shop selected');
    }

    const { FirebaseAdminService } = await import('./firebase-admin');
    const { Collections } = await import('./firebase');
    const shop = await FirebaseAdminService.getDocument(Collections.SHOP_PROFILES, request.printingShopId);
    
    if (!shop || shop.ownerId !== businessOwnerId) {
      throw AppError.forbidden('You do not own this printing shop');
    }

    if (!request.productionDetails) {
      throw AppError.badRequest('Production has not been started');
    }

    const updatedProductionDetails: ProductionDetails = {
      ...request.productionDetails,
      ...data,
      ...(data.status && { status: data.status }),
      ...(data.estimatedCompletionDate && { estimatedCompletionDate: Timestamp.fromDate(data.estimatedCompletionDate) })
    };

    const updatedRequest = await this.customizationRepo.update(requestId, {
      productionDetails: updatedProductionDetails as any,
      updatedAt: Timestamp.now() as any
    });

    // Emit event
    await eventBus.emit('customization.production.updated', {
      requestId,
      customerId: request.customerId,
      shopId: request.printingShopId,
      status: data.status
    });

    return updatedRequest;
  }

  /**
   * Complete production
   */
  async completeProduction(
    requestId: string,
    businessOwnerId: string,
    qualityCheckPassed: boolean,
    qualityCheckNotes?: string
  ): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    // Verify business owner owns the shop
    if (!request.printingShopId) {
      throw AppError.badRequest('No printing shop selected');
    }

    const { FirebaseAdminService } = await import('./firebase-admin');
    const { Collections } = await import('./firebase');
    const shop = await FirebaseAdminService.getDocument(Collections.SHOP_PROFILES, request.printingShopId);
    
    if (!shop || shop.ownerId !== businessOwnerId) {
      throw AppError.forbidden('You do not own this printing shop');
    }

    if (!request.productionDetails) {
      throw AppError.badRequest('Production has not been started');
    }

    if (!qualityCheckPassed) {
      throw AppError.badRequest('Quality check must pass before completing production');
    }

    const updatedProductionDetails: ProductionDetails = {
      ...request.productionDetails,
      status: 'completed',
      actualCompletionDate: Timestamp.now(),
      qualityCheckPassed,
      qualityCheckNotes
    };

    const updatedRequest = await this.customizationRepo.update(requestId, {
      status: 'ready_for_pickup' as any,
      productionDetails: updatedProductionDetails as any,
      updatedAt: Timestamp.now() as any
    });

    // Emit event
    await eventBus.emit('customization.production.completed', {
      requestId,
      customerId: request.customerId,
      shopId: request.printingShopId
    });

    return updatedRequest;
  }

  /**
   * Get production requests for a shop
   */
  async getShopProductionRequests(shopId: string): Promise<CustomizationRequest[]> {
    const allRequests = await this.customizationRepo.findAll();
    return allRequests.filter(r => 
      r.printingShopId === shopId && 
      ['in_production', 'ready_for_pickup'].includes(r.status)
    );
  }

  /**
   * Get production stats for a shop
   */
  async getProductionStats(shopId: string): Promise<{
    total: number;
    confirmed: number;
    inProgress: number;
    qualityCheck: number;
    completed: number;
  }> {
    const allRequests = await this.customizationRepo.findAll();
    const shopRequests = allRequests.filter(r => r.printingShopId === shopId);

    return {
      total: shopRequests.length,
      confirmed: shopRequests.filter(r => r.productionDetails?.status === 'confirmed').length,
      inProgress: shopRequests.filter(r => r.productionDetails?.status === 'in_progress').length,
      qualityCheck: shopRequests.filter(r => r.productionDetails?.status === 'quality_check').length,
      completed: shopRequests.filter(r => r.productionDetails?.status === 'completed').length
    };
  }
}












