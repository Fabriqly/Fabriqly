import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { XenditService } from './XenditService';
import { 
  CustomizationRequest, 
  PaymentType, 
  PaymentDetails,
  PricingAgreement 
} from '@/types/customization';
import { Timestamp } from 'firebase/firestore';
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

    if (request.status !== 'in_progress') {
      throw AppError.badRequest('Request must be in progress to create pricing');
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

    // Initialize payment details
    const paymentDetails: PaymentDetails = {
      paymentType: pricingData.paymentType,
      totalAmount: totalCost,
      paidAmount: 0,
      remainingAmount: totalCost,
      paymentStatus: 'pending',
      currency: 'PHP',
      payments: []
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

    const updatedRequest = await this.customizationRepo.update(requestId, {
      pricingAgreement: pricingAgreement as any,
      paymentDetails: paymentDetails as any,
      updatedAt: Timestamp.now() as any
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
      pricingAgreement: updatedPricing as any,
      updatedAt: Timestamp.now() as any
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
        externalId: `customization-${requestId}-${Date.now()}`,
        amount: paymentData.amount,
        payerEmail: request.customerEmail,
        description: `Payment for customization request #${requestId}`,
        items: [
          {
            name: `Customization - ${request.productName}`,
            quantity: 1,
            price: paymentData.amount
          }
        ],
        successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/my-customizations?payment=success`,
        failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/my-customizations?payment=failed`
      });

      // Update payment details
      const updatedPaymentDetails = {
        ...request.paymentDetails,
        payments: [
          ...request.paymentDetails.payments,
          {
            id: invoice.id,
            amount: paymentData.amount,
            paymentMethod: paymentData.paymentMethod,
            status: 'pending' as const,
            paidAt: Timestamp.now(),
            transactionId: invoice.id,
            invoiceUrl: invoice.invoiceUrl
          }
        ]
      };

      const updatedRequest = await this.customizationRepo.update(requestId, {
        paymentDetails: updatedPaymentDetails as any,
        updatedAt: Timestamp.now() as any
      });

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
    // Find customization request by payment ID
    const allRequests = await this.customizationRepo.findAll();
    const request = allRequests.find(r => 
      r.paymentDetails?.payments.some(p => p.id === invoiceId)
    );

    if (!request || !request.paymentDetails) {
      console.error('Customization request not found for invoice:', invoiceId);
      return;
    }

    // Update payment status
    const paymentIndex = request.paymentDetails.payments.findIndex(p => p.id === invoiceId);
    if (paymentIndex === -1) return;

    const updatedPayments = [...request.paymentDetails.payments];
    updatedPayments[paymentIndex] = {
      ...updatedPayments[paymentIndex],
      status: status === 'PAID' ? 'success' : 'failed',
      paidAt: Timestamp.now()
    };

    let updatedPaymentDetails = {
      ...request.paymentDetails,
      payments: updatedPayments
    };

    // If payment successful, update amounts
    if (status === 'PAID' && paidAmount) {
      updatedPaymentDetails.paidAmount += paidAmount;
      updatedPaymentDetails.remainingAmount -= paidAmount;

      // Update milestone if applicable
      const payment = request.paymentDetails.payments[paymentIndex];
      if (request.paymentDetails.paymentType === 'milestone' && request.paymentDetails.milestones) {
        // Find matching milestone by amount
        const milestoneIndex = request.paymentDetails.milestones.findIndex(
          m => !m.isPaid && m.amount === paidAmount
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
      paymentDetails: updatedPaymentDetails as any,
      updatedAt: Timestamp.now() as any
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
    payments: any[];
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



