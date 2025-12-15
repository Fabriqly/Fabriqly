import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Order } from '@/types/firebase';
import { CacheService } from '@/services/CacheService';

export class PurchaseService {
  private static cachePrefix = 'purchase-verification';
  private static cacheTTL = 300; // 5 minutes

  /**
   * Check if a user has purchased a specific product
   */
  static async hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    // Check cache first
    const cacheKey = `${this.cachePrefix}-product-${userId}-${productId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached !== null) {
      return cached as boolean;
    }

    try {
      // Query orders where:
      // 1. customerId matches userId
      // 2. paymentStatus is 'paid'
      // 3. status is not 'cancelled'
      // 4. items array contains the productId
      const orders = await FirebaseAdminService.queryDocuments<Order>(
        Collections.ORDERS,
        [
          { field: 'customerId', operator: '==', value: userId },
          { field: 'paymentStatus', operator: '==', value: 'paid' }
        ]
      );

      // Filter orders that are not cancelled and contain the product
      const hasPurchased = orders.some(order => {
        if (order.status === 'cancelled') {
          return false;
        }

        // Check if any item in the order matches the productId
        return order.items.some(item => item.productId === productId);
      });

      // Cache the result
      await CacheService.set(cacheKey, hasPurchased, this.cacheTTL);

      return hasPurchased;
    } catch (error) {
      console.error('Error checking purchase status:', error);
      // Fail securely - return false if verification fails
      return false;
    }
  }

  /**
   * Check if a user has purchased a specific design
   * Note: Designs might be purchased through customization requests or direct orders
   */
  static async hasPurchasedDesign(userId: string, designId: string): Promise<boolean> {
    // Check cache first
    const cacheKey = `${this.cachePrefix}-design-${userId}-${designId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached !== null) {
      return cached as boolean;
    }

    try {
      // For designs, we need to check:
      // 1. Orders with paid status that reference the design
      // 2. Customization requests that are linked to orders and paid
      
      // First, check orders
      const orders = await FirebaseAdminService.queryDocuments<Order>(
        Collections.ORDERS,
        [
          { field: 'customerId', operator: '==', value: userId },
          { field: 'paymentStatus', operator: '==', value: 'paid' }
        ]
      );

      // Check if any order references this design
      // Note: This assumes designs can be referenced in order items or customization requests
      const hasPurchased = orders.some(order => {
        if (order.status === 'cancelled') {
          return false;
        }

        // Check if order has a customization request that references the design
        if (order.customizationRequestId) {
          // We'd need to fetch the customization request to check designId
          // For now, we'll check if the order itself indicates design purchase
          // This might need refinement based on your data model
        }

        // Check if any item references the design
        return order.items.some(item => {
          const orderItem = item as any;
          // Check if item has designId field or itemType is 'design'
          return orderItem.designId === designId || 
                 (orderItem.itemType === 'design' && orderItem.designId === designId);
        });
      });

      // Cache the result
      await CacheService.set(cacheKey, hasPurchased, this.cacheTTL);

      return hasPurchased;
    } catch (error) {
      console.error('Error checking design purchase status:', error);
      // Fail securely - return false if verification fails
      return false;
    }
  }

  /**
   * Get all products a user has purchased
   */
  static async getUserPurchasedProducts(userId: string): Promise<string[]> {
    const cacheKey = `${this.cachePrefix}-products-${userId}`;
    const cached = await CacheService.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const orders = await FirebaseAdminService.queryDocuments<Order>(
        Collections.ORDERS,
        [
          { field: 'customerId', operator: '==', value: userId },
          { field: 'paymentStatus', operator: '==', value: 'paid' }
        ]
      );

      const productIds = new Set<string>();
      orders.forEach(order => {
        if (order.status !== 'cancelled') {
          order.items.forEach(item => {
            if (item.productId) {
              productIds.add(item.productId);
            }
          });
        }
      });

      const productIdsArray = Array.from(productIds);
      await CacheService.set(cacheKey, productIdsArray, this.cacheTTL);
      return productIdsArray;
    } catch (error) {
      console.error('Error getting user purchased products:', error);
      return [];
    }
  }

  /**
   * Clear purchase cache for a user (call after purchase completion)
   */
  static async clearUserCache(userId: string): Promise<void> {
    // Note: This is a simple implementation
    // In production, you might want to use cache tags or patterns
    const patterns = [
      `${this.cachePrefix}-product-${userId}-`,
      `${this.cachePrefix}-design-${userId}-`,
      `${this.cachePrefix}-products-${userId}`
    ];

    // CacheService might need a method to clear by pattern
    // For now, we'll just let the cache expire naturally
  }
}






