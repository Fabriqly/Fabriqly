import {
  ShopProfile,
  CreateShopProfileData,
  UpdateShopProfileData,
  ShopProfileFilters,
  ShopProfileStats,
  ShopProfileValidationResult,
  ShopApprovalAction,
  ApprovalStatus
} from '@/types/shop-profile';

export interface IShopProfileService {
  // CRUD Operations
  createShopProfile(data: CreateShopProfileData, userId: string): Promise<ShopProfile>;
  updateShopProfile(id: string, data: UpdateShopProfileData, userId: string): Promise<ShopProfile>;
  deleteShopProfile(id: string, userId: string): Promise<void>;
  getShopProfile(id: string): Promise<ShopProfile | null>;
  getShopProfileByUserId(userId: string): Promise<ShopProfile | null>;
  getShopProfileByUsername(username: string): Promise<ShopProfile | null>;
  getShopProfiles(filters?: ShopProfileFilters): Promise<ShopProfile[]>;

  // Search & Discovery
  searchShops(searchTerm: string): Promise<ShopProfile[]>;
  getTopRatedShops(limit?: number): Promise<ShopProfile[]>;
  getMostPopularShops(limit?: number): Promise<ShopProfile[]>;
  getNewestShops(limit?: number): Promise<ShopProfile[]>;
  getFeaturedShops(limit?: number): Promise<ShopProfile[]>;
  getShopsByLocation(city?: string, province?: string): Promise<ShopProfile[]>;
  getShopsByBusinessType(businessType: string): Promise<ShopProfile[]>;
  getShopsBySupportedCategory(categoryId: string): Promise<ShopProfile[]>;

  // Stats & Analytics
  getShopStats(shopId: string): Promise<ShopProfileStats | null>;
  updateShopStats(shopId: string, stats: Partial<ShopProfile['shopStats']>): Promise<ShopProfile>;
  updateShopRatings(shopId: string, ratings: Partial<ShopProfile['ratings']>): Promise<ShopProfile>;
  incrementProductCount(shopId: string): Promise<void>;
  decrementProductCount(shopId: string): Promise<void>;
  incrementOrderCount(shopId: string, orderAmount: number): Promise<void>;
  incrementViewCount(shopId: string): Promise<void>;

  // Approval & Verification Management
  approveShop(shopId: string, adminId: string): Promise<ShopProfile>;
  rejectShop(shopId: string, adminId: string, reason: string): Promise<ShopProfile>;
  suspendShop(shopId: string, adminId: string, reason: string): Promise<ShopProfile>;
  activateShop(shopId: string, adminId: string): Promise<ShopProfile>;
  verifyShop(shopId: string): Promise<ShopProfile>;
  unverifyShop(shopId: string): Promise<ShopProfile>;
  getPendingApprovals(limit?: number): Promise<ShopProfile[]>;
  getShopsByApprovalStatus(status: ApprovalStatus): Promise<ShopProfile[]>;
  getApprovalStats(): Promise<{
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalSuspended: number;
    totalActive: number;
  }>;
  bulkUpdateApprovalStatus(action: ShopApprovalAction): Promise<void>;

  // Validation & Utilities
  validateShopProfileData(data: CreateShopProfileData): ShopProfileValidationResult;
  canUserModifyShop(shopId: string, userId: string): Promise<boolean>;
  isUsernameAvailable(username: string, excludeId?: string): Promise<boolean>;
  isShopNameAvailable(shopName: string, excludeId?: string): Promise<boolean>;
}


