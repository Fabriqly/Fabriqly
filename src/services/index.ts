// Business Services
export { ProductService, type ProductSearchOptions, type ProductValidationResult } from './ProductService';
export { CategoryService, type CategoryValidationResult, type CategoryHierarchy } from './CategoryService';
export { UserService, type UserValidationResult, type UserStats } from './UserService';
export { ActivityService, type ActivityFilters, type ActivityStats } from './ActivityService';

// Data Access Services (existing)
export { FirebaseService } from './firebase';
export { FirebaseAdminService } from './firebase-admin';
