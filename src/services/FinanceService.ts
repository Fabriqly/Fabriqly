import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CustomizationRequest, PaymentDetails } from '@/types/customization';
import { Order } from '@/types/firebase';

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export interface FinanceSummary {
  totalEarnings: number;
  totalRevenue: number;
  pendingAmount: number;
  paidAmount: number;
  thisMonthEarnings: number;
  thisMonthRevenue: number;
  currency: string;
}

export interface PaymentTransaction {
  id: string;
  type: 'customization' | 'order';
  referenceId: string; // customization request ID or order ID
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  paidAt?: Date;
  paymentMethod?: string;
  invoiceUrl?: string;
  description: string;
  customerName?: string;
  productName?: string;
}

export interface RevenueAnalytics {
  timeSeries: Array<{
    date: string;
    revenue: number;
    earnings: number;
  }>;
  breakdown: {
    customizations: number;
    orders: number;
  };
  topItems: Array<{
    id: string;
    name: string;
    amount: number;
    count: number;
  }>;
  growth: {
    percentage: number;
    period: string;
  };
}

export class FinanceService {
  private customizationRepo: CustomizationRepository;
  private orderRepo: OrderRepository;
  private shopProfileRepo: ShopProfileRepository;
  private productRepo: ProductRepository;

  constructor() {
    this.customizationRepo = new CustomizationRepository();
    this.orderRepo = new OrderRepository();
    this.shopProfileRepo = new ShopProfileRepository();
    this.productRepo = new ProductRepository();
  }

  /**
   * Get finance summary for a designer
   */
  async getDesignerFinance(userId: string, timeRange: TimeRange = 'all'): Promise<FinanceSummary> {
    const customizations = await this.customizationRepo.findByDesignerId(userId);
    const dateFilter = this.getDateFilter(timeRange);

    let totalEarnings = 0;
    let pendingAmount = 0;
    let paidAmount = 0;
    let thisMonthEarnings = 0;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get design order earnings
    try {
      const { FirebaseAdminService } = await import('@/services/firebase-admin');
      const { Collections } = await import('@/services/firebase');
      
      // Find designer profile by userId to get designerId
      const designerProfiles = await FirebaseAdminService.queryDocuments(
        Collections.DESIGNER_PROFILES,
        [{ field: 'userId', operator: '==', value: userId }]
      );
      
      if (designerProfiles.length > 0) {
        const designerProfile = designerProfiles[0];
        
        // Get all earnings records for this designer
        const earningsRecords = await FirebaseAdminService.queryDocuments(
          Collections.DESIGNER_EARNINGS,
          [{ field: 'designerId', operator: '==', value: designerProfile.id }]
        );
        
        // Also get design orders directly (as fallback if earnings records don't exist)
        const designOrders = await this.orderRepo.findByBusinessOwner(userId);
        const paidDesignOrders = designOrders.filter(order => {
          const isDesignOrder = order.items.every((item: any) => 
            item.itemType === 'design' || (item.designId && !item.productId)
          );
          return isDesignOrder && order.paymentStatus === 'paid';
        });
        
        // Calculate earnings from earnings records
        for (const earnings of earningsRecords) {
          const paidDate = this.toDate(earnings.paidAt);
          
          // Apply time filter
          if (dateFilter && paidDate && paidDate < dateFilter) {
            continue;
          }
          
          const amount = earnings.amount || 0;
          totalEarnings += amount;
          paidAmount += amount;
          
          // Check if this month
          if (paidDate && paidDate >= thisMonthStart) {
            thisMonthEarnings += amount;
          }
        }
        
        // Also check paid design orders that might not have earnings records yet
        for (const order of paidDesignOrders) {
          // Check if earnings record already exists for this order
          const hasEarningsRecord = earningsRecords.some(er => er.orderId === order.id);
          
          if (!hasEarningsRecord) {
            // This order was paid but earnings record wasn't created (legacy data)
            // Calculate earnings from order
            const orderDate = this.toDate(order.createdAt);
            
            // Apply time filter
            if (dateFilter && orderDate && orderDate < dateFilter) {
              continue;
            }
            
            const amount = order.totalAmount || 0;
            totalEarnings += amount;
            paidAmount += amount;
            
            // Check if this month
            if (orderDate && orderDate >= thisMonthStart) {
              thisMonthEarnings += amount;
            }
          }
        }
        
        // Check for pending design orders (payment not yet completed)
        const pendingDesignOrders = designOrders.filter(order => {
          const isDesignOrder = order.items.every((item: any) => 
            item.itemType === 'design' || (item.designId && !item.productId)
          );
          return isDesignOrder && order.paymentStatus === 'pending';
        });
        
        for (const order of pendingDesignOrders) {
          const orderDate = this.toDate(order.createdAt);
          
          // Apply time filter
          if (dateFilter && orderDate && orderDate < dateFilter) {
            continue;
          }
          
          const amount = order.totalAmount || 0;
          totalEarnings += amount; // Count as potential earnings
          pendingAmount += amount;
        }
      }
    } catch (error) {
      console.error('[FinanceService] Error fetching design order earnings:', error);
      // Continue with customization earnings even if design order earnings fail
    }

    for (const customization of customizations) {
      // Apply time filter - check both requestedAt and payment dates
      if (dateFilter) {
        const requestedDate = this.toDate(customization.requestedAt);
        const payment = customization.paymentDetails;
        
        let isInTimeRange = false;
        
        // Check if requested date is within range
        if (requestedDate && requestedDate >= dateFilter) {
          isInTimeRange = true;
        } else if (payment?.payments && payment.payments.length > 0) {
          // Check if any payment was made within the time range
          isInTimeRange = payment.payments.some(p => {
            if (p.status === 'success' && p.paidAt) {
              const paymentDate = this.toDate(p.paidAt);
              return paymentDate && paymentDate >= dateFilter;
            }
            return false;
          });
        } else if (payment?.designerPaidAt) {
          // Check if designer was paid within the time range
          const paidDate = this.toDate(payment.designerPaidAt);
          isInTimeRange = paidDate && paidDate >= dateFilter;
        }
        
        if (!isInTimeRange) {
          continue;
        }
      }

      const pricing = customization.pricingAgreement;
      const payment = customization.paymentDetails;

      if (!pricing || !payment) {
        continue;
      }

      const designFee = pricing.designFee || 0;
      const designerPayoutAmount = payment.designerPayoutAmount || designFee; // Use actual payout amount or fallback to design fee

      // Check if there are any successful customer payments
      const successfulPayments = payment.payments?.filter(p => p.status === 'success') || [];
      const hasSuccessfulPayments = successfulPayments.length > 0;
      
      // Also check paymentStatus as fallback (in case payments array isn't populated)
      const isPaid = hasSuccessfulPayments || 
                     payment.paymentStatus === 'fully_paid' || 
                     payment.paymentStatus === 'partially_paid' ||
                     (payment.paidAmount && payment.paidAmount > 0);

      // Check if designer has been paid (escrow released)
      if (payment.designerPayoutAmount && payment.designerPaidAt) {
        // Designer has received payout - count as paid earnings
        totalEarnings += payment.designerPayoutAmount;
        paidAmount += payment.designerPayoutAmount;

        // Check if this month - use designerPaidAt if available
        const paidDate = this.toDate(payment.designerPaidAt);
        if (paidDate && paidDate >= thisMonthStart) {
          thisMonthEarnings += payment.designerPayoutAmount;
        } else {
          // Fallback: check if customer payment was made this month
          if (hasSuccessfulPayments) {
            const lastSuccessfulPayment = successfulPayments[successfulPayments.length - 1];
            if (lastSuccessfulPayment.paidAt) {
              const paymentDate = this.toDate(lastSuccessfulPayment.paidAt);
              if (paymentDate && paymentDate >= thisMonthStart) {
                thisMonthEarnings += payment.designerPayoutAmount;
              }
            }
          }
        }
      } else if (isPaid) {
        // Customer has paid successfully but designer hasn't received payout yet (escrow still held)
        // Count as pending earnings AND add to total earnings (potential earnings)
        totalEarnings += designerPayoutAmount;
        pendingAmount += designerPayoutAmount;
        
        // Check if payment was made this month (for this month earnings calculation)
        if (hasSuccessfulPayments) {
          // Use the most recent successful payment date
          const lastSuccessfulPayment = successfulPayments[successfulPayments.length - 1];
          if (lastSuccessfulPayment.paidAt) {
            const paymentDate = this.toDate(lastSuccessfulPayment.paidAt);
            if (paymentDate && paymentDate >= thisMonthStart) {
              thisMonthEarnings += designerPayoutAmount;
            }
          }
        } else if (payment.paidAmount && payment.paidAmount > 0) {
          // Fallback: if no payment records but paidAmount exists, use customization requested date
          const requestedDate = this.toDate(customization.requestedAt);
          if (requestedDate && requestedDate >= thisMonthStart) {
            thisMonthEarnings += designerPayoutAmount;
          }
        }
      } else {
        // Payment not yet made - count as pending if there are pending payments or escrow is set up
        const hasPendingPayments = payment.payments?.some(p => p.status === 'pending') || false;
        if (hasPendingPayments || payment.escrowStatus === 'held' || payment.designerPayoutAmount || payment.paymentStatus === 'pending') {
          totalEarnings += designerPayoutAmount; // Still count as potential earnings
          pendingAmount += designerPayoutAmount;
        }
      }
    }

    return {
      totalEarnings,
      totalRevenue: totalEarnings, // For designers, earnings = revenue
      pendingAmount,
      paidAmount,
      thisMonthEarnings,
      thisMonthRevenue: thisMonthEarnings,
      currency: 'PHP'
    };
  }

  /**
   * Get finance summary for a business owner
   */
  async getBusinessOwnerFinance(userId: string, timeRange: TimeRange = 'all'): Promise<FinanceSummary> {
    // Get shop profile first
    const shop = await this.shopProfileRepo.findByUserId(userId);
    if (!shop) {
      return this.getEmptySummary();
    }

    const orders = await this.orderRepo.findByBusinessOwner(userId);
    const customizations = await this.customizationRepo.findAll({
      filters: [{ field: 'printingShopId', operator: '==', value: shop.id }]
    });

    const dateFilter = this.getDateFilter(timeRange);
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalRevenue = 0;
    let pendingAmount = 0;
    let paidAmount = 0;
    let thisMonthRevenue = 0;

    // Calculate from orders
    for (const order of orders) {
      // Skip cancelled orders
      if (order.status === 'cancelled') continue;

      if (dateFilter && order.createdAt) {
        const orderDate = this.toDate(order.createdAt);
        if (!orderDate || orderDate < dateFilter) continue;
      }

      const orderAmount = order.totalAmount || 0;

      // Count delivered AND paid orders as revenue
      if (order.status === 'delivered' && order.paymentStatus === 'paid') {
        totalRevenue += orderAmount;
        paidAmount += orderAmount;

        if (order.createdAt) {
          const orderDate = this.toDate(order.createdAt);
          if (orderDate && orderDate >= thisMonthStart) {
            thisMonthRevenue += orderAmount;
          }
        }
      } 
      // Count pending/in-process orders as pending amount
      else if (order.paymentStatus === 'pending' || 
               (order.status !== 'delivered' && order.status !== 'cancelled')) {
        pendingAmount += orderAmount;
      }
    }

    // Calculate from customizations (product cost + printing cost)
    for (const customization of customizations) {
      if (dateFilter && customization.requestedAt) {
        const requestedDate = this.toDate(customization.requestedAt);
        if (!requestedDate || requestedDate < dateFilter) continue;
      }

      const pricing = customization.pricingAgreement;
      const payment = customization.paymentDetails;

      if (!pricing || !payment) continue;

      const shopRevenue = (pricing.productCost || 0) + (pricing.printingCost || 0);

      if (payment.paymentStatus === 'fully_paid' && payment.shopPayoutAmount) {
        totalRevenue += payment.shopPayoutAmount;
        paidAmount += payment.shopPayoutAmount;

        if (payment.shopPaidAt) {
          const paidDate = this.toDate(payment.shopPaidAt);
          if (paidDate && paidDate >= thisMonthStart) {
            thisMonthRevenue += payment.shopPayoutAmount;
          }
        }
      } else if (payment.paymentStatus === 'partially_paid' || payment.paymentStatus === 'pending') {
        if (payment.escrowStatus === 'held' || payment.escrowStatus === 'shop_paid') {
          pendingAmount += shopRevenue;
        }
      }
    }

    return {
      totalEarnings: totalRevenue, // For business owners, revenue = earnings
      totalRevenue,
      pendingAmount,
      paidAmount,
      thisMonthEarnings: thisMonthRevenue,
      thisMonthRevenue,
      currency: 'PHP'
    };
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(
    userId: string,
    role: 'designer' | 'business_owner' | 'customer',
    filters?: {
      status?: string;
      type?: 'customization' | 'order';
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<PaymentTransaction[]> {
    const transactions: PaymentTransaction[] = [];

    if (role === 'designer') {
      const customizations = await this.customizationRepo.findByDesignerId(userId);
      
      // Get design order payments
      try {
        const { FirebaseAdminService } = await import('@/services/firebase-admin');
        const { Collections } = await import('@/services/firebase');
        
        // Find designer profile by userId to get designerId
        const designerProfiles = await FirebaseAdminService.queryDocuments(
          Collections.DESIGNER_PROFILES,
          [{ field: 'userId', operator: '==', value: userId }]
        );
        
        if (designerProfiles.length > 0) {
          const designerProfile = designerProfiles[0];
          
          // Get all earnings records for this designer (these represent paid design orders)
          const earningsRecords = await FirebaseAdminService.queryDocuments(
            Collections.DESIGNER_EARNINGS,
            [{ field: 'designerId', operator: '==', value: designerProfile.id }]
          );
          
          // Also get design orders directly (as fallback)
          const designOrders = await this.orderRepo.findByBusinessOwner(userId);
          const paidDesignOrders = designOrders.filter(order => {
            const isDesignOrder = order.items.every((item: any) => 
              item.itemType === 'design' || (item.designId && !item.productId)
            );
            return isDesignOrder && order.paymentStatus === 'paid';
          });
          
          // Add design order transactions from earnings records
          for (const earnings of earningsRecords) {
            // Apply filters
            if (filters?.type && filters.type !== 'order') continue;
            if (filters?.status && filters.status !== 'success') continue;
            
            const paidDate = this.toDate(earnings.paidAt);
            if (filters?.dateFrom || filters?.dateTo) {
              if (!paidDate) continue;
              if (filters.dateFrom && paidDate < filters.dateFrom) continue;
              if (filters.dateTo && paidDate > filters.dateTo) continue;
            }
            
            // Get order details for description
            const order = paidDesignOrders.find(o => o.id === earnings.orderId);
            const designName = order?.items?.[0]?.designName || 'Design';
            
            transactions.push({
              id: earnings.orderId || `earnings-${earnings.id}`,
              type: 'order',
              referenceId: earnings.orderId,
              amount: earnings.amount || 0,
              status: 'success',
              paidAt: paidDate,
              paymentMethod: 'xendit',
              description: `Design purchase: ${designName}`,
              productName: designName
            });
          }
          
          // Also add pending design orders
          const pendingDesignOrders = designOrders.filter(order => {
            const isDesignOrder = order.items.every((item: any) => 
              item.itemType === 'design' || (item.designId && !item.productId)
            );
            return isDesignOrder && order.paymentStatus === 'pending';
          });
          
          for (const order of pendingDesignOrders) {
            // Apply filters
            if (filters?.type && filters.type !== 'order') continue;
            if (filters?.status && filters.status !== 'pending') continue;
            
            const orderDate = this.toDate(order.createdAt);
            if (filters?.dateFrom || filters?.dateTo) {
              if (!orderDate) continue;
              if (filters.dateFrom && orderDate < filters.dateFrom) continue;
              if (filters.dateTo && orderDate > filters.dateTo) continue;
            }
            
            const designName = order.items?.[0]?.designName || 'Design';
            
            transactions.push({
              id: order.id,
              type: 'order',
              referenceId: order.id,
              amount: order.totalAmount || 0,
              status: 'pending',
              paidAt: orderDate,
              paymentMethod: order.paymentMethod || 'xendit',
              description: `Design purchase: ${designName} (Payment pending)`,
              productName: designName
            });
          }
        }
      } catch (error) {
        console.error('[FinanceService] Error fetching design order payments:', error);
        // Continue with customization payments even if design order payments fail
      }
      
      for (const customization of customizations) {
        if (!customization.paymentDetails) continue;

        const payment = customization.paymentDetails;
        const pricing = customization.pricingAgreement;

        // Auto-release escrow for approved/ready_for_production customizations that still have escrow held
        // Also check if designerPayoutAmount exists but escrow status wasn't updated (data inconsistency)
        const hasPayoutButNotReleased = payment.designerPayoutAmount && 
                                       payment.escrowStatus === 'held' && 
                                       !payment.designerPaidAt;

        // If designerPayoutAmount exists but escrow status is still 'held', fix the data inconsistency
        if (hasPayoutButNotReleased) {
          try {
            const { Timestamp } = await import('firebase-admin/firestore');
            await this.customizationRepo.update(customization.id, {
              paymentDetails: {
                ...payment,
                escrowStatus: 'designer_paid',
                designerPaidAt: payment.designerPaidAt || Timestamp.now() as any
              } as any,
              updatedAt: Timestamp.now() as any
            });
            // Refresh payment data
            const updated = await this.customizationRepo.findById(customization.id);
            if (updated?.paymentDetails) {
              Object.assign(payment, updated.paymentDetails);
            }
          } catch (error: any) {
            console.error(`[FinanceService] Failed to fix escrow status for ${customization.id}:`, error);
          }
        }

        if ((customization.status === 'approved' || customization.status === 'ready_for_production') &&
            payment.escrowStatus === 'held' &&
            !payment.designerPayoutAmount &&
            pricing &&
            customization.designerId) {
          try {
            const { escrowService } = await import('./EscrowService');
            const canRelease = await escrowService.canReleaseDesignerPayment(customization.id);
            if (canRelease) {
              await escrowService.releaseDesignerPayment(customization.id);
              // Refresh the customization data
              const updated = await this.customizationRepo.findById(customization.id);
              if (updated?.paymentDetails) {
                Object.assign(payment, updated.paymentDetails);
              }
            }
          } catch (error: any) {
            console.error(`[FinanceService] Failed to auto-release escrow for ${customization.id}:`, error?.message || error);
            // Continue processing even if auto-release fails
          }
        }

        if (pricing && payment.payments) {
          for (const paymentRecord of payment.payments) {
            // Apply filters
            if (filters?.status && paymentRecord.status !== filters.status) continue;
            if (filters?.type && filters.type !== 'customization') continue;
            if (filters?.dateFrom || filters?.dateTo) {
              const paidDate = this.toDate(paymentRecord.paidAt);
              if (!paidDate) continue;
              if (filters.dateFrom && paidDate < filters.dateFrom) continue;
              if (filters.dateTo && paidDate > filters.dateTo) continue;
            }

            // Determine status - customer payment success means the transaction was successful
            // Escrow release is a separate process that happens after approval
            let transactionStatus: 'pending' | 'success' | 'failed' | 'refunded' = 'pending';
            let description = `Design fee for ${customization.productName}`;
            
            if (paymentRecord.status === 'success') {
              // Customer payment was successful - this is a successful transaction
              // The escrow release is a separate payout process
              transactionStatus = 'success';
              
              // Add note about escrow status if applicable
              if (!payment.designerPayoutAmount || !payment.designerPaidAt) {
                const isApproved = customization.status === 'approved' || customization.status === 'ready_for_production';
                if (isApproved) {
                  description = `Design fee for ${customization.productName} (Escrow release pending)`;
                } else {
                  description = `Design fee for ${customization.productName} (Awaiting design approval)`;
                }
              }
            } else if (paymentRecord.status === 'failed') {
              transactionStatus = 'failed';
            }

            transactions.push({
              id: paymentRecord.id,
              type: 'customization',
              referenceId: customization.id,
              amount: paymentRecord.amount,
              status: transactionStatus,
              paidAt: paymentRecord.paidAt ? this.toDate(paymentRecord.paidAt) : undefined,
              paymentMethod: paymentRecord.paymentMethod,
              invoiceUrl: paymentRecord.invoiceUrl,
              description,
              customerName: customization.customerName,
              productName: customization.productName
            });
          }
        }

        // Add payout transactions
        if (payment.designerPayoutAmount && payment.designerPaidAt) {
          const paidDate = this.toDate(payment.designerPaidAt);
          if (paidDate && (!filters?.dateFrom || paidDate >= filters.dateFrom)) {
            if (!filters?.dateTo || paidDate <= filters.dateTo) {
              transactions.push({
                id: payment.designerPayoutId || `payout-${customization.id}`,
                type: 'customization',
                referenceId: customization.id,
                amount: payment.designerPayoutAmount,
                status: 'success',
                paidAt: paidDate,
                description: `Payout for design: ${customization.productName}`,
                customerName: customization.customerName,
                productName: customization.productName
              });
            }
          }
        }
      }
    } else if (role === 'business_owner') {
      const orders = await this.orderRepo.findByBusinessOwner(userId);
      
      for (const order of orders) {
        // Show all orders (delivered/paid, pending, and in-process)
        // Skip only cancelled orders
        if (order.status === 'cancelled') continue;

        if (filters?.type && filters.type !== 'order') continue;
        
        // Map order status to transaction status
        let transactionStatus: 'pending' | 'success' | 'failed' | 'refunded' = 'pending';
        if (order.paymentStatus === 'paid' && order.status === 'delivered') {
          transactionStatus = 'success';
        } else if (order.paymentStatus === 'failed') {
          transactionStatus = 'failed';
        } else if (order.paymentStatus === 'refunded') {
          transactionStatus = 'refunded';
        } else {
          transactionStatus = 'pending';
        }

        if (filters?.status) {
          // Map filter status to order status
          if (filters.status === 'success' && transactionStatus !== 'success') continue;
          if (filters.status === 'pending' && transactionStatus !== 'pending') continue;
          if (filters.status === 'failed' && transactionStatus !== 'failed') continue;
          if (filters.status === 'refunded' && transactionStatus !== 'refunded') continue;
        }

        if (filters?.dateFrom || filters?.dateTo) {
          const orderDate = this.toDate(order.createdAt);
          if (!orderDate) continue;
          if (filters.dateFrom && orderDate < filters.dateFrom) continue;
          if (filters.dateTo && orderDate > filters.dateTo) continue;
        }

        transactions.push({
          id: order.id,
          type: 'order',
          referenceId: order.id,
          amount: order.totalAmount || 0,
          status: transactionStatus,
          paidAt: this.toDate(order.createdAt), // Always show order creation date
          paymentMethod: order.paymentMethod,
          description: `Order #${order.id.substring(0, 8)} - ${order.status}`,
          productName: order.items?.[0]?.productName || 'Multiple items'
        });
      }

      // Get customizations for shop
      const shop = await this.shopProfileRepo.findByUserId(userId);
      if (shop) {
        const customizations = await this.customizationRepo.findAll({
          filters: [{ field: 'printingShopId', operator: '==', value: shop.id }]
        });

        for (const customization of customizations) {
          if (!customization.paymentDetails) continue;

          const payment = customization.paymentDetails;
          const pricing = customization.pricingAgreement;

          if (pricing && payment.shopPayoutAmount && payment.shopPaidAt) {
            const paidDate = this.toDate(payment.shopPaidAt);
            if (paidDate && (!filters?.dateFrom || paidDate >= filters.dateFrom)) {
              if (!filters?.dateTo || paidDate <= filters.dateTo) {
                transactions.push({
                  id: payment.shopPayoutId || `payout-${customization.id}`,
                  type: 'customization',
                  referenceId: customization.id,
                  amount: payment.shopPayoutAmount,
                  status: 'success',
                  paidAt: paidDate,
                  description: `Production payment for ${customization.productName}`,
                  customerName: customization.customerName,
                  productName: customization.productName
                });
              }
            }
          }
        }
      }
    } else if (role === 'customer') {
      // Get customer orders
      const orders = await this.orderRepo.findByCustomer(userId);
      
      for (const order of orders) {
        if (filters?.type && filters.type !== 'order') continue;
        if (filters?.status && order.paymentStatus !== filters.status) continue;
        if (filters?.dateFrom || filters?.dateTo) {
          const orderDate = this.toDate(order.createdAt);
          if (!orderDate) continue;
          if (filters.dateFrom && orderDate < filters.dateFrom) continue;
          if (filters.dateTo && orderDate > filters.dateTo) continue;
        }

        transactions.push({
          id: order.id,
          type: 'order',
          referenceId: order.id,
          amount: order.totalAmount || 0,
          status: order.paymentStatus === 'paid' ? 'success' :
                 order.paymentStatus === 'refunded' ? 'refunded' :
                 order.paymentStatus === 'failed' ? 'failed' : 'pending',
          paidAt: this.toDate(order.createdAt), // Always show order creation date
          paymentMethod: order.paymentMethod,
          description: `Order #${order.id.substring(0, 8)}`,
          productName: order.items?.[0]?.productName || 'Multiple items'
        });
      }

      // Get customer customizations
      const customizations = await this.customizationRepo.findByCustomerId(userId);
      
      for (const customization of customizations) {
        if (!customization.paymentDetails) continue;

        const payment = customization.paymentDetails;

        if (payment.payments) {
          for (const paymentRecord of payment.payments) {
            if (filters?.status && paymentRecord.status !== filters.status) continue;
            if (filters?.type && filters.type !== 'customization') continue;
            if (filters?.dateFrom || filters?.dateTo) {
              const paidDate = this.toDate(paymentRecord.paidAt);
              if (!paidDate) continue;
              if (filters.dateFrom && paidDate < filters.dateFrom) continue;
              if (filters.dateTo && paidDate > filters.dateTo) continue;
            }

            transactions.push({
              id: paymentRecord.id,
              type: 'customization',
              referenceId: customization.id,
              amount: paymentRecord.amount,
              status: paymentRecord.status === 'success' ? 'success' : 
                      paymentRecord.status === 'failed' ? 'failed' : 'pending',
              paidAt: paymentRecord.paidAt ? this.toDate(paymentRecord.paidAt) : undefined,
              paymentMethod: paymentRecord.paymentMethod,
              invoiceUrl: paymentRecord.invoiceUrl,
              description: `Payment for ${customization.productName} customization`,
              productName: customization.productName
            });
          }
        }
      }
    }

    // Sort by date (most recent first)
    transactions.sort((a, b) => {
      const dateA = a.paidAt?.getTime() || 0;
      const dateB = b.paidAt?.getTime() || 0;
      return dateB - dateA;
    });

    return transactions;
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    userId: string,
    role: 'designer' | 'business_owner',
    timeRange: TimeRange = '30d'
  ): Promise<RevenueAnalytics> {
    const dateFilter = this.getDateFilter(timeRange);
    const now = new Date();
    const periodStart = dateFilter || new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // Default to 1 year if all

    let customizations: CustomizationRequest[] = [];
    let orders: Order[] = [];

    if (role === 'designer') {
      customizations = await this.customizationRepo.findByDesignerId(userId);
      
      // Also get design orders for designers
      try {
        const { FirebaseAdminService } = await import('@/services/firebase-admin');
        const { Collections } = await import('@/services/firebase');
        
        // Find designer profile by userId to get designerId
        const designerProfiles = await FirebaseAdminService.queryDocuments(
          Collections.DESIGNER_PROFILES,
          [{ field: 'userId', operator: '==', value: userId }]
        );
        
        if (designerProfiles.length > 0) {
          const designerProfile = designerProfiles[0];
          
          // Get design orders for this designer (businessOwnerId is the designer's userId)
          const allDesignOrders = await this.orderRepo.findByBusinessOwner(userId);
          const designOrders = allDesignOrders.filter(order => {
            const isDesignOrder = order.items.every((item: any) => 
              item.itemType === 'design' || (item.designId && !item.productId)
            );
            return isDesignOrder;
          });
          
          // Add design orders to the items array for time series generation
          orders.push(...designOrders);
        }
      } catch (error) {
        console.error('[FinanceService] Error fetching design orders for analytics:', error);
        // Continue with customizations even if design orders fail
      }
    } else {
      orders = await this.orderRepo.findByBusinessOwner(userId);
      // Include all orders except cancelled ones
      orders = orders.filter(order => order.status !== 'cancelled');
      const shop = await this.shopProfileRepo.findByUserId(userId);
      if (shop) {
        customizations = await this.customizationRepo.findAll({
          filters: [{ field: 'printingShopId', operator: '==', value: shop.id }]
        });
      }
    }

    // Generate time series data
    const timeSeries = this.generateTimeSeries(periodStart, now, role === 'designer' ? customizations : [...customizations, ...orders]);

    // Calculate breakdown
    let customizationRevenue = 0;
    let orderRevenue = 0;

    if (role === 'designer') {
      // Calculate customization revenue
      for (const customization of customizations) {
        if (customization.paymentDetails?.designerPayoutAmount) {
          customizationRevenue += customization.paymentDetails.designerPayoutAmount;
        }
      }
      
      // Calculate design order revenue
      try {
        const { FirebaseAdminService } = await import('@/services/firebase-admin');
        const { Collections } = await import('@/services/firebase');
        
        // Find designer profile by userId to get designerId
        const designerProfiles = await FirebaseAdminService.queryDocuments(
          Collections.DESIGNER_PROFILES,
          [{ field: 'userId', operator: '==', value: userId }]
        );
        
        if (designerProfiles.length > 0) {
          const designerProfile = designerProfiles[0];
          
          // Get all earnings records for this designer
          const earningsRecords = await FirebaseAdminService.queryDocuments(
            Collections.DESIGNER_EARNINGS,
            [{ field: 'designerId', operator: '==', value: designerProfile.id }]
          );
          
          // Calculate revenue from earnings records
          for (const earnings of earningsRecords) {
            const paidDate = this.toDate(earnings.paidAt);
            // Apply time filter
            if (dateFilter && paidDate && paidDate < dateFilter) {
              continue;
            }
            orderRevenue += earnings.amount || 0;
          }
          
          // Also check paid design orders that might not have earnings records yet
          const allDesignOrders = await this.orderRepo.findByBusinessOwner(userId);
          const paidDesignOrders = allDesignOrders.filter(order => {
            const isDesignOrder = order.items.every((item: any) => 
              item.itemType === 'design' || (item.designId && !item.productId)
            );
            return isDesignOrder && order.paymentStatus === 'paid';
          });
          
          for (const order of paidDesignOrders) {
            // Check if earnings record already exists for this order
            const hasEarningsRecord = earningsRecords.some(er => er.orderId === order.id);
            
            if (!hasEarningsRecord) {
              // This order was paid but earnings record wasn't created (legacy data)
              const orderDate = this.toDate(order.createdAt);
              // Apply time filter
              if (dateFilter && orderDate && orderDate < dateFilter) {
                continue;
              }
              orderRevenue += order.totalAmount || 0;
            }
          }
        }
      } catch (error) {
        console.error('[FinanceService] Error calculating design order revenue:', error);
        // Continue with customization revenue even if design order revenue fails
      }
    } else {
      for (const order of orders) {
        // Include all orders (paid, pending, in-process) except cancelled
        if (order.status !== 'cancelled') {
          orderRevenue += order.totalAmount || 0;
        }
      }
      for (const customization of customizations) {
        if (customization.paymentDetails?.shopPayoutAmount) {
          customizationRevenue += customization.paymentDetails.shopPayoutAmount;
        }
      }
    }

    // Get top items
    const topItems = await this.calculateTopItems(customizations, orders, role);

    // Calculate growth
    const growth = this.calculateGrowth(timeSeries);

    return {
      timeSeries,
      breakdown: {
        customizations: customizationRevenue,
        orders: orderRevenue
      },
      topItems,
      growth
    };
  }

  /**
   * Helper methods
   */
  private getDateFilter(timeRange: TimeRange): Date | null {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'all':
        return null;
      default:
        return null;
    }
  }

  private toDate(timestamp: any): Date | undefined {
    if (!timestamp) return undefined;
    
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      // Handle Firestore Timestamp (both client and admin SDK)
      date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      // Handle timestamp as number (milliseconds)
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // Try to parse as date string
      date = new Date(timestamp);
    } else {
      return undefined;
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      return undefined;
    }
    
    return date;
  }

  private getEmptySummary(): FinanceSummary {
    return {
      totalEarnings: 0,
      totalRevenue: 0,
      pendingAmount: 0,
      paidAmount: 0,
      thisMonthEarnings: 0,
      thisMonthRevenue: 0,
      currency: 'PHP'
    };
  }

  private generateTimeSeries(startDate: Date, endDate: Date, items: Array<CustomizationRequest | Order>): Array<{ date: string; revenue: number; earnings: number }> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const series: Map<string, { revenue: number; earnings: number }> = new Map();

    // Initialize all days
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      series.set(key, { revenue: 0, earnings: 0 });
    }

    // Aggregate data
    for (const item of items) {
      let date: Date | undefined;
      let amount = 0;

      if ('paymentDetails' in item) {
        // CustomizationRequest
        const customization = item as CustomizationRequest;
        const payment = customization.paymentDetails;
        
        // For designers: use designerPaidAt if available, otherwise use payment date, otherwise requestedAt
        if (payment?.designerPayoutAmount) {
          if (payment.designerPaidAt) {
            date = this.toDate(payment.designerPaidAt);
          } else if (payment.payments && payment.payments.length > 0) {
            // Use the most recent successful payment date
            const successfulPayments = payment.payments.filter(p => p.status === 'success');
            if (successfulPayments.length > 0) {
              const lastPayment = successfulPayments[successfulPayments.length - 1];
              date = lastPayment.paidAt ? this.toDate(lastPayment.paidAt) : this.toDate(customization.requestedAt);
            } else {
              date = this.toDate(customization.requestedAt);
            }
          } else {
            date = this.toDate(customization.requestedAt);
          }
          amount = payment.designerPayoutAmount;
        } else if (payment?.shopPayoutAmount) {
          // For shop owners: use shopPaidAt if available, otherwise use payment date, otherwise requestedAt
          if (payment.shopPaidAt) {
            date = this.toDate(payment.shopPaidAt);
          } else if (payment.payments && payment.payments.length > 0) {
            const successfulPayments = payment.payments.filter(p => p.status === 'success');
            if (successfulPayments.length > 0) {
              const lastPayment = successfulPayments[successfulPayments.length - 1];
              date = lastPayment.paidAt ? this.toDate(lastPayment.paidAt) : this.toDate(customization.requestedAt);
            } else {
              date = this.toDate(customization.requestedAt);
            }
          } else {
            date = this.toDate(customization.requestedAt);
          }
          amount = payment.shopPayoutAmount;
        } else {
          // No payout yet, but check if there are successful payments to use their date
          if (payment.payments && payment.payments.length > 0) {
            const successfulPayments = payment.payments.filter(p => p.status === 'success');
            if (successfulPayments.length > 0) {
              const lastPayment = successfulPayments[successfulPayments.length - 1];
              date = lastPayment.paidAt ? this.toDate(lastPayment.paidAt) : this.toDate(customization.requestedAt);
              // Use design fee as amount even if not paid out yet (for chart display)
              const pricing = customization.pricingAgreement;
              amount = pricing?.designFee || 0;
            } else {
              date = this.toDate(customization.requestedAt);
              amount = 0;
            }
          } else {
            date = this.toDate(customization.requestedAt);
            amount = 0;
          }
        }
      } else {
        // Order
        const order = item as Order;
        
        // For design orders, try to use payment date from earnings record if available
        // Otherwise use order creation date
        const isDesignOrder = order.items?.every((item: any) => 
          item.itemType === 'design' || (item.designId && !item.productId)
        );
        
        if (isDesignOrder && order.paymentStatus === 'paid') {
          // For paid design orders, try to get payment date from earnings record
          // For now, use order creation date (earnings records are separate)
          // In the future, we could enhance this to look up earnings records
          date = this.toDate(order.createdAt);
        } else {
          date = this.toDate(order.createdAt);
        }
        
        // Include all orders (paid, pending, in-process) except cancelled
        if (order.status !== 'cancelled') {
          amount = order.totalAmount || 0;
        }
      }

      if (!date || date < startDate || date > endDate) continue;
      
      const key = date.toISOString().split('T')[0];
      const existing = series.get(key) || { revenue: 0, earnings: 0 };
      existing.revenue += amount;
      existing.earnings += amount;
      series.set(key, existing);
    }

    // Convert to array
    return Array.from(series.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async calculateTopItems(
    customizations: CustomizationRequest[],
    orders: Order[],
    role: 'designer' | 'business_owner'
  ): Promise<Array<{ id: string; name: string; amount: number; count: number }>> {
    const itemMap = new Map<string, { name: string; amount: number; count: number }>();
    const productCache = new Map<string, string>(); // Cache product names by productId

    // Collect all unique product IDs that need to be fetched
    const productIdsToFetch = new Set<string>();
    if (role === 'business_owner') {
      for (const order of orders) {
        if (order.status !== 'cancelled') {
          for (const item of order.items || []) {
            // If productName is not in item, we need to fetch it
            if (!(item as any).productName && item.productId) {
              productIdsToFetch.add(item.productId);
            }
          }
        }
      }
    }

    // Batch fetch all products at once
    if (productIdsToFetch.size > 0) {
      try {
        const productPromises = Array.from(productIdsToFetch).map(async (productId) => {
          try {
            const product = await this.productRepo.findById(productId);
            return { productId, name: product?.name || 'Unknown' };
          } catch (error) {
            console.error(`Error fetching product ${productId}:`, error);
            return { productId, name: 'Unknown' };
          }
        });
        
        const productResults = await Promise.all(productPromises);
        for (const { productId, name } of productResults) {
          productCache.set(productId, name);
        }
      } catch (error) {
        console.error('Error batch fetching products:', error);
      }
    }

    if (role === 'designer') {
      for (const customization of customizations) {
        const productName = customization.productName || 'Unknown';
        const existing = itemMap.get(productName) || { name: productName, amount: 0, count: 0 };
        if (customization.paymentDetails?.designerPayoutAmount) {
          existing.amount += customization.paymentDetails.designerPayoutAmount;
        }
        existing.count += 1;
        itemMap.set(productName, existing);
      }
    } else {
      // Include all orders (paid, pending, in-process) except cancelled
      for (const order of orders) {
        if (order.status !== 'cancelled') {
          for (const item of order.items || []) {
            // Try to get product name from item first, otherwise use cached name
            let productName = (item as any).productName;
            if (!productName && item.productId) {
              productName = productCache.get(item.productId) || 'Unknown';
            }
            if (!productName) {
              productName = 'Unknown';
            }

            const existing = itemMap.get(productName) || { name: productName, amount: 0, count: 0 };
            existing.amount += (item.price || 0) * (item.quantity || 1);
            existing.count += item.quantity || 1;
            itemMap.set(productName, existing);
          }
        }
      }
    }

    return Array.from(itemMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map((item, index) => ({
        id: `item-${index}`,
        ...item
      }));
  }

  private calculateGrowth(timeSeries: Array<{ date: string; revenue: number; earnings: number }>): { percentage: number; period: string } {
    if (timeSeries.length < 2) {
      return { percentage: 0, period: 'N/A' };
    }

    const firstHalf = timeSeries.slice(0, Math.floor(timeSeries.length / 2));
    const secondHalf = timeSeries.slice(Math.floor(timeSeries.length / 2));

    const firstTotal = firstHalf.reduce((sum, item) => sum + item.revenue, 0);
    const secondTotal = secondHalf.reduce((sum, item) => sum + item.revenue, 0);

    if (firstTotal === 0) {
      return { percentage: secondTotal > 0 ? 100 : 0, period: 'current' };
    }

    const percentage = ((secondTotal - firstTotal) / firstTotal) * 100;
    return { percentage: Math.round(percentage * 100) / 100, period: 'current' };
  }
}

