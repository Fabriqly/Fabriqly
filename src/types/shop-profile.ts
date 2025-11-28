import { Timestamp } from 'firebase/firestore';

// Business Type Enum
export type BusinessType = 'individual' | 'msme' | 'printing_partner';

// Approval Status
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

// Shop Profile Interface
export interface ShopProfile {
  id: string;
  
  // Basic Information
  shopName: string;
  username: string; // Unique handle for shop URL
  businessOwnerName: string;
  userId: string; // Links to users collection
  
  // Contact Information
  contactInfo: {
    email: string;
    phone?: string;
  };
  
  // Location
  location?: {
    city?: string;
    province?: string;
    fullAddress?: string;
    country?: string;
  };
  
  // Branding
  branding: {
    logoUrl?: string;
    bannerUrl?: string;
    thumbnailUrl?: string;
    tagline?: string;
  };
  
  // Business Details
  businessDetails: {
    businessType: BusinessType;
    operatingHours?: {
      [key: string]: { // e.g., "monday", "tuesday"
        open: string;
        close: string;
        isOpen: boolean;
      };
    };
    registeredBusinessId?: string; // Business permit/license
    taxId?: string; // Optional tax ID
  };
  
  // Shop Description
  description: string;
  specialties?: string[]; // e.g., ["Custom Shirts", "Mugs", "Tote Bags"]
  
  // Customization & Offerings
  supportedProductCategories: string[]; // Category IDs
  customizationPolicy?: {
    turnaroundTime?: string; // e.g., "3-5 business days"
    revisionsAllowed?: number;
    rushOrderAvailable?: boolean;
    customInstructions?: string;
  };
  
  // Social & External Links
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
  };
  website?: string;
  
  // Ratings & Reviews (system-generated)
  ratings: {
    averageRating: number;
    totalReviews: number;
    totalOrders: number;
  };
  
  // Shop Stats
  shopStats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalViews: number;
  };
  
  // Status & Verification
  approvalStatus: ApprovalStatus;
  isVerified: boolean;
  isActive: boolean;
  isFeatured: boolean;
  
  // Admin & Metadata
  approvedBy?: string; // Admin user ID
  approvedAt?: Timestamp;
  rejectionReason?: string;
  
  // Strike System
  strikes: number; // Default 0
  strikeHistory: Array<{
    disputeId: string;
    reason: string;
    issuedAt: Timestamp;
    issuedBy?: string; // Admin ID
  }>;
  isSuspended: boolean; // Auto-suspended at 3 strikes
  suspensionReason?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Shop Profile with populated data
export interface ShopProfileWithDetails extends ShopProfile {
  categories: Array<{
    id: string;
    categoryName: string;
  }>;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

// Create Shop Profile DTO
export interface CreateShopProfileData {
  // Basic Information
  shopName: string;
  username: string;
  businessOwnerName: string;
  
  // Contact Information
  contactInfo: {
    email: string;
    phone?: string;
  };
  
  // Location
  location?: {
    city?: string;
    province?: string;
    fullAddress?: string;
    country?: string;
  };
  
  // Branding
  branding?: {
    logoUrl?: string;
    bannerUrl?: string;
    thumbnailUrl?: string;
    tagline?: string;
  };
  
  // Business Details
  businessDetails: {
    businessType: BusinessType;
    operatingHours?: ShopProfile['businessDetails']['operatingHours'];
    registeredBusinessId?: string;
    taxId?: string;
  };
  
  // Shop Description
  description: string;
  specialties?: string[];
  
  // Customization & Offerings
  supportedProductCategories: string[];
  customizationPolicy?: ShopProfile['customizationPolicy'];
  
  // Social & External Links
  socialMedia?: ShopProfile['socialMedia'];
  website?: string;
}

// Update Shop Profile DTO
export interface UpdateShopProfileData {
  // Basic Information
  shopName?: string;
  username?: string;
  businessOwnerName?: string;
  
  // Contact Information
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  
  // Location
  location?: {
    city?: string;
    province?: string;
    fullAddress?: string;
    country?: string;
  };
  
  // Branding
  branding?: {
    logoUrl?: string;
    bannerUrl?: string;
    thumbnailUrl?: string;
    tagline?: string;
  };
  
  // Business Details
  businessDetails?: {
    businessType?: BusinessType;
    operatingHours?: ShopProfile['businessDetails']['operatingHours'];
    registeredBusinessId?: string;
    taxId?: string;
  };
  
  // Shop Description
  description?: string;
  specialties?: string[];
  
  // Customization & Offerings
  supportedProductCategories?: string[];
  customizationPolicy?: ShopProfile['customizationPolicy'];
  
  // Social & External Links
  socialMedia?: ShopProfile['socialMedia'];
  website?: string;
  
  // Status updates (admin only)
  approvalStatus?: ApprovalStatus;
  isVerified?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
}

// Shop Profile Filters
export interface ShopProfileFilters {
  userId?: string;
  username?: string;
  businessType?: BusinessType;
  approvalStatus?: ApprovalStatus;
  isVerified?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  location?: {
    city?: string;
    province?: string;
  };
  supportedCategories?: string[];
  search?: string;
  minRating?: number;
  sortBy?: 'name' | 'rating' | 'createdAt' | 'totalOrders' | 'totalProducts';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Shop Profile Search Result
export interface ShopProfileSearchResult {
  shops: ShopProfile[];
  total: number;
  hasMore: boolean;
  filters: ShopProfileFilters;
}

// Shop Profile Stats
export interface ShopProfileStats {
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
}

// Shop Profile Validation Result
export interface ShopProfileValidationResult {
  isValid: boolean;
  errors: string[];
}

// Shop Approval Action
export interface ShopApprovalAction {
  shopId: string;
  action: 'approve' | 'reject' | 'suspend' | 'activate';
  reason?: string;
  adminId: string;
}


