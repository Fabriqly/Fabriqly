import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { OrderService } from './OrderService';
import { CustomizationRequest } from '@/types/customization';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { Timestamp } from 'firebase/firestore';
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
    shippingAddress: any
  ): Promise<{ orderId: string; customizationRequest: CustomizationRequest }> {
    const request = await this.customizationRepo.findById(requestId);
    
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    if (request.customerId !== customerId) {
      throw AppError.forbidden('Unauthorized');
    }

    if (request.status !== 'approved') {
      throw AppError.badRequest('Design must be approved before creating order');
    }

    if (!request.printingShopId) {
      throw AppError.badRequest('Printing shop must be selected before creating order');
    }

    if (!request.pricingAgreement) {
      throw AppError.badRequest('Pricing agreement is required');
    }

    // Check payment requirements based on payment type
    if (request.paymentDetails) {
      const paymentType = request.paymentDetails.paymentType;
      const paidAmount = request.paymentDetails.paidAmount;
      const totalAmount = request.paymentDetails.totalAmount;

      if (paymentType === 'upfront' && request.paymentDetails.paymentStatus !== 'fully_paid') {
        throw AppError.badRequest('Full payment required for upfront payment type');
      }

      if (paymentType === 'half_payment' && paidAmount < totalAmount * 0.5) {
        throw AppError.badRequest('At least 50% payment required for half-payment type');
      }

      if (paymentType === 'milestone' && request.paymentDetails.paymentStatus === 'pending') {
        throw AppError.badRequest('First milestone payment required');
      }
    }

    // Get shop owner ID for the order
    const { FirebaseAdminService } = await import('./firebase-admin');
    const { Collections } = await import('./firebase');
    const shop = await FirebaseAdminService.getDocument(Collections.SHOP_PROFILES, request.printingShopId);
    
    if (!shop) {
      throw AppError.notFound('Shop not found');
    }

    // Create order
    const orderData = {
      customerId: request.customerId,
      businessOwnerId: shop.ownerId,
      items: [
        {
          productId: request.productId,
          quantity: 1,
          price: request.pricingAgreement.totalCost,
          customizations: {
            customizationRequestId: request.id,
            designerFinalFileUrl: request.designerFinalFile?.url || '',
            designerName: request.designerName || 'Designer',
            printingShopName: request.printingShopName || shop.businessName
          }
        }
      ],
      shippingAddress: shippingAddress,
      billingAddress: shippingAddress,
      paymentMethod: 'xendit',
      shippingCost: 0,
      notes: `Custom design order from customization request #${request.id.substring(0, 8)}`
    };

    const order = await this.orderService.createOrder(orderData);

    // Update customization request with order ID
    await this.customizationRepo.update(requestId, {
      orderId: order.id as any,
      updatedAt: Timestamp.now() as any
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
















