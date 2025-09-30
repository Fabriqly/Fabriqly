import { BaseRepository, QueryFilter } from './BaseRepository';
import { DesignerProfile } from '@/types/enhanced-products';
import { Collections } from '@/services/firebase';

export class DesignerProfileRepository extends BaseRepository<DesignerProfile> {
  constructor() {
    super(Collections.DESIGNER_PROFILES);
  }

  async findByUserId(userId: string): Promise<DesignerProfile | null> {
    const results = await this.findAll({
      filters: [{ field: 'userId', operator: '==', value: userId }]
    });
    return results.length > 0 ? results[0] : null;
  }

  async findByBusinessName(businessName: string): Promise<DesignerProfile[]> {
    return this.findAll({
      filters: [{ field: 'businessName', operator: '==', value: businessName }]
    });
  }

  async findVerifiedDesigners(): Promise<DesignerProfile[]> {
    return this.findAll({
      filters: [
        { field: 'isVerified', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findBySpecialties(specialties: string[]): Promise<DesignerProfile[]> {
    const results: DesignerProfile[] = [];
    
    for (const specialty of specialties) {
      const profiles = await this.findAll({
        filters: [
          { field: 'specialties', operator: 'array-contains', value: specialty },
          { field: 'isActive', operator: '==', value: true }
        ]
      });
      results.push(...profiles);
    }
    
    // Remove duplicates
    const uniqueResults = results.filter((profile, index, self) => 
      index === self.findIndex(p => p.id === profile.id)
    );
    
    return uniqueResults;
  }

  async searchDesigners(searchTerm: string): Promise<DesignerProfile[]> {
    const results: DesignerProfile[] = [];
    
    // Search by business name
    const businessNameResults = await this.findAll({
      filters: [
        { field: 'businessName', operator: '>=', value: searchTerm },
        { field: 'businessName', operator: '<=', value: searchTerm + '\uf8ff' },
        { field: 'isActive', operator: '==', value: true }
      ]
    });
    results.push(...businessNameResults);
    
    // Search by bio (if bio contains search term)
    const allActiveProfiles = await this.findAll({
      filters: [{ field: 'isActive', operator: '==', value: true }]
    });
    
    const bioResults = allActiveProfiles.filter(profile => 
      profile.bio && profile.bio.toLowerCase().includes(searchTerm.toLowerCase())
    );
    results.push(...bioResults);
    
    // Remove duplicates
    const uniqueResults = results.filter((profile, index, self) => 
      index === self.findIndex(p => p.id === profile.id)
    );
    
    return uniqueResults;
  }

  async getTopDesigners(limit: number = 10): Promise<DesignerProfile[]> {
    return this.findAll({
      filters: [{ field: 'isActive', operator: '==', value: true }],
      orderBy: { field: 'portfolioStats.totalDownloads', direction: 'desc' },
      limit
    });
  }

  async getMostViewedDesigners(limit: number = 10): Promise<DesignerProfile[]> {
    return this.findAll({
      filters: [{ field: 'isActive', operator: '==', value: true }],
      orderBy: { field: 'portfolioStats.totalViews', direction: 'desc' },
      limit
    });
  }

  async getHighestRatedDesigners(limit: number = 10): Promise<DesignerProfile[]> {
    return this.findAll({
      filters: [
        { field: 'isActive', operator: '==', value: true },
        { field: 'portfolioStats.averageRating', operator: '>', value: 0 }
      ],
      orderBy: { field: 'portfolioStats.averageRating', direction: 'desc' },
      limit
    });
  }

  async updatePortfolioStats(
    designerId: string, 
    stats: Partial<DesignerProfile['portfolioStats']>
  ): Promise<DesignerProfile> {
    const profile = await this.findById(designerId);
    if (!profile) {
      throw new Error('Designer profile not found');
    }

    const updatedStats = {
      ...profile.portfolioStats,
      ...stats
    };

    return this.update(designerId, { portfolioStats: updatedStats });
  }

  async incrementDesignCount(designerId: string): Promise<void> {
    const profile = await this.findById(designerId);
    if (profile) {
      await this.updatePortfolioStats(designerId, {
        totalDesigns: profile.portfolioStats.totalDesigns + 1
      });
    }
  }

  async decrementDesignCount(designerId: string): Promise<void> {
    const profile = await this.findById(designerId);
    if (profile) {
      await this.updatePortfolioStats(designerId, {
        totalDesigns: Math.max(0, profile.portfolioStats.totalDesigns - 1)
      });
    }
  }

  async incrementDownloadCount(designerId: string): Promise<void> {
    const profile = await this.findById(designerId);
    if (profile) {
      await this.updatePortfolioStats(designerId, {
        totalDownloads: profile.portfolioStats.totalDownloads + 1
      });
    }
  }

  async incrementViewCount(designerId: string): Promise<void> {
    const profile = await this.findById(designerId);
    if (profile) {
      await this.updatePortfolioStats(designerId, {
        totalViews: profile.portfolioStats.totalViews + 1
      });
    }
  }

  async updateAverageRating(designerId: string, newRating: number): Promise<void> {
    const profile = await this.findById(designerId);
    if (profile) {
      // This is a simplified calculation - in a real app, you'd want more sophisticated rating logic
      const currentRating = profile.portfolioStats.averageRating;
      const totalDesigns = profile.portfolioStats.totalDesigns;
      
      if (totalDesigns > 0) {
        const newAverage = ((currentRating * totalDesigns) + newRating) / (totalDesigns + 1);
        await this.updatePortfolioStats(designerId, {
          averageRating: Math.round(newAverage * 10) / 10 // Round to 1 decimal place
        });
      }
    }
  }

  async getDesignerStats(designerId: string): Promise<{
    totalDesigns: number;
    totalDownloads: number;
    totalViews: number;
    averageRating: number;
    isVerified: boolean;
    isActive: boolean;
    createdAt: Date;
  } | null> {
    const profile = await this.findById(designerId);
    if (!profile) {
      return null;
    }

    return {
      totalDesigns: profile.portfolioStats.totalDesigns,
      totalDownloads: profile.portfolioStats.totalDownloads,
      totalViews: profile.portfolioStats.totalViews,
      averageRating: profile.portfolioStats.averageRating,
      isVerified: profile.isVerified,
      isActive: profile.isActive,
      createdAt: profile.createdAt instanceof Date ? profile.createdAt : profile.createdAt.toDate()
    };
  }
}
