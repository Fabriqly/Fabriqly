import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { OrderService } from './OrderService';
import { CustomizationRequest } from '@/types/customization';
import { Timestamp } from 'firebase-admin/firestore';
import type { Address } from '@/types/firebase';
import { AppError } from '@/errors/AppError';
import { eventBus } from '@/events/EventBus';

export class CustomizationOrderService {
  private customizationRepo: CustomizationRepository;
  private orderService: OrderService;

  constructor(
    customizationRepo: CustomizationRepository,
    orderService: OrderService
  ) {
    this.customizationRepo = customizationRepo;
    this.orderService = orderService;
  }

  /**
   * Create order from approved customization request
   * Called after customer selects printing shop
   */
  async createOrderFromCustomization(
    requestId: string,
    customerId: string,
    shippingAddress: Address,
    paymentMethod: string = 'xendit'
  ): Promise<{ orderId: string; customizationRequest: CustomizationRequest }> {
    const request = await this.customizationRepo.findById(requestId);
    
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    if (request.customerId !== customerId) {
      throw AppError.forbidden('Unauthorized');
    }

    if (request.status !== 'approved' && request.status !== 'ready_for_production') {
      throw AppError.badRequest('Design must be approved before creating order');
    }

    if (!request.printingShopId) {
      throw AppError.badRequest('Printing shop must be selected before creating order');
    }

    if (!request.pricingAgreement) {
      throw AppError.badRequest('Pricing agreement is required');
    }

    // Check if order already exists (prevent duplicates)
    if (request.orderId) {
      throw AppError.badRequest('Order already exists for this customization request');
    }

    // Check payment requirements based on payment type
    // For escrow orders, if designer has been paid, allow order creation
    // This supports flexible payment options like COD or partial payments
    if (request.paymentDetails) {
      const escrowStatus = request.paymentDetails.escrowStatus;
      const paidAmount = request.paymentDetails.paidAmount || 0;
      const designFee = request.pricingAgreement?.designFee || 0;
      
      // If designer has been paid (escrow released), allow order creation
      if (escrowStatus === 'designer_paid' || escrowStatus === 'fully_released') {
        console.log('[CustomizationOrderService] Escrow active - allowing order creation');
      }
      // If design fee has been paid (even if escrow status not updated), allow order
      else if (paidAmount >= designFee && designFee > 0) {
        console.log('[CustomizationOrderService] Design fee paid - allowing order creation');
      } else {
        // Apply stricter payment validation if design fee not paid
        const paymentType = request.paymentDetails.paymentType;
        const totalAmount = request.paymentDetails.totalAmount;

        if (paymentType === 'upfront') {
          throw AppError.badRequest('Design fee must be paid before creating order');
        }

        if (paymentType === 'half_payment' && paidAmount < totalAmount * 0.5) {
          throw AppError.badRequest('At least 50% payment required for half-payment type');
        }

        if (paymentType === 'milestone' && request.paymentDetails.paymentStatus === 'pending') {
          throw AppError.badRequest('First milestone payment required');
        }
      }
    }

    // Get shop owner ID for the order
    const { FirebaseAdminService } = await import('./firebase-admin');
    const { Collections } = await import('./firebase');
    const shop = await FirebaseAdminService.getDocument(Collections.SHOP_PROFILES, request.printingShopId);
    
    if (!shop) {
      throw AppError.notFound('Shop not found');
    }

    // Get business owner ID (shop profiles use userId field)
    const businessOwnerId = shop.ownerId || shop.userId;
    
    if (!businessOwnerId) {
      throw AppError.badRequest('Shop owner ID not found in shop profile');
    }

    // Calculate product cost (base price + color adjustment)
    // If shop owner has set pricing, use that; otherwise calculate from product
    let productCost = request.pricingAgreement.productCost || 0;
    const printingCost = request.pricingAgreement.printingCost || 0;

    // If product cost is 0, calculate it from product base price + color
    if (productCost === 0) {
      const { ProductRepository } = await import('@/repositories/ProductRepository');
      const productRepo = new ProductRepository();
      const product = await productRepo.findById(request.productId);
      
      if (product) {
        const basePrice = product.price || 0;
        const colorAdjustment = request.colorPriceAdjustment || 0;
        productCost = basePrice + colorAdjustment;
      }
    }

    // Order item price = product cost + printing cost (design fee is already paid separately)
    const orderItemPrice = productCost + printingCost;

    // Create order
    const orderData = {
      customerId: request.customerId,
      businessOwnerId: businessOwnerId,
      items: [
        {
          productId: request.productId,
          quantity: 1,
          price: orderItemPrice, // Product cost + printing cost (NOT including design fee)
          customizations: {
            customizationRequestId: request.id,
            designerFinalFileUrl: request.designerFinalFile?.url || '',
            designerName: request.designerName || 'Designer',
            printingShopName: request.printingShopName || shop.shopName || shop.businessName || 'Print Shop'
          }
        }
      ],
      shippingAddress: shippingAddress,
      billingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      shippingCost: 0,
      notes: `Custom design order from customization request #${request.id.substring(0, 8)}`
    };

    const order = await this.orderService.createOrder(orderData);

    // Update customization request with order ID
    await this.customizationRepo.update(requestId, {
      orderId: order.id,
      updatedAt: Timestamp.now()
    });

    // Emit event
    await eventBus.emit('customization.order.created', {
      requestId: request.id,
      orderId: order.id,
      customerId: request.customerId,
      shopId: request.printingShopId,
      totalAmount: request.pricingAgreement.totalCost
    });

    return {
      orderId: order.id,
      customizationRequest: {
        ...request,
        orderId: order.id
      }
    };
  }

  /**
   * Get order for customization request
   */
  async getOrderForCustomization(requestId: string): Promise<any> {
    const request = await this.customizationRepo.findById(requestId);
    
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    if (!request.orderId) {
      return null;
    }

    return this.orderService.getOrder(request.orderId, request.customerId);
  }
}
















