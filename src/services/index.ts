// Business Services
export { ProductService, type ProductValidationResult } from './ProductService';
export { CategoryService, type CategoryValidationResult } from './CategoryService';
export { UserService, type UserValidationResult } from './UserService';
export { ActivityService, type ActivityFilters, type ActivityStats } from './ActivityService';

// Service Interfaces
export { type CategoryHierarchy } from './interfaces/ICategoryService';
export { type UserStats } from './interfaces/IUserService';
export { type ProductSearchOptions } from './interfaces/IProductService';

// Data Access Services (existing)
export { FirebaseService } from './firebase';
export { FirebaseAdminService } from './firebase-admin';
