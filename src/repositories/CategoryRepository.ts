import { BaseRepository, QueryFilter } from './BaseRepository';
import { Collections } from '@/services/firebase';
import { Category } from '@/types/products';

export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super(Collections.PRODUCT_CATEGORIES);
  }

  async findByParentId(parentId: string): Promise<Category[]> {
    return this.findAll({
      filters: [{ field: 'parentCategoryId', operator: '==', value: parentId }]
    });
  }

  async findRootCategories(): Promise<Category[]> {
    return this.findAll({
      filters: [
        { field: 'parentCategoryId', operator: '==', value: null },
        { field: 'isActive', operator: '==', value: true }
      ]
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const results = await this.findAll({
      filters: [{ field: 'slug', operator: '==', value: slug }]
    });
    return results.length > 0 ? results[0] : null;
  }

  async findActiveCategories(): Promise<Category[]> {
    return this.findAll({
      filters: [{ field: 'isActive', operator: '==', value: true }]
    });
  }

  async findByLevel(level: number): Promise<Category[]> {
    return this.findAll({
      filters: [{ field: 'level', operator: '==', value: level }]
    });
  }

  async findCategoriesByPath(path: string[]): Promise<Category[]> {
    // This is a simplified implementation
    // In a real scenario, you might want to implement more sophisticated path queries
    const filters: QueryFilter[] = [];
    
    if (path.length > 0) {
      filters.push({ field: 'path', operator: 'array-contains', value: path[0] });
    }

    return this.findAll({ filters });
  }

  async getCategoryHierarchy(): Promise<Category[]> {
    return this.findAll({
      orderBy: { field: 'level', direction: 'asc' }
    });
  }

  async getCategoryBreadcrumbs(categoryId: string): Promise<Category[]> {
    const category = await this.findById(categoryId);
    if (!category || !category.path) {
      return [];
    }

    const breadcrumbs: Category[] = [];
    
    // Find categories by their names in the path
    for (const pathName of category.path) {
      const results = await this.findAll({
        filters: [
          { field: 'categoryName', operator: '==', value: pathName },
          { field: 'isActive', operator: '==', value: true }
        ]
      });
      
      if (results.length > 0) {
        breadcrumbs.push(results[0]);
      }
    }

    return breadcrumbs;
  }

  async getCategoryStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byLevel: Record<number, number>;
  }> {
    const allCategories = await this.findAll();
    const activeCategories = await this.findActiveCategories();
    
    const stats = {
      total: allCategories.length,
      active: activeCategories.length,
      inactive: allCategories.length - activeCategories.length,
      byLevel: {} as Record<number, number>
    };

    // Count by level
    allCategories.forEach(category => {
      const level = category.level || 0;
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
    });

    return stats;
  }

  async findCategoriesWithProducts(): Promise<Category[]> {
    // Get all active categories
    const activeCategories = await this.findActiveCategories();
    
    // Filter categories that have products
    const categoriesWithProducts: Category[] = [];
    
    for (const category of activeCategories) {
      const productCount = await this.getProductCountByCategory(category.id);
      if (productCount > 0) {
        categoriesWithProducts.push(category);
      }
    }
    
    return categoriesWithProducts;
  }

  async getProductCountByCategory(categoryId: string): Promise<number> {
    // Import ProductRepository dynamically to avoid circular dependency
    const { ProductRepository } = await import('./ProductRepository');
    const productRepository = new ProductRepository();
    return productRepository.getProductCountByCategory(categoryId);
  }

  async validateCategoryHierarchy(categoryId: string, newParentId?: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    // Check for self-parenting
    if (newParentId === categoryId) {
      errors.push('Category cannot be its own parent');
    }

    // Check for circular references
    if (newParentId) {
      const parent = await this.findById(newParentId);
      if (parent && parent.path) {
        const currentCategory = await this.findById(categoryId);
        if (currentCategory && parent.path.includes(currentCategory.categoryName)) {
          errors.push('Cannot create circular category reference');
        }
      }
    }

    // Check depth limit
    if (newParentId) {
      const parent = await this.findById(newParentId);
      if (parent && (parent.level || 0) >= 4) { // Max 5 levels (0-4)
        errors.push('Maximum category depth exceeded (5 levels max)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
