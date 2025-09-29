import { SupabaseStorageService } from '@/lib/supabase-storage';
import { StorageBuckets } from '@/lib/supabase-storage';

export class ImageCleanupService {
  /**
   * Extract Supabase storage path from image URL
   */
  static extractStoragePath(imageUrl: string, entityType: 'product' | 'category'): string | null {
    try {
      // Parse Supabase storage URLs like:
      // https://project.supabase.co/storage/v1/object/public/objects/bucket/folder/file.jpg
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => 
        Object.values(StorageBuckets).includes(part as any)
      );
      
      if (bucketIndex === -1) return null;
      
      // Extract path from bucket onwards: folder/filename.jpg
      const pathParts = urlParts.slice(bucketIndex + 1);
      return pathParts.join('/');
    } catch (error) {
      console.warn('Failed to extract storage path from URL:', imageUrl);
      return null;
    }
  }

  /**
   * Delete single image from Supabase storage
   */
  static async deleteImage(imageUrl: string, bucket: string): Promise<boolean> {
    try {
      const storagePath = this.extractStoragePath(imageUrl, 
        bucket === StorageBuckets.PRODUCTS ? 'product' : 'category'
      );
      
      if (!storagePath) {
        console.warn('Could not extract storage path from URL:', imageUrl);
        return false;
      }

      await SupabaseStorageService.deleteFile(bucket, storagePath);
      console.log(`✅ Successfully deleted image: ${storagePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete image from Supabase: ${imageUrl}`, error);
      return false;
    }
  }

  /**
   * Delete all images for a product
   */
  static async deleteProductImages(productImages: Array<{ imageUrl: string }>): Promise<{
    successCount: number;
    failureCount: number;
    errors: string[];
  }> {
    const results = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[]
    };

    for (const image of productImages) {
      try {
        const success = await this.deleteImage(image.imageUrl, StorageBuckets.PRODUCTS);
        if (success) {
          results.successCount++;
        } else {
          results.failureCount++;
          results.errors.push(`Could not parse URL: ${image.imageUrl}`);
        }
      } catch (error: any) {
        results.failureCount++;
        results.errors.push(`Delete failed for ${image.imageUrl}: ${error.message}`);
      }
    }

    console.log(`📊 Product image cleanup: ${results.successCount} deleted, ${results.failureCount} failed`);
    return results;
  }

  /**
   * Delete category image
   */
  static async deleteCategoryImage(imageUrl: string): Promise<boolean> {
    if (!imageUrl) return true; // No image to delete
    
    try {
      const success = await this.deleteImage(imageUrl, StorageBuckets.CATEGORIES);
      if (success) {
        console.log('✅ Category image deleted successfully');
      } else {
        console.warn('⚠️ Category image cleanup had issues');
      }
      return success;
    } catch (error: any) {
      console.error('❌ Category image cleanup failed:', error);
      return false;
    }
  }

  /**
   * Cleanup orphaned images (utility for manual cleanup)
   */
  static async cleanupOrphanedImages(): Promise<{
    categoryImagesDeleted: number;
    productImagesDeleted: number;
    errors: string[];
  }> {
    return {
      categoryImagesDeleted: 0, // Would require complex logic to identify orphans
      productImagesDeleted: 0, // Would require complex logic to identify orphans  
      errors: ['Orphaned image cleanup requires database queries to identify unused files']
    };
  }
}
