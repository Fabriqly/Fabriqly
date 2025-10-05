import { BaseRepository, QueryFilter } from './BaseRepository';
import { Collections } from '@/services/firebase';
import { Product, ProductStatus } from '@/types/products';

export interface ProductFilters {
  categoryId?: string;
  businessOwnerId?: string;
  shopId?: string;
  status?: ProductStatus;
  isCustomizable?: boolean;
  isDigital?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
}

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super(Collections.PRODUCTS);
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.findAll({
      filters: [{ field: 'categoryId', operator: '==', value: categoryId }]
    });
  }

  async findByBusinessOwner(businessOwnerId: string): Promise<Product[]> {
    return this.findAll({
      filters: [{ field: 'businessOwnerId', operator: '==', value: businessOwnerId }]
    });
  }

  async findByShop(shopId: string): Promise<Product[]> {
    return this.findAll({
      filters: [{ field: 'shopId', operator: '==', value: shopId }]
    });
  }

  async findByStatus(status: ProductStatus): Promise<Product[]> {
    return this.findAll({
      filters: [{ field: 'status', operator: '==', value: status }]
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    const results = await this.findAll({
      filters: [{ field: 'sku', operator: '==', value: sku }]
    });
    return results.length > 0 ? results[0] : null;
  }

  async findActiveProducts(): Promise<Product[]> {
    return this.findAll({
      filters: [{ field: 'status', operator: '==', value: 'active' }]
    });
  }

  async findCustomizableProducts(): Promise<Product[]> {
    return this.findAll({
      filters: [
        { field: 'isCustomizable', operator: '==', value: true },
        { field: 'status', operator: '==', value: 'active' }
      ]
    });
  }

  async findDigitalProducts(): Promise<Product[]> {
    return this.findAll({
      filters: [
        { field: 'isDigital', operator: '==', value: true },
        { field: 'status', operator: '==', value: 'active' }
      ]
    });
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    return this.findAll({
      filters: [
        { field: 'price', operator: '>=', value: minPrice },
        { field: 'price', operator: '<=', value: maxPrice },
        { field: 'status', operator: '==', value: 'active' }
      ]
    });
  }

  async findByTags(tags: string[]): Promise<Product[]> {
    // Firestore doesn't support array-contains-any directly, so we'll use a different approach
    const filters: QueryFilter[] = [
      { field: 'status', operator: '==', value: 'active' }
    ];

    // For now, we'll filter by the first tag and handle multiple tags in the service layer
    if (tags.length > 0) {
      filters.push({ field: 'tags', operator: 'array-contains', value: tags[0] });
    }

    return this.findAll({ filters });
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a simplified implementation - in production, you'd use Algolia or similar
    const filters: QueryFilter[] = [
      { field: 'status', operator: '==', value: 'active' }
    ];

    return this.findAll({ filters });
  }

  async findWithFilters(filters: ProductFilters, sortBy?: string, sortOrder?: 'asc' | 'desc', limit?: number): Promise<Product[]> {
    const queryFilters: QueryFilter[] = [];

    if (filters.categoryId) {
      queryFilters.push({ field: 'categoryId', operator: '==', value: filters.categoryId });
    }

    if (filters.businessOwnerId) {
      queryFilters.push({ field: 'businessOwnerId', operator: '==', value: filters.businessOwnerId });
    }

    if (filters.shopId) {
      queryFilters.push({ field: 'shopId', operator: '==', value: filters.shopId });
    }

    if (filters.isCustomizable !== undefined) {
      queryFilters.push({ field: 'isCustomizable', operator: '==', value: filters.isCustomizable });
    }

    if (filters.isDigital !== undefined) {
      queryFilters.push({ field: 'isDigital', operator: '==', value: filters.isDigital });
    }

    if (filters.minPrice !== undefined) {
      queryFilters.push({ field: 'price', operator: '>=', value: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      queryFilters.push({ field: 'price', operator: '<=', value: filters.maxPrice });
    }

    // Only filter by status if explicitly provided
    // If no status filter is provided, return all products (for admin/business owner management)
    if (filters.status !== undefined) {
      queryFilters.push({ field: 'status', operator: '==', value: filters.status });
    }

    // Note: Search filter is handled in the service layer after fetching products
    // since Firestore doesn't support full-text search natively

    const options: any = { filters: queryFilters };
    
    if (sortBy) {
      options.orderBy = { field: sortBy, direction: sortOrder || 'desc' };
    }
    
    if (limit) {
      options.limit = limit;
    }

    return this.findAll(options);
  }

  async getProductCountByCategory(categoryId: string): Promise<number> {
    return this.count([{ field: 'categoryId', operator: '==', value: categoryId }]);
  }

  async getProductCountByBusinessOwner(businessOwnerId: string): Promise<number> {
    return this.count([{ field: 'businessOwnerId', operator: '==', value: businessOwnerId }]);
  }

  async getProductCountByShop(shopId: string): Promise<number> {
    return this.count([{ field: 'shopId', operator: '==', value: shopId }]);
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return this.findAll({
      filters: [
        { field: 'stockQuantity', operator: '<=', value: threshold },
        { field: 'status', operator: '==', value: 'active' }
      ]
    });
  }

  async getOutOfStockProducts(): Promise<Product[]> {
    return this.findAll({
      filters: [
        { field: 'stockQuantity', operator: '==', value: 0 },
        { field: 'status', operator: '==', value: 'active' }
      ]
    });
  }
}
