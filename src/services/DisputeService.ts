import { DisputeRepository } from '@/repositories/DisputeRepository';
import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { OrderRepository } from '@/repositories/OrderRepository';
import { MessagingService } from './MessagingService';
import { EscrowService } from './EscrowService';
import { FirebaseAdminService } from './firebase-admin';
import { Collections } from './firebase';
import { AppError } from '@/errors/AppError';
import { Timestamp } from 'firebase-admin/firestore';
import { eventBus } from '@/events/EventBus';
import {
  Dispute,
  CreateDisputeData,
  UpdateDisputeData,
  DisputeResolutionData,
  DisputeWithDetails,
  DisputeCategory,
  DisputeStage,
  DisputeStatus,
  PartialRefundOffer,
  EvidenceFile
} from '@/types/dispute';
import { CustomizationStatus } from '@/types/customization';
import { Order } from '@/types/firebase';
import { SupabaseStorageService } from '@/lib/supabase-storage';
import { StorageBuckets } from '@/lib/supabase-storage';

const DISPUTE_FILING_DEADLINE_DAYS = parseInt(process.env.DISPUTE_FILING_DEADLINE_DAYS || '5');
const DISPUTE_NEGOTIATION_DEADLINE_HOURS = parseInt(process.env.DISPUTE_NEGOTIATION_DEADLINE_HOURS || '48');

export class DisputeService {
  private disputeRepo: DisputeRepository;
  private customizationRepo: CustomizationRepository;
  private orderRepo: OrderRepository;
  private messagingService: MessagingService;
  private escrowService: EscrowService;

  constructor() {
    this.disputeRepo = new DisputeRepository();
    this.customizationRepo = new CustomizationRepository();
    this.orderRepo = new OrderRepository();
    this.messagingService = new MessagingService();
    this.escrowService = new EscrowService();
  }

  /**
   * Check if user can file a dispute for an order or customization request
   */
  async canFileDispute(
    orderId?: string,
    customizationRequestId?: string,
    userId?: string
  ): Promise<{ canFile: boolean; reason?: string }> {
    try {
      if (!userId) {
        return { canFile: false, reason: 'User ID is required' };
      }

      // Check if dispute already exists
      const existingDispute = await this.disputeRepo.findActiveDispute(orderId, customizationRequestId);
      if (existingDispute) {
        return { canFile: false, reason: 'An active dispute already exists for this transaction' };
      }

      // Check order-based dispute
      if (orderId) {
        const order = await this.orderRepo.findById(orderId);
        if (!order) {
          return { canFile: false, reason: 'Order not found' };
        }

        if (order.customerId !== userId) {
          return { canFile: false, reason: 'You can only file disputes for your own orders' };
        }

        // Check if order status allows dispute (shipped or delivered)
        if (order.status !== 'shipped' && order.status !== 'delivered') {
          return { canFile: false, reason: `Disputes can only be filed for shipped or delivered orders. Current status: ${order.status}` };
        }

        // Check filing deadline (5 days from status change)
        const statusHistory = order.statusHistory || [];
        const shippedStatus = statusHistory.find(s => s.status === 'shipped' || s.status === 'delivered');
        if (shippedStatus) {
          const statusChangeTime = shippedStatus.timestamp.toDate ? shippedStatus.timestamp.toDate() : new Date(shippedStatus.timestamp);
          const daysSinceStatusChange = (Date.now() - statusChangeTime.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceStatusChange > DISPUTE_FILING_DEADLINE_DAYS) {
            return { canFile: false, reason: `Dispute filing deadline has passed. You have ${DISPUTE_FILING_DEADLINE_DAYS} days from shipment/delivery to file a dispute.` };
          }
        }
      }

      // Check customization-based dispute
      if (customizationRequestId) {
        const request = await this.customizationRepo.findById(customizationRequestId);
        if (!request) {
          return { canFile: false, reason: 'Customization request not found' };
        }

        if (request.customerId !== userId) {
          return { canFile: false, reason: 'You can only file disputes for your own customization requests' };
        }

        // Check if status allows dispute (in_progress or awaiting_customer_approval)
        const allowedStatuses: CustomizationStatus[] = ['in_progress', 'awaiting_customer_approval'];
        if (!allowedStatuses.includes(request.status)) {
          return { canFile: false, reason: `Disputes can only be filed when status is 'in_progress' or 'awaiting_customer_approval'. Current status: ${request.status}` };
        }

        // Check filing deadline (5 days from status change)
        const statusChangeTime = request.assignedAt?.toDate ? request.assignedAt.toDate() : 
                                 request.requestedAt?.toDate ? request.requestedAt.toDate() : 
                                 new Date();
        const daysSinceStatusChange = (Date.now() - statusChangeTime.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceStatusChange > DISPUTE_FILING_DEADLINE_DAYS) {
          return { canFile: false, reason: `Dispute filing deadline has passed. You have ${DISPUTE_FILING_DEADLINE_DAYS} days from assignment to file a dispute.` };
        }
      }

      return { canFile: true };
    } catch (error: any) {
      console.error('[DisputeService] Error checking dispute eligibility:', error);
      return { canFile: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * File a new dispute
   */
  async fileDispute(data: CreateDisputeData): Promise<Dispute> {
    try {
      console.log('[DisputeService] Filing dispute:', data);

      // Validate eligibility
      const eligibility = await this.canFileDispute(data.orderId, data.customizationRequestId, data.filedBy);
      if (!eligibility.canFile) {
        throw AppError.badRequest(eligibility.reason || 'Cannot file dispute');
      }

      // Determine accused party
      let accusedParty: string;
      if (data.orderId) {
        const order = await this.orderRepo.findById(data.orderId);
        if (!order) {
          throw AppError.notFound('Order not found');
        }
        accusedParty = order.businessOwnerId;
      } else if (data.customizationRequestId) {
        const request = await this.customizationRepo.findById(data.customizationRequestId);
        if (!request) {
          throw AppError.notFound('Customization request not found');
        }
        if (!request.designerId) {
          throw AppError.badRequest('No designer assigned to this customization request');
        }
        accusedParty = request.designerId;
      } else {
        throw AppError.badRequest('Either orderId or customizationRequestId is required');
      }

      // Upload evidence files
      const evidenceImages: EvidenceFile[] = [];
      if (data.evidenceImages && data.evidenceImages.length > 0) {
        if (data.evidenceImages.length > 5) {
          throw AppError.badRequest('Maximum 5 images allowed per dispute');
        }

        for (const file of data.evidenceImages) {
          // Validate file type
          if (!file.type.startsWith('image/') || !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            throw AppError.badRequest(`Invalid image type: ${file.type}. Only JPG, PNG, and WEBP are allowed.`);
          }

          // Validate file size (5MB)
          if (file.size > 5 * 1024 * 1024) {
            throw AppError.badRequest(`Image ${file.name} is too large. Maximum size is 5MB.`);
          }

          // Upload to Supabase
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const timestamp = Date.now();
          const fileExt = file.name.split('.').pop();
          const fileName = `evidence_${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const uploadResult = await SupabaseStorageService.uploadFileFromServer(
            buffer,
            fileName,
            file.type,
            {
              bucket: StorageBuckets.DESIGNS, // Using designs bucket for dispute evidence
              folder: `disputes/${data.filedBy}/images`,
              upsert: false
            }
          );

          evidenceImages.push({
            url: uploadResult.url,
            path: uploadResult.path,
            fileName: file.name,
            fileSize: uploadResult.size,
            contentType: uploadResult.contentType,
            uploadedAt: Timestamp.now() as any
          });
        }
      }

      // Upload video if provided
      let evidenceVideo: EvidenceFile | undefined;
      if (data.evidenceVideo) {
        // Validate file type
        if (!data.evidenceVideo.type.startsWith('video/')) {
          throw AppError.badRequest('Invalid video type. Only video files are allowed.');
        }

        // Validate file size (50MB)
        if (data.evidenceVideo.size > 50 * 1024 * 1024) {
          throw AppError.badRequest('Video is too large. Maximum size is 50MB.');
        }

        // TODO: Validate video duration (30-60 seconds) - requires video processing library

        // Upload to Supabase
        const arrayBuffer = await data.evidenceVideo.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const timestamp = Date.now();
        const fileExt = data.evidenceVideo.name.split('.').pop();
        const fileName = `evidence_video_${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const uploadResult = await SupabaseStorageService.uploadFileFromServer(
          buffer,
          fileName,
          data.evidenceVideo.type,
          {
            bucket: StorageBuckets.DESIGNS,
            folder: `disputes/${data.filedBy}/videos`,
            upsert: false
          }
        );

        evidenceVideo = {
          url: uploadResult.url,
          path: uploadResult.path,
          fileName: data.evidenceVideo.name,
          fileSize: uploadResult.size,
          contentType: uploadResult.contentType,
          uploadedAt: Timestamp.now() as any
        };
      }

      // Create dispute conversation
      const conversation = await this.messagingService.createDisputeConversation(
        data.filedBy,
        accusedParty,
        data.orderId,
        data.customizationRequestId
      );

      // Set deadlines
      const now = Timestamp.now();
      const negotiationDeadline = new Date(now.toMillis() + (DISPUTE_NEGOTIATION_DEADLINE_HOURS * 60 * 60 * 1000));
      const deadline = new Date(now.toMillis() + (DISPUTE_FILING_DEADLINE_DAYS * 24 * 60 * 60 * 1000));

      // Create dispute record
      const disputeData: Omit<Dispute, 'id'> = {
        orderId: data.orderId,
        customizationRequestId: data.customizationRequestId,
        filedBy: data.filedBy,
        accusedParty: accusedParty,
        stage: 'negotiation',
        category: data.category,
        description: data.description,
        evidenceImages,
        evidenceVideo,
        status: 'open',
        conversationId: conversation.id,
        negotiationDeadline: Timestamp.fromDate(negotiationDeadline) as any,
        deadline: Timestamp.fromDate(deadline) as any,
        createdAt: now as any,
        updatedAt: now as any
      };

      const dispute = await this.disputeRepo.create(disputeData);

      // Freeze escrow if customization request (only if payment details exist)
      if (data.customizationRequestId) {
        try {
          await this.escrowService.freezeEscrow(data.customizationRequestId, dispute.id);
        } catch (error: any) {
          console.error('[DisputeService] Failed to freeze escrow:', error);
          // Continue even if escrow freeze fails - dispute is still created
          // This is normal for design phase disputes before payment is made
        }
      }

      // Emit event for notifications
      await eventBus.emit('dispute.filed', {
        disputeId: dispute.id,
        filedBy: data.filedBy,
        accusedParty: accusedParty,
        orderId: data.orderId,
        customizationRequestId: data.customizationRequestId,
        category: data.category
      });

      console.log('[DisputeService] Dispute filed successfully:', dispute.id);
      return dispute;
    } catch (error: any) {
      console.error('[DisputeService] Failed to file dispute:', error);
      if (error instanceof AppError || error.name === 'AppError') {
        throw error;
      }
      throw AppError.internal('Failed to file dispute', error);
    }
  }

  /**
   * Get dispute with full details
   */
  async getDisputeWithDetails(disputeId: string): Promise<DisputeWithDetails | null> {
    try {
      const dispute = await this.disputeRepo.findById(disputeId);
      if (!dispute) {
        return null;
      }

      // Fetch related entities
      const [order, customizationRequest, filer, accused, conversation] = await Promise.all([
        dispute.orderId ? this.orderRepo.findById(dispute.orderId) : null,
        dispute.customizationRequestId ? this.customizationRepo.findById(dispute.customizationRequestId) : null,
        FirebaseAdminService.getDocument(Collections.USERS, dispute.filedBy),
        FirebaseAdminService.getDocument(Collections.USERS, dispute.accusedParty),
        FirebaseAdminService.getDocument(Collections.CONVERSATIONS, dispute.conversationId)
      ]);

      return {
        ...dispute,
        order: order || undefined,
        customizationRequest: customizationRequest || undefined,
        filer: filer || undefined,
        accused: accused || undefined,
        conversation: conversation || undefined
      };
    } catch (error: any) {
      console.error('[DisputeService] Error getting dispute details:', error);
      if (error instanceof AppError || error.name === 'AppError') {
        throw error;
      }
      throw AppError.internal('Failed to get dispute details', error);
    }
  }

  /**
   * Accept dispute (accused party accepts and offers full refund)
   */
  async acceptDispute(disputeId: string, userId: string): Promise<Dispute> {
    try {
      const dispute = await this.disputeRepo.findById(disputeId);
      if (!dispute) {
        throw AppError.notFound('Dispute not found');
      }

      if (dispute.accusedParty !== userId) {
        throw AppError.forbidden('Only the accused party can accept a dispute');
      }

      if (dispute.status !== 'open' || dispute.stage !== 'negotiation') {
        throw AppError.badRequest('Dispute is not in negotiation stage');
      }

      // Process full refund if customization request
      if (dispute.customizationRequestId) {
        try {
          const request = await this.customizationRepo.findById(dispute.customizationRequestId);
          if (request?.pricingAgreement) {
            await this.escrowService.refundEscrow(
              dispute.customizationRequestId,
              request.pricingAgreement.totalCost,
              `Full refund due to dispute acceptance: ${dispute.category}`
            );
          }
        } catch (error: any) {
          console.error('[DisputeService] Failed to process refund:', error);
          // Continue with dispute resolution even if refund fails
        }
      }

      // Update dispute
      const updatedDispute = await this.disputeRepo.update(disputeId, {
        stage: 'resolved',
        status: 'closed',
        resolutionOutcome: 'refunded',
        resolvedAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any
      });

      // Unfreeze escrow
      if (dispute.customizationRequestId) {
        try {
          await this.escrowService.unfreezeEscrow(dispute.customizationRequestId);
        } catch (error: any) {
          console.error('[DisputeService] Failed to unfreeze escrow:', error);
        }
      }

      // Emit event
      await eventBus.emit('dispute.accepted', {
        disputeId: dispute.id,
        acceptedBy: userId
      });

      return updatedDispute;
    } catch (error: any) {
      console.error('[DisputeService] Failed to accept dispute:', error);
      if (error instanceof AppError || error.name === 'AppError') {
        throw error;
      }
      throw AppError.internal('Failed to accept dispute', error);
    }
  }

  /**
   * Offer partial refund (accused party)
   */
  async offerPartialRefund(
    disputeId: string,
    userId: string,
    amount: number,
    percentage?: number
  ): Promise<Dispute> {
    try {
      const dispute = await this.disputeRepo.findById(disputeId);
      if (!dispute) {
        throw AppError.notFound('Dispute not found');
      }

      if (dispute.accusedParty !== userId) {
        throw AppError.forbidden('Only the accused party can offer partial refund');
      }

      if (dispute.status !== 'open' || dispute.stage !== 'negotiation') {
        throw AppError.badRequest('Dispute is not in negotiation stage');
      }

      // Validate amount
      let maxAmount = 0;
      if (dispute.customizationRequestId) {
        const request = await this.customizationRepo.findById(dispute.customizationRequestId);
        if (request?.pricingAgreement) {
          maxAmount = request.pricingAgreement.totalCost;
        }
      } else if (dispute.orderId) {
        const order = await this.orderRepo.findById(dispute.orderId);
        if (order) {
          maxAmount = order.totalAmount;
        }
      }

      if (amount > maxAmount) {
        throw AppError.badRequest(`Refund amount cannot exceed total order amount (${maxAmount})`);
      }

      // Create partial refund offer
      const offer: PartialRefundOffer = {
        amount,
        percentage,
        offeredBy: userId,
        offeredAt: Timestamp.now() as any,
        status: 'pending'
      };

      // Update dispute
      const updatedDispute = await this.disputeRepo.update(disputeId, {
        partialRefundOffer: offer as any,
        updatedAt: Timestamp.now() as any
      });

      // Emit event
      await eventBus.emit('dispute.partial_refund_offered', {
        disputeId: dispute.id,
        offeredBy: userId,
        amount,
        percentage
      });

      return updatedDispute;
    } catch (error: any) {
      console.error('[DisputeService] Failed to offer partial refund:', error);
      // If it's already an AppError, re-throw it as-is to preserve status code
      if (error instanceof AppError || error.name === 'AppError') {
        throw error;
      }
      // Only convert non-AppError errors to internal errors
      throw AppError.internal('Failed to offer partial refund', error);
    }
  }

  /**
   * Accept partial refund offer (filer accepts the offer)
   */
  async acceptPartialRefund(disputeId: string, userId: string): Promise<Dispute> {
    try {
      const dispute = await this.disputeRepo.findById(disputeId);
      if (!dispute) {
        throw AppError.notFound('Dispute not found');
      }

      if (dispute.filedBy !== userId) {
        throw AppError.forbidden('Only the filer can accept a partial refund offer');
      }

      if (!dispute.partialRefundOffer || dispute.partialRefundOffer.status !== 'pending') {
        throw AppError.badRequest('No pending partial refund offer found');
      }

      // Process partial refund
      if (dispute.customizationRequestId) {
        try {
          await this.escrowService.refundEscrow(
            dispute.customizationRequestId,
            dispute.partialRefundOffer.amount,
            `Partial refund due to dispute resolution: ${dispute.category}`
          );
        } catch (error: any) {
          console.error('[DisputeService] Failed to process partial refund:', error);
        }
      }

      // Update offer status and dispute
      const updatedOffer: PartialRefundOffer = {
        ...dispute.partialRefundOffer,
        status: 'accepted',
        acceptedAt: Timestamp.now() as any
      };

      const updatedDispute = await this.disputeRepo.update(disputeId, {
        partialRefundOffer: updatedOffer as any,
        stage: 'resolved',
        status: 'closed',
        resolutionOutcome: 'partial_refund',
        resolvedAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any
      });

      // Unfreeze escrow and release remaining funds
      if (dispute.customizationRequestId) {
        try {
          await this.escrowService.unfreezeEscrow(dispute.customizationRequestId);
        } catch (error: any) {
          console.error('[DisputeService] Failed to unfreeze escrow:', error);
        }
      }

      // Emit event
      await eventBus.emit('dispute.partial_refund_accepted', {
        disputeId: dispute.id,
        acceptedBy: userId,
        amount: dispute.partialRefundOffer.amount
      });

      return updatedDispute;
    } catch (error: any) {
      console.error('[DisputeService] Failed to accept partial refund:', error);
      if (error instanceof AppError || error.name === 'AppError') {
        throw error;
      }
      throw AppError.internal('Failed to accept partial refund', error);
    }
  }

  /**
   * Reject partial refund offer (filer rejects the offer)
   */
  async rejectPartialRefund(disputeId: string, userId: string): Promise<Dispute> {
    try {
      const dispute = await this.disputeRepo.findById(disputeId);
      if (!dispute) {
        throw AppError.notFound('Dispute not found');
      }

      if (dispute.filedBy !== userId) {
        throw AppError.forbidden('Only the filer can reject a partial refund offer');
      }

      if (!dispute.partialRefundOffer || dispute.partialRefundOffer.status !== 'pending') {
        throw AppError.badRequest('No pending partial refund offer found');
      }

      // Update offer status
      const updatedOffer: PartialRefundOffer = {
        ...dispute.partialRefundOffer,
        status: 'rejected',
        rejectedAt: Timestamp.now() as any
      };

      const updatedDispute = await this.disputeRepo.update(disputeId, {
        partialRefundOffer: updatedOffer as any,
        updatedAt: Timestamp.now() as any
      });

      // Emit event
      await eventBus.emit('dispute.partial_refund_rejected', {
        disputeId: dispute.id,
        rejectedBy: userId
      });

      return updatedDispute;
    } catch (error: any) {
      console.error('[DisputeService] Failed to reject partial refund:', error);
      if (error instanceof AppError || error.name === 'AppError') {
        throw error;
      }
      throw AppError.internal('Failed to reject partial refund', error);
    }
  }

  /**
   * Cancel dispute (filer cancels)
   */
  async cancelDispute(disputeId: string, userId: string): Promise<Dispute> {
    try {
      const dispute = await this.disputeRepo.findById(disputeId);
      if (!dispute) {
        throw AppError.notFound('Dispute not found');
      }

      if (dispute.filedBy !== userId) {
        throw AppError.forbidden('Only the filer can cancel a dispute');
      }

      if (dispute.status !== 'open') {
        throw AppError.badRequest('Only open disputes can be cancelled');
      }

      // Update dispute status
      const updatedDispute = await this.disputeRepo.update(disputeId, {
        status: 'closed',
        stage: 'resolved',
        resolutionOutcome: 'dismissed',
        resolvedAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any
      });

      // Unfreeze escrow
      if (dispute.customizationRequestId) {
        try {
          await this.escrowService.unfreezeEscrow(dispute.customizationRequestId);
        } catch (error: any) {
          console.error('[DisputeService] Failed to unfreeze escrow:', error);
        }
      }

      // Emit event
      await eventBus.emit('dispute.cancelled', {
        disputeId: dispute.id,
        cancelledBy: userId
      });

      return updatedDispute;
    } catch (error: any) {
      console.error('[DisputeService] Failed to cancel dispute:', error);
      if (error instanceof AppError || error.name === 'AppError') {
        throw error;
      }
      throw AppError.internal('Failed to cancel dispute', error);
    }
  }

  /**
   * Check negotiation deadline and auto-escalate if expired
   */
  async checkNegotiationDeadline(disputeId: string): Promise<void> {
    try {
      const dispute = await this.disputeRepo.findById(disputeId);
      if (!dispute) {
        return;
      }

      if (dispute.stage !== 'negotiation' || dispute.status !== 'open') {
        return;
      }

      const deadline = dispute.negotiationDeadline.toDate ? dispute.negotiationDeadline.toDate() : new Date(dispute.negotiationDeadline);
      if (Date.now() > deadline.getTime()) {
        // Auto-escalate to admin review
        await this.disputeRepo.update(disputeId, {
          stage: 'admin_review',
          updatedAt: Timestamp.now() as any
        });

        // Emit event
        await eventBus.emit('dispute.escalated', {
          disputeId: dispute.id,
          reason: 'Negotiation deadline expired'
        });
      }
    } catch (error: any) {
      console.error('[DisputeService] Error checking negotiation deadline:', error);
    }
  }

  /**
   * Admin resolves dispute
   */
  async resolveDispute(
    disputeId: string,
    resolution: DisputeResolutionData,
    adminId: string
  ): Promise<Dispute> {
    try {
      const dispute = await this.disputeRepo.findById(disputeId);
      if (!dispute) {
        throw AppError.notFound('Dispute not found');
      }

      if (dispute.status !== 'open') {
        throw AppError.badRequest('Dispute is already resolved');
      }

      // Process resolution based on outcome
      if (resolution.outcome === 'refunded') {
        // Full refund
        if (dispute.customizationRequestId) {
          try {
            const request = await this.customizationRepo.findById(dispute.customizationRequestId);
            if (request?.pricingAgreement) {
              await this.escrowService.refundEscrow(
                dispute.customizationRequestId,
                request.pricingAgreement.totalCost,
                resolution.reason
              );
            }
          } catch (error: any) {
            console.error('[DisputeService] Failed to process refund:', error);
          }
        }
      } else if (resolution.outcome === 'partial_refund') {
        // Partial refund
        if (!resolution.partialRefundAmount) {
          throw AppError.badRequest('Partial refund amount is required');
        }
        if (dispute.customizationRequestId) {
          try {
            await this.escrowService.refundEscrow(
              dispute.customizationRequestId,
              resolution.partialRefundAmount,
              resolution.reason
            );
          } catch (error: any) {
            console.error('[DisputeService] Failed to process partial refund:', error);
          }
        }
      } else if (resolution.outcome === 'released') {
        // Release funds normally (dispute dismissed)
        if (dispute.customizationRequestId) {
          try {
            await this.escrowService.unfreezeEscrow(dispute.customizationRequestId);
          } catch (error: any) {
            console.error('[DisputeService] Failed to unfreeze escrow:', error);
          }
        }
      } else if (resolution.outcome === 'dismissed') {
        // Dismiss dispute, unfreeze escrow
        if (dispute.customizationRequestId) {
          try {
            await this.escrowService.unfreezeEscrow(dispute.customizationRequestId);
          } catch (error: any) {
            console.error('[DisputeService] Failed to unfreeze escrow:', error);
          }
        }
      }

      // Update dispute
      const updateData: UpdateDisputeData = {
        stage: 'resolved',
        status: 'closed',
        resolutionOutcome: resolution.outcome,
        resolutionReason: resolution.reason,
        resolvedBy: adminId,
        resolvedAt: Timestamp.now() as any,
        adminNotes: resolution.adminNotes,
        strikeIssued: resolution.issueStrike
      };

      const updatedDispute = await this.disputeRepo.update(disputeId, updateData);

      // Issue strike if requested
      if (resolution.issueStrike) {
        try {
          const { StrikeService } = await import('./StrikeService');
          const strikeService = new StrikeService();
          await strikeService.issueStrike(dispute.accusedParty, disputeId, resolution.reason);
        } catch (error: any) {
          console.error('[DisputeService] Failed to issue strike:', error);
        }
      }

      // Emit event
      await eventBus.emit('dispute.resolved', {
        disputeId: dispute.id,
        resolvedBy: adminId,
        outcome: resolution.outcome,
        reason: resolution.reason
      });

      return updatedDispute;
    } catch (error: any) {
      console.error('[DisputeService] Failed to resolve dispute:', error);
      if (error instanceof AppError || error.name === 'AppError') {
        throw error;
      }
      throw AppError.internal('Failed to resolve dispute', error);
    }
  }
}






