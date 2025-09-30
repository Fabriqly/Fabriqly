import { IDesignerProfileService, DesignerProfileFilters, DesignerProfileStats, DesignerProfileValidationResult } from './interfaces/IDesignerProfileService';
import { DesignerProfileRepository } from '@/repositories/DesignerProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { 
  DesignerProfile, 
  CreateDesignerProfileData,
  UpdateDesignerProfileData
} from '@/types/enhanced-products';
import { CacheService } from './CacheService';
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';
import { AppError } from '@/errors/AppError';

export class DesignerProfileService implements IDesignerProfileService {
  constructor(
    private designerProfileRepository: DesignerProfileRepository,
    private activityRepository: ActivityRepository
  ) {}

  async createDesignerProfile(data: CreateDesignerProfileData, userId: string): Promise<DesignerProfile> {
    const monitor = new PerformanceMonitor('DesignerProfileService.createDesignerProfile');
    
    try {
      // Validate data
      const validation = this.validateDesignerProfileData(data);
      if (!validation.isValid) {
        throw AppError.badRequest(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user already has a designer profile
      const existingProfile = await this.designerProfileRepository.findByUserId(userId);
      if (existingProfile) {
        throw AppError.badRequest('User already has a designer profile');
      }

      // Check if business name is available
      const isNameAvailable = await this.isBusinessNameAvailable(data.businessName);
      if (!isNameAvailable) {
        throw AppError.badRequest('Business name is already taken');
      }

      // Create profile data
      const profileData: Omit<DesignerProfile, 'id'> = {
        businessName: data.businessName,
        userId,
        bio: data.bio,
        website: data.website,
        socialMedia: data.socialMedia,
        specialties: data.specialties || [],
        isVerified: false,
        isActive: true,
        portfolioStats: {
          totalDesigns: 0,
          totalDownloads: 0,
          totalViews: 0,
          averageRating: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create profile
      const profile = await this.designerProfileRepository.create(profileData);

      // Log activity
      await this.activityRepository.create({
        type: 'designer_profile_created',
        actorId: userId,
        targetId: profile.id,
        targetType: 'designer_profile',
        title: 'Designer Profile Created',
        description: `New designer profile created: ${profile.businessName}`,
        metadata: {
          businessName: profile.businessName,
          specialties: profile.specialties
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Cache the profile
      await CacheService.set(CacheService.userKey(`designer_profile_${userId}`), profile, 15 * 60 * 1000); // 15 minutes

      return profile;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async updateDesignerProfile(id: string, data: UpdateDesignerProfileData, userId: string): Promise<DesignerProfile> {
    const monitor = new PerformanceMonitor('DesignerProfileService.updateDesignerProfile');
    
    try {
      // Check if user can modify this profile
      const canModify = await this.canUserModifyProfile(id, userId);
      if (!canModify) {
        throw AppError.forbidden('You do not have permission to modify this profile');
      }

      // Get existing profile
      const existingProfile = await this.designerProfileRepository.findById(id);
      if (!existingProfile) {
        throw AppError.notFound('Designer profile not found');
      }

      // Check business name availability if it's being changed
      if (data.businessName && data.businessName !== existingProfile.businessName) {
        const isNameAvailable = await this.isBusinessNameAvailable(data.businessName, id);
        if (!isNameAvailable) {
          throw AppError.badRequest('Business name is already taken');
        }
      }

      // Update profile
      const updatedProfile = await this.designerProfileRepository.update(id, {
        ...data,
        updatedAt: new Date()
      });

      // Log activity
      await this.activityRepository.create({
        type: 'designer_profile_updated',
        actorId: userId,
        targetId: id,
        targetType: 'designer_profile',
        title: 'Designer Profile Updated',
        description: `Designer profile updated: ${updatedProfile.businessName}`,
        metadata: {
          businessName: updatedProfile.businessName,
          changes: Object.keys(data)
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update cache
      await CacheService.set(CacheService.userKey(`designer_profile_${userId}`), updatedProfile, 15 * 60 * 1000);
      await CacheService.invalidate(`designer_profile_${id}`);

      return updatedProfile;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async deleteDesignerProfile(id: string, userId: string): Promise<void> {
    const monitor = new PerformanceMonitor('DesignerProfileService.deleteDesignerProfile');
    
    try {
      // Check if user can modify this profile
      const canModify = await this.canUserModifyProfile(id, userId);
      if (!canModify) {
        throw AppError.forbidden('You do not have permission to delete this profile');
      }

      // Get profile for logging
      const profile = await this.designerProfileRepository.findById(id);
      if (!profile) {
        throw AppError.notFound('Designer profile not found');
      }

      // Delete profile
      await this.designerProfileRepository.delete(id);

      // Log activity
      await this.activityRepository.create({
        type: 'designer_profile_deleted',
        actorId: userId,
        targetId: id,
        targetType: 'designer_profile',
        title: 'Designer Profile Deleted',
        description: `Designer profile deleted: ${profile.businessName}`,
        metadata: {
          businessName: profile.businessName
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Clear cache
      await CacheService.delete(CacheService.userKey(`designer_profile_${userId}`));
      await CacheService.invalidate(`designer_profile_${id}`);
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async getDesignerProfile(id: string): Promise<DesignerProfile | null> {
    const monitor = new PerformanceMonitor('DesignerProfileService.getDesignerProfile');
    
    try {
      // Try cache first
      const cacheKey = CacheService.generateKey('designer_profile', id);
      const cached = await CacheService.get<DesignerProfile>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const profile = await this.designerProfileRepository.findById(id);
      
      // Cache the result
      if (profile) {
        await CacheService.set(cacheKey, profile, 15 * 60 * 1000); // 15 minutes
      }

      return profile;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async getDesignerProfileByUserId(userId: string): Promise<DesignerProfile | null> {
    const monitor = new PerformanceMonitor('DesignerProfileService.getDesignerProfileByUserId');
    
    try {
      // Try cache first
      const cacheKey = CacheService.userKey(`designer_profile_${userId}`);
      const cached = await CacheService.get<DesignerProfile>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const profile = await this.designerProfileRepository.findByUserId(userId);
      
      // Cache the result
      if (profile) {
        await CacheService.set(cacheKey, profile, 15 * 60 * 1000); // 15 minutes
      }

      return profile;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async getDesignerProfiles(filters?: DesignerProfileFilters): Promise<DesignerProfile[]> {
    const monitor = new PerformanceMonitor('DesignerProfileService.getDesignerProfiles');
    
    try {
      // Generate cache key based on filters
      const cacheKey = CacheService.generateKey('designer_profiles', JSON.stringify(filters || {}));
      const cached = await CacheService.get<DesignerProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      let profiles: DesignerProfile[] = [];

      if (filters?.search) {
        profiles = await this.designerProfileRepository.searchDesigners(filters.search);
      } else if (filters?.specialties && filters.specialties.length > 0) {
        profiles = await this.designerProfileRepository.findBySpecialties(filters.specialties);
      } else if (filters?.isVerified) {
        profiles = await this.designerProfileRepository.findVerifiedDesigners();
      } else {
        // Get all active profiles
        profiles = await this.designerProfileRepository.findAll({
          filters: [{ field: 'isActive', operator: '==', value: true }],
          orderBy: { field: 'createdAt', direction: 'desc' }
        });
      }

      // Apply additional filters
      if (filters?.userId) {
        profiles = profiles.filter(p => p.userId === filters.userId);
      }
      if (filters?.isActive !== undefined) {
        profiles = profiles.filter(p => p.isActive === filters.isActive);
      }

      // Cache the result
      await CacheService.set(cacheKey, profiles, 5 * 60 * 1000); // 5 minutes

      return profiles;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async getVerifiedDesigners(): Promise<DesignerProfile[]> {
    const monitor = new PerformanceMonitor('DesignerProfileService.getVerifiedDesigners');
    
    try {
      const cacheKey = CacheService.generateKey('designer_profiles', 'verified');
      const cached = await CacheService.get<DesignerProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const profiles = await this.designerProfileRepository.findVerifiedDesigners();
      
      // Cache the result
      await CacheService.set(cacheKey, profiles, 10 * 60 * 1000); // 10 minutes

      return profiles;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async getTopDesigners(limit: number = 10): Promise<DesignerProfile[]> {
    const monitor = new PerformanceMonitor('DesignerProfileService.getTopDesigners');
    
    try {
      const cacheKey = CacheService.generateKey('designer_profiles', 'top', limit.toString());
      const cached = await CacheService.get<DesignerProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const profiles = await this.designerProfileRepository.getTopDesigners(limit);
      
      // Cache the result
      await CacheService.set(cacheKey, profiles, 5 * 60 * 1000); // 5 minutes

      return profiles;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async getMostViewedDesigners(limit: number = 10): Promise<DesignerProfile[]> {
    const monitor = new PerformanceMonitor('DesignerProfileService.getMostViewedDesigners');
    
    try {
      const cacheKey = CacheService.generateKey('designer_profiles', 'most_viewed', limit.toString());
      const cached = await CacheService.get<DesignerProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const profiles = await this.designerProfileRepository.getMostViewedDesigners(limit);
      
      // Cache the result
      await CacheService.set(cacheKey, profiles, 5 * 60 * 1000); // 5 minutes

      return profiles;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async getHighestRatedDesigners(limit: number = 10): Promise<DesignerProfile[]> {
    const monitor = new PerformanceMonitor('DesignerProfileService.getHighestRatedDesigners');
    
    try {
      const cacheKey = CacheService.generateKey('designer_profiles', 'highest_rated', limit.toString());
      const cached = await CacheService.get<DesignerProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const profiles = await this.designerProfileRepository.getHighestRatedDesigners(limit);
      
      // Cache the result
      await CacheService.set(cacheKey, profiles, 5 * 60 * 1000); // 5 minutes

      return profiles;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async searchDesigners(searchTerm: string): Promise<DesignerProfile[]> {
    const monitor = new PerformanceMonitor('DesignerProfileService.searchDesigners');
    
    try {
      const cacheKey = CacheService.generateKey('designer_profiles', 'search', searchTerm);
      const cached = await CacheService.get<DesignerProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const profiles = await this.designerProfileRepository.searchDesigners(searchTerm);
      
      // Cache the result
      await CacheService.set(cacheKey, profiles, 2 * 60 * 1000); // 2 minutes

      return profiles;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async getDesignersBySpecialties(specialties: string[]): Promise<DesignerProfile[]> {
    const monitor = new PerformanceMonitor('DesignerProfileService.getDesignersBySpecialties');
    
    try {
      const cacheKey = CacheService.generateKey('designer_profiles', 'specialties', specialties.sort().join(','));
      const cached = await CacheService.get<DesignerProfile[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const profiles = await this.designerProfileRepository.findBySpecialties(specialties);
      
      // Cache the result
      await CacheService.set(cacheKey, profiles, 5 * 60 * 1000); // 5 minutes

      return profiles;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async getDesignerStats(designerId: string): Promise<DesignerProfileStats | null> {
    const monitor = new PerformanceMonitor('DesignerProfileService.getDesignerStats');
    
    try {
      const cacheKey = CacheService.generateKey('designer_stats', designerId);
      const cached = await CacheService.get<DesignerProfileStats>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get real-time stats from designs instead of cached profile stats
      const realTimeStats = await this.getRealTimeDesignerStats(designerId);
      
      // Cache the result
      if (realTimeStats) {
        await CacheService.set(cacheKey, realTimeStats, 5 * 60 * 1000); // 5 minutes (optimized for better performance)
      }

      return realTimeStats;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async getRealTimeDesignerStats(designerId: string): Promise<DesignerProfileStats | null> {
    try {
      // Get the designer profile to get basic info
      const profile = await this.designerProfileRepository.findById(designerId);
      if (!profile) {
        return null;
      }

      // Get real-time stats from designs
      const { DesignService } = await import('./DesignService');
      const { DesignRepository } = await import('../repositories/DesignRepository');
      const { ActivityRepository } = await import('../repositories/ActivityRepository');
      
      const designRepository = new DesignRepository();
      const activityRepository = new ActivityRepository();
      const designService = new DesignService(designRepository, activityRepository);
      
      const designStats = await designService.getDesignStats(designerId);

      return {
        totalDesigns: designStats.totalDesigns,
        totalDownloads: designStats.totalDownloads,
        totalViews: designStats.totalViews,
        averageRating: designStats.averageRating,
        isVerified: profile.isVerified,
        isActive: profile.isActive,
        createdAt: profile.createdAt instanceof Date ? profile.createdAt : profile.createdAt.toDate()
      };
    } catch (error) {
      console.error('Error getting real-time designer stats:', error);
      // Fallback to cached profile stats
      return this.designerProfileRepository.getDesignerStats(designerId);
    }
  }

  async updatePortfolioStats(designerId: string, stats: Partial<DesignerProfile['portfolioStats']>): Promise<DesignerProfile> {
    const monitor = new PerformanceMonitor('DesignerProfileService.updatePortfolioStats');
    
    try {
      const profile = await this.designerProfileRepository.updatePortfolioStats(designerId, stats);
      
      // Clear cache
      await CacheService.invalidate(`designer_profile_${designerId}`);
      await CacheService.invalidate(`designer_stats_${designerId}`);
      
      return profile;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async incrementDesignCount(designerId: string): Promise<void> {
    await this.designerProfileRepository.incrementDesignCount(designerId);
    await CacheService.invalidate(`designer_profile_${designerId}`);
    await CacheService.invalidate(`designer_stats_${designerId}`);
  }

  async decrementDesignCount(designerId: string): Promise<void> {
    await this.designerProfileRepository.decrementDesignCount(designerId);
    await CacheService.invalidate(`designer_profile_${designerId}`);
    await CacheService.invalidate(`designer_stats_${designerId}`);
  }

  async incrementDownloadCount(designerId: string): Promise<void> {
    await this.designerProfileRepository.incrementDownloadCount(designerId);
    await CacheService.invalidate(`designer_profile_${designerId}`);
    await CacheService.invalidate(`designer_stats_${designerId}`);
  }

  async incrementViewCount(designerId: string): Promise<void> {
    await this.designerProfileRepository.incrementViewCount(designerId);
    await CacheService.invalidate(`designer_profile_${designerId}`);
    await CacheService.invalidate(`designer_stats_${designerId}`);
  }

  async updateAverageRating(designerId: string, newRating: number): Promise<void> {
    await this.designerProfileRepository.updateAverageRating(designerId, newRating);
    await CacheService.invalidate(`designer_profile_${designerId}`);
    await CacheService.invalidate(`designer_stats_${designerId}`);
  }

  async syncPortfolioStatsWithDesigns(designerId: string): Promise<DesignerProfile> {
    const monitor = new PerformanceMonitor('DesignerProfileService.syncPortfolioStatsWithDesigns');
    
    try {
      // Get real-time stats from designs
      const realTimeStats = await this.getRealTimeDesignerStats(designerId);
      if (!realTimeStats) {
        throw new Error('Could not get real-time stats');
      }

      // Update the profile with real-time stats
      const updatedProfile = await this.designerProfileRepository.update(designerId, {
        portfolioStats: {
          totalDesigns: realTimeStats.totalDesigns,
          totalDownloads: realTimeStats.totalDownloads,
          totalViews: realTimeStats.totalViews,
          averageRating: realTimeStats.averageRating
        },
        updatedAt: new Date()
      });

      // Invalidate cache
      await CacheService.invalidate(`designer_stats_${designerId}`);
      await CacheService.invalidate(`designer_profile_${designerId}`);

      return updatedProfile;
    } catch (error) {
      monitor.recordError(error);
      throw error;
    } finally {
      monitor.end();
    }
  }

  async verifyDesigner(designerId: string): Promise<DesignerProfile> {
    const profile = await this.designerProfileRepository.update(designerId, {
      isVerified: true,
      updatedAt: new Date()
    });

    await CacheService.invalidate(`designer_profile_${designerId}`);
    return profile;
  }

  async unverifyDesigner(designerId: string): Promise<DesignerProfile> {
    const profile = await this.designerProfileRepository.update(designerId, {
      isVerified: false,
      updatedAt: new Date()
    });

    await CacheService.invalidate(`designer_profile_${designerId}`);
    return profile;
  }

  async activateDesigner(designerId: string): Promise<DesignerProfile> {
    const profile = await this.designerProfileRepository.update(designerId, {
      isActive: true,
      updatedAt: new Date()
    });

    await CacheService.invalidate(`designer_profile_${designerId}`);
    return profile;
  }

  async deactivateDesigner(designerId: string): Promise<DesignerProfile> {
    const profile = await this.designerProfileRepository.update(designerId, {
      isActive: false,
      updatedAt: new Date()
    });

    await CacheService.invalidate(`designer_profile_${designerId}`);
    return profile;
  }

  validateDesignerProfileData(data: CreateDesignerProfileData): DesignerProfileValidationResult {
    const errors: string[] = [];

    if (!data.businessName || data.businessName.trim().length === 0) {
      errors.push('Business name is required');
    } else if (data.businessName.length < 2) {
      errors.push('Business name must be at least 2 characters long');
    } else if (data.businessName.length > 100) {
      errors.push('Business name must be less than 100 characters');
    }

    if (data.bio && data.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    if (data.website && !this.isValidUrl(data.website)) {
      errors.push('Website must be a valid URL');
    }

    if (data.socialMedia) {
      if (data.socialMedia.instagram && !this.isValidSocialUrl(data.socialMedia.instagram, 'instagram')) {
        errors.push('Instagram URL must be valid');
      }
      if (data.socialMedia.facebook && !this.isValidSocialUrl(data.socialMedia.facebook, 'facebook')) {
        errors.push('Facebook URL must be valid');
      }
      if (data.socialMedia.twitter && !this.isValidSocialUrl(data.socialMedia.twitter, 'twitter')) {
        errors.push('Twitter URL must be valid');
      }
      if (data.socialMedia.linkedin && !this.isValidSocialUrl(data.socialMedia.linkedin, 'linkedin')) {
        errors.push('LinkedIn URL must be valid');
      }
    }

    if (data.specialties && data.specialties.length > 10) {
      errors.push('Maximum 10 specialties allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async canUserModifyProfile(profileId: string, userId: string): Promise<boolean> {
    const profile = await this.designerProfileRepository.findById(profileId);
    return profile ? profile.userId === userId : false;
  }

  async isBusinessNameAvailable(businessName: string, excludeId?: string): Promise<boolean> {
    const profiles = await this.designerProfileRepository.findByBusinessName(businessName);
    
    if (excludeId) {
      return profiles.filter(p => p.id !== excludeId).length === 0;
    }
    
    return profiles.length === 0;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidSocialUrl(url: string, platform: string): boolean {
    if (!this.isValidUrl(url)) {
      return false;
    }

    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    switch (platform) {
      case 'instagram':
        return hostname.includes('instagram.com');
      case 'facebook':
        return hostname.includes('facebook.com');
      case 'twitter':
        return hostname.includes('twitter.com') || hostname.includes('x.com');
      case 'linkedin':
        return hostname.includes('linkedin.com');
      default:
        return true;
    }
  }
}
