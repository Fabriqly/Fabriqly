import { Timestamp } from 'firebase/firestore';

// Product Status Enum
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'out_of_stock';

// Product Categories
export interface Category {
  id: string;
  categoryName: string; // Database field name
  name?: string; // Alias for backward compatibility
  description?: string;
  parentCategoryId?: string; // Database field name for subcategories
  parentId?: string; // Alias for backward compatibility
  slug: string; // URL-friendly name
  iconUrl?: string; // Category image/icon URL
  isActive: boolean;
  level?: number; // Hierarchy level (0 for root categories)
  path?: string[]; // Breadcrumb path for hierarchy
  sortOrder?: number; // For ordering categories
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Supabase Storage metadata
  storagePath?: string; // Path in Supabase Storage
  storageBucket?: string; // Bucket name in Supabase Storage
}

// Product Variant Option (for designs and sizes with price modifiers)
export interface ProductVariantOption {
  id: string;        // UUID or unique key
  name: string;      // e.g., "Sunset Vibe" or "XL"
  priceModifier: number; // e.g., 0.00 (free) or 50.00 (adds ₱50)
}

// Product Variants (for sizes, colors, etc.) - Legacy support
export interface ProductVariant {
  id: string;
  productId: string;
  variantName: string; // e.g., "Size", "Color"
  variantValue: string; // e.g., "Large", "Red"
  priceAdjustment: number; // Additional cost (can be negative)
  stock: number;
  sku?: string; // Optional SKU for this variant
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Product Images
export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  thumbnailUrl?: string; // Optimized thumbnail
  altText?: string;
  isPrimary: boolean; // Main product image
  sortOrder: number; // For ordering images
  createdAt: Timestamp;
  // Supabase Storage metadata
  storagePath?: string; // Path in Supabase Storage
  storageBucket?: string; // Bucket name in Supabase Storage
}

// Main Product Interface
export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string; // For cards/previews
  categoryId: string;
  price: number; // Base price
  stockQuantity: number; // Total stock across all variants
  sku: string; // Product code
  businessOwnerId: string; // Who owns this product
  shopId?: string; // Shop this product belongs to (optional for business owners without shops)
  status: ProductStatus;
  isCustomizable: boolean; // Can customers add designs?
  isDigital: boolean; // Digital product vs physical
  weight?: number; // For shipping calculations
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  tags: string[]; // For search and filtering
  designs?: ProductVariantOption[]; // Design variants with price modifiers
  sizes?: ProductVariantOption[]; // Size variants with price modifiers
  specifications?: Record<string, any>; // Flexible specs
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Product with populated data (for display)
export interface ProductWithDetails extends Product {
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  businessOwner?: {
    id: string;
    name: string;
    businessName?: string;
  };
  shop?: {
    id: string;
    shopName: string;
    username: string;
  };
}

// Product Creation/Update DTOs
export interface CreateProductData {
  name: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  price: number;
  stockQuantity: number;
  sku: string;
  shopId?: string; // Optional shop association
  status: ProductStatus;
  isCustomizable: boolean;
  isDigital: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  tags: string[];
  designs?: ProductVariantOption[]; // Design variants with price modifiers
  sizes?: ProductVariantOption[]; // Size variants with price modifiers
  specifications?: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

// Product Filters
export interface ProductFilters {
  categoryId?: string;
  businessOwnerId?: string;
  shopId?: string; // Filter by shop
  status?: ProductStatus;
  isCustomizable?: boolean;
  isDigital?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string; // Text search
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Product Search Results
export interface ProductSearchResult {
  products: Product[];
  total: number;
  hasMore: boolean;
  filters: ProductFilters;
}

// Category Creation/Update
export interface CreateCategoryData {
  name: string;
  description?: string;
  parentId?: string;
  slug: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
}

// Image Upload
export interface ImageUploadData {
  productId: string;
  imageFile: File;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

// Inventory Management
export interface InventoryUpdate {
  productId: string;
  variantId?: string; // If updating specific variant
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
  reason?: string; // For audit trail
}