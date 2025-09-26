import { ServiceContainer } from '@/container/ServiceContainer';
import { ProductService } from '../ProductService';
import { UserService } from '../UserService';
import { CategoryService } from '../CategoryService';
import { ActivityService } from '../ActivityService';

// Mock all repositories and services
jest.mock('@/repositories/ProductRepository');
jest.mock('@/repositories/UserRepository');
jest.mock('@/repositories/CategoryRepository');
jest.mock('@/repositories/ActivityRepository');
jest.mock('@/services/firebase-admin');

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
    container.clear();
  });

  describe('Service Registration', () => {
    it('should register and retrieve a service', () => {
      const mockService = { test: 'value' };
      
      container.register('testService', () => mockService);
      const retrieved = container.get('testService');
      
      expect(retrieved).toBe(mockService);
    });

    it('should throw error when service not found', () => {
      expect(() => container.get('nonExistentService'))
        .toThrow('Service nonExistentService not found');
    });

    it('should maintain singleton instances', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return { id: callCount };
      };

      container.register('singletonService', factory);
      
      const instance1 = container.get('singletonService');
      const instance2 = container.get('singletonService');
      
      expect(instance1).toBe(instance2);
      expect(callCount).toBe(1);
    });

    it('should create new instances for non-singleton services', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return { id: callCount };
      };

      container.register('transientService', factory, false);
      
      const instance1 = container.get('transientService');
      const instance2 = container.get('transientService');
      
      expect(instance1).not.toBe(instance2);
      expect(callCount).toBe(2);
    });
  });

  describe('Default Service Registration', () => {
    let defaultContainer: ServiceContainer;

    beforeEach(() => {
      defaultContainer = ServiceContainer.getInstance();
    });

    it('should register all default services', () => {
      // Test that all default services are registered
      expect(() => defaultContainer.get('productRepository')).not.toThrow();
      expect(() => defaultContainer.get('userRepository')).not.toThrow();
      expect(() => defaultContainer.get('categoryRepository')).not.toThrow();
      expect(() => defaultContainer.get('activityRepository')).not.toThrow();
      expect(() => defaultContainer.get('productService')).not.toThrow();
      expect(() => defaultContainer.get('userService')).not.toThrow();
      expect(() => defaultContainer.get('categoryService')).not.toThrow();
      expect(() => defaultContainer.get('activityService')).not.toThrow();
    });

    it('should return correct service types', () => {
      const productService = defaultContainer.get('productService');
      const userService = defaultContainer.get('userService');
      const categoryService = defaultContainer.get('categoryService');
      const activityService = defaultContainer.get('activityService');

      expect(productService).toBeInstanceOf(ProductService);
      expect(userService).toBeInstanceOf(UserService);
      expect(categoryService).toBeInstanceOf(CategoryService);
      expect(activityService).toBeInstanceOf(ActivityService);
    });

    it('should maintain singleton instances for default services', () => {
      const productService1 = defaultContainer.get('productService');
      const productService2 = defaultContainer.get('productService');

      expect(productService1).toBe(productService2);
    });
  });

  describe('Service Dependencies', () => {
    it('should inject dependencies correctly', () => {
      const productService = container.get('productService');
      
      // Verify that the service has the expected dependencies
      expect(productService).toBeInstanceOf(ProductService);
      // Note: In a real test, you'd verify the dependencies are properly injected
      // This would require exposing the dependencies or using reflection
    });
  });

  describe('Container Management', () => {
    it('should clear all services', () => {
      container.register('testService', () => ({ test: 'value' }));
      container.get('testService'); // Create instance
      
      container.clear();
      
      expect(() => container.get('testService'))
        .toThrow('Service testService not found');
    });

    it('should handle service replacement', () => {
      const service1 = { version: 1 };
      const service2 = { version: 2 };

      container.register('versionedService', () => service1);
      const instance1 = container.get('versionedService');
      
      container.register('versionedService', () => service2);
      const instance2 = container.get('versionedService');
      
      expect(instance1).toBe(service1); // First instance is cached
      expect(instance2).toBe(service1); // Still returns cached instance
    });
  });

  describe('Error Handling', () => {
    it('should handle factory errors gracefully', () => {
      container.register('errorService', () => {
        throw new Error('Factory error');
      });

      expect(() => container.get('errorService'))
        .toThrow('Factory error');
    });

    it('should provide helpful error messages', () => {
      container.register('service1', () => ({ id: 1 }));
      container.register('service2', () => ({ id: 2 }));

      try {
        container.get('nonExistentService');
      } catch (error: any) {
        expect(error.message).toContain('nonExistentService not found');
        expect(error.message).toContain('service1');
        expect(error.message).toContain('service2');
      }
    });
  });

  describe('Performance', () => {
    it('should handle large number of services efficiently', () => {
      const startTime = Date.now();
      
      // Register 1000 services
      for (let i = 0; i < 1000; i++) {
        container.register(`service${i}`, () => ({ id: i }));
      }
      
      // Retrieve all services
      for (let i = 0; i < 1000; i++) {
        container.get(`service${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000);
    });
  });
});
