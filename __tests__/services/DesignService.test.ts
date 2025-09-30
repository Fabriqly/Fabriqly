import { DesignService } from '@/services/DesignService';
import { DesignRepository } from '@/repositories/DesignRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { CreateDesignData, Design, DesignWithDetails } from '@/types/enhanced-products';

// Mock dependencies
jest.mock('@/repositories/DesignRepository');
jest.mock('@/repositories/ActivityRepository');
jest.mock('@/services/firebase-admin');

describe('DesignService', () => {
  let designService: DesignService;
  let mockDesignRepository: jest.Mocked<DesignRepository>;
  let mockActivityRepository: jest.Mocked<ActivityRepository>;

  beforeEach(() => {
    mockDesignRepository = new DesignRepository() as jest.Mocked<DesignRepository>;
    mockActivityRepository = new ActivityRepository() as jest.Mocked<ActivityRepository>;
    designService = new DesignService(mockDesignRepository, mockActivityRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDesign', () => {
    const mockDesignData: CreateDesignData = {
      designName: 'Test Design',
      description: 'A test design',
      categoryId: 'cat1',
      designFileUrl: 'https://example.com/design.png',
      thumbnailUrl: 'https://example.com/thumbnail.png',
      designType: 'template',
      fileFormat: 'png',
      tags: ['test'],
      isPublic: true,
      pricing: { isFree: true, currency: 'USD' }
    };

    it('should create a design successfully', async () => {
      const mockDesign: Design = {
        id: 'design1',
        ...mockDesignData,
        designSlug: 'test-design-123',
        designerId: 'designer1',
        isFeatured: false,
        isActive: true,
        downloadCount: 0,
        viewCount: 0,
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDesignRepository.create.mockResolvedValue(mockDesign);
      mockActivityRepository.create.mockResolvedValue({} as any);

      const result = await designService.createDesign(mockDesignData, 'user1');

      expect(result).toEqual(mockDesign);
      expect(mockDesignRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          designName: 'Test Design',
          description: 'A test design',
          categoryId: 'cat1'
        })
      );
      expect(mockActivityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          action: 'DESIGN_CREATED',
          entityType: 'design',
          entityId: 'design1'
        })
      );
    });

    it('should throw error for invalid design data', async () => {
      const invalidData = { ...mockDesignData, designName: '' };

      await expect(designService.createDesign(invalidData, 'user1'))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('getDesign', () => {
    it('should return design with details', async () => {
      const mockDesign: Design = {
        id: 'design1',
        designName: 'Test Design',
        description: 'A test design',
        designSlug: 'test-design',
        designerId: 'designer1',
        categoryId: 'cat1',
        designFileUrl: 'https://example.com/design.png',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        designType: 'template',
        fileFormat: 'png',
        tags: ['test'],
        isPublic: true,
        isFeatured: false,
        isActive: true,
        pricing: { isFree: true, currency: 'USD' },
        downloadCount: 0,
        viewCount: 0,
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDesignRepository.findById.mockResolvedValue(mockDesign);

      const result = await designService.getDesign('design1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('design1');
      expect(result?.designName).toBe('Test Design');
    });

    it('should return null for non-existent design', async () => {
      mockDesignRepository.findById.mockResolvedValue(null);

      const result = await designService.getDesign('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateDesign', () => {
    it('should update design successfully', async () => {
      const existingDesign: Design = {
        id: 'design1',
        designName: 'Original Name',
        description: 'Original description',
        designSlug: 'original-slug',
        designerId: 'designer1',
        categoryId: 'cat1',
        designFileUrl: 'https://example.com/design.png',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        designType: 'template',
        fileFormat: 'png',
        tags: ['test'],
        isPublic: true,
        isFeatured: false,
        isActive: true,
        pricing: { isFree: true, currency: 'USD' },
        downloadCount: 0,
        viewCount: 0,
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedDesign = { ...existingDesign, designName: 'Updated Name' };

      mockDesignRepository.findById.mockResolvedValue(existingDesign);
      mockDesignRepository.update.mockResolvedValue(updatedDesign);
      mockActivityRepository.create.mockResolvedValue({} as any);

      const result = await designService.updateDesign('design1', { designName: 'Updated Name' }, 'user1');

      expect(result.designName).toBe('Updated Name');
      expect(mockDesignRepository.update).toHaveBeenCalledWith('design1', expect.objectContaining({
        designName: 'Updated Name',
        updatedAt: expect.any(Date)
      }));
    });

    it('should throw error for non-existent design', async () => {
      mockDesignRepository.findById.mockResolvedValue(null);

      await expect(designService.updateDesign('nonexistent', { designName: 'New Name' }, 'user1'))
        .rejects.toThrow('Design not found');
    });
  });

  describe('deleteDesign', () => {
    it('should delete design successfully', async () => {
      const existingDesign: Design = {
        id: 'design1',
        designName: 'Test Design',
        description: 'A test design',
        designSlug: 'test-design',
        designerId: 'designer1',
        categoryId: 'cat1',
        designFileUrl: 'https://example.com/design.png',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        designType: 'template',
        fileFormat: 'png',
        tags: ['test'],
        isPublic: true,
        isFeatured: false,
        isActive: true,
        pricing: { isFree: true, currency: 'USD' },
        downloadCount: 0,
        viewCount: 0,
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDesignRepository.findById.mockResolvedValue(existingDesign);
      mockDesignRepository.delete.mockResolvedValue();
      mockActivityRepository.create.mockResolvedValue({} as any);

      await designService.deleteDesign('design1', 'user1');

      expect(mockDesignRepository.delete).toHaveBeenCalledWith('design1');
      expect(mockActivityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          action: 'DESIGN_DELETED',
          entityType: 'design',
          entityId: 'design1'
        })
      );
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count', async () => {
      const existingDesign: Design = {
        id: 'design1',
        designName: 'Test Design',
        description: 'A test design',
        designSlug: 'test-design',
        designerId: 'designer1',
        categoryId: 'cat1',
        designFileUrl: 'https://example.com/design.png',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        designType: 'template',
        fileFormat: 'png',
        tags: ['test'],
        isPublic: true,
        isFeatured: false,
        isActive: true,
        pricing: { isFree: true, currency: 'USD' },
        downloadCount: 0,
        viewCount: 5,
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDesignRepository.findById.mockResolvedValue(existingDesign);
      mockDesignRepository.update.mockResolvedValue({ ...existingDesign, viewCount: 6 });

      await designService.incrementViewCount('design1');

      expect(mockDesignRepository.update).toHaveBeenCalledWith('design1', {
        viewCount: 6,
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('incrementDownloadCount', () => {
    it('should increment download count', async () => {
      const existingDesign: Design = {
        id: 'design1',
        designName: 'Test Design',
        description: 'A test design',
        designSlug: 'test-design',
        designerId: 'designer1',
        categoryId: 'cat1',
        designFileUrl: 'https://example.com/design.png',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        designType: 'template',
        fileFormat: 'png',
        tags: ['test'],
        isPublic: true,
        isFeatured: false,
        isActive: true,
        pricing: { isFree: true, currency: 'USD' },
        downloadCount: 3,
        viewCount: 0,
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDesignRepository.findById.mockResolvedValue(existingDesign);
      mockDesignRepository.update.mockResolvedValue({ ...existingDesign, downloadCount: 4 });

      await designService.incrementDownloadCount('design1');

      expect(mockDesignRepository.update).toHaveBeenCalledWith('design1', {
        downloadCount: 4,
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('incrementLikesCount', () => {
    it('should increment likes count', async () => {
      const existingDesign: Design = {
        id: 'design1',
        designName: 'Test Design',
        description: 'A test design',
        designSlug: 'test-design',
        designerId: 'designer1',
        categoryId: 'cat1',
        designFileUrl: 'https://example.com/design.png',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        designType: 'template',
        fileFormat: 'png',
        tags: ['test'],
        isPublic: true,
        isFeatured: false,
        isActive: true,
        pricing: { isFree: true, currency: 'USD' },
        downloadCount: 0,
        viewCount: 0,
        likesCount: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDesignRepository.findById.mockResolvedValue(existingDesign);
      mockDesignRepository.update.mockResolvedValue({ ...existingDesign, likesCount: 3 });

      await designService.incrementLikesCount('design1');

      expect(mockDesignRepository.update).toHaveBeenCalledWith('design1', {
        likesCount: 3,
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('validateDesignData', () => {
    it('should validate correct design data', () => {
      const validData: CreateDesignData = {
        designName: 'Test Design',
        description: 'A test design',
        categoryId: 'cat1',
        designFileUrl: 'https://example.com/design.png',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        designType: 'template',
        fileFormat: 'png',
        tags: ['test'],
        isPublic: true,
        pricing: { isFree: true, currency: 'USD' }
      };

      const result = designService.validateDesignData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid design data', () => {
      const invalidData = {
        designName: '',
        description: '',
        categoryId: '',
        designFileUrl: '',
        thumbnailUrl: '',
        designType: 'invalid' as any,
        fileFormat: 'invalid' as any,
        tags: [],
        isPublic: true,
        pricing: { isFree: true, currency: 'USD' }
      };

      const result = designService.validateDesignData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('canUserModifyDesign', () => {
    it('should allow admin to modify any design', async () => {
      const result = await designService.canUserModifyDesign('design1', 'admin-user');

      expect(result).toBe(true);
    });

    it('should allow designer to modify own design', async () => {
      const existingDesign: Design = {
        id: 'design1',
        designName: 'Test Design',
        description: 'A test design',
        designSlug: 'test-design',
        designerId: 'designer1',
        categoryId: 'cat1',
        designFileUrl: 'https://example.com/design.png',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        designType: 'template',
        fileFormat: 'png',
        tags: ['test'],
        isPublic: true,
        isFeatured: false,
        isActive: true,
        pricing: { isFree: true, currency: 'USD' },
        downloadCount: 0,
        viewCount: 0,
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDesignRepository.findById.mockResolvedValue(existingDesign);

      const result = await designService.canUserModifyDesign('design1', 'designer1');

      expect(result).toBe(true);
    });

    it('should deny designer from modifying other designer\'s design', async () => {
      const existingDesign: Design = {
        id: 'design1',
        designName: 'Test Design',
        description: 'A test design',
        designSlug: 'test-design',
        designerId: 'designer1',
        categoryId: 'cat1',
        designFileUrl: 'https://example.com/design.png',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        designType: 'template',
        fileFormat: 'png',
        tags: ['test'],
        isPublic: true,
        isFeatured: false,
        isActive: true,
        pricing: { isFree: true, currency: 'USD' },
        downloadCount: 0,
        viewCount: 0,
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDesignRepository.findById.mockResolvedValue(existingDesign);

      const result = await designService.canUserModifyDesign('design1', 'other-designer');

      expect(result).toBe(false);
    });
  });
});
