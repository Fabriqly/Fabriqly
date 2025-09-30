import { 
  Design, 
  CreateDesignData, 
  UpdateDesignData, 
  DesignFilters,
  DesignWithDetails 
} from '@/types/enhanced-products';

export interface DesignSearchOptions {
  search?: string;
  categoryId?: string;
  designerId?: string;
  designType?: Design['designType'];
  isFree?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'downloads' | 'views' | 'likes' | 'price';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface DesignStats {
  totalDesigns: number;
  totalDownloads: number;
  totalViews: number;
  totalLikes: number;
  averageRating: number;
}

export interface IDesignService {
  // CRUD Operations
  createDesign(data: CreateDesignData, designerId: string): Promise<Design>;
  updateDesign(id: string, data: UpdateDesignData, userId: string): Promise<Design>;
  deleteDesign(id: string, userId: string): Promise<void>;
  getDesign(id: string): Promise<DesignWithDetails | null>;
  
  // Query Operations
  getDesigns(filters?: DesignFilters): Promise<DesignWithDetails[]>;
  getDesignsByDesigner(designerId: string): Promise<DesignWithDetails[]>;
  getPublicDesigns(): Promise<DesignWithDetails[]>;
  getFeaturedDesigns(): Promise<DesignWithDetails[]>;
  getFreeDesigns(): Promise<DesignWithDetails[]>;
  searchDesigns(options: DesignSearchOptions): Promise<DesignWithDetails[]>;
  
  // Analytics
  getPopularDesigns(limit?: number): Promise<DesignWithDetails[]>;
  getMostViewedDesigns(limit?: number): Promise<DesignWithDetails[]>;
  getMostLikedDesigns(limit?: number): Promise<DesignWithDetails[]>;
  getDesignStats(designerId?: string): Promise<DesignStats>;
  
  // Interaction Operations
  incrementViewCount(designId: string): Promise<void>;
  incrementDownloadCount(designId: string): Promise<void>;
  incrementLikesCount(designId: string): Promise<void>;
  decrementLikesCount(designId: string): Promise<void>;
  
  // Validation
  validateDesignData(data: CreateDesignData): DesignValidationResult;
  canUserModifyDesign(designId: string, userId: string): Promise<boolean>;
}

export interface DesignValidationResult {
  isValid: boolean;
  errors: string[];
}
