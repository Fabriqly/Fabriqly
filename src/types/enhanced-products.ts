import { Timestamp } from 'firebase/firestore';

// Enhanced types based on ERD structure

// Designer Profiles
export interface DesignerProfile {
  id: string;
  businessName: string;
  userId: string; // Links to users collection
  bio?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  specialties: string[]; // Design specialties
  isVerified: boolean;
  isActive: boolean;
  portfolioStats: {
    totalDesigns: number;
    totalDownloads: number;
    totalViews: number;
    averageRating: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Shop Profiles
export interface ShopProfile {
  id: string;
  businessName: string;
  userId: string; // Links to users collection
  description?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    email: string;
    phone?: string;
  };
  businessHours?: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  isVerified: boolean;
  isActive: boolean;
  shopStats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Enhanced Categories with hierarchical structure
export interface Category {
  id: string;
  categoryName: string;
  description?: string;
  slug: string;
  iconUrl?: string;
  parentCategoryId?: string; // For subcategories
  level: number; // 0 = root, 1 = subcategory, etc.
  path: string[]; // Full path from root (e.g., ["Apparel", "T-Shirts"])
  isActive: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Designs Portfolio System
export interface Design {
  id: string;
  designName: string;
  description: string;
  designSlug: string;
  designerId: string;
  categoryId: string;
  designFileUrl: string;
  thumbnailUrl: string;
  previewUrl?: string;
  designType: 'template' | 'custom' | 'premium';
  fileFormat: 'svg' | 'png' | 'jpg' | 'pdf' | 'ai' | 'psd';
  tags: string[];
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  pricing?: {
    isFree: boolean;
    price?: number;
    currency: string;
  };
  downloadCount: number;
  viewCount: number;
  likesCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Colors System
export interface Color {
  id: string;
  colorName: string;
  hexCode: string;
  rgbCode: string;
  businessOwnerId?: string; // Track who created the color
  isActive: boolean;
  createdAt: Timestamp;
}

// Size Charts System
export interface SizeChart {
  id: string;
  chartName: string;
  description?: string;
  sizeData: {
    [size: string]: {
      measurements: {
        [measurement: string]: number;
      };
      unit: 'cm' | 'in';
    };
  };
  categoryId?: string; // Optional category association
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Enhanced Products with all ERD features
export interface EnhancedProduct {
  id: string;
  productName: string;
  shortDescription: string;
  detailedDescription: string;
  productSku: string;
  shopId: string;
  categoryId: string;
  baseMaterialId?: string; // For future material system
  sizeChartId?: string;
  basePrice: number;
  currency: string;
  isCustomizable: boolean;
  isFeatured: boolean;
  isActive: boolean;
  stockQuantity: number;
  minOrderQuantity: number;
  weightGrams: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  tags: string[];
  specifications?: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Product Images (enhanced)
export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  displayOrder: number;
  imageType: 'main' | 'gallery' | 'detail';
  uploadedAt: Timestamp;
  editedAt?: Timestamp;
}

// Product Colors (linking products to colors with adjustments)
export interface ProductColor {
  id: string;
  productId: string;
  colorId: string;
  priceAdjustment: number; // Can be positive or negative
  isAvailable: boolean;
  stockQuantity?: number; // Color-specific stock
  createdAt: Timestamp;
}

// Product Variants (enhanced for sizes, etc.)
export interface ProductVariant {
  id: string;
  productId: string;
  variantName: string; // e.g., "Size", "Material"
  variantValue: string; // e.g., "Large", "Cotton"
  priceAdjustment: number;
  stock: number;
  sku?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Enhanced Product with all related data
export interface EnhancedProductWithDetails extends EnhancedProduct {
  shop: ShopProfile;
  category: Category;
  images: ProductImage[];
  colors: (ProductColor & { color: Color })[];
  variants: ProductVariant[];
  sizeChart?: SizeChart;
}

// Design with related data
export interface DesignWithDetails extends Design {
  designer: DesignerProfile;
  category: Category;
}

// Analytics and Statistics
export interface ProductAnalytics {
  productId: string;
  views: number;
  likes: number;
  shares: number;
  inquiries: number;
  conversions: number;
  lastViewed: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DesignAnalytics {
  designId: string;
  views: number;
  downloads: number;
  likes: number;
  shares: number;
  lastViewed: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Search and Filter Types
export interface EnhancedProductFilters {
  categoryId?: string;
  shopId?: string;
  designerId?: string;
  colorId?: string;
  sizeChartId?: string;
  isCustomizable?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface DesignFilters {
  designerId?: string;
  categoryId?: string;
  designType?: 'template' | 'custom' | 'premium';
  isPublic?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
  sortBy?: 'name' | 'price' | 'createdAt' | 'downloads' | 'views' | 'likes';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Creation/Update DTOs
export interface CreateDesignerProfileData {
  businessName: string;
  bio?: string;
  website?: string;
  socialMedia?: DesignerProfile['socialMedia'];
  specialties: string[];
}

export interface UpdateDesignerProfileData {
  businessName?: string;
  bio?: string;
  website?: string;
  socialMedia?: DesignerProfile['socialMedia'];
  specialties?: string[];
}

export interface CreateShopProfileData {
  businessName: string;
  description?: string;
  website?: string;
  address?: ShopProfile['address'];
  contactInfo: ShopProfile['contactInfo'];
  businessHours?: ShopProfile['businessHours'];
  socialMedia?: ShopProfile['socialMedia'];
}

export interface UpdateShopProfileData {
  businessName?: string;
  description?: string;
  website?: string;
  address?: ShopProfile['address'];
  contactInfo?: ShopProfile['contactInfo'];
  businessHours?: ShopProfile['businessHours'];
  socialMedia?: ShopProfile['socialMedia'];
}

export interface CreateDesignData {
  designName: string;
  description: string;
  categoryId: string;
  designFileUrl: string;
  thumbnailUrl: string;
  previewUrl?: string;
  designType: Design['designType'];
  fileFormat: Design['fileFormat'];
  tags: string[];
  isPublic: boolean;
  pricing?: Design['pricing'];
}

export interface UpdateDesignData {
  designName?: string;
  description?: string;
  categoryId?: string;
  designFileUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  designType?: Design['designType'];
  fileFormat?: Design['fileFormat'];
  tags?: string[];
  isPublic?: boolean;
  pricing?: Design['pricing'];
}

export interface CreateColorData {
  colorName: string;
  hexCode: string;
  rgbCode: string;
}

export interface CreateSizeChartData {
  chartName: string;
  description?: string;
  sizeData: SizeChart['sizeData'];
  categoryId?: string;
}

export interface CreateColorData {
  colorName: string;
  hexCode: string;
  rgbCode: string;
}

export interface UpdateColorData extends Partial<CreateColorData> {
  isActive?: boolean;
}

export interface CreateProductColorData {
  colorId: string;
  priceAdjustment: number;
  isAvailable: boolean;
  stockQuantity?: number;
}

export interface UpdateProductColorData {
  priceAdjustment?: number;
  isAvailable?: boolean;
  stockQuantity?: number;
}

// Category Creation/Update DTOs
export interface CreateCategoryData {
  categoryName: string;
  description?: string;
  slug: string;
  iconUrl?: string;
  parentCategoryId?: string;
  isActive: boolean;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
}

export interface UpdateSizeChartData extends Partial<CreateSizeChartData> {
  id: string;
}