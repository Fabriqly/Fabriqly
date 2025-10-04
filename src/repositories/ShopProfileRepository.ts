import { BaseRepository } from './BaseRepository';
import { ShopProfile, ApprovalStatus, BusinessType } from '@/types/shop-profile';
import { Collections } from '@/services/firebase';

export class ShopProfileRepository extends BaseRepository<ShopProfile> {
  constructor() {
    super(Collections.SHOP_PROFILES);
  }

  // Find shop profile by user ID
  async findByUserId(userId: string): Promise<ShopProfile | null> {
    const results = await this.findAll({
      filters: [{ field: 'userId', operator: '==', value: userId }]
    });
    return results.length > 0 ? results[0] : null;
  }

  // Find shop profile by username
  async findByUsername(username: string): Promise<ShopProfile | null> {
    const results = await this.findAll({
      filters: [{ field: 'username', operator: '==', value: username }]
    });
    return results.length > 0 ? results[0] : null;
  }

  // Find shop profile by shop name
  async findByShopName(shopName: string): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [{ field: 'shopName', operator: '==', value: shopName }]
    });
  }

  // Find approved shops
  async findApprovedShops(): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [
        { field: 'approvalStatus', operator: '==', value: 'approved' },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  // Find shops by approval status
  async findByApprovalStatus(status: ApprovalStatus): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [{ field: 'approvalStatus', operator: '==', value: status }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  // Find pending approval shops
  async findPendingApproval(): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [
        { field: 'approvalStatus', operator: '==', value: 'pending' },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'asc' }
    });
  }

  // Find verified shops
  async findVerifiedShops(): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [
        { field: 'isVerified', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'approved' }
      ],
      orderBy: { field: 'ratings.averageRating', direction: 'desc' }
    });
  }

  // Find featured shops
  async findFeaturedShops(limit: number = 10): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [
        { field: 'isFeatured', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'approved' }
      ],
      orderBy: { field: 'ratings.averageRating', direction: 'desc' },
      limit
    });
  }

  // Find shops by business type
  async findByBusinessType(businessType: BusinessType): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [
        { field: 'businessDetails.businessType', operator: '==', value: businessType },
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'approved' }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  // Find shops by location
  async findByLocation(city?: string, province?: string): Promise<ShopProfile[]> {
    const filters: any[] = [
      { field: 'isActive', operator: '==', value: true },
      { field: 'approvalStatus', operator: '==', value: 'approved' }
    ];

    if (city) {
      filters.push({ field: 'location.city', operator: '==', value: city });
    }
    if (province) {
      filters.push({ field: 'location.province', operator: '==', value: province });
    }

    return this.findAll({
      filters,
      orderBy: { field: 'ratings.averageRating', direction: 'desc' }
    });
  }

  // Find shops by supported category
  async findBySupportedCategory(categoryId: string): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [
        { field: 'supportedProductCategories', operator: 'array-contains', value: categoryId },
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'approved' }
      ],
      orderBy: { field: 'ratings.averageRating', direction: 'desc' }
    });
  }

  // Search shops
  async searchShops(searchTerm: string): Promise<ShopProfile[]> {
    const results: ShopProfile[] = [];
    
    // Search by shop name
    const shopNameResults = await this.findAll({
      filters: [
        { field: 'shopName', operator: '>=', value: searchTerm },
        { field: 'shopName', operator: '<=', value: searchTerm + '\uf8ff' },
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'approved' }
      ]
    });
    results.push(...shopNameResults);
    
    // Search by description
    const allActiveShops = await this.findAll({
      filters: [
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'approved' }
      ]
    });
    
    const descriptionResults = allActiveShops.filter(shop => 
      shop.description && shop.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    results.push(...descriptionResults);
    
    // Search by specialties
    const specialtyResults = allActiveShops.filter(shop =>
      shop.specialties && shop.specialties.some(specialty =>
        specialty.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    results.push(...specialtyResults);
    
    // Remove duplicates
    const uniqueResults = results.filter((shop, index, self) => 
      index === self.findIndex(s => s.id === shop.id)
    );
    
    return uniqueResults;
  }

  // Get top rated shops
  async getTopRatedShops(limit: number = 10): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'approved' },
        { field: 'ratings.averageRating', operator: '>', value: 0 }
      ],
      orderBy: { field: 'ratings.averageRating', direction: 'desc' },
      limit
    });
  }

  // Get most popular shops (by total orders)
  async getMostPopularShops(limit: number = 10): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'approved' }
      ],
      orderBy: { field: 'shopStats.totalOrders', direction: 'desc' },
      limit
    });
  }

  // Get newest shops
  async getNewestShops(limit: number = 10): Promise<ShopProfile[]> {
    return this.findAll({
      filters: [
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'approved' }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    });
  }

  // Update shop stats
  async updateShopStats(
    shopId: string,
    stats: Partial<ShopProfile['shopStats']>
  ): Promise<ShopProfile> {
    const shop = await this.findById(shopId);
    if (!shop) {
      throw new Error('Shop profile not found');
    }

    const updatedStats = {
      ...shop.shopStats,
      ...stats
    };

    return this.update(shopId, { shopStats: updatedStats });
  }

  // Update shop ratings
  async updateShopRatings(
    shopId: string,
    ratings: Partial<ShopProfile['ratings']>
  ): Promise<ShopProfile> {
    const shop = await this.findById(shopId);
    if (!shop) {
      throw new Error('Shop profile not found');
    }

    const updatedRatings = {
      ...shop.ratings,
      ...ratings
    };

    return this.update(shopId, { ratings: updatedRatings });
  }

  // Increment product count
  async incrementProductCount(shopId: string): Promise<void> {
    const shop = await this.findById(shopId);
    if (shop) {
      await this.updateShopStats(shopId, {
        totalProducts: shop.shopStats.totalProducts + 1
      });
    }
  }

  // Decrement product count
  async decrementProductCount(shopId: string): Promise<void> {
    const shop = await this.findById(shopId);
    if (shop) {
      await this.updateShopStats(shopId, {
        totalProducts: Math.max(0, shop.shopStats.totalProducts - 1)
      });
    }
  }

  // Increment order count
  async incrementOrderCount(shopId: string, orderAmount: number): Promise<void> {
    const shop = await this.findById(shopId);
    if (shop) {
      await this.updateShopStats(shopId, {
        totalOrders: shop.shopStats.totalOrders + 1,
        totalRevenue: shop.shopStats.totalRevenue + orderAmount
      });
    }
  }

  // Increment view count
  async incrementViewCount(shopId: string): Promise<void> {
    const shop = await this.findById(shopId);
    if (shop) {
      await this.updateShopStats(shopId, {
        totalViews: shop.shopStats.totalViews + 1
      });
    }
  }

  // Get shop statistics
  async getShopStats(shopId: string): Promise<{
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalViews: number;
    averageRating: number;
    totalReviews: number;
    isVerified: boolean;
    isActive: boolean;
    approvalStatus: ApprovalStatus;
    createdAt: Date;
  } | null> {
    const shop = await this.findById(shopId);
    if (!shop) {
      return null;
    }

    return {
      totalProducts: shop.shopStats.totalProducts,
      totalOrders: shop.shopStats.totalOrders,
      totalRevenue: shop.shopStats.totalRevenue,
      totalViews: shop.shopStats.totalViews,
      averageRating: shop.ratings.averageRating,
      totalReviews: shop.ratings.totalReviews,
      isVerified: shop.isVerified,
      isActive: shop.isActive,
      approvalStatus: shop.approvalStatus,
      createdAt: shop.createdAt instanceof Date ? shop.createdAt : shop.createdAt.toDate()
    };
  }

  // Approval management
  async getApprovalStats(): Promise<{
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalSuspended: number;
    totalActive: number;
  }> {
    const allShops = await this.findAll();
    
    return {
      totalPending: allShops.filter(s => s.approvalStatus === 'pending').length,
      totalApproved: allShops.filter(s => s.approvalStatus === 'approved').length,
      totalRejected: allShops.filter(s => s.approvalStatus === 'rejected').length,
      totalSuspended: allShops.filter(s => s.approvalStatus === 'suspended').length,
      totalActive: allShops.filter(s => s.isActive).length,
    };
  }

  // Get shops requiring review (pending with products)
  async getShopsRequiringReview(minProducts: number = 1): Promise<ShopProfile[]> {
    const pendingShops = await this.findPendingApproval();
    return pendingShops.filter(shop => shop.shopStats.totalProducts >= minProducts);
  }

  // Bulk update approval status
  async bulkUpdateApprovalStatus(
    shopIds: string[],
    approvalStatus: ApprovalStatus,
    adminId: string,
    reason?: string
  ): Promise<void> {
    const updatePromises = shopIds.map(shopId => {
      const updateData: any = {
        approvalStatus,
        updatedAt: new Date()
      };

      if (approvalStatus === 'approved') {
        updateData.approvedBy = adminId;
        updateData.approvedAt = new Date();
      } else if (approvalStatus === 'rejected' && reason) {
        updateData.rejectionReason = reason;
      }

      return this.update(shopId, updateData);
    });

    await Promise.all(updatePromises);
  }
}


