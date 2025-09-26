import { Category } from '@/types/products';

export interface CreateCategoryData {
  name: string;
  description?: string;
  parentId?: string;
  slug: string;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  parentId?: string;
  slug?: string;
  isActive?: boolean;
}

export interface CategoryHierarchy {
  category: Category;
  children: CategoryHierarchy[];
  productCount: number;
}

export interface ICategoryService {
  createCategory(data: CreateCategoryData, userId: string): Promise<Category>;
  updateCategory(categoryId: string, data: UpdateCategoryData, userId: string): Promise<Category>;
  deleteCategory(categoryId: string, userId: string): Promise<void>;
  getCategory(categoryId: string): Promise<Category | null>;
  getCategories(): Promise<Category[]>;
  getRootCategories(): Promise<Category[]>;
  getSubcategories(parentId: string): Promise<Category[]>;
  getCategoryHierarchy(): Promise<CategoryHierarchy[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  validateCategoryData(data: CreateCategoryData): Promise<{ isValid: boolean; errors: string[] }>;
}
