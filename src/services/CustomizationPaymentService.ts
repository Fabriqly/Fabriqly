import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { XenditService } from './XenditService';
import { 
  CustomizationRequest, 
  PaymentType, 
  PaymentDetails,
  PricingAgreement 
} from '@/types/customization';
import { Timestamp } from 'firebase-admin/firestore';
import { eventBus } from '@/events/EventBus';
import { AppError } from '@/errors/AppError';

export interface CreatePricingData {
  designFee: number;
  productCost: number;
  printingCost: number;
  paymentType: PaymentType;
  milestones?: Array<{
    description: string;
    amount: number;
  }>;
}

export interface ProcessPaymentData {
  amount: number;
  paymentMethod: string;
  milestoneId?: string;
}

export class CustomizationPaymentService {
  private customizationRepo: CustomizationRepository;
  private xenditService: XenditService;

  constructor() {
    this.customizationRepo = new CustomizationRepository();
    this.xenditService = new XenditService();
  }

  /**
   * Create pricing agreement between customer and designer
   */
  async createPricingAgreement(
    requestId: string,
    pricingData: CreatePricingData,
    designerId: string
  ): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    if (request.designerId !== designerId) {
      throw AppError.forbidden('Only the assigned designer can create pricing');
    }

    // Allow pricing to be set during in_progress, awaiting_customer_approval, or awaiting_pricing (after rejection)
    if (!['in_progress', 'awaiting_customer_approval', 'awaiting_pricing'].includes(request.status)) {
      throw AppError.badRequest('Cannot set pricing at current status: ' + request.status);
    }

    const totalCost = pricingData.designFee + pricingData.productCost + pricingData.printingCost;

    const pricingAgreement: PricingAgreement = {
      designFee: pricingData.designFee,
      productCost: pricingData.productCost,
      printingCost: pricingData.printingCost,
      totalCost,
      agreedAt: Timestamp.now(),
      agreedByCustomer: false,
      agreedByDesigner: true
    };

    // Initialize payment details with escrow status
    const paymentDetails: PaymentDetails = {
      paymentType: pricingData.paymentType,
      totalAmount: totalCost,
      paidAmount: 0,
      remainingAmount: totalCost,
      paymentStatus: 'pending',
      currency: 'PHP',
      payments: [],
      // Escrow tracking - funds will be held until design approval and order completion
      escrowStatus: 'held',
      designerPayoutAmount: pricingData.designFee,
      shopPayoutAmount: pricingData.productCost + pricingData.printingCost
    };

    // Setup milestones if milestone payment
    if (pricingData.paymentType === 'milestone' && pricingData.milestones) {
      paymentDetails.milestones = pricingData.milestones.map((m, index) => ({
        id: `milestone-${index + 1}`,
        description: m.description,
        amount: m.amount,
        isPaid: false
      }));
    }

    // If status is awaiting_pricing (after rejection), change back to awaiting_customer_approval
    // so customer can review the new pricing
    const newStatus = request.status === 'awaiting_pricing' 
      ? 'awaiting_customer_approval' 
      : request.status;

    const updatedRequest = await this.customizationRepo.update(requestId, {
      pricingAgreement,
      paymentDetails,
      status: newStatus,
      updatedAt: Timestamp.now()
    });

    // Emit event
    await eventBus.emit('customization.pricing.created', {
      requestId,
      customerId: request.customerId,
      designerId,
      totalCost
    });

    return updatedRequest;
  }

  /**
   * Customer agrees to pricing
   */
  async agreeToPricing(
    requestId: string,
    customerId: string
  ): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    if (request.customerId !== customerId) {
      throw AppError.forbidden('Unauthorized');
    }

    if (!request.pricingAgreement) {
      throw AppError.badRequest('No pricing agreement to approve');
    }

    if (request.pricingAgreement.agreedByCustomer) {
      throw AppError.badRequest('Pricing already agreed to');
    }

    const updatedPricing = {
      ...request.pricingAgreement,
      agreedByCustomer: true,
      agreedAt: Timestamp.now()
    };

    const updatedRequest = await this.customizationRepo.update(requestId, {
      pricingAgreement: updatedPricing,
      updatedAt: Timestamp.now()
    });

    // Emit event
    await eventBus.emit('customization.pricing.agreed', {
      requestId,
      customerId,
      designerId: request.designerId
    });

    return updatedRequest;
  }

  /**
   * Process payment
   */
  async processPayment(
    requestId: string,
    customerId: string,
    paymentData: ProcessPaymentData
  ): Promise<CustomizationRequest> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    if (request.customerId !== customerId) {
      throw AppError.forbidden('Unauthorized');
    }

    if (!request.paymentDetails) {
      throw AppError.badRequest('No payment details found');
    }

    if (!request.pricingAgreement?.agreedByCustomer) {
      throw AppError.badRequest('Pricing must be agreed to before payment');
    }

    // Validate payment amount
    if (paymentData.amount > request.paymentDetails.remainingAmount) {
      throw AppError.badRequest('Payment amount exceeds remaining balance');
    }

    // For milestone payments, validate milestone
    if (request.paymentDetails.paymentType === 'milestone' && paymentData.milestoneId) {
      const milestone = request.paymentDetails.milestones?.find(m => m.id === paymentData.milestoneId);
      if (!milestone) {
        throw AppError.badRequest('Invalid milestone');
      }
      if (milestone.isPaid) {
        throw AppError.badRequest('Milestone already paid');
      }
      if (paymentData.amount !== milestone.amount) {
        throw AppError.badRequest('Payment amount must match milestone amount');
      }
    }

    // Create Xendit invoice
    try {
      const invoice = await this.xenditService.createInvoice({
        external_id: `customization-${requestId}-${Date.now()}`,
        amount: paymentData.amount,
        description: `Payment for customization request #${requestId}`,
        currency: 'PHP',
        customer: {
          given_names: request.customerName || 'Customer',
          surname: '',
          email: request.customerEmail,
        },
        items: [
          {
            name: `Customization - ${request.productName}`,
            quantity: 1,
            price: paymentData.amount
          }
        ],
        success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/my-customizations?payment=success`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/my-customizations?payment=failed`
      });

      console.log('Invoice response:', {
        id: invoice.id,
        invoice_url: invoice.invoice_url,
        status: invoice.status
      });

      // Update payment details - keep escrow status as 'held' since funds are now secured
      const existingPayments = request.paymentDetails?.payments || [];
      const updatedPaymentDetails = {
        ...request.paymentDetails,
        escrowStatus: 'held', // Funds are held in escrow
        payments: [
          ...existingPayments,
          {
            id: invoice.id,
            amount: paymentData.amount,
            paymentMethod: paymentData.paymentMethod,
            status: 'pending' as const,
            paidAt: Timestamp.now(),
            transactionId: invoice.id,
            ...(invoice.invoice_url && { invoiceUrl: invoice.invoice_url })
          }
        ]
      };

      const updatedRequest = await this.customizationRepo.update(requestId, {
        paymentDetails: updatedPaymentDetails,
        updatedAt: Timestamp.now()
      });

      // Attach invoice URL for easy access
      Object.assign(updatedRequest, { invoiceUrl: invoice.invoice_url });

      return updatedRequest;
    } catch (error) {
      console.error('Error creating payment invoice:', error);
      throw AppError.internal('Failed to process payment', error);
    }
  }

  /**
   * Handle payment webhook (called by Xendit)
   */
  async handlePaymentWebhook(
    invoiceId: string,
    status: 'PAID' | 'EXPIRED' | 'FAILED',
    paidAmount?: number
  ): Promise<void> {
    console.log('[CustomizationPayment] Processing webhook', {
      invoice_id: invoiceId,
      status,
      amount: paidAmount
    });

    // Find customization request by payment ID
    const allRequests = await this.customizationRepo.findAll();
    
    const request = allRequests.find(r => 
      r.paymentDetails?.payments.some(p => p.id === invoiceId)
    );

    if (!request || !request.paymentDetails) {
      console.error('[CustomizationPayment] Request not found for invoice:', invoiceId);
      return;
    }

    console.log('[CustomizationPayment] Found request:', request.id);

    // Update payment status
    const payments = request.paymentDetails.payments || [];
    const paymentIndex = payments.findIndex(p => p.id === invoiceId);
    if (paymentIndex === -1) return;

    // Check if payment already processed to prevent duplicate processing
    const existingPayment = payments[paymentIndex];
    if (existingPayment.status === 'success' && status === 'PAID') {
      console.log('[CustomizationPayment] Payment already processed, skipping duplicate webhook');
      return;
    }

    const updatedPayments = [...payments];
    updatedPayments[paymentIndex] = {
      ...updatedPayments[paymentIndex],
      status: status === 'PAID' ? 'success' : 'failed',
      paidAt: Timestamp.now()
    };

    const updatedPaymentDetails = {
      ...request.paymentDetails,
      payments: updatedPayments,
      // Keep escrowStatus as 'held' - will be updated when design is approved/order completed
      escrowStatus: request.paymentDetails.escrowStatus || 'held'
    };

    // If payment successful, update amounts (only if not already processed)
    if (status === 'PAID' && paidAmount) {
      const amountNumber = typeof paidAmount === 'number' ? paidAmount : parseFloat(String(paidAmount));
      updatedPaymentDetails.paidAmount = (updatedPaymentDetails.paidAmount || 0) + amountNumber;
      updatedPaymentDetails.remainingAmount = (updatedPaymentDetails.remainingAmount || 0) - amountNumber;

      // Update milestone if applicable
      const payment = payments[paymentIndex];
      if (request.paymentDetails.paymentType === 'milestone' && request.paymentDetails.milestones) {
        // Find matching milestone by amount
        const milestoneIndex = request.paymentDetails.milestones.findIndex(
          m => !m.isPaid && m.amount === amountNumber
        );

        if (milestoneIndex !== -1) {
          const updatedMilestones = [...request.paymentDetails.milestones];
          updatedMilestones[milestoneIndex] = {
            ...updatedMilestones[milestoneIndex],
            isPaid: true,
            paidAt: Timestamp.now(),
            paymentId: invoiceId
          };
          updatedPaymentDetails.milestones = updatedMilestones;
        }
      }

      // Update payment status
      if (updatedPaymentDetails.remainingAmount === 0) {
        updatedPaymentDetails.paymentStatus = 'fully_paid';
      } else if (updatedPaymentDetails.paidAmount > 0) {
        updatedPaymentDetails.paymentStatus = 'partially_paid';
      }
    }

    await this.customizationRepo.update(request.id, {
      paymentDetails: updatedPaymentDetails,
      updatedAt: Timestamp.now()
    });

    console.log('[CustomizationPayment] Updated successfully', {
      request_id: request.id,
      paid_amount: updatedPaymentDetails.paidAmount,
      remaining: updatedPaymentDetails.remainingAmount,
      status: updatedPaymentDetails.paymentStatus
    });

    // Emit event
    await eventBus.emit('customization.payment.updated', {
      requestId: request.id,
      customerId: request.customerId,
      designerId: request.designerId,
      status,
      amount: paidAmount
    });
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(requestId: string): Promise<{
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string;
    payments: unknown[];
  } | null> {
    const request = await this.customizationRepo.findById(requestId);
    if (!request || !request.paymentDetails) {
      return null;
    }

    return {
      totalAmount: request.paymentDetails.totalAmount,
      paidAmount: request.paymentDetails.paidAmount,
      remainingAmount: request.paymentDetails.remainingAmount,
      paymentStatus: request.paymentDetails.paymentStatus,
      payments: request.paymentDetails.payments
    };
  }
}



