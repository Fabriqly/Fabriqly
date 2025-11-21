import { IShopProfileService } from './interfaces/IShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import {
  ShopProfile,
  CreateShopProfileData,
  UpdateShopProfileData,
  ShopProfileFilters,
  ShopProfileStats,
  ShopProfileValidationResult,
  ShopApprovalAction,
  ApprovalStatus,
  BusinessType
} from '@/types/shop-profile';
import { CacheService } from './CacheService';
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';
import { AppError } from '@/errors/AppError';
import { Timestamp } from 'firebase/firestore';

export class ShopProfileService implements IShopProfileService {
  constructor(
    private shopProfileRepository: ShopProfileRepository,
    private activityRepository: ActivityRepository
  ) {}

  async createShopProfile(data: CreateShopProfileData, userId: string): Promise<ShopProfile> {
    return PerformanceMonitor.measure('ShopProfileService.createShopProfile', async () => {
      // Validate data
      const validation = this.validateShopProfileData(data);
      if (!validation.isValid) {
        throw AppError.badRequest(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user already has an active/pending/approved shop profile
      const existingProfile = await this.shopProfileRepository.findByUserId(userId);
      if (existingProfile) {
        if (existingProfile.approvalStatus !== 'rejected') {
          throw AppError.badRequest('User already has a shop profile');
        }
        // Delete the old rejected profile to allow creating a new one
        await this.shopProfileRepository.delete(existingProfile.id);
        CacheService.invalidate(`shop_profile_${existingProfile.id}`);
        CacheService.invalidate(CacheService.userKey(`shop_profile_${userId}`));
      }

      // Check if username is available
      const isUsernameAvailable = await this.isUsernameAvailable(data.username);
      if (!isUsernameAvailable) {
        throw AppError.badRequest('Username is already taken');
      }

      // Check if shop name is available
      const isShopNameAvailable = await this.isShopNameAvailable(data.shopName);
      if (!isShopNameAvailable) {
        throw AppError.badRequest('Shop name is already taken');
      }

      // Create shop profile data
      const shopData: Omit<ShopProfile, 'id'> = {
        shopName: data.shopName,
        username: data.username.toLowerCase(),
        businessOwnerName: data.businessOwnerName,
        userId,
        contactInfo: data.contactInfo,
        location: data.location,
        branding: data.branding || {},
        businessDetails: data.businessDetails,
        description: data.description,
        specialties: data.specialties || [],
        supportedProductCategories: data.supportedProductCategories,
        customizationPolicy: data.customizationPolicy,
        socialMedia: data.socialMedia,
        website: data.website,
        ratings: {
          averageRating: 0,
          totalReviews: 0,
          totalOrders: 0
        },
        shopStats: {
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalViews: 0
        },
        approvalStatus: 'pending',
        isVerified: false,
        isActive: true,
        isFeatured: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Create shop profile
      const shop = await this.shopProfileRepository.create(shopData);

      // Log activity
      await this.activityRepository.create({
        type: 'shop_profile_created',
        actorId: userId,
        targetId: shop.id,
        targetType: 'shop_profile',
        title: 'Shop Profile Created',
        description: `New shop profile created: ${shop.shopName}`,
        priority: 'medium',
        status: 'active',
        metadata: {
          shopName: shop.shopName,
          username: shop.username,
          businessType: shop.businessDetails.businessType
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Cache the profile
      CacheService.set(
        CacheService.userKey(`shop_profile_${userId}`),
        shop,
        15 * 60 * 1000
      );

      return shop;
    });
  }

  async updateShopProfile(id: string, data: UpdateShopProfileData, userId: string): Promise<ShopProfile> {
    return PerformanceMonitor.measure('ShopProfileService.updateShopProfile', async () => {
      // Check if user can modify this shop
      const canModify = await this.canUserModifyShop(id, userId);
      if (!canModify) {
        throw AppError.forbidden('You do not have permission to modify this shop');
      }

      // Get existing shop
      const existingShop = await this.shopProfileRepository.findById(id);
      if (!existingShop) {
        throw AppError.notFound('Shop profile not found');
      }

      // Check username availability if it's being changed
      if (data.username && data.username !== existingShop.username) {
        const isUsernameAvailable = await this.isUsernameAvailable(data.username, id);
        if (!isUsernameAvailable) {
          throw AppError.badRequest('Username is already taken');
        }
      }

      // Check shop name availability if it's being changed
      if (data.shopName && data.shopName !== existingShop.shopName) {
        const isShopNameAvailable = await this.isShopNameAvailable(data.shopName, id);
        if (!isShopNameAvailable) {
          throw AppError.badRequest('Shop name is already taken');
        }
      }

      // Update shop profile
      const updatedShop = await this.shopProfileRepository.update(id, {
        ...data,
        updatedAt: Timestamp.now()
      });

      // Log activity
      await this.activityRepository.create({
        type: 'shop_profile_updated',
        actorId: userId,
        targetId: id,
        targetType: 'shop_profile',
        title: 'Shop Profile Updated',
        description: `Shop profile updated: ${updatedShop.shopName}`,
        priority: 'low',
        status: 'active',
        metadata: {
          shopName: updatedShop.shopName,
          changes: Object.keys(data)
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Update cache
      CacheService.set(
        CacheService.userKey(`shop_profile_${userId}`),
        updatedShop,
        15 * 60 * 1000
      );
      CacheService.invalidate(`shop_profile_${id}`);

      return updatedShop;
    });
  }

  async deleteShopProfile(id: string, userId: string): Promise<void> {
    return PerformanceMonitor.measure('ShopProfileService.deleteShopProfile', async () => {
      // Check if user can modify this shop
      const canModify = await this.canUserModifyShop(id, userId);
      if (!canModify) {
        throw AppError.forbidden('You do not have permission to delete this shop');
      }

      // Get shop for logging
      const shop = await this.shopProfileRepository.findById(id);
      if (!shop) {
        throw AppError.notFound('Shop profile not found');
      }

      // Delete shop
      await this.shopProfileRepository.delete(id);

      // Log activity
      await this.activityRepository.create({
        type: 'shop_profile_updated',
        actorId: userId,
        targetId: id,
        targetType: 'shop_profile',
        title: 'Shop Profile Deleted',
        description: `Shop profile deleted: ${shop.shopName}`,
        priority: 'high',
        status: 'active',
        metadata: {
          shopName: shop.shopName
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Clear cache
      CacheService.delete(CacheService.userKey(`shop_profile_${userId}`));
      CacheService.invalidate(`shop_profile_${id}`);
    });
  }

  async getShopProfile(id: string): Promise<ShopProfile | null> {
    return PerformanceMonitor.measure('ShopProfileService.getShopProfile', async () => {
      // Try cache first
      const cacheKey = CacheService.generateKey('shop_profile', id);
      const cached = await CacheService.get<ShopProfile>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const shop = await this.shopProfileRepository.findById(id);
      
      // Cache the result
      if (shop) {
        CacheService.set(cacheKey, shop, 15 * 60 * 1000);
      }

      return shop;
    });
  }

  async getShopProfileByUserId(userId: string): Promise<ShopProfile | null> {
    return PerformanceMonitor.measure('ShopProfileService.getShopProfileByUserId', async () => {
      // Try cache first
      const cacheKey = CacheService.userKey(`shop_profile_${userId}`);
      const cached = await CacheService.get<ShopProfile>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const shop = await this.shopProfileRepository.findByUserId(userId);
      
      // Cache the result
      if (shop) {
        CacheService.set(cacheKey, shop, 15 * 60 * 1000);
      }

      return shop;
    });
  }

  async getShopProfileByUsername(username: string): Promise<ShopProfile | null> {
    return PerformanceMonitor.measure('ShopProfileService.getShopProfileByUsername', async () => {
      // Try cache first
      const cacheKey = CacheService.generateKey('shop_profile_username', username);
      const cached = await CacheService.get<ShopProfile>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const shop = await this.shopProfileRepository.findByUsername(username.toLowerCase());
      
      // Cache the result
      if (shop) {
        CacheService.set(cacheKey, shop, 15 * 60 * 1000);
      }

      return shop;
    });
  }

  async getShopProfiles(filters?: ShopProfileFilters): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.getShopProfiles', async () => {
      // Generate cache key based on filters
      const cacheKey = CacheService.generateKey('shop_profiles', JSON.stringify(filters || {}));
      const cached = await CacheService.get<ShopProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      let shops: ShopProfile[] = [];

      if (filters?.search) {
        shops = await this.shopProfileRepository.searchShops(filters.search);
      } else if (filters?.username) {
        const shop = await this.shopProfileRepository.findByUsername(filters.username);
        shops = shop ? [shop] : [];
      } else if (filters?.approvalStatus) {
        shops = await this.shopProfileRepository.findByApprovalStatus(filters.approvalStatus);
      } else if (filters?.businessType) {
        shops = await this.shopProfileRepository.findByBusinessType(filters.businessType);
      } else if (filters?.location?.city || filters?.location?.province) {
        shops = await this.shopProfileRepository.findByLocation(
          filters.location.city,
          filters.location.province
        );
      } else {
        // Get all approved active shops
        shops = await this.shopProfileRepository.findAll({
          filters: [
            { field: 'isActive', operator: '==', value: true },
            { field: 'approvalStatus', operator: '==', value: 'approved' }
          ],
          orderBy: { field: 'createdAt', direction: 'desc' }
        });
      }

      // Apply additional filters
      if (filters?.userId) {
        shops = shops.filter(s => s.userId === filters.userId);
      }
      if (filters?.isVerified !== undefined) {
        shops = shops.filter(s => s.isVerified === filters.isVerified);
      }
      if (filters?.isActive !== undefined) {
        shops = shops.filter(s => s.isActive === filters.isActive);
      }
      if (filters?.isFeatured !== undefined) {
        shops = shops.filter(s => s.isFeatured === filters.isFeatured);
      }
      if (filters?.minRating) {
        shops = shops.filter(s => s.ratings.averageRating >= filters.minRating!);
      }

      // Cache the result
      CacheService.set(cacheKey, shops, 5 * 60 * 1000);

      return shops;
    });
  }

  async searchShops(searchTerm: string): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.searchShops', async () => {
      const cacheKey = CacheService.generateKey('shop_search', searchTerm);
      const cached = await CacheService.get<ShopProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const shops = await this.shopProfileRepository.searchShops(searchTerm);
      
      CacheService.set(cacheKey, shops, 2 * 60 * 1000);
      return shops;
    });
  }

  async getTopRatedShops(limit: number = 10): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.getTopRatedShops', async () => {
      const cacheKey = CacheService.generateKey('shops_top_rated', limit.toString());
      const cached = await CacheService.get<ShopProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const shops = await this.shopProfileRepository.getTopRatedShops(limit);
      
      CacheService.set(cacheKey, shops, 5 * 60 * 1000);
      return shops;
    });
  }

  async getMostPopularShops(limit: number = 10): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.getMostPopularShops', async () => {
      const cacheKey = CacheService.generateKey('shops_popular', limit.toString());
      const cached = await CacheService.get<ShopProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const shops = await this.shopProfileRepository.getMostPopularShops(limit);
      
      CacheService.set(cacheKey, shops, 5 * 60 * 1000);
      return shops;
    });
  }

  async getNewestShops(limit: number = 10): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.getNewestShops', async () => {
      const cacheKey = CacheService.generateKey('shops_newest', limit.toString());
      const cached = await CacheService.get<ShopProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const shops = await this.shopProfileRepository.getNewestShops(limit);
      
      CacheService.set(cacheKey, shops, 5 * 60 * 1000);
      return shops;
    });
  }

  async getFeaturedShops(limit: number = 10): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.getFeaturedShops', async () => {
      const cacheKey = CacheService.generateKey('shops_featured', limit.toString());
      const cached = await CacheService.get<ShopProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const shops = await this.shopProfileRepository.findFeaturedShops(limit);
      
      CacheService.set(cacheKey, shops, 10 * 60 * 1000);
      return shops;
    });
  }

  async getShopsByLocation(city?: string, province?: string): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.getShopsByLocation', async () => {
      const cacheKey = CacheService.generateKey('shops_location', `${city}_${province}`);
      const cached = await CacheService.get<ShopProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const shops = await this.shopProfileRepository.findByLocation(city, province);
      
      CacheService.set(cacheKey, shops, 5 * 60 * 1000);
      return shops;
    });
  }

  async getShopsByBusinessType(businessType: string): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.getShopsByBusinessType', async () => {
      const cacheKey = CacheService.generateKey('shops_business_type', businessType);
      const cached = await CacheService.get<ShopProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const shops = await this.shopProfileRepository.findByBusinessType(businessType as BusinessType);
      
      CacheService.set(cacheKey, shops, 5 * 60 * 1000);
      return shops;
    });
  }

  async getShopsBySupportedCategory(categoryId: string): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.getShopsBySupportedCategory', async () => {
      const cacheKey = CacheService.generateKey('shops_category', categoryId);
      const cached = await CacheService.get<ShopProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const shops = await this.shopProfileRepository.findBySupportedCategory(categoryId);
      
      CacheService.set(cacheKey, shops, 5 * 60 * 1000);
      return shops;
    });
  }

  async getShopStats(shopId: string): Promise<ShopProfileStats | null> {
    return PerformanceMonitor.measure('ShopProfileService.getShopStats', async () => {
      const cacheKey = CacheService.generateKey('shop_stats', shopId);
      const cached = await CacheService.get<ShopProfileStats>(cacheKey);
      if (cached) {
        return cached;
      }

      const stats = await this.shopProfileRepository.getShopStats(shopId);
      
      if (stats) {
        CacheService.set(cacheKey, stats, 5 * 60 * 1000);
      }

      return stats;
    });
  }

  async updateShopStats(shopId: string, stats: Partial<ShopProfile['shopStats']>): Promise<ShopProfile> {
    return PerformanceMonitor.measure('ShopProfileService.updateShopStats', async () => {
      const shop = await this.shopProfileRepository.updateShopStats(shopId, stats);
      
      // Invalidate all relevant cache keys
      CacheService.invalidate(`shop_profile_${shopId}`);
      CacheService.invalidate(`shop_stats_${shopId}`);
      
      // Also invalidate cache by userId (used in getShopProfileByUserId)
      if (shop.userId) {
        CacheService.invalidate(CacheService.userKey(`shop_profile_${shop.userId}`));
      }
      
      return shop;
    });
  }

  async updateShopRatings(shopId: string, ratings: Partial<ShopProfile['ratings']>): Promise<ShopProfile> {
    return PerformanceMonitor.measure('ShopProfileService.updateShopRatings', async () => {
      const shop = await this.shopProfileRepository.updateShopRatings(shopId, ratings);
      
      CacheService.invalidate(`shop_profile_${shopId}`);
      CacheService.invalidate(`shop_stats_${shopId}`);
      
      return shop;
    });
  }

  async incrementProductCount(shopId: string): Promise<void> {
    await this.shopProfileRepository.incrementProductCount(shopId);
    CacheService.invalidate(`shop_profile_${shopId}`);
    CacheService.invalidate(`shop_stats_${shopId}`);
  }

  async decrementProductCount(shopId: string): Promise<void> {
    await this.shopProfileRepository.decrementProductCount(shopId);
    CacheService.invalidate(`shop_profile_${shopId}`);
    CacheService.invalidate(`shop_stats_${shopId}`);
  }

  async incrementOrderCount(shopId: string, orderAmount: number): Promise<void> {
    await this.shopProfileRepository.incrementOrderCount(shopId, orderAmount);
    CacheService.invalidate(`shop_profile_${shopId}`);
    CacheService.invalidate(`shop_stats_${shopId}`);
  }

  async incrementViewCount(shopId: string): Promise<void> {
    await this.shopProfileRepository.incrementViewCount(shopId);
    CacheService.invalidate(`shop_profile_${shopId}`);
    CacheService.invalidate(`shop_stats_${shopId}`);
  }

  async approveShop(shopId: string, adminId: string): Promise<ShopProfile> {
    const shop = await this.shopProfileRepository.update(shopId, {
      approvalStatus: 'approved',
      approvedBy: adminId,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Log activity
    await this.activityRepository.create({
      type: 'shop_approved',
      actorId: adminId,
      targetId: shopId,
      targetType: 'shop_profile',
      title: 'Shop Approved',
      description: `Shop approved: ${shop.shopName}`,
      priority: 'high',
      status: 'active',
      metadata: { shopName: shop.shopName },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    CacheService.invalidate(`shop_profile_${shopId}`);
    return shop;
  }

  async rejectShop(shopId: string, adminId: string, reason: string): Promise<ShopProfile> {
    const shop = await this.shopProfileRepository.update(shopId, {
      approvalStatus: 'rejected',
      rejectionReason: reason,
      updatedAt: Timestamp.now()
    });

    // Log activity
    await this.activityRepository.create({
      type: 'shop_rejected',
      actorId: adminId,
      targetId: shopId,
      targetType: 'shop_profile',
      title: 'Shop Rejected',
      description: `Shop rejected: ${shop.shopName}`,
      priority: 'high',
      status: 'active',
      metadata: { shopName: shop.shopName, reason },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    CacheService.invalidate(`shop_profile_${shopId}`);
    return shop;
  }

  async suspendShop(shopId: string, adminId: string, reason: string): Promise<ShopProfile> {
    const shop = await this.shopProfileRepository.update(shopId, {
      approvalStatus: 'suspended',
      isActive: false,
      updatedAt: Timestamp.now()
    });

    // Log activity
    await this.activityRepository.create({
      type: 'shop_suspended',
      actorId: adminId,
      targetId: shopId,
      targetType: 'shop_profile',
      title: 'Shop Suspended',
      description: `Shop suspended: ${shop.shopName}`,
      priority: 'high',
      status: 'active',
      metadata: { shopName: shop.shopName, reason },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    CacheService.invalidate(`shop_profile_${shopId}`);
    return shop;
  }

  async activateShop(shopId: string, adminId: string): Promise<ShopProfile> {
    const shop = await this.shopProfileRepository.update(shopId, {
      isActive: true,
      approvalStatus: 'approved',
      updatedAt: Timestamp.now()
    });

    // Log activity
    await this.activityRepository.create({
      type: 'shop_activated',
      actorId: adminId,
      targetId: shopId,
      targetType: 'shop_profile',
      title: 'Shop Activated',
      description: `Shop activated: ${shop.shopName}`,
      priority: 'medium',
      status: 'active',
      metadata: { shopName: shop.shopName },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    CacheService.invalidate(`shop_profile_${shopId}`);
    return shop;
  }

  async verifyShop(shopId: string): Promise<ShopProfile> {
    const shop = await this.shopProfileRepository.update(shopId, {
      isVerified: true,
      updatedAt: Timestamp.now()
    });

    CacheService.invalidate(`shop_profile_${shopId}`);
    return shop;
  }

  async unverifyShop(shopId: string): Promise<ShopProfile> {
    const shop = await this.shopProfileRepository.update(shopId, {
      isVerified: false,
      updatedAt: Timestamp.now()
    });

    CacheService.invalidate(`shop_profile_${shopId}`);
    return shop;
  }

  async getPendingApprovals(limit: number = 20): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.getPendingApprovals', async () => {
      const shops = await this.shopProfileRepository.findPendingApproval();
      
      const cacheKey = CacheService.generateKey('shops_pending');
      CacheService.set(cacheKey, shops, 5 * 60 * 1000);
      
      return shops.slice(0, limit);
    });
  }

  async getShopsByApprovalStatus(status: ApprovalStatus): Promise<ShopProfile[]> {
    return PerformanceMonitor.measure('ShopProfileService.getShopsByApprovalStatus', async () => {
      const cacheKey = CacheService.generateKey('shops_status', status);
      const cached = await CacheService.get<ShopProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const shops = await this.shopProfileRepository.findByApprovalStatus(status);
      
      CacheService.set(cacheKey, shops, 5 * 60 * 1000);
      return shops;
    });
  }

  async getApprovalStats(): Promise<{
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalSuspended: number;
    totalActive: number;
  }> {
    return PerformanceMonitor.measure('ShopProfileService.getApprovalStats', async () => {
      return await this.shopProfileRepository.getApprovalStats();
    });
  }

  async bulkUpdateApprovalStatus(action: ShopApprovalAction): Promise<void> {
    return PerformanceMonitor.measure('ShopProfileService.bulkUpdateApprovalStatus', async () => {
      const status: ApprovalStatus = 
        action.action === 'approve' ? 'approved' :
        action.action === 'reject' ? 'rejected' :
        action.action === 'suspend' ? 'suspended' : 'approved';

      await this.shopProfileRepository.bulkUpdateApprovalStatus(
        [action.shopId],
        status,
        action.adminId,
        action.reason
      );

      // Invalidate caches
      CacheService.invalidate(`shop_profile_${action.shopId}`);
      CacheService.invalidate('shops_pending');
      CacheService.invalidate('shops_status');
    });
  }

  validateShopProfileData(data: CreateShopProfileData): ShopProfileValidationResult {
    const errors: string[] = [];

    // Shop Name Validation
    if (!data.shopName || data.shopName.trim().length === 0) {
      errors.push('Shop name is required');
    } else if (data.shopName.length < 2) {
      errors.push('Shop name must be at least 2 characters long');
    } else if (data.shopName.length > 100) {
      errors.push('Shop name must be less than 100 characters');
    }

    // Username Validation
    if (!data.username || data.username.trim().length === 0) {
      errors.push('Username is required');
    } else if (data.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    } else if (data.username.length > 50) {
      errors.push('Username must be less than 50 characters');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }

    // Business Owner Name Validation
    if (!data.businessOwnerName || data.businessOwnerName.trim().length === 0) {
      errors.push('Business owner name is required');
    }

    // Contact Info Validation
    if (!data.contactInfo.email || !this.isValidEmail(data.contactInfo.email)) {
      errors.push('Valid email address is required');
    }
    if (data.contactInfo.phone && !this.isValidPhone(data.contactInfo.phone)) {
      errors.push('Phone number must be valid');
    }

    // Description Validation
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Shop description is required');
    } else if (data.description.length < 20) {
      errors.push('Description must be at least 20 characters long');
    } else if (data.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    // Website Validation
    if (data.website && !this.isValidUrl(data.website)) {
      errors.push('Website must be a valid URL');
    }

    // Social Media Validation
    if (data.socialMedia) {
      if (data.socialMedia.facebook && !this.isValidUrl(data.socialMedia.facebook)) {
        errors.push('Facebook URL must be valid');
      }
      if (data.socialMedia.instagram && !this.isValidUrl(data.socialMedia.instagram)) {
        errors.push('Instagram URL must be valid');
      }
      if (data.socialMedia.tiktok && !this.isValidUrl(data.socialMedia.tiktok)) {
        errors.push('TikTok URL must be valid');
      }
      if (data.socialMedia.twitter && !this.isValidUrl(data.socialMedia.twitter)) {
        errors.push('Twitter URL must be valid');
      }
    }

    // Supported Categories Validation
    if (!data.supportedProductCategories || data.supportedProductCategories.length === 0) {
      errors.push('At least one supported product category is required');
    }

    // Specialties Validation
    if (data.specialties && data.specialties.length > 20) {
      errors.push('Maximum 20 specialties allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async canUserModifyShop(shopId: string, userId: string): Promise<boolean> {
    const shop = await this.shopProfileRepository.findById(shopId);
    return shop ? shop.userId === userId : false;
  }

  async isUsernameAvailable(username: string, excludeId?: string): Promise<boolean> {
    const shop = await this.shopProfileRepository.findByUsername(username.toLowerCase());
    
    if (!shop) return true;
    if (excludeId && shop.id === excludeId) return true;
    
    return false;
  }

  async isShopNameAvailable(shopName: string, excludeId?: string): Promise<boolean> {
    const shops = await this.shopProfileRepository.findByShopName(shopName);
    
    if (shops.length === 0) return true;
    if (excludeId) {
      return shops.filter(s => s.id !== excludeId).length === 0;
    }
    
    return false;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}


