import { ProductRepository, ProductFilters } from '@/repositories/ProductRepository';
import { CategoryRepository } from '@/repositories/CategoryRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { Product, CreateProductData, UpdateProductData, ProductStatus } from '@/types/products';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { ActivityType } from '@/types/activity';

export interface ProductSearchOptions {
  filters?: ProductFilters;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProductValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ProductService {
  private productRepository: ProductRepository;
  private categoryRepository: CategoryRepository;
  private activityRepository: ActivityRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.categoryRepository = new CategoryRepository();
    this.activityRepository = new ActivityRepository();
  }

  async createProduct(data: CreateProductData, businessOwnerId: string): Promise<Product> {
    // Validate product data
    const validation = await this.validateProductData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if category exists
    const category = await this.categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Generate SKU if not provided
    const sku = data.sku?.trim() || this.generateSKU(data.name);

    // Check for duplicate SKU
    const existingProduct = await this.productRepository.findBySku(sku);
    if (existingProduct) {
      throw new Error('Product SKU already exists');
    }

    // Create product
    const productData: Omit<Product, 'id'> = {
      name: data.name.trim(),
      description: data.description.trim(),
      shortDescription: data.shortDescription?.trim() || '',
      categoryId: data.categoryId.trim(),
      price: Number(data.price),
      stockQuantity: Number(data.stockQuantity) || 0,
      sku,
      businessOwnerId,
      status: data.status || 'draft',
      isCustomizable: Boolean(data.isCustomizable),
      isDigital: Boolean(data.isDigital),
      tags: Array.isArray(data.tags) ? data.tags.filter(tag => tag.trim().length > 0) : [],
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      // Optional fields
      ...(data.weight !== undefined && data.weight > 0 && { weight: Number(data.weight) }),
      ...(data.dimensions && { dimensions: data.dimensions }),
      ...(data.specifications && Object.keys(data.specifications).length > 0 && { specifications: data.specifications }),
      ...(data.seoTitle && data.seoTitle.trim().length > 0 && { seoTitle: data.seoTitle.trim() }),
      ...(data.seoDescription && data.seoDescription.trim().length > 0 && { seoDescription: data.seoDescription.trim() })
    };

    const product = await this.productRepository.create(productData);

    // Log activity
    await this.logProductActivity('product_created', product.id, businessOwnerId, {
      productName: product.name,
      categoryId: product.categoryId,
      sku: product.sku
    });

    return product;
  }

  async updateProduct(productId: string, data: UpdateProductData, userId: string): Promise<Product> {
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Check permissions
    if (existingProduct.businessOwnerId !== userId) {
      throw new Error('Unauthorized to update this product');
    }

    // Validate update data
    const validation = await this.validateProductUpdate(data, existingProduct);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for duplicate SKU if changing
    if (data.sku && data.sku !== existingProduct.sku) {
      const existingSku = await this.productRepository.findBySku(data.sku);
      if (existingSku) {
        throw new Error('Product SKU already exists');
      }
    }

    // Update product
    const updatedProduct = await this.productRepository.update(productId, data);

    // Log activity
    await this.logProductActivity('product_updated', productId, userId, {
      productName: updatedProduct.name,
      changedFields: Object.keys(data)
    });

    return updatedProduct;
  }

  async deleteProduct(productId: string, userId: string): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check permissions
    if (product.businessOwnerId !== userId) {
      throw new Error('Unauthorized to delete this product');
    }

    // Check if product has orders (in a real app, you'd check order history)
    // For now, we'll just delete it

    await this.productRepository.delete(productId);

    // Log activity
    await this.logProductActivity('product_deleted', productId, userId, {
      productName: product.name,
      sku: product.sku
    });
  }

  async getProduct(productId: string): Promise<Product | null> {
    return this.productRepository.findById(productId);
  }

  async getProducts(options: ProductSearchOptions = {}): Promise<Product[]> {
    const { filters, sortBy = 'createdAt', sortOrder = 'desc', limit = 50 } = options;

    if (filters) {
      return this.productRepository.findWithFilters(filters);
    }

    return this.productRepository.findAll({
      orderBy: { field: sortBy, direction: sortOrder },
      limit
    });
  }

  async getProductsWithDetails(options: ProductSearchOptions = {}): Promise<any[]> {
    const { filters, sortBy = 'createdAt', sortOrder = 'desc', limit = 50 } = options;

    let products: Product[];
    if (filters) {
      products = await this.productRepository.findWithFilters(filters, sortBy, sortOrder, limit);
    } else {
      products = await this.productRepository.findAll({
        orderBy: { field: sortBy, direction: sortOrder },
        limit
      });
    }

    // Apply search filter if provided
    let filteredProducts = products;
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Populate category and image information for each product
    const productsWithDetails = await Promise.all(
      filteredProducts.map(async (product) => {
        let category = null;
        let images: any[] = [];
        
        if (product.categoryId) {
          try {
            category = await this.categoryRepository.findById(product.categoryId);
          } catch (error) {
            console.error(`Error fetching category ${product.categoryId}:`, error);
          }
        }

        // Fetch product images
        try {
          const { FirebaseAdminService } = await import('@/services/firebase-admin');
          const { Collections } = await import('@/services/firebase');
          
          const allImages = await FirebaseAdminService.queryDocuments(
            Collections.PRODUCT_IMAGES,
            [],
            { field: 'sortOrder', direction: 'asc' },
            undefined
          );
          
          images = allImages.filter((image: any) => image.productId === product.id);
          
          // Debug logging
          console.log(`Product ${product.id} (${product.name}): Found ${images.length} images`);
          if (images.length > 0) {
            console.log('Images:', images.map(img => ({ id: img.id, productId: img.productId, imageUrl: img.imageUrl })));
          }
        } catch (error) {
          console.error(`Error fetching images for product ${product.id}:`, error);
        }

        return {
          ...product,
          category,
          images
        };
      })
    );

    return productsWithDetails;
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return this.productRepository.findByCategory(categoryId);
  }

  async getProductsByBusinessOwner(businessOwnerId: string): Promise<Product[]> {
    return this.productRepository.findByBusinessOwner(businessOwnerId);
  }

  async getActiveProducts(): Promise<Product[]> {
    return this.productRepository.findActiveProducts();
  }

  async getCustomizableProducts(): Promise<Product[]> {
    return this.productRepository.findCustomizableProducts();
  }

  async getDigitalProducts(): Promise<Product[]> {
    return this.productRepository.findDigitalProducts();
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return this.productRepository.getLowStockProducts(threshold);
  }

  async getOutOfStockProducts(): Promise<Product[]> {
    return this.productRepository.getOutOfStockProducts();
  }

  async updateProductStatus(productId: string, status: ProductStatus, userId: string): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check permissions
    if (product.businessOwnerId !== userId) {
      throw new Error('Unauthorized to update this product');
    }

    const updatedProduct = await this.productRepository.update(productId, { status });

    // Log activity
    await this.logProductActivity('product_updated', productId, userId, {
      productName: product.name,
      oldStatus: product.status,
      newStatus: status,
      action: 'status_changed'
    });

    return updatedProduct;
  }

  async updateStock(productId: string, quantity: number, userId: string): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check permissions
    if (product.businessOwnerId !== userId) {
      throw new Error('Unauthorized to update this product');
    }

    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    const updatedProduct = await this.productRepository.update(productId, { stockQuantity: quantity });

    // Log activity
    await this.logProductActivity('product_updated', productId, userId, {
      productName: product.name,
      oldStock: product.stockQuantity,
      newStock: quantity,
      action: 'stock_updated'
    });

    return updatedProduct;
  }

  private async validateProductData(data: CreateProductData): Promise<ProductValidationResult> {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Product description is required');
    }

    if (!data.categoryId || data.categoryId.trim().length === 0) {
      errors.push('Category is required');
    }

    if (!data.price || data.price <= 0) {
      errors.push('Valid price is required');
    }

    if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }

    if (data.weight !== undefined && data.weight < 0) {
      errors.push('Weight cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async validateProductUpdate(data: UpdateProductData, existingProduct: Product): Promise<ProductValidationResult> {
    const errors: string[] = [];

    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      errors.push('Product name cannot be empty');
    }

    if (data.description !== undefined && (!data.description || data.description.trim().length === 0)) {
      errors.push('Product description cannot be empty');
    }

    if (data.price !== undefined && data.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }

    if (data.weight !== undefined && data.weight < 0) {
      errors.push('Weight cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private generateSKU(name: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const namePrefix = name.replace(/[^a-zA-Z0-9]/g, '').substr(0, 3).toUpperCase();
    return `${namePrefix}-${timestamp}-${random}`;
  }

  private async logProductActivity(
    type: ActivityType,
    productId: string,
    userId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await this.activityRepository.create({
        type,
        title: this.getActivityTitle(type),
        description: this.getActivityDescription(type, metadata),
        priority: 'low',
        status: 'active',
        actorId: userId,
        targetId: productId,
        targetType: 'product',
        targetName: metadata.productName || 'Unknown Product',
        metadata,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      });
    } catch (error) {
      console.error('Error logging product activity:', error);
      // Don't fail the operation if activity logging fails
    }
  }

  private getActivityTitle(type: ActivityType): string {
    const titles: Partial<Record<ActivityType, string>> = {
      'product_created': 'Product Created',
      'product_updated': 'Product Updated',
      'product_deleted': 'Product Deleted',
      'product_published': 'Product Published',
      'product_unpublished': 'Product Unpublished',
      'product_activated': 'Product Activated',
      'product_deactivated': 'Product Deactivated'
    };
    return titles[type] || 'Product Activity';
  }

  private getActivityDescription(type: ActivityType, metadata: Record<string, any>): string {
    const productName = metadata.productName || 'Product';
    
    switch (type) {
      case 'product_created':
        return `Product "${productName}" has been created`;
      case 'product_updated':
        return `Product "${productName}" has been updated`;
      case 'product_deleted':
        return `Product "${productName}" has been deleted`;
      case 'product_published':
        return `Product "${productName}" has been published`;
      case 'product_unpublished':
        return `Product "${productName}" has been unpublished`;
      case 'product_activated':
        return `Product "${productName}" has been activated`;
      case 'product_deactivated':
        return `Product "${productName}" has been deactivated`;
      default:
        return `Product "${productName}" activity`;
    }
  }
}
