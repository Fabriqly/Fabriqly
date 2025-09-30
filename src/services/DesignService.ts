import { IDesignService, DesignSearchOptions, DesignStats, DesignValidationResult } from './interfaces/IDesignService';
import { DesignRepository } from '@/repositories/DesignRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { 
  Design, 
  DesignFilters, 
  DesignWithDetails,
  DesignerProfile,
  Category,
  CreateDesignData,
  UpdateDesignData
} from '@/types/enhanced-products';
import { FirebaseAdminService } from './firebase-admin';
import { Collections } from './firebase';
import { Timestamp } from 'firebase/firestore';

export class DesignService implements IDesignService {
  constructor(
    private designRepository: DesignRepository,
    private activityRepository: ActivityRepository
  ) {}

  async createDesign(data: CreateDesignData, designerId: string): Promise<Design> {
    // Validate design data
    const validation = this.validateDesignData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Get designer profile to verify it exists
    const designerProfile = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_PROFILES,
      [{ field: 'userId', operator: '==', value: designerId }]
    );

    if (designerProfile.length === 0) {
      throw new Error('Designer profile not found');
    }

    // Generate design slug
    const slug = data.designName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    const designData: Omit<Design, 'id'> = {
      designName: data.designName,
      description: data.description,
      designSlug: slug,
      designerId: designerProfile[0].id,
      categoryId: data.categoryId,
      designFileUrl: data.designFileUrl,
      thumbnailUrl: data.thumbnailUrl,
      previewUrl: data.previewUrl,
      designType: data.designType,
      fileFormat: data.fileFormat,
      tags: data.tags,
      isPublic: data.isPublic,
      isFeatured: false, // Only admins can feature designs
      isActive: true,
      pricing: data.pricing,
      downloadCount: 0,
      viewCount: 0,
      likesCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const design = await this.designRepository.create(designData);

    // Update designer profile stats
    await FirebaseAdminService.updateDocument(
      Collections.DESIGNER_PROFILES,
      designerProfile[0].id,
      {
        portfolioStats: {
          ...designerProfile[0].portfolioStats,
          totalDesigns: designerProfile[0].portfolioStats.totalDesigns + 1
        },
        updatedAt: Timestamp.now()
      }
    );

    // Log activity
    await this.activityRepository.create({
      type: 'design_created',
      title: 'Design Created',
      description: `Design "${design.designName}" was created`,
      priority: 'medium',
      status: 'active',
      actorId: designerId,
      targetId: design.id,
      targetType: 'design',
      targetName: design.designName,
      metadata: {
        action: 'created',
        designName: design.designName,
        designType: design.designType
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return design;
  }

  async updateDesign(id: string, data: UpdateDesignData, userId: string): Promise<Design> {
    const existingDesign = await this.designRepository.findById(id);
    if (!existingDesign) {
      throw new Error('Design not found');
    }

    // Check if user can modify this design
    const canModify = await this.canUserModifyDesign(id, userId);
    if (!canModify) {
      throw new Error('Unauthorized to modify this design');
    }

    const updateData: Partial<Design> = {
      ...data,
      updatedAt: Timestamp.now()
    };

    const updatedDesign = await this.designRepository.update(id, updateData);

    // Log activity
    await this.activityRepository.create({
      type: 'design_updated',
      title: 'Design Updated',
      description: `Design "${updatedDesign.designName}" was updated`,
      priority: 'medium',
      status: 'active',
      actorId: userId,
      targetId: id,
      targetType: 'design',
      targetName: updatedDesign.designName,
      metadata: {
        action: 'updated',
        designName: updatedDesign.designName,
        changes: Object.keys(data)
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return updatedDesign;
  }

  async deleteDesign(id: string, userId: string): Promise<void> {
    const existingDesign = await this.designRepository.findById(id);
    if (!existingDesign) {
      throw new Error('Design not found');
    }

    // Check if user can modify this design
    const canModify = await this.canUserModifyDesign(id, userId);
    if (!canModify) {
      throw new Error('Unauthorized to delete this design');
    }

    await this.designRepository.delete(id);

    // Update designer profile stats
    const designerProfile = await FirebaseAdminService.getDocument(
      Collections.DESIGNER_PROFILES,
      existingDesign.designerId
    );

    if (designerProfile) {
      await FirebaseAdminService.updateDocument(
        Collections.DESIGNER_PROFILES,
        existingDesign.designerId,
        {
          portfolioStats: {
            ...designerProfile.portfolioStats,
            totalDesigns: Math.max(0, designerProfile.portfolioStats.totalDesigns - 1)
          },
          updatedAt: Timestamp.now()
        }
      );
    }

    // Log activity
    await this.activityRepository.create({
      type: 'design_deleted',
      title: 'Design Deleted',
      description: `Design "${existingDesign.designName}" was deleted`,
      priority: 'medium',
      status: 'active',
      actorId: userId,
      targetId: id,
      targetType: 'design',
      targetName: existingDesign.designName,
      metadata: {
        action: 'deleted',
        designName: existingDesign.designName
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  async getDesign(id: string): Promise<DesignWithDetails | null> {
    const design = await this.designRepository.findById(id);
    if (!design) {
      return null;
    }

    // Get related data
    const [designer, category] = await Promise.all([
      FirebaseAdminService.getDocument(Collections.DESIGNER_PROFILES, design.designerId) as Promise<DesignerProfile | null>,
      FirebaseAdminService.getDocument(Collections.PRODUCT_CATEGORIES, design.categoryId) as Promise<Category | null>
    ]);

    return {
      ...design,
      designer: designer || {
        id: '',
        businessName: 'Unknown Designer',
        userId: '',
        specialties: [],
        isVerified: false,
        isActive: true,
        portfolioStats: { totalDesigns: 0, totalDownloads: 0, totalViews: 0, averageRating: 0 },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as DesignerProfile,
      category: category || {
        id: '',
        categoryName: 'Unknown',
        slug: 'unknown',
        level: 0,
        path: [],
        isActive: true,
        sortOrder: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as Category
    };
  }

  async getDesigns(filters?: DesignFilters): Promise<DesignWithDetails[]> {
    const designs = await this.designRepository.getDesignsByFilters(filters || {});
    
    // Populate with related data
    return Promise.all(
      designs.map(async (design) => {
        const [designer, category] = await Promise.all([
          FirebaseAdminService.getDocument(Collections.DESIGNER_PROFILES, design.designerId) as Promise<DesignerProfile | null>,
          FirebaseAdminService.getDocument(Collections.PRODUCT_CATEGORIES, design.categoryId) as Promise<Category | null>
        ]);

        return {
          ...design,
          designer: designer || {
            id: '',
            businessName: 'Unknown Designer',
            userId: '',
            specialties: [],
            isVerified: false,
            isActive: true,
            portfolioStats: { totalDesigns: 0, totalDownloads: 0, totalViews: 0, averageRating: 0 },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          } as DesignerProfile,
          category: category || {
            id: '',
            categoryName: 'Unknown',
            slug: 'unknown',
            level: 0,
            path: [],
            isActive: true,
            sortOrder: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          } as Category
        };
      })
    );
  }

  async getDesignsByDesigner(designerId: string): Promise<DesignWithDetails[]> {
    const filters: DesignFilters = { designerId };
    return this.getDesigns(filters);
  }

  async getPublicDesigns(): Promise<DesignWithDetails[]> {
    const filters: DesignFilters = { isPublic: true };
    return this.getDesigns(filters);
  }

  async getFeaturedDesigns(): Promise<DesignWithDetails[]> {
    const filters: DesignFilters = { isFeatured: true, isPublic: true };
    return this.getDesigns(filters);
  }

  async getFreeDesigns(): Promise<DesignWithDetails[]> {
    const filters: DesignFilters = { isFree: true, isPublic: true };
    return this.getDesigns(filters);
  }

  async searchDesigns(options: DesignSearchOptions): Promise<DesignWithDetails[]> {
    const filters: DesignFilters = {
      search: options.search,
      categoryId: options.categoryId,
      designerId: options.designerId,
      designType: options.designType,
      isFree: options.isFree,
      isFeatured: options.isFeatured,
      tags: options.tags,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      limit: options.limit,
      offset: options.offset
    };

    return this.getDesigns(filters);
  }

  async getPopularDesigns(limit: number = 10): Promise<DesignWithDetails[]> {
    const designs = await this.designRepository.getPopularDesigns(limit);
    
    return Promise.all(
      designs.map(async (design) => {
        const [designer, category] = await Promise.all([
          FirebaseAdminService.getDocument(Collections.DESIGNER_PROFILES, design.designerId) as Promise<DesignerProfile | null>,
          FirebaseAdminService.getDocument(Collections.PRODUCT_CATEGORIES, design.categoryId) as Promise<Category | null>
        ]);

        return {
          ...design,
          designer: designer || {
            id: '',
            businessName: 'Unknown Designer',
            userId: '',
            specialties: [],
            isVerified: false,
            isActive: true,
            portfolioStats: { totalDesigns: 0, totalDownloads: 0, totalViews: 0, averageRating: 0 },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          } as DesignerProfile,
          category: category || {
            id: '',
            categoryName: 'Unknown',
            slug: 'unknown',
            level: 0,
            path: [],
            isActive: true,
            sortOrder: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          } as Category
        };
      })
    );
  }

  async getMostViewedDesigns(limit: number = 10): Promise<DesignWithDetails[]> {
    const designs = await this.designRepository.getMostViewedDesigns(limit);
    
    return Promise.all(
      designs.map(async (design) => {
        const [designer, category] = await Promise.all([
          FirebaseAdminService.getDocument(Collections.DESIGNER_PROFILES, design.designerId) as Promise<DesignerProfile | null>,
          FirebaseAdminService.getDocument(Collections.PRODUCT_CATEGORIES, design.categoryId) as Promise<Category | null>
        ]);

        return {
          ...design,
          designer: designer || {
            id: '',
            businessName: 'Unknown Designer',
            userId: '',
            specialties: [],
            isVerified: false,
            isActive: true,
            portfolioStats: { totalDesigns: 0, totalDownloads: 0, totalViews: 0, averageRating: 0 },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          } as DesignerProfile,
          category: category || {
            id: '',
            categoryName: 'Unknown',
            slug: 'unknown',
            level: 0,
            path: [],
            isActive: true,
            sortOrder: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          } as Category
        };
      })
    );
  }

  async getMostLikedDesigns(limit: number = 10): Promise<DesignWithDetails[]> {
    const designs = await this.designRepository.getMostLikedDesigns(limit);
    
    return Promise.all(
      designs.map(async (design) => {
        const [designer, category] = await Promise.all([
          FirebaseAdminService.getDocument(Collections.DESIGNER_PROFILES, design.designerId) as Promise<DesignerProfile | null>,
          FirebaseAdminService.getDocument(Collections.PRODUCT_CATEGORIES, design.categoryId) as Promise<Category | null>
        ]);

        return {
          ...design,
          designer: designer || {
            id: '',
            businessName: 'Unknown Designer',
            userId: '',
            specialties: [],
            isVerified: false,
            isActive: true,
            portfolioStats: { totalDesigns: 0, totalDownloads: 0, totalViews: 0, averageRating: 0 },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          } as DesignerProfile,
          category: category || {
            id: '',
            categoryName: 'Unknown',
            slug: 'unknown',
            level: 0,
            path: [],
            isActive: true,
            sortOrder: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          } as Category
        };
      })
    );
  }

  async getDesignStats(designerId?: string): Promise<DesignStats> {
    return this.designRepository.getDesignStats(designerId);
  }

  async incrementViewCount(designId: string): Promise<void> {
    await this.designRepository.incrementViewCount(designId);
  }

  async incrementDownloadCount(designId: string): Promise<void> {
    await this.designRepository.incrementDownloadCount(designId);
  }

  async incrementLikesCount(designId: string): Promise<void> {
    await this.designRepository.incrementLikesCount(designId);
  }

  async decrementLikesCount(designId: string): Promise<void> {
    await this.designRepository.decrementLikesCount(designId);
  }

  validateDesignData(data: CreateDesignData): DesignValidationResult {
    const errors: string[] = [];

    if (!data.designName || data.designName.trim().length === 0) {
      errors.push('Design name is required');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!data.categoryId) {
      errors.push('Category is required');
    }

    if (!data.designFileUrl) {
      errors.push('Design file URL is required');
    }

    if (!data.thumbnailUrl) {
      errors.push('Thumbnail URL is required');
    }

    if (!data.designType || !['template', 'custom', 'premium'].includes(data.designType)) {
      errors.push('Valid design type is required');
    }

    if (!data.fileFormat || !['svg', 'png', 'jpg', 'pdf', 'ai', 'psd'].includes(data.fileFormat)) {
      errors.push('Valid file format is required');
    }

    if (data.tags && data.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    if (data.pricing && !data.pricing.isFree && (!data.pricing.price || data.pricing.price < 0)) {
      errors.push('Valid price is required for paid designs');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async canUserModifyDesign(designId: string, userId: string): Promise<boolean> {
    const design = await this.designRepository.findById(designId);
    if (!design) {
      return false;
    }

    // Get user role
    const user = await FirebaseAdminService.getDocument(Collections.USERS, userId);
    if (!user) {
      return false;
    }

    // Admins can modify any design
    if (user.role === 'admin') {
      return true;
    }

    // Get designer profile to check ownership
    const designerProfile = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_PROFILES,
      [{ field: 'userId', operator: '==', value: userId }]
    );

    if (designerProfile.length === 0) {
      return false;
    }

    // Designers can only modify their own designs
    return design.designerId === designerProfile[0].id;
  }
}
