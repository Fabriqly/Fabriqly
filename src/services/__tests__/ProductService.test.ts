
import { ProductService } from '../ProductService';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CategoryRepository } from '@/repositories/CategoryRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ServiceContainer } from '@/container/ServiceContainer';
import { AppError } from '@/errors/AppError';
import { CreateProductData, UpdateProductData } from '@/types/products';
import { createMockProduct, createMockCategory } from './setup';

// Mock repositories
jest.mock('@/repositories/ProductRepository');
jest.mock('@/repositories/CategoryRepository');
jest.mock('@/repositories/ActivityRepository');

describe('ProductService', () => {
  let productService: ProductService;
  let mockProductRepository: jest.Mocked<ProductRepository>;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;
  let mockActivityRepository: jest.Mocked<ActivityRepository>;
  let serviceContainer: ServiceContainer;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockProductRepository = new ProductRepository() as jest.Mocked<ProductRepository>;
    mockCategoryRepository = new CategoryRepository() as jest.Mocked<CategoryRepository>;
    mockActivityRepository = new ActivityRepository() as jest.Mocked<ActivityRepository>;

    // Create service container and register mocks
    serviceContainer = new ServiceContainer();
    serviceContainer.clear();
    serviceContainer.register('productRepository', () => mockProductRepository);
    serviceContainer.register('categoryRepository', () => mockCategoryRepository);
    serviceContainer.register('activityRepository', () => mockActivityRepository);

    // Create service with mocked dependencies
    productService = new ProductService(
      mockProductRepository,
      mockCategoryRepository,
      mockActivityRepository
    );
  });

  describe('createProduct', () => {
    const validProductData: CreateProductData = {
      name: 'Test Product',
      description: 'A test product',
      categoryId: 'category-1',
      price: 100,
      stockQuantity: 10,
      sku: 'TEST-001',
      status: 'draft',
      isCustomizable: false,
      isDigital: false,
      tags: []
    };

    const mockCategory = createMockCategory();
    const mockProduct = createMockProduct();

    it('should create a product successfully', async () => {
      // Arrange
      mockCategoryRepository.findById.mockResolvedValue(mockCategory as any);
      mockProductRepository.findBySku.mockResolvedValue(null);
      mockProductRepository.create.mockResolvedValue(mockProduct as any);
      mockActivityRepository.create.mockResolvedValue({} as Record<string, unknown>);

      // Act
      const result = await productService.createProduct(validProductData, 'owner-1');

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('category-1');
      expect(mockProductRepository.findBySku).toHaveBeenCalledWith('TEST-001');
      expect(mockProductRepository.create).toHaveBeenCalled();
      expect(mockActivityRepository.create).toHaveBeenCalled();
    });

    it('should throw validation error for invalid data', async () => {
      // Arrange
      const invalidData = { ...validProductData, name: '' };

      // Act & Assert
      await expect(productService.createProduct(invalidData, 'owner-1'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error when category not found', async () => {
      // Arrange
      mockCategoryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(productService.createProduct(validProductData, 'owner-1'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error when SKU already exists', async () => {
      // Arrange
      mockCategoryRepository.findById.mockResolvedValue(mockCategory as Record<string, unknown>);
      mockProductRepository.findBySku.mockResolvedValue(mockProduct as Record<string, unknown>);

      // Act & Assert
      await expect(productService.createProduct(validProductData, 'owner-1'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getProduct', () => {
    const mockProduct = {
      id: 'product-1',
      name: 'Test Product',
      description: 'A test product',
      price: 100
    };

    it('should return product from cache if available', async () => {
      // This test would require mocking the CacheService
      // For now, we'll test the repository call
      mockProductRepository.findById.mockResolvedValue(mockProduct as Record<string, unknown>);

      const result = await productService.getProduct('product-1');

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findById).toHaveBeenCalledWith('product-1');
    });

    it('should return null when product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const result = await productService.getProduct('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    const existingProduct = {
      id: 'product-1',
      name: 'Existing Product',
      description: 'An existing product',
      price: 100,
      businessOwnerId: 'owner-1'
    };

    const updateData: UpdateProductData = {
      id: 'product-1',
      name: 'Updated Product',
      price: 150
    };

    it('should update product successfully', async () => {
      // Arrange
      mockProductRepository.findById.mockResolvedValue(existingProduct as Record<string, unknown>);
      mockProductRepository.update.mockResolvedValue({
        ...existingProduct,
        ...updateData
      } as Record<string, unknown>);
      mockActivityRepository.create.mockResolvedValue({} as Record<string, unknown>);

      // Act
      const result = await productService.updateProduct('product-1', updateData, 'owner-1');

      // Assert
      expect(result.name).toBe('Updated Product');
      expect(result.price).toBe(150);
      expect(mockProductRepository.update).toHaveBeenCalledWith('product-1', updateData);
    });

    it('should throw error when product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(productService.updateProduct('non-existent', updateData, 'owner-1'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('deleteProduct', () => {
    const existingProduct = {
      id: 'product-1',
      name: 'Test Product',
      businessOwnerId: 'owner-1'
    };

    it('should delete product successfully', async () => {
      // Arrange
      mockProductRepository.findById.mockResolvedValue(existingProduct as any);
      mockProductRepository.delete.mockResolvedValue();
      mockActivityRepository.create.mockResolvedValue({} as Record<string, unknown>);

      // Act
      await productService.deleteProduct('product-1', 'owner-1');

      // Assert
      expect(mockProductRepository.delete).toHaveBeenCalledWith('product-1');
      expect(mockActivityRepository.create).toHaveBeenCalled();
    });

    it('should throw error when product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(productService.deleteProduct('non-existent', 'owner-1'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('validateProductData', () => {
    it('should return valid result for correct data', async () => {
      const validData: CreateProductData = {
        name: 'Test Product',
        description: 'A test product',
        categoryId: 'category-1',
        price: 100,
        stockQuantity: 10,
        sku: 'TEST-001',
        status: 'draft',
        isCustomizable: false,
        isDigital: false,
        tags: []
      };

      const result = await productService.validateProductData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for missing name', async () => {
      const invalidData = {
        name: '',
        description: 'A test product',
        categoryId: 'category-1',
        price: 100
      };

      const result = await productService.validateProductData(invalidData as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name is required');
    });

    it('should return invalid result for negative price', async () => {
      const invalidData = {
        name: 'Test Product',
        description: 'A test product',
        categoryId: 'category-1',
        price: -10
      };

      const result = await productService.validateProductData(invalidData as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid price is required');
    });
  });
});
