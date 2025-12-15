import { FirebaseAdminService } from './firebase-admin';
import { AppError } from '@/errors/AppError';

export interface TransactionOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data?: unknown;
}

export interface TransactionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  operations: TransactionOperation[];
}

export class TransactionService {
  /**
   * Execute multiple operations within a single transaction
   */
  static async executeTransaction<T>(
    operations: (transaction: unknown) => Promise<T>
  ): Promise<T> {
    try {
      return await FirebaseAdminService.runTransaction(operations);
    } catch (error) {
      console.error('Transaction failed:', error);
      throw AppError.internal('Transaction failed', error);
    }
  }

  /**
   * Execute multiple operations with rollback support
   */
  static async executeWithRollback<T>(
    operations: TransactionOperation[],
    executeFn: (operations: TransactionOperation[]) => Promise<T>
  ): Promise<TransactionResult<T>> {
    const result: TransactionResult<T> = {
      success: false,
      operations: []
    };

    try {
      const data = await executeFn(operations);
      result.success = true;
      result.data = data;
      result.operations = operations;
      return result;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.operations = operations;
      
      // Attempt rollback
      try {
        await this.rollback(operations);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
        result.error += ` (Rollback also failed: ${rollbackError})`;
      }
      
      return result;
    }
  }

  /**
   * Create a product with images in a transaction
   */
  static async createProductWithImages(
    productData: Record<string, unknown>,
    images: Array<Record<string, unknown>>,
    businessOwnerId: string
  ): Promise<Record<string, unknown>> {
    return this.executeTransaction(async (transaction) => {
      // Create product
      const product = await FirebaseAdminService.createDocument(
        'products',
        productData,
        transaction
      );

      // Create image records
      const imagePromises = images.map(image => 
        FirebaseAdminService.createDocument(
          'productImages',
          {
            productId: product.id,
            imageUrl: image.url,
            isPrimary: image.isPrimary || false,
            altText: image.altText || '',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          transaction
        )
      );

      const imageRecords = await Promise.all(imagePromises);

      return {
        product,
        images: imageRecords
      };
    });
  }

  /**
   * Update product and its related data in a transaction
   */
  static async updateProductWithRelations(
    productId: string,
    productData: Record<string, unknown>,
    categoryData?: Record<string, unknown>,
    imageData?: Array<Record<string, unknown>>
  ): Promise<Record<string, unknown>> {
    return this.executeTransaction(async (transaction) => {
      const results: Record<string, unknown> = {};

      // Update product
      if (productData) {
        results.product = await FirebaseAdminService.updateDocument(
          'products',
          productId,
          productData,
          transaction
        );
      }

      // Update category if provided
      if (categoryData) {
        results.category = await FirebaseAdminService.updateDocument(
          'productCategories',
          productData.categoryId,
          categoryData,
          transaction
        );
      }

      // Update images if provided
      if (imageData && imageData.length > 0) {
        const imagePromises = imageData.map(image => 
          FirebaseAdminService.updateDocument(
            'productImages',
            image.id,
            image.data,
            transaction
          )
        );
        results.images = await Promise.all(imagePromises);
      }

      return results;
    });
  }

  /**
   * Delete product and all related data in a transaction
   */
  static async deleteProductWithRelations(productId: string): Promise<void> {
    return this.executeTransaction(async (transaction) => {
      // Get product first to find related data
      const product = await FirebaseAdminService.getDocument('products', productId);
      if (!product) {
        throw AppError.notFound('Product not found');
      }

      // Delete product images
      const images = await FirebaseAdminService.queryDocuments(
        'productImages',
        [{ field: 'productId', operator: '==', value: productId }]
      );

      for (const image of images) {
        await FirebaseAdminService.deleteDocument(
          'productImages',
          image.id,
          transaction
        );
      }

      // Delete product variants
      const variants = await FirebaseAdminService.queryDocuments(
        'productVariants',
        [{ field: 'productId', operator: '==', value: productId }]
      );

      for (const variant of variants) {
        await FirebaseAdminService.deleteDocument(
          'productVariants',
          variant.id,
          transaction
        );
      }

      // Delete product colors
      const colors = await FirebaseAdminService.queryDocuments(
        'productColors',
        [{ field: 'productId', operator: '==', value: productId }]
      );

      for (const color of colors) {
        await FirebaseAdminService.deleteDocument(
          'productColors',
          color.id,
          transaction
        );
      }

      // Finally delete the product
      await FirebaseAdminService.deleteDocument('products', productId, transaction);
    });
  }

  /**
   * Create user with profile in a transaction
   */
  static async createUserWithProfile(
    userData: Record<string, unknown>,
    profileData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.executeTransaction(async (transaction) => {
      // Create user
      const user = await FirebaseAdminService.createDocument(
        'users',
        userData,
        transaction
      );

      // Create profile
      const profile = await FirebaseAdminService.createDocument(
        'userProfiles',
        {
          ...profileData,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        transaction
      );

      return {
        user,
        profile
      };
    });
  }

  /**
   * Update category hierarchy in a transaction
   */
  static async updateCategoryHierarchy(
    categoryId: string,
    newParentId: string | null
  ): Promise<Record<string, unknown>> {
    return this.executeTransaction(async (transaction) => {
      // Get category
      const category = await FirebaseAdminService.getDocument(
        'productCategories',
        categoryId
      );
      
      if (!category) {
        throw AppError.notFound('Category not found');
      }

      // Calculate new level and path
      let newLevel = 0;
      let newPath = [category.name];

      if (newParentId) {
        const parent = await FirebaseAdminService.getDocument(
          'productCategories',
          newParentId
        );
        
        if (!parent) {
          throw AppError.notFound('Parent category not found');
        }

        newLevel = (parent.level || 0) + 1;
        newPath = [...(parent.path || []), category.name];
      }

      // Update category
      const updatedCategory = await FirebaseAdminService.updateDocument(
        'productCategories',
        categoryId,
        {
          parentId: newParentId,
          level: newLevel,
          path: newPath,
          updatedAt: new Date()
        },
        transaction
      );

      // Update all child categories
      const children = await FirebaseAdminService.queryDocuments(
        'productCategories',
        [{ field: 'parentId', operator: '==', value: categoryId }]
      );

      for (const child of children) {
        await this.updateChildCategoryPath(child.id, newPath, transaction);
      }

      return updatedCategory;
    });
  }

  /**
   * Rollback operations (simplified implementation)
   */
  private static async rollback(operations: TransactionOperation[]): Promise<void> {
    // In a real implementation, you would:
    // 1. Keep track of original values
    // 2. Reverse operations in opposite order
    // 3. Handle partial failures gracefully
    
    console.log('Rolling back operations:', operations);
    
    // For now, just log the rollback attempt
    // In production, implement proper rollback logic
  }

  /**
   * Update child category path recursively
   */
  private static async updateChildCategoryPath(
    categoryId: string,
    parentPath: string[],
    transaction: unknown
  ): Promise<void> {
    const category = await FirebaseAdminService.getDocument(
      'productCategories',
      categoryId
    );

    if (!category) return;

    const newPath = [...parentPath, category.name];
    const newLevel = parentPath.length;

    await FirebaseAdminService.updateDocument(
      'productCategories',
      categoryId,
      {
        level: newLevel,
        path: newPath,
        updatedAt: new Date()
      },
      transaction
    );

    // Recursively update grandchildren
    const children = await FirebaseAdminService.queryDocuments(
      'productCategories',
      [{ field: 'parentId', operator: '==', value: categoryId }]
    );

    for (const child of children) {
      await this.updateChildCategoryPath(child.id, newPath, transaction);
    }
  }

  /**
   * Batch operations for better performance
   */
  static async executeBatchOperations(
    operations: TransactionOperation[]
  ): Promise<unknown[]> {
    const results: unknown[] = [];

    // Group operations by type for better performance
    const createOps = operations.filter(op => op.type === 'create');
    const updateOps = operations.filter(op => op.type === 'update');
    const deleteOps = operations.filter(op => op.type === 'delete');

    // Execute creates
    for (const op of createOps) {
      const result = await FirebaseAdminService.createDocument(
        op.collection,
        op.data
      );
      results.push(result);
    }

    // Execute updates
    for (const op of updateOps) {
      if (!op.docId) {
        throw AppError.badRequest('Document ID required for update operation');
      }
      
      const result = await FirebaseAdminService.updateDocument(
        op.collection,
        op.docId,
        op.data
      );
      results.push(result);
    }

    // Execute deletes
    for (const op of deleteOps) {
      if (!op.docId) {
        throw AppError.badRequest('Document ID required for delete operation');
      }
      
      await FirebaseAdminService.deleteDocument(op.collection, op.docId);
      results.push({ id: op.docId, deleted: true });
    }

    return results;
  }
}

