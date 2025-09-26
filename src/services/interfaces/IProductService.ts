import { 
  Product, 
  CreateProductData, 
  UpdateProductData, 
  ProductFilters,
  ProductSearchResult
} from '@/types/products';

export interface ProductSearchOptions {
  filters?: ProductFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface IProductService {
  createProduct(data: CreateProductData, businessOwnerId: string): Promise<Product>;
  updateProduct(id: string, data: UpdateProductData, userId: string): Promise<Product>;
  deleteProduct(id: string, userId: string): Promise<void>;
  getProduct(id: string): Promise<Product | null>;
  getProducts(options: ProductSearchOptions): Promise<ProductSearchResult>;
  getProductsByBusinessOwner(businessOwnerId: string, options?: ProductSearchOptions): Promise<ProductSearchResult>;
  updateStock(productId: string, quantity: number, userId: string): Promise<Product>;
  validateProductData(data: CreateProductData): Promise<{ isValid: boolean; errors: string[] }>;
}
