// Business Services
export { ProductService, type ProductValidationResult } from './ProductService';
export { CategoryService, type CategoryValidationResult } from './CategoryService';
export { UserService, type UserValidationResult } from './UserService';
export { ActivityService, type ActivityFilters, type ActivityStats } from './ActivityService';
export { OrderService } from './OrderService';

// Service Interfaces
export { type CategoryHierarchy } from './interfaces/ICategoryService';
export { type UserStats } from './interfaces/IUserService';
export { type ProductSearchOptions } from './interfaces/IProductService';
export { type OrderSearchOptions, type OrderSearchResult, type OrderStats } from './interfaces/IOrderService';

// Data Access Services (existing)
export { FirebaseService } from './firebase';
export { FirebaseAdminService } from './firebase-admin';
