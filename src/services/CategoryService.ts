import { CategoryRepository } from '@/repositories/CategoryRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { Category, CreateCategoryData, UpdateCategoryData } from '@/types/products';
import { ActivityType } from '@/types/activity';
import { ICategoryService, CategoryHierarchy } from '@/services/interfaces/ICategoryService';
import { AppError } from '@/errors/AppError';
import { CacheService } from '@/services/CacheService';

export interface CategoryValidationResult {
  isValid: boolean;
  errors: string[];
}

export class CategoryService implements ICategoryService {
  constructor(
    private categoryRepository: CategoryRepository,
    private productRepository: ProductRepository,
    private activityRepository: ActivityRepository
  ) {}

  async createCategory(data: CreateCategoryData, userId: string): Promise<Category> {
    // Validate category data
    const validation = await this.validateCategoryData(data);
    if (!validation.isValid) {
      throw AppError.validation(`Validation failed: ${validation.errors.join(', ')}`, validation.errors);
    }

    // Check if slug already exists
    const existingSlug = await this.categoryRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw AppError.conflict('Category with this slug already exists');
    }

    // Handle parent category
    let level = 0;
    let path: string[] = [data.name];

    if (data.parentId) {
      const parent = await this.categoryRepository.findById(data.parentId);
      if (!parent) {
        throw AppError.notFound('Parent category not found');
      }

      level = (parent.level || 0) + 1;
      path = [...(parent.path || []), data.name];

      // Check depth limit
      if (level > 5) {
        throw AppError.badRequest('Maximum category depth exceeded (5 levels max)');
      }
    }

    // Create category
    const categoryData: Omit<Category, 'id'> = {
      categoryName: data.name.trim(),
      name: data.name.trim(), // Keep for backward compatibility
      description: data.description?.trim() || '',
      parentCategoryId: data.parentId,
      parentId: data.parentId, // Keep for backward compatibility
      slug: data.slug.trim(),
      isActive: data.isActive,
      level,
      path,
      sortOrder: 0, // Default sort order
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    };

    const category = await this.categoryRepository.create(categoryData);

    // Invalidate cache
    CacheService.invalidate('categories');

    // Log activity
    await this.logCategoryActivity('category_created', category.id, userId, {
      categoryName: category.categoryName || category.name,
      parentId: category.parentCategoryId || category.parentId,
      level: category.level
    });

    return category;
  }

  async updateCategory(categoryId: string, data: UpdateCategoryData, userId: string): Promise<Category> {
    const existingCategory = await this.categoryRepository.findById(categoryId);
    if (!existingCategory) {
      throw AppError.notFound('Category not found');
    }

    // Validate update data
    const validation = await this.validateCategoryUpdate(data, existingCategory);
    if (!validation.isValid) {
      throw AppError.validation(`Validation failed: ${validation.errors.join(', ')}`, validation.errors);
    }

    // Check if slug is being changed and if it already exists
    if (data.slug && data.slug !== existingCategory.slug) {
      const existingSlug = await this.categoryRepository.findBySlug(data.slug);
      if (existingSlug) {
        throw AppError.conflict('Category with this slug already exists');
      }
    }

    // Handle parent category changes
    let level = existingCategory.level || 0;
    let path = existingCategory.path || [];

    if (data.parentId !== undefined && data.parentId !== existingCategory.parentId) {
      // Validate hierarchy
      const hierarchyValidation = await this.categoryRepository.validateCategoryHierarchy(categoryId, data.parentId);
      if (!hierarchyValidation.isValid) {
        throw AppError.badRequest(`Hierarchy validation failed: ${hierarchyValidation.errors.join(', ')}`);
      }

      if (data.parentId) {
        const newParent = await this.categoryRepository.findById(data.parentId);
        if (!newParent) {
          throw AppError.notFound('Parent category not found');
        }

        level = (newParent.level || 0) + 1;
        const categoryName = data.name || existingCategory.categoryName || existingCategory.name || 'Unnamed Category';
        path = [...(newParent.path || []), categoryName];
      } else {
        // Moving to root level
        level = 0;
        const categoryName = data.name || existingCategory.categoryName || existingCategory.name || 'Unnamed Category';
        path = [categoryName];
      }
    }

    // Update category
    const updateData = {
      ...(data.name && { 
        categoryName: data.name.trim(),
        name: data.name.trim() // Keep for backward compatibility
      }),
      ...(data.description !== undefined && { description: data.description.trim() }),
      ...(data.slug && { slug: data.slug.trim() }),
      ...(data.parentId !== undefined && { 
        parentCategoryId: data.parentId,
        parentId: data.parentId // Keep for backward compatibility
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      level,
      path
    };

    const updatedCategory = await this.categoryRepository.update(categoryId, updateData);

    // If parent changed, update all children's paths
    if (data.parentId !== undefined && data.parentId !== existingCategory.parentId) {
      await this.updateChildrenPaths(categoryId, path);
    }

    // Log activity
    await this.logCategoryActivity('category_updated', categoryId, userId, {
      categoryName: updatedCategory.categoryName || updatedCategory.name,
      changedFields: Object.keys(updateData)
    });

    return updatedCategory;
  }

  async deleteCategory(categoryId: string, userId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if there are products using this category
    const productsInCategory = await this.productRepository.getProductCountByCategory(categoryId);
    if (productsInCategory > 0) {
      throw new Error('Cannot delete category that has products. Please reassign or delete products first.');
    }

    // Check if there are subcategories
    const subcategories = await this.categoryRepository.findByParentId(categoryId);
    if (subcategories.length > 0) {
      throw new Error('Cannot delete category that has subcategories. Please delete subcategories first.');
    }

    await this.categoryRepository.delete(categoryId);

    // Log activity
    await this.logCategoryActivity('category_deleted', categoryId, userId, {
      categoryName: category.categoryName || category.name,
      level: category.level
    });
  }

  async getCategory(categoryId: string): Promise<Category | null> {
    const cacheKey = CacheService.categoryKey(categoryId);
    const cached = await CacheService.get<Category>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const category = await this.categoryRepository.findById(categoryId);
    
    if (category) {
      CacheService.set(cacheKey, category);
    }

    return category;
  }

  async getCategories(): Promise<Category[]> {
    const cacheKey = CacheService.categoriesListKey();
    const cached = await CacheService.get<Category[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const categories = await this.categoryRepository.findActiveCategories();
    CacheService.set(cacheKey, categories);

    return categories;
  }

  async getCategoryHierarchy(): Promise<CategoryHierarchy[]> {
    const categories = await this.categoryRepository.getCategoryHierarchy();
    const rootCategories = categories.filter(cat => !cat.parentCategoryId && !cat.parentId);

    return Promise.all(
      rootCategories.map(cat => this.buildCategoryHierarchy(cat, categories))
    );
  }

  async getCategoryBreadcrumbs(categoryId: string): Promise<Category[]> {
    return this.categoryRepository.getCategoryBreadcrumbs(categoryId);
  }

  async getRootCategories(): Promise<Category[]> {
    return this.categoryRepository.findRootCategories();
  }

  async getSubcategories(parentId: string): Promise<Category[]> {
    return this.categoryRepository.findByParentId(parentId);
  }

  async getCategoryStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byLevel: Record<number, number>;
  }> {
    return this.categoryRepository.getCategoryStats();
  }

  async getCategoryWithProductCount(categoryId: string): Promise<{
    category: Category;
    productCount: number;
  } | null> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      return null;
    }

    const productCount = await this.productRepository.getProductCountByCategory(categoryId);

    return {
      category,
      productCount
    };
  }

  private async buildCategoryHierarchy(category: Category, allCategories: Category[]): Promise<CategoryHierarchy> {
    const children = allCategories.filter(cat => 
      (cat.parentCategoryId === category.id) || (cat.parentId === category.id)
    );
    const productCount = await this.productRepository.getProductCountByCategory(category.id);

    const childHierarchies = await Promise.all(
      children.map(child => this.buildCategoryHierarchy(child, allCategories))
    );

    return {
      category,
      children: childHierarchies,
      productCount
    };
  }

  private async updateChildrenPaths(parentId: string, parentPath: string[]): Promise<void> {
    const children = await this.categoryRepository.findByParentId(parentId);

    for (const child of children) {
      const childName = child.categoryName || child.name || 'Unnamed Category';
      const newPath = [...parentPath, childName];
      await this.categoryRepository.update(child.id, {
        path: newPath,
        level: newPath.length - 1
      });

      // Recursively update grandchildren
      await this.updateChildrenPaths(child.id, newPath);
    }
  }

  async validateCategoryData(data: CreateCategoryData): Promise<CategoryValidationResult> {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Category name is required');
    }

    if (!data.slug || data.slug.trim().length === 0) {
      errors.push('Category slug is required');
    }

    // Validate slug format
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      errors.push('Category slug must contain only lowercase letters, numbers, and hyphens');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async validateCategoryUpdate(data: UpdateCategoryData, existingCategory: Category): Promise<CategoryValidationResult> {
    const errors: string[] = [];

    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      errors.push('Category name cannot be empty');
    }

    if (data.slug !== undefined && (!data.slug || data.slug.trim().length === 0)) {
      errors.push('Category slug cannot be empty');
    }

    // Validate slug format
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      errors.push('Category slug must contain only lowercase letters, numbers, and hyphens');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async logCategoryActivity(
    type: ActivityType,
    categoryId: string,
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
        targetId: categoryId,
        targetType: 'category',
        targetName: metadata.categoryName || 'Unknown Category',
        metadata,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      });
    } catch (error) {
      console.error('Error logging category activity:', error);
      // Don't fail the operation if activity logging fails
    }
  }

  private getActivityTitle(type: ActivityType): string {
    const titles: Partial<Record<ActivityType, string>> = {
      'category_created': 'Category Created',
      'category_updated': 'Category Updated',
      'category_deleted': 'Category Deleted'
    };
    return titles[type] || 'Category Activity';
  }

  private getActivityDescription(type: ActivityType, metadata: Record<string, any>): string {
    const categoryName = metadata.categoryName || 'Category';
    
    switch (type) {
      case 'category_created':
        return `Category "${categoryName}" has been created`;
      case 'category_updated':
        return `Category "${categoryName}" has been updated`;
      case 'category_deleted':
        return `Category "${categoryName}" has been deleted`;
      default:
        return `Category "${categoryName}" activity`;
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const cacheKey = CacheService.generateKey('category', 'slug', slug);
    const cached = await CacheService.get<Category>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const category = await this.categoryRepository.findBySlug(slug);
    
    if (category) {
      CacheService.set(cacheKey, category);
    }

    return category;
  }
}
