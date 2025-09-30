import { BaseRepository, QueryFilter } from './BaseRepository';
import { Design, DesignFilters } from '@/types/enhanced-products';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase/firestore';

export class DesignRepository extends BaseRepository<Design> {
  constructor() {
    super(Collections.DESIGNS);
  }

  async findByDesigner(designerId: string): Promise<Design[]> {
    return this.findAll({
      filters: [{ field: 'designerId', operator: '==', value: designerId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByCategory(categoryId: string): Promise<Design[]> {
    return this.findAll({
      filters: [{ field: 'categoryId', operator: '==', value: categoryId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findPublicDesigns(): Promise<Design[]> {
    return this.findAll({
      filters: [
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findFeaturedDesigns(): Promise<Design[]> {
    return this.findAll({
      filters: [
        { field: 'isFeatured', operator: '==', value: true },
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findFreeDesigns(): Promise<Design[]> {
    return this.findAll({
      filters: [
        { field: 'pricing.isFree', operator: '==', value: true },
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
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

    return this.findAll({
      filters: queryFilters,
      orderBy: { field: sortBy, direction: sortOrder },
      limit: filters.limit || 20
    });
  }

  async getDesignStats(designerId?: string): Promise<{
    totalDesigns: number;
    totalDownloads: number;
    totalViews: number;
    totalLikes: number;
    averageRating: number;
  }> {
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

    return stats;
  }
}
