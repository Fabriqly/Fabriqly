import { Timestamp } from 'firebase/firestore';

// Product Status Enum
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'out_of_stock';

// Product Categories
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string; // For subcategories
  slug: string; // URL-friendly name
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Product Variants (for sizes, colors, etc.)
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
  products: ProductWithDetails[];
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