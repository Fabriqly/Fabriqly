import { ProductRepository } from '@/repositories/ProductRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { CategoryRepository } from '@/repositories/CategoryRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductService } from '@/services/ProductService';
import { UserService } from '@/services/UserService';
import { CategoryService } from '@/services/CategoryService';
import { ActivityService } from '@/services/ActivityService';

export type ServiceFactory<T> = () => T;

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, ServiceFactory<any>>();
  private singletons = new Map<string, any>();

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
      ServiceContainer.instance.registerDefaultServices();
    }
    return ServiceContainer.instance;
  }

  register<T>(key: string, factory: ServiceFactory<T>, singleton: boolean = true): void {
    this.services.set(key, factory);
    
    // If it's a singleton and we already have an instance, keep it
    if (singleton && this.singletons.has(key)) {
      return;
    }
    
    // If it's not a singleton, remove any existing instance
    if (!singleton) {
      this.singletons.delete(key);
    }
  }

  get<T>(key: string): T {
    // Check if we have a singleton instance
    if (this.singletons.has(key)) {
      return this.singletons.get(key);
    }

    // Get the factory and create instance
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service ${key} not found. Available services: ${Array.from(this.services.keys()).join(', ')}`);
    }

    const instance = factory();
    
    // Store as singleton if it's registered as one
    const isSingleton = this.services.has(key);
    if (isSingleton) {
      this.singletons.set(key, instance);
    }

    return instance;
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }

  private registerDefaultServices(): void {
    // Register repositories
    this.register('productRepository', () => new ProductRepository());
    this.register('userRepository', () => new UserRepository());
    this.register('categoryRepository', () => new CategoryRepository());
    this.register('activityRepository', () => new ActivityRepository());

    // Register services with their dependencies
    this.register('productService', () => new ProductService(
      this.get<ProductRepository>('productRepository'),
      this.get<CategoryRepository>('categoryRepository'),
      this.get<ActivityRepository>('activityRepository')
    ));

    this.register('userService', () => new UserService(
      this.get<UserRepository>('userRepository'),
      this.get<ActivityRepository>('activityRepository')
    ));

    this.register('categoryService', () => new CategoryService(
      this.get<CategoryRepository>('categoryRepository'),
      this.get<ProductRepository>('productRepository'),
      this.get<ActivityRepository>('activityRepository')
    ));

    this.register('activityService', () => new ActivityService(
      this.get<ActivityRepository>('activityRepository')
    ));
  }
}

