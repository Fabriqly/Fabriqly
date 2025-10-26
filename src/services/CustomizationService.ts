import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { UserRepository } from '@/repositories/UserRepository';
import {
  CustomizationRequest,
  CreateCustomizationRequest,
  UpdateCustomizationRequest,
  CustomizationFilters,
  CustomizationStats,
  CustomizationRequestWithDetails,
  DesignerWorkload,
  CustomizationStatus
} from '@/types/customization';
import { Timestamp } from 'firebase/firestore';
import { eventBus } from '@/events/EventBus';

export class CustomizationService {
  private customizationRepo: CustomizationRepository;
  private productRepo: ProductRepository;
  private userRepo: UserRepository;

  constructor() {
    this.customizationRepo = new CustomizationRepository();
    this.productRepo = new ProductRepository();
    this.userRepo = new UserRepository();
  }

  /**
   * Create a new customization request
   */
  async createRequest(data: CreateCustomizationRequest): Promise<CustomizationRequest> {
    // Validate product exists
    const product = await this.productRepo.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isCustomizable) {
      throw new Error('This product is not customizable');
    }

    // Create the request
    const requestData = {
      ...data,
      status: 'pending_designer_review' as CustomizationStatus,
      requestedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const request = await this.customizationRepo.create(requestData);

    // Emit event for notifications
    await eventBus.emit('customization.request.created', {
      requestId: request.id,
      customerId: request.customerId,
      productId: request.productId,
      productName: request.productName
    });

    return request;
  }

  /**
   * Get request by ID
   */
  async getRequestById(id: string): Promise<CustomizationRequest | null> {
    return this.customizationRepo.findById(id);
  }

  /**
   * Get request with detailed information
   */
  async getRequestWithDetails(id: string): Promise<CustomizationRequestWithDetails | null> {
    const request = await this.customizationRepo.findById(id);
    if (!request) return null;

    const [customer, designer, product] = await Promise.all([
      this.userRepo.findById(request.customerId),
      request.designerId ? this.userRepo.findById(request.designerId) : null,
      this.productRepo.findById(request.productId)
    ]);

    return {
      ...request,
      customer: customer ? {
        id: customer.id,
        name: customer.displayName || 'Unknown',
        email: customer.email,
        photoURL: customer.profile?.avatar
      } : undefined,
      designer: designer ? {
        id: designer.id,
        name: designer.displayName || 'Unknown',
        email: designer.email,
        photoURL: designer.profile?.avatar,
        portfolioUrl: designer.profile?.website
      } : undefined,
      product: product ? {
        id: product.id,
        name: product.name,
        price: product.price,
        images: [] // You can populate this from ProductImages collection
      } : undefined
    };
  }

  /**
   * Get customer's requests
   */
  async getCustomerRequests(customerId: string): Promise<CustomizationRequest[]> {
    return this.customizationRepo.findByCustomerId(customerId);
  }

  /**
   * Get designer's requests
   */
  async getDesignerRequests(designerId: string): Promise<CustomizationRequest[]> {
    return this.customizationRepo.findByDesignerId(designerId);
  }

  /**
   * Get pending requests (available for designers to claim)
   */
  async getPendingRequests(limit?: number): Promise<CustomizationRequest[]> {
    return this.customizationRepo.findPendingRequests(limit);
  }

  /**
   * Assign designer to a request
   */
  async assignDesigner(requestId: string, designerId: string): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending_designer_review') {
      throw new Error('Request is no longer available');
    }

    const designer = await this.userRepo.findById(designerId);
    if (!designer) {
      throw new Error('Designer not found');
    }

    if (designer.role !== 'designer' && designer.role !== 'business_owner' && designer.role !== 'admin') {
      throw new Error('User is not a designer');
    }

    const updatedRequest = await this.customizationRepo.assignDesigner(
      requestId,
      designerId,
      designer.displayName || 'Designer'
    );

    // Emit event
    await eventBus.emit('customization.designer.assigned', {
      requestId,
      designerId,
      customerId: request.customerId
    });

    return updatedRequest;
  }

  /**
   * Designer uploads final design
   */
  async uploadFinalDesign(
    requestId: string,
    designerId: string,
    finalFile: any,
    previewImage: any,
    notes?: string
  ): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.designerId !== designerId) {
      throw new Error('You are not assigned to this request');
    }

    if (request.status !== 'in_progress') {
      throw new Error('Request is not in progress');
    }

    const updatedRequest = await this.customizationRepo.updateStatus(
      requestId,
      'awaiting_customer_approval',
      {
        designerFinalFile: finalFile,
        designerPreviewImage: previewImage,
        designerNotes: notes
      }
    );

    // Emit event
    await eventBus.emit('customization.design.completed', {
      requestId,
      designerId,
      customerId: request.customerId
    });

    return updatedRequest;
  }

  /**
   * Customer approves the design
   */
  async approveDesign(requestId: string, customerId: string): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.customerId !== customerId) {
      throw new Error('Unauthorized');
    }

    if (request.status !== 'awaiting_customer_approval') {
      throw new Error('Request is not awaiting approval');
    }

    const updatedRequest = await this.customizationRepo.updateStatus(
      requestId,
      'approved'
    );

    // Emit event
    await eventBus.emit('customization.design.approved', {
      requestId,
      customerId,
      designerId: request.designerId
    });

    return updatedRequest;
  }

  /**
   * Customer rejects the design
   */
  async rejectDesign(requestId: string, customerId: string, reason: string): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.customerId !== customerId) {
      throw new Error('Unauthorized');
    }

    if (request.status !== 'awaiting_customer_approval') {
      throw new Error('Request is not awaiting approval');
    }

    const updatedRequest = await this.customizationRepo.updateStatus(
      requestId,
      'in_progress', // Send back to designer
      {
        rejectionReason: reason
      }
    );

    // Emit event
    await eventBus.emit('customization.design.rejected', {
      requestId,
      customerId,
      designerId: request.designerId,
      reason
    });

    return updatedRequest;
  }

  /**
   * Cancel a request
   */
  async cancelRequest(requestId: string, userId: string): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Only customer or admin can cancel
    if (request.customerId !== userId) {
      const user = await this.userRepo.findById(userId);
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
    }

    if (['completed', 'approved', 'cancelled'].includes(request.status)) {
      throw new Error('Cannot cancel this request');
    }

    const updatedRequest = await this.customizationRepo.updateStatus(
      requestId,
      'cancelled'
    );

    // Emit event
    await eventBus.emit('customization.request.cancelled', {
      requestId,
      customerId: request.customerId,
      designerId: request.designerId
    });

    return updatedRequest;
  }

  /**
   * Update request with order ID after order is created
   */
  async linkToOrder(requestId: string, orderId: string): Promise<CustomizationRequest> {
    return this.customizationRepo.update(requestId, {
      orderId: orderId as any,
      status: 'completed' as any
    });
  }

  /**
   * Search requests with filters
   */
  async searchRequests(filters: CustomizationFilters): Promise<CustomizationRequest[]> {
    return this.customizationRepo.search(filters);
  }

  /**
   * Get statistics
   */
  async getStatistics(filters?: { customerId?: string; designerId?: string }): Promise<CustomizationStats> {
    return this.customizationRepo.getStatistics(filters);
  }

  /**
   * Get designer workload (for load balancing)
   */
  async getDesignerWorkload(designerId: string): Promise<DesignerWorkload> {
    const activeCount = await this.customizationRepo.getDesignerActiveCount(designerId);
    const designer = await this.userRepo.findById(designerId);

    // Get today's completed requests
    const allRequests = await this.customizationRepo.findByDesignerId(designerId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedToday = allRequests.filter(r => {
      if (!r.completedAt) return false;
      const completedDate = r.completedAt.toDate ? r.completedAt.toDate() : new Date(r.completedAt);
      return completedDate >= today && r.status === 'completed';
    }).length;

    // Calculate average completion time
    const completedRequests = allRequests.filter(r => r.completedAt && r.assignedAt);
    let avgCompletionTime = 0;
    
    if (completedRequests.length > 0) {
      const totalTime = completedRequests.reduce((sum, r) => {
        const assigned = r.assignedAt!.toDate ? r.assignedAt!.toDate() : new Date(r.assignedAt!);
        const completed = r.completedAt!.toDate ? r.completedAt!.toDate() : new Date(r.completedAt!);
        return sum + (completed.getTime() - assigned.getTime());
      }, 0);
      avgCompletionTime = totalTime / completedRequests.length / (1000 * 60 * 60); // Convert to hours
    }

    return {
      designerId,
      designerName: designer?.displayName || 'Unknown',
      activeRequests: activeCount,
      completedToday,
      averageCompletionTime: Math.round(avgCompletionTime * 10) / 10
    };
  }

  /**
   * Get all designers with their workload
   */
  async getAllDesignersWorkload(): Promise<DesignerWorkload[]> {
    const allUsers = await this.userRepo.findAll();
    const designers = allUsers.filter(u => 
      u.role === 'designer' || u.role === 'business_owner'
    );

    const workloads = await Promise.all(
      designers.map(d => this.getDesignerWorkload(d.id))
    );

    return workloads.sort((a, b) => a.activeRequests - b.activeRequests);
  }
}

