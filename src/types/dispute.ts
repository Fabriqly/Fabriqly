import { Timestamp } from 'firebase/firestore';
import { BaseDocument } from './firebase';

/**
 * Dispute Categories
 * Design Phase: Customer vs Designer
 * Shipping Phase: Customer vs Shop
 */
export type DisputeCategory =
  // Design Phase
  | 'design_ghosting'
  | 'design_quality_mismatch'
  | 'design_copyright_infringement'
  // Shipping Phase
  | 'shipping_not_received'
  | 'shipping_damaged'
  | 'shipping_wrong_item'
  | 'shipping_print_quality'
  | 'shipping_late_delivery'
  | 'shipping_incomplete_order';

/**
 * Dispute Stage
 */
export type DisputeStage = 'negotiation' | 'admin_review' | 'resolved';

/**
 * Dispute Status
 */
export type DisputeStatus = 'open' | 'closed';

/**
 * Resolution Outcome
 */
export type ResolutionOutcome = 'refunded' | 'released' | 'dismissed' | 'partial_refund';

/**
 * Partial Refund Offer
 */
export interface PartialRefundOffer {
  amount: number;
  percentage?: number;
  offeredBy: string;
  offeredAt: Timestamp;
  status: 'pending' | 'accepted' | 'rejected';
  rejectedAt?: Timestamp;
  acceptedAt?: Timestamp;
}

/**
 * Evidence File
 */
export interface EvidenceFile {
  url: string;
  path: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: Timestamp;
}

/**
 * Dispute Interface
 */
export interface Dispute extends BaseDocument {
  // Transaction References
  orderId?: string;
  customizationRequestId?: string;
  
  // Parties
  filedBy: string; // User ID of person filing dispute
  accusedParty: string; // User ID of designer or shop owner
  
  // Dispute Details
  stage: DisputeStage;
  category: DisputeCategory;
  description: string;
  
  // Evidence
  evidenceImages: EvidenceFile[]; // Max 5 images, 5MB each
  evidenceVideo?: EvidenceFile; // Max 1 video, 50MB, 30-60 seconds
  
  // Status
  status: DisputeStatus;
  resolutionOutcome?: ResolutionOutcome;
  resolutionReason?: string;
  
  // Partial Refund
  partialRefundOffer?: PartialRefundOffer;
  
  // Escrow & Payment
  escrowTransactionId?: string; // Link to Xendit transaction
  previousEscrowStatus?: 'held' | 'designer_paid' | 'shop_paid' | 'fully_released';
  
  // Messaging
  conversationId: string; // Link to dedicated dispute conversation
  
  // Deadlines
  deadline: Timestamp; // Auto-escalation deadline
  negotiationDeadline: Timestamp; // 48 hours from filing
  
  // Admin
  adminNotes?: string;
  resolutionNotes?: string;
  resolvedBy?: string; // Admin ID
  resolvedAt?: Timestamp;
  
  // Strike System
  strikeIssued?: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Create Dispute Data DTO
 */
export interface CreateDisputeData {
  orderId?: string;
  customizationRequestId?: string;
  filedBy: string;
  category: DisputeCategory;
  description: string;
  evidenceImages?: File[];
  evidenceVideo?: File;
}

/**
 * Update Dispute Data DTO
 */
export interface UpdateDisputeData {
  stage?: DisputeStage;
  status?: DisputeStatus;
  partialRefundOffer?: PartialRefundOffer;
  adminNotes?: string;
  resolutionNotes?: string;
  resolutionOutcome?: ResolutionOutcome;
  resolutionReason?: string;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
  strikeIssued?: boolean;
}

/**
 * Dispute Resolution Data DTO
 */
export interface DisputeResolutionData {
  outcome: ResolutionOutcome;
  reason: string;
  partialRefundAmount?: number; // For partial_refund outcome
  issueStrike?: boolean;
  adminNotes?: string;
}

/**
 * Dispute Filters
 */
export interface DisputeFilters {
  filedBy?: string;
  accusedParty?: string;
  stage?: DisputeStage;
  status?: DisputeStatus;
  category?: DisputeCategory;
  orderId?: string;
  customizationRequestId?: string;
  resolutionOutcome?: ResolutionOutcome;
}

/**
 * Dispute With Details (includes related entities)
 */
export interface DisputeWithDetails extends Dispute {
  order?: any; // Order details if orderId exists
  customizationRequest?: any; // CustomizationRequest details if customizationRequestId exists
  filer?: any; // User who filed
  accused?: any; // User who is accused
  conversation?: any; // Conversation details
}

/**
 * Dispute Statistics
 */
export interface DisputeStats {
  total: number;
  open: number;
  closed: number;
  negotiation: number;
  adminReview: number;
  resolved: number;
  byCategory: Record<DisputeCategory, number>;
  byOutcome: Record<ResolutionOutcome, number>;
  averageResolutionTime: number; // in hours
  activeDisputeRate: number; // percentage
  atRiskAmount: number; // Total escrow funds frozen
}






