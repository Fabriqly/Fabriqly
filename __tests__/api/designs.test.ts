import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/designs/route';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/services/DesignService');
jest.mock('@/repositories/DesignRepository');
jest.mock('@/repositories/ActivityRepository');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/designs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/designs', () => {
    it('should return designs with filters', async () => {
      const mockDesigns = [
        {
          id: 'design1',
          designName: 'Test Design 1',
          description: 'A test design',
          designSlug: 'test-design-1',
          designerId: 'designer1',
          categoryId: 'cat1',
          designFileUrl: 'https://example.com/design1.png',
          thumbnailUrl: 'https://example.com/thumbnail1.png',
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
          updatedAt: new Date(),
          designer: {
            id: 'designer1',
            businessName: 'Test Designer',
            userId: 'user1',
            specialties: [],
            isVerified: false,
            isActive: true,
            portfolioStats: { totalDesigns: 1, totalDownloads: 0, totalViews: 0, averageRating: 0 },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          category: {
            id: 'cat1',
            categoryName: 'Test Category',
            slug: 'test-category',
            level: 0,
            path: [],
            isActive: true,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      ];

      // Mock the service
      const mockDesignService = {
        getDesigns: jest.fn().mockResolvedValue(mockDesigns)
      };

      // Mock the constructor
      jest.doMock('@/services/DesignService', () => ({
        DesignService: jest.fn().mockImplementation(() => mockDesignService)
      }));

      const request = new NextRequest('http://localhost:3000/api/designs?categoryId=cat1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.designs).toHaveLength(1);
      expect(data.designs[0].designName).toBe('Test Design 1');
    });

    it('should handle errors gracefully', async () => {
      // Mock service to throw error
      const mockDesignService = {
        getDesigns: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      jest.doMock('@/services/DesignService', () => ({
        DesignService: jest.fn().mockImplementation(() => mockDesignService)
      }));

      const request = new NextRequest('http://localhost:3000/api/designs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/designs', () => {
    it('should create a design for authenticated designer', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user1',
          email: 'designer@example.com',
          role: 'designer'
        }
      } as any);

      const mockDesign = {
        id: 'design1',
        designName: 'New Design',
        description: 'A new design',
        designSlug: 'new-design-123',
        designerId: 'designer1',
        categoryId: 'cat1',
        designFileUrl: 'https://example.com/design.png',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        designType: 'template',
        fileFormat: 'png',
        tags: ['new'],
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

      const mockDesignService = {
        createDesign: jest.fn().mockResolvedValue(mockDesign)
      };

      jest.doMock('@/services/DesignService', () => ({
        DesignService: jest.fn().mockImplementation(() => mockDesignService)
      }));

      const request = new NextRequest('http://localhost:3000/api/designs', {
        method: 'POST',
        body: JSON.stringify({
          designName: 'New Design',
          description: 'A new design',
          categoryId: 'cat1',
          designFileUrl: 'https://example.com/design.png',
          thumbnailUrl: 'https://example.com/thumbnail.png',
          designType: 'template',
          fileFormat: 'png',
          tags: ['new'],
          isPublic: true,
          pricing: { isFree: true, currency: 'USD' }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.design.designName).toBe('New Design');
    });

    it('should reject unauthorized users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user1',
          email: 'customer@example.com',
          role: 'customer'
        }
      } as any);

      const request = new NextRequest('http://localhost:3000/api/designs', {
        method: 'POST',
        body: JSON.stringify({
          designName: 'New Design',
          description: 'A new design',
          categoryId: 'cat1',
          designFileUrl: 'https://example.com/design.png',
          thumbnailUrl: 'https://example.com/thumbnail.png'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - Designer access required');
    });

    it('should reject unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/designs', {
        method: 'POST',
        body: JSON.stringify({
          designName: 'New Design',
          description: 'A new design',
          categoryId: 'cat1',
          designFileUrl: 'https://example.com/design.png',
          thumbnailUrl: 'https://example.com/thumbnail.png'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - Designer access required');
    });

    it('should handle validation errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user1',
          email: 'designer@example.com',
          role: 'designer'
        }
      } as any);

      const mockDesignService = {
        createDesign: jest.fn().mockRejectedValue(new Error('Validation failed: Design name is required'))
      };

      jest.doMock('@/services/DesignService', () => ({
        DesignService: jest.fn().mockImplementation(() => mockDesignService)
      }));

      const request = new NextRequest('http://localhost:3000/api/designs', {
        method: 'POST',
        body: JSON.stringify({
          designName: '',
          description: 'A new design',
          categoryId: 'cat1',
          designFileUrl: 'https://example.com/design.png',
          thumbnailUrl: 'https://example.com/thumbnail.png'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Validation failed: Design name is required');
    });
  });
});
