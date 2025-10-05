import { ProductRepository, ProductFilters } from '@/repositories/ProductRepository';
import { CategoryRepository } from '@/repositories/CategoryRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { Product, CreateProductData, UpdateProductData, ProductStatus, ProductSearchResult } from '@/types/products';
import { adminDb } from '@/lib/firebase-admin';
import { Collections } from '@/services/firebase';
import { ActivityType } from '@/types/activity';
import { IProductService, ProductSearchOptions } from '@/services/interfaces/IProductService';
import { AppError } from '@/errors/AppError';
import { CacheService } from '@/services/CacheService';
import { eventBus, EventTypes } from '@/events';
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';

export interface ProductValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ProductService implements IProductService {
  constructor(
    private productRepository: ProductRepository,
    private categoryRepository: CategoryRepository,
    private activityRepository: ActivityRepository
  ) {}

  async createProduct(data: CreateProductData, businessOwnerId: string): Promise<Product> {
    return PerformanceMonitor.measure('ProductService.createProduct', async () => {
      // Validate product data
      const validation = await this.validateProductData(data);
      if (!validation.isValid) {
        throw AppError.validation(`Validation failed: ${validation.errors.join(', ')}`, validation.errors);
      }

      // Check if category exists
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        throw AppError.notFound('Category not found');
      }

      // If shopId is provided, verify the shop belongs to the business owner
      if (data.shopId) {
        const shopValid = await this.validateShopOwnership(data.shopId, businessOwnerId);
        if (!shopValid) {
          throw AppError.forbidden('Shop does not belong to this business owner');
        }
      }

      // Generate SKU if not provided
      const sku = data.sku?.trim() || this.generateSKU(data.name);

      // Check for duplicate SKU
      const existingProduct = await this.productRepository.findBySku(sku);
      if (existingProduct) {
        throw AppError.conflict('Product SKU already exists');
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
      ...(data.shopId && { shopId: data.shopId }),
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

      // Update shop product count if shopId is present
      if (data.shopId) {
        await this.updateShopProductCount(data.shopId, 1);
      }

      // Emit event
      await eventBus.emit(EventTypes.PRODUCT_CREATED, product, 'ProductService');

      // Log activity
      await this.logProductActivity('product_created', product.id, businessOwnerId, {
        productName: product.name,
        categoryId: product.categoryId,
        sku: product.sku,
        ...(data.shopId && { shopId: data.shopId })
      });

      return product;
    });
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

    // Update shop product count if product was associated with a shop
    if (product.shopId) {
      await this.updateShopProductCount(product.shopId, -1);
    }

    // Log activity
    await this.logProductActivity('product_deleted', productId, userId, {
      productName: product.name,
      sku: product.sku,
      ...(product.shopId && { shopId: product.shopId })
    });
  }

  async getProduct(productId: string): Promise<Product | null> {
    const cacheKey = CacheService.productKey(productId);
    const cached = await CacheService.get<Product>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const product = await this.productRepository.findById(productId);
    
    if (product) {
      CacheService.set(cacheKey, product);
    }

    return product;
  }

  async getProducts(options: ProductSearchOptions = {}): Promise<ProductSearchResult> {
    const { filters, sortBy = 'createdAt', sortOrder = 'desc', limit = 50 } = options;

    let products: Product[];
    
    if (filters) {
      products = await this.productRepository.findWithFilters(filters);
    } else {
      products = await this.productRepository.findAll({
        orderBy: { field: sortBy, direction: sortOrder },
        limit
      });
    }

    return {
      products,
      total: products.length,
      hasMore: products.length === limit,
      filters: filters || {}
    };
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

    // Populate category, image, and business owner information for each product
    const productsWithDetails = await Promise.all(
      filteredProducts.map(async (product) => {
        let category = null;
        let images: any[] = [];
        let businessOwner = null;
        
        if (product.categoryId) {
          try {
            category = await this.categoryRepository.findById(product.categoryId);
          } catch (error) {
            console.error(`Error fetching category ${product.categoryId}:`, error);
          }
        }

        // Fetch business owner information
        if (product.businessOwnerId) {
          try {
            const { FirebaseAdminService } = await import('@/services/firebase-admin');
            const { Collections } = await import('@/services/firebase');
            
            const ownerDoc = await FirebaseAdminService.getDocument(
              Collections.USERS,
              product.businessOwnerId
            );
            
            if (ownerDoc) {
              businessOwner = {
                id: product.businessOwnerId,
                name: ownerDoc.displayName || 
                      `${ownerDoc.profile?.firstName || ''} ${ownerDoc.profile?.lastName || ''}`.trim() ||
                      ownerDoc.email,
                businessName: ownerDoc.profile?.businessName || ownerDoc.displayName
              };
            }
          } catch (error) {
            console.error(`Error fetching business owner ${product.businessOwnerId}:`, error);
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
          images,
          businessOwner
        };
      })
    );

    return productsWithDetails;
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return this.productRepository.findByCategory(categoryId);
  }

  async getProductsByBusinessOwner(businessOwnerId: string, options: ProductSearchOptions = {}): Promise<ProductSearchResult> {
    const products = await this.productRepository.findByBusinessOwner(businessOwnerId);
    
    return {
      products,
      total: products.length,
      hasMore: false,
      filters: { businessOwnerId, ...options.filters }
    };
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

  async validateProductData(data: CreateProductData): Promise<ProductValidationResult> {
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

  /**
   * Validates that a shop belongs to the specified business owner
   */
  private async validateShopOwnership(shopId: string, businessOwnerId: string): Promise<boolean> {
    try {
      const shopDoc = await adminDb.collection('shopProfiles').doc(shopId).get();
      
      if (!shopDoc.exists) {
        return false;
      }
      
      const shopData = shopDoc.data();
      return shopData?.userId === businessOwnerId && shopData?.approvalStatus === 'approved';
    } catch (error) {
      console.error('Error validating shop ownership:', error);
      return false;
    }
  }

  /**
   * Updates the product count for a shop
   */
  private async updateShopProductCount(shopId: string, delta: number): Promise<void> {
    try {
      const shopRef = adminDb.collection('shopProfiles').doc(shopId);
      
      // Get current shop data
      const shopDoc = await shopRef.get();
      if (!shopDoc.exists) {
        return;
      }

      const shopData = shopDoc.data();
      const currentCount = shopData?.shopStats?.totalProducts || 0;
      const newCount = Math.max(0, currentCount + delta);

      // Update the count
      await shopRef.update({
        'shopStats.totalProducts': newCount,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating shop product count:', error);
      // Don't fail the operation if this fails
    }
  }
}
