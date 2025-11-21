import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { XenditService } from './XenditService';
import { FirebaseAdminService } from './firebase-admin';
import { Collections } from './firebase';
import { AppError } from '@/errors/AppError';
import { Timestamp } from 'firebase-admin/firestore';
import { eventBus } from '@/events/EventBus';

/**
 * EscrowService handles payment escrow and disbursements
 * for the design collaboration workflow
 */
export class EscrowService {
  private customizationRepo: CustomizationRepository;
  private xenditService: XenditService;

  constructor() {
    this.customizationRepo = new CustomizationRepository();
    this.xenditService = new XenditService();
  }

  /**
   * Release design fee to designer when design is approved
   */
  async releaseDesignerPayment(requestId: string): Promise<void> {
    try {
      console.log(`[EscrowService] Releasing designer payment for request: ${requestId}`);

      // 1. Get customization request
      const request = await this.customizationRepo.findById(requestId);
      if (!request) {
        throw AppError.notFound('Customization request not found');
      }

      // 2. Validate escrow status
      if (!request.paymentDetails) {
        throw AppError.badRequest('No payment details found for this request');
      }

      // Allow release if status is 'held' OR if it's already been attempted but failed
      // (in case we need to retry)
      if (request.paymentDetails.escrowStatus !== 'held' && request.paymentDetails.escrowStatus !== 'designer_paid') {
        // If already paid, just return success
        if (request.paymentDetails.escrowStatus === 'designer_paid' && request.paymentDetails.designerPayoutAmount) {
          console.log(`[EscrowService] Designer payment already released for ${requestId}`);
          return;
        }
        throw AppError.badRequest(
          `Cannot release designer payment. Current escrow status: ${request.paymentDetails.escrowStatus}`
        );
      }

      // 3. Validate pricing agreement
      if (!request.pricingAgreement) {
        throw AppError.badRequest('No pricing agreement found. Cannot process payout.');
      }

      const designerPayoutAmount = request.pricingAgreement.designFee;

      if (designerPayoutAmount <= 0) {
        throw AppError.badRequest('Invalid designer fee amount');
      }

      // 4. Get designer profile for payout details
      if (!request.designerId) {
        throw AppError.badRequest('No designer assigned to this request');
      }

      const designerProfile = await FirebaseAdminService.getDocument(
        Collections.DESIGNER_PROFILES,
        request.designerId
      );

      if (!designerProfile) {
        throw AppError.notFound('Designer profile not found');
      }

      // 5. Get designer payout information
      // NOTE: Designer profiles need to have payout info fields added:
      // payoutDetails: { bankCode, accountNumber, accountHolderName }
      const payoutInfo = (designerProfile as any).payoutDetails;

      if (!payoutInfo || !payoutInfo.bankCode || !payoutInfo.accountNumber || !payoutInfo.accountHolderName) {
        throw AppError.badRequest(
          'Designer payout information is incomplete. Please update profile with bank details.'
        );
      }

      // 6. Create Xendit disbursement
      console.log(`[EscrowService] Creating disbursement for designer: ${request.designerId}`);
      
      const disbursement = await this.xenditService.createDisbursement({
        externalId: `designer-payout-${requestId}-${Date.now()}`,
        amount: designerPayoutAmount,
        bankCode: payoutInfo.bankCode,
        accountHolderName: payoutInfo.accountHolderName,
        accountNumber: payoutInfo.accountNumber,
        description: `Design fee payment for customization request #${requestId}`,
        emailTo: [request.designerName || designerProfile.businessName].filter(Boolean),
      });

      console.log(`[EscrowService] Disbursement created: ${disbursement.id}`);

      // 7. Update escrow status
      await this.customizationRepo.update(requestId, {
        paymentDetails: {
          ...request.paymentDetails,
          escrowStatus: 'designer_paid',
          designerPayoutId: disbursement.id,
          designerPaidAt: Timestamp.now() as any,
          designerPayoutAmount: designerPayoutAmount,
        } as any,
        updatedAt: Timestamp.now() as any,
      });

      // 8. Fire event
      eventBus.emit('escrow.designer.paid', {
        requestId,
        designerId: request.designerId,
        amount: designerPayoutAmount,
        disbursementId: disbursement.id,
      });

      console.log(`[EscrowService] Designer payment released successfully`);
    } catch (error: any) {
      console.error(`[EscrowService] Failed to release designer payment:`, error);
      throw AppError.internal('Failed to release designer payment', error);
    }
  }

  /**
   * Release product + printing fee to shop owner when order is completed
   */
  async releaseShopPayment(requestId: string): Promise<void> {
    try {
      console.log(`[EscrowService] Releasing shop payment for request: ${requestId}`);

      // 1. Get customization request
      const request = await this.customizationRepo.findById(requestId);
      if (!request) {
        throw AppError.notFound('Customization request not found');
      }

      // 2. Validate order status (must be shipped or delivered)
      if (!request.orderId) {
        throw AppError.badRequest('No order associated with this customization request');
      }

      const order = await FirebaseAdminService.getDocument(Collections.ORDERS, request.orderId);
      if (!order) {
        throw AppError.notFound('Order not found');
      }

      if (order.status !== 'shipped' && order.status !== 'delivered') {
        throw AppError.badRequest(
          `Order must be shipped or delivered before releasing shop payment. Current status: ${order.status}`
        );
      }

      console.log(`[EscrowService] Order status validated: ${order.status}`);

      // 3. Validate escrow status
      if (!request.paymentDetails) {
        throw AppError.badRequest('No payment details found for this request');
      }

      if (request.paymentDetails.escrowStatus === 'fully_released') {
        throw AppError.badRequest('Shop payment has already been released');
      }

      if (request.paymentDetails.escrowStatus !== 'designer_paid') {
        throw AppError.badRequest(
          `Cannot release shop payment. Designer must be paid first. Current status: ${request.paymentDetails.escrowStatus}`
        );
      }

      // 4. Validate pricing agreement
      if (!request.pricingAgreement) {
        throw AppError.badRequest('No pricing agreement found. Cannot process payout.');
      }

      // Shop gets: product cost + printing cost
      const shopPayoutAmount = request.pricingAgreement.productCost + request.pricingAgreement.printingCost;

      if (shopPayoutAmount <= 0) {
        throw AppError.badRequest('Invalid shop payout amount');
      }

      // 5. Get shop profile for payout details
      if (!request.printingShopId) {
        throw AppError.badRequest('No printing shop assigned to this request');
      }

      const shopProfile = await FirebaseAdminService.getDocument(
        Collections.SHOP_PROFILES,
        request.printingShopId
      );

      if (!shopProfile) {
        throw AppError.notFound('Shop profile not found');
      }

      // 6. Get shop payout information
      // NOTE: Shop profiles need to have payout info fields added:
      // payoutDetails: { bankCode, accountNumber, accountHolderName }
      const payoutInfo = (shopProfile as any).payoutDetails;

      if (!payoutInfo || !payoutInfo.bankCode || !payoutInfo.accountNumber || !payoutInfo.accountHolderName) {
        throw AppError.badRequest(
          'Shop payout information is incomplete. Please update profile with bank details.'
        );
      }

      // 7. Create Xendit disbursement
      console.log(`[EscrowService] Creating disbursement for shop: ${request.printingShopId}`);
      
      const disbursement = await this.xenditService.createDisbursement({
        externalId: `shop-payout-${requestId}-${Date.now()}`,
        amount: shopPayoutAmount,
        bankCode: payoutInfo.bankCode,
        accountHolderName: payoutInfo.accountHolderName,
        accountNumber: payoutInfo.accountNumber,
        description: `Production payment for customization request #${requestId}`,
        emailTo: [shopProfile.contactInfo?.email].filter(Boolean),
      });

      console.log(`[EscrowService] Disbursement created: ${disbursement.id}`);

      // 8. Update escrow status
      await this.customizationRepo.update(requestId, {
        paymentDetails: {
          ...request.paymentDetails,
          escrowStatus: 'fully_released',
          shopPayoutId: disbursement.id,
          shopPaidAt: Timestamp.now() as any,
          shopPayoutAmount: shopPayoutAmount,
        } as any,
        updatedAt: Timestamp.now() as any,
      });

      // 8. Fire event
      eventBus.emit('escrow.shop.paid', {
        requestId,
        shopId: request.printingShopId,
        amount: shopPayoutAmount,
        disbursementId: disbursement.id,
      });

      console.log(`[EscrowService] Shop payment released successfully`);
    } catch (error: any) {
      console.error(`[EscrowService] Failed to release shop payment:`, error);
      throw AppError.internal('Failed to release shop payment', error);
    }
  }

  /**
   * Check if designer payment can be released
   */
  async canReleaseDesignerPayment(requestId: string): Promise<boolean> {
    try {
      const request = await this.customizationRepo.findById(requestId);
      
      if (!request || !request.paymentDetails) {
        return false;
      }

      // Check if design is approved (either 'approved' or 'ready_for_production' status)
      const isApproved = request.status === 'approved' || request.status === 'ready_for_production';

      if (!(request.paymentDetails.escrowStatus === 'held' && isApproved && !!request.pricingAgreement && !!request.designerId)) {
        return false;
      }

      // Also check if designer has payout details configured
      try {
        const designerProfile = await FirebaseAdminService.getDocument(
          Collections.DESIGNER_PROFILES,
          request.designerId
        );

        if (!designerProfile) {
          return false;
        }

        const payoutInfo = (designerProfile as any).payoutDetails;
        if (!payoutInfo || !payoutInfo.bankCode || !payoutInfo.accountNumber || !payoutInfo.accountHolderName) {
          return false;
        }

        return true;
      } catch (error) {
        console.error('[EscrowService] Error checking designer payout details:', error);
        return false;
      }
    } catch (error) {
      console.error('Error checking designer payment eligibility:', error);
      return false;
    }
  }

  /**
   * Check if shop payment can be released
   */
  async canReleaseShopPayment(requestId: string): Promise<boolean> {
    try {
      const request = await this.customizationRepo.findById(requestId);
      
      if (!request || !request.paymentDetails) {
        return false;
      }

      return (
        request.paymentDetails.escrowStatus === 'designer_paid' &&
        request.status === 'completed' &&
        !!request.pricingAgreement &&
        !!request.printingShopId
      );
    } catch (error) {
      console.error('Error checking shop payment eligibility:', error);
      return false;
    }
  }

  /**
   * Get escrow status for a customization request
   */
  async getEscrowStatus(requestId: string): Promise<{
    escrowStatus: string;
    totalAmount: number;
    designerPaid: boolean;
    shopPaid: boolean;
    designerAmount?: number;
    shopAmount?: number;
  }> {
    const request = await this.customizationRepo.findById(requestId);
    
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    if (!request.paymentDetails) {
      throw AppError.badRequest('No payment details found');
    }

    return {
      escrowStatus: request.paymentDetails.escrowStatus,
      totalAmount: request.paymentDetails.totalAmount,
      designerPaid: request.paymentDetails.escrowStatus !== 'held',
      shopPaid: request.paymentDetails.escrowStatus === 'fully_released',
      designerAmount: request.paymentDetails.designerPayoutAmount,
      shopAmount: request.paymentDetails.shopPayoutAmount,
    };
  }
}

// Export singleton instance
export const escrowService = new EscrowService();




