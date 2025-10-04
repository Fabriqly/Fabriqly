import { DesignerProfile, CreateDesignerProfileData, UpdateDesignerProfileData } from '@/types/enhanced-products';

export interface DesignerProfileFilters {
  userId?: string;
  isVerified?: boolean;
  isActive?: boolean;
  specialties?: string[];
  search?: string;
}

export interface DesignerProfileStats {
  totalDesigns: number;
  totalDownloads: number;
  totalViews: number;
  averageRating: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface DesignerProfileValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface IDesignerProfileService {
  // CRUD Operations
  createDesignerProfile(data: CreateDesignerProfileData, userId: string): Promise<DesignerProfile>;
  updateDesignerProfile(id: string, data: UpdateDesignerProfileData, userId: string): Promise<DesignerProfile>;
  deleteDesignerProfile(id: string, userId: string): Promise<void>;
  getDesignerProfile(id: string): Promise<DesignerProfile | null>;
  getDesignerProfileByUserId(userId: string): Promise<DesignerProfile | null>;
  
  // Query Operations
  getDesignerProfiles(filters?: DesignerProfileFilters): Promise<DesignerProfile[]>;
  getVerifiedDesigners(): Promise<DesignerProfile[]>;
  getTopDesigners(limit?: number): Promise<DesignerProfile[]>;
  getMostViewedDesigners(limit?: number): Promise<DesignerProfile[]>;
  getHighestRatedDesigners(limit?: number): Promise<DesignerProfile[]>;
  searchDesigners(searchTerm: string): Promise<DesignerProfile[]>;
  getDesignersBySpecialties(specialties: string[]): Promise<DesignerProfile[]>;
  
  // Analytics & Stats
  getDesignerStats(designerId: string): Promise<DesignerProfileStats | null>;
  updatePortfolioStats(designerId: string, stats: Partial<DesignerProfile['portfolioStats']>): Promise<DesignerProfile>;
  syncPortfolioStatsWithDesigns(designerId: string): Promise<DesignerProfile>;
  
  // Portfolio Management
  incrementDesignCount(designerId: string): Promise<void>;
  decrementDesignCount(designerId: string): Promise<void>;
  incrementDownloadCount(designerId: string): Promise<void>;
  incrementViewCount(designerId: string): Promise<void>;
  updateAverageRating(designerId: string, newRating: number): Promise<void>;
  
  // Verification & Status
  verifyDesigner(designerId: string): Promise<DesignerProfile>;
  unverifyDesigner(designerId: string): Promise<DesignerProfile>;
  activateDesigner(designerId: string): Promise<DesignerProfile>;
  deactivateDesigner(designerId: string): Promise<DesignerProfile>;
  
  // Verification Management
  getVerificationStats(): Promise<{
    totalPending: number;
 totalVerified: number;
 totalRejected: number;
 totalActive: number;
  }>;
  getPendingVerifications(limit?: number): Promise<DesignerProfile[]>;
  getVerifiedDesignersWithDetails(): Promise<DesignerProfile[]>;
  getSuspendedDesigners(): Promise<DesignerProfile[]>;
  getRecentVerifications(days?: number): Promise<DesignerProfile[]>;
  bulkUpdateVerificationStatus(designerIds: string[], isVerified: boolean, adminId: string): Promise<void>;
  searchUnverifiedDesigners(searchTerm: string): Promise<DesignerProfile[]>;
  getDesignersRequiringReview(thresholdDesigns?: number): Promise<DesignerProfile[]>;
  
  // Validation
  validateDesignerProfileData(data: CreateDesignerProfileData): DesignerProfileValidationResult;
  canUserModifyProfile(profileId: string, userId: string): Promise<boolean>;
  isBusinessNameAvailable(businessName: string, excludeId?: string): Promise<boolean>;
}
