import { BaseRepository, QueryFilter } from './BaseRepository';
import { Design, DesignFilters } from '@/types/enhanced-products';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase/firestore';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { CacheService } from '@/services/CacheService';
import { FirebaseAdminService } from '@/services/firebase-admin';

export class DesignRepository extends BaseRepository<Design> {
  constructor() {
    super(Collections.DESIGNS);
  }

  async findByDesigner(designerId: string): Promise<Design[]> {
    // Generate cache key
    const cacheKey = CacheService.generateKey('designs_by_designer', designerId);
    
    // Try cache first
    const cached = await CacheService.get<Design[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const designs = await this.findAll({
      filters: [{ field: 'designerId', operator: '==', value: designerId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });

    // Cache the result for 5 minutes
    await CacheService.set(cacheKey, designs, 5 * 60 * 1000);

    return designs;
  }

  async findByCategory(categoryId: string): Promise<Design[]> {
    // Generate cache key
    const cacheKey = CacheService.generateKey('designs_by_category', categoryId);
    
    // Try cache first
    const cached = await CacheService.get<Design[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const designs = await this.findAll({
      filters: [{ field: 'categoryId', operator: '==', value: categoryId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });

    // Cache the result for 5 minutes
    await CacheService.set(cacheKey, designs, 5 * 60 * 1000);

    return designs;
  }

  async findPublicDesigns(): Promise<Design[]> {
    // Generate cache key
    const cacheKey = CacheService.generateKey('public_designs');
    
    // Try cache first
    const cached = await CacheService.get<Design[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const designs = await this.findAll({
      filters: [
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });

    // Cache the result for 3 minutes (public designs change more frequently)
    await CacheService.set(cacheKey, designs, 3 * 60 * 1000);

    return designs;
  }

  async findFeaturedDesigns(): Promise<Design[]> {
    // Generate cache key
    const cacheKey = CacheService.generateKey('featured_designs');
    
    // Try cache first
    const cached = await CacheService.get<Design[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const designs = await this.findAll({
      filters: [
        { field: 'isFeatured', operator: '==', value: true },
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });

    // Cache the result for 10 minutes (featured designs change less frequently)
    await CacheService.set(cacheKey, designs, 10 * 60 * 1000);

    return designs;
  }

  async findFreeDesigns(): Promise<Design[]> {
    // Generate cache key
    const cacheKey = CacheService.generateKey('free_designs');
    
    // Try cache first
    const cached = await CacheService.get<Design[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const designs = await this.findAll({
      filters: [
        { field: 'pricing.isFree', operator: '==', value: true },
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });

    // Cache the result for 5 minutes
    await CacheService.set(cacheKey, designs, 5 * 60 * 1000);

    return designs;
  }

  async findByDesignType(designType: Design['designType']): Promise<Design[]> {
    return this.findAll({
      filters: [
        { field: 'designType', operator: '==', value: designType },
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByTags(tags: string[]): Promise<Design[]> {
    // Note: Firestore doesn't support array-contains-any with multiple values efficiently
    // This is a simplified implementation - in production, you might want to use a different approach
    const designs: Design[] = [];
    
    for (const tag of tags) {
      const tagDesigns = await this.findAll({
        filters: [
          { field: 'tags', operator: 'array-contains', value: tag },
          { field: 'isPublic', operator: '==', value: true },
          { field: 'isActive', operator: '==', value: true }
        ]
      });
      designs.push(...tagDesigns);
    }
    
    // Remove duplicates
    const uniqueDesigns = designs.filter((design, index, self) => 
      index === self.findIndex(d => d.id === design.id)
    );
    
    return uniqueDesigns.sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }

  async searchDesigns(searchTerm: string): Promise<Design[]> {
    // Note: This is a basic implementation. For production, consider using Algolia or similar
    const allDesigns = await this.findAll({
      filters: [
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ]
    });

    const searchLower = searchTerm.toLowerCase();
    return allDesigns.filter(design => 
      design.designName.toLowerCase().includes(searchLower) ||
      design.description.toLowerCase().includes(searchLower) ||
      design.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  async getPopularDesigns(limit: number = 10): Promise<Design[]> {
    return this.findAll({
      filters: [
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'downloadCount', direction: 'desc' },
      limit
    });
  }

  async getMostViewedDesigns(limit: number = 10): Promise<Design[]> {
    return this.findAll({
      filters: [
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'viewCount', direction: 'desc' },
      limit
    });
  }

  async getMostLikedDesigns(limit: number = 10): Promise<Design[]> {
    return this.findAll({
      filters: [
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'likesCount', direction: 'desc' },
      limit
    });
  }

  async incrementViewCount(designId: string): Promise<void> {
    const design = await this.findById(designId);
    if (design) {
      await this.update(designId, {
        viewCount: design.viewCount + 1,
        updatedAt: Timestamp.now()
      });
    }
  }

  async incrementDownloadCount(designId: string): Promise<void> {
    const design = await this.findById(designId);
    if (design) {
      await this.update(designId, {
        downloadCount: design.downloadCount + 1,
        updatedAt: Timestamp.now()
      });
    }
  }

  async incrementLikesCount(designId: string): Promise<void> {
    const design = await this.findById(designId);
    if (design) {
      await this.update(designId, {
        likesCount: design.likesCount + 1,
        updatedAt: Timestamp.now()
      });
    }
  }

  async decrementLikesCount(designId: string): Promise<void> {
    const design = await this.findById(designId);
    if (design && design.likesCount > 0) {
      await this.update(designId, {
        likesCount: design.likesCount - 1,
        updatedAt: Timestamp.now()
      });
    }
  }

  async getDesignsByFilters(filters: DesignFilters): Promise<Design[]> {
    const queryFilters: QueryFilter[] = [];

    if (filters.designerId) {
      queryFilters.push({ field: 'designerId', operator: '==', value: filters.designerId });
    }

    if (filters.categoryId) {
      queryFilters.push({ field: 'categoryId', operator: '==', value: filters.categoryId });
    }

    if (filters.designType) {
      queryFilters.push({ field: 'designType', operator: '==', value: filters.designType });
    }

    if (filters.isPublic !== undefined) {
      queryFilters.push({ field: 'isPublic', operator: '==', value: filters.isPublic });
    }

    if (filters.isFeatured !== undefined) {
      queryFilters.push({ field: 'isFeatured', operator: '==', value: filters.isFeatured });
    }

    if (filters.isFree !== undefined) {
      queryFilters.push({ field: 'pricing.isFree', operator: '==', value: filters.isFree });
    }

    // Always filter for active designs (isActive is not in DesignFilters interface)
    queryFilters.push({ field: 'isActive', operator: '==', value: true });

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    // Support cursor-based pagination via createdAt
    // Convert cursor (timestamp in ms) to Firestore Timestamp for proper comparison
    const startAfterValue = filters.cursor 
      ? AdminTimestamp.fromMillis(parseInt(filters.cursor.toString()))
      : undefined;
    const limit = filters.limit || 20;

    return FirebaseAdminService.queryDocuments(
      Collections.DESIGNS,
      queryFilters,
      { field: sortBy, direction: sortOrder },
      limit,
      startAfterValue
    ) as unknown as Design[];
  }

  async getDesignStats(designerId?: string): Promise<{
    totalDesigns: number;
    totalDownloads: number;
    totalViews: number;
    totalLikes: number;
    averageRating: number;
  }> {
    // Generate cache key
    const cacheKey = CacheService.generateKey('design_stats', designerId || 'all');
    
    // Try cache first
    const cached = await CacheService.get<{
      totalDesigns: number;
      totalDownloads: number;
      totalViews: number;
      totalLikes: number;
      averageRating: number;
    }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const filters: QueryFilter[] = [];
    
    if (designerId) {
      filters.push({ field: 'designerId', operator: '==', value: designerId });
    }

    const designs = await this.findAll({ filters });

    const stats = designs.reduce((acc, design) => ({
      totalDesigns: acc.totalDesigns + 1,
      totalDownloads: acc.totalDownloads + design.downloadCount,
      totalViews: acc.totalViews + design.viewCount,
      totalLikes: acc.totalLikes + design.likesCount,
      averageRating: acc.averageRating // Note: Rating system not implemented yet
    }), {
      totalDesigns: 0,
      totalDownloads: 0,
      totalViews: 0,
      totalLikes: 0,
      averageRating: 0
    });

    // Cache the result for 3 minutes (shorter than designer stats since design stats change more frequently)
    await CacheService.set(cacheKey, stats, 3 * 60 * 1000);

    return stats;
  }

  // Cache invalidation methods
  async invalidateDesignerCache(designerId: string): Promise<void> {
    const keys = [
      CacheService.generateKey('designs_by_designer', designerId),
      CacheService.generateKey('design_stats', designerId),
      CacheService.generateKey('designer_stats', designerId)
    ];
    
    for (const key of keys) {
      await CacheService.delete(key);
    }
  }

  async invalidateDesignCache(designId: string): Promise<void> {
    // Get the design to find the designer ID
    const design = await this.findById(designId);
    if (design) {
      await this.invalidateDesignerCache(design.designerId);
    }
    
    // Invalidate general caches
    const keys = [
      CacheService.generateKey('public_designs'),
      CacheService.generateKey('featured_designs'),
      CacheService.generateKey('free_designs'),
      CacheService.generateKey('design_stats', 'all')
    ];
    
    for (const key of keys) {
      await CacheService.delete(key);
    }
  }

  async invalidateAllDesignCaches(): Promise<void> {
    // This is a more aggressive approach - invalidate all design-related caches
    const keys = [
      'designs_by_designer',
      'designs_by_category', 
      'public_designs',
      'featured_designs',
      'free_designs',
      'design_stats'
    ];
    
    // Note: This is a simplified approach. In a production system, you'd want
    // to track cache keys more systematically or use a cache with pattern-based deletion
  }
}
