import { Timestamp } from 'firebase/firestore';

/**
 * Customization Request Status
 * - pending_designer_review: Customer submitted, waiting for designer
 * - in_progress: Designer is working on it
 * - awaiting_customer_approval: Designer uploaded final design, customer needs to review
 * - approved: Customer approved, ready for order processing
 * - rejected: Customer rejected, needs revision
 * - in_production: Being printed by shop
 * - ready_for_pickup: Production complete, ready for delivery
 * - completed: Order fulfilled
 * - cancelled: Request cancelled
 */
export type CustomizationStatus = 
  | 'pending_designer_review'
  | 'in_progress'
  | 'awaiting_customer_approval'
  | 'approved'
  | 'rejected'
  | 'in_production'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';

/**
 * Production Status
 */
export type ProductionStatus = 
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'quality_check'
  | 'completed';

/**
 * Production Details
 */
export interface ProductionDetails {
  status: ProductionStatus;
  confirmedAt?: Timestamp;
  startedAt?: Timestamp;
  estimatedCompletionDate?: Timestamp;
  actualCompletionDate?: Timestamp;
  materials?: string;
  notes?: string;
  qualityCheckPassed?: boolean;
  qualityCheckNotes?: string;
}

/**
 * File types for customization
 */
export interface CustomizationFile {
  url: string;
  path: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: Timestamp;
}

/**
 * Payment Type for Customization
 */
export type PaymentType = 'upfront' | 'half_payment' | 'milestone';

/**
 * Payment Status
 */
export type PaymentStatus = 'pending' | 'partially_paid' | 'fully_paid' | 'refunded';

/**
 * Payment Details
 */
export interface PaymentDetails {
  paymentType: PaymentType;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  currency: string;
  
  // Payment breakdown for milestone
  milestones?: Array<{
    id: string;
    description: string;
    amount: number;
    isPaid: boolean;
    paidAt?: Timestamp;
    paymentId?: string;
  }>;
  
  // Payment history
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    status: 'pending' | 'success' | 'failed';
    paidAt: Timestamp;
    transactionId?: string;
    invoiceUrl?: string;
  }>;
}

/**
 * Pricing Agreement
 */
export interface PricingAgreement {
  designFee: number;
  productCost: number;
  printingCost: number;
  totalCost: number;
  agreedAt: Timestamp;
  agreedByCustomer: boolean;
  agreedByDesigner: boolean;
}

/**
 * Customization Request
 */
export interface CustomizationRequest {
  id: string;
  
  // Customer Info
  customerId: string;
  customerName: string;
  customerEmail: string;
  
  // Product Info
  productId: string;
  productName: string;
  productImage?: string;
  
  // Design Files
  customerDesignFile?: CustomizationFile; // Original customer upload
  customerPreviewImage?: CustomizationFile; // System-generated preview
  
  // Designer Work
  designerId?: string; // Assigned designer
  designerName?: string;
  designerFinalFile?: CustomizationFile; // Final design from designer
  designerPreviewImage?: CustomizationFile; // Final preview from designer
  
  // Request Details
  customizationNotes: string; // Customer instructions
  designerNotes?: string; // Designer notes/comments
  rejectionReason?: string; // If customer rejects
  
  // Payment & Pricing
  pricingAgreement?: PricingAgreement;
  paymentDetails?: PaymentDetails;
  
  // Printing Shop Selection
  printingShopId?: string;
  printingShopName?: string;
  
  // Production
  productionDetails?: ProductionDetails;
  
  // Status & Timeline
  status: CustomizationStatus;
  requestedAt: Timestamp;
  assignedAt?: Timestamp;
  completedAt?: Timestamp;
  approvedAt?: Timestamp;
  
  // Order Integration
  orderId?: string; // Created after approval
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Create Customization Request DTO
 */
export interface CreateCustomizationRequest {
  customerId: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  productName: string;
  productImage?: string;
  customizationNotes: string;
  customerDesignFile?: CustomizationFile;
  customerPreviewImage?: CustomizationFile;
}

/**
 * Update Customization Request DTO
 */
export interface UpdateCustomizationRequest {
  status?: CustomizationStatus;
  designerId?: string;
  designerName?: string;
  designerFinalFile?: CustomizationFile;
  designerPreviewImage?: CustomizationFile;
  designerNotes?: string;
  rejectionReason?: string;
  orderId?: string;
}

/**
 * Customization Request Filters
 */
export interface CustomizationFilters {
  customerId?: string;
  designerId?: string;
  productId?: string;
  status?: CustomizationStatus | CustomizationStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'requestedAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Customization Request with populated data
 */
export interface CustomizationRequestWithDetails extends CustomizationRequest {
  customer?: {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
  };
  designer?: {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    portfolioUrl?: string;
  };
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
}

/**
 * Customization Statistics
 */
export interface CustomizationStats {
  totalRequests: number;
  pendingReview: number;
  inProgress: number;
  awaitingApproval: number;
  approved: number;
  rejected: number;
  completed: number;
  cancelled: number;
}

/**
 * Designer Workload
 */
export interface DesignerWorkload {
  designerId: string;
  designerName: string;
  activeRequests: number;
  completedToday: number;
  averageCompletionTime: number; // in hours
  rating?: number;
}

