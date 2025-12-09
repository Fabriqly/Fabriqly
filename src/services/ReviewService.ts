import { Review } from '@/types/firebase';
import { FirebaseAdminService } from './firebase-admin';
import { Collections } from './firebase';
import { Timestamp } from 'firebase/firestore';
import { AppError } from '@/errors/AppError';
import { eventBus } from '@/events/EventBus';

export interface CreateReviewData {
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  images?: string[];
  reviewType: 'product' | 'shop' | 'designer' | 'design' | 'customization';
  productId?: string;
  shopId?: string;
  designerId?: string;
  designId?: string;
  customizationRequestId?: string;
}

export class ReviewService {
  /**
   * Create a review
   */
  async createReview(data: CreateReviewData): Promise<Review> {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw AppError.badRequest('Rating must be between 1 and 5');
    }

    // Validate required fields based on review type
    if (data.reviewType === 'product' && !data.productId) {
      throw AppError.badRequest('Product ID is required for product reviews');
    }
    if (data.reviewType === 'shop' && !data.shopId) {
      throw AppError.badRequest('Shop ID is required for shop reviews');
    }
    if (data.reviewType === 'designer' && !data.designerId) {
      throw AppError.badRequest('Designer ID is required for designer reviews');
    }
    if (data.reviewType === 'design' && !data.designId) {
      throw AppError.badRequest('Design ID is required for design reviews');
    }
    if (data.reviewType === 'customization' && !data.customizationRequestId) {
      throw AppError.badRequest('Customization request ID is required for customization reviews');
    }

    // Check if user already reviewed (prevent duplicate reviews)
    const existingReviews = await this.getReviews({
      customerId: data.customerId,
      reviewType: data.reviewType,
      productId: data.productId,
      shopId: data.shopId,
      designerId: data.designerId,
      designId: data.designId,
      customizationRequestId: data.customizationRequestId
    });

    if (existingReviews.length > 0) {
      throw AppError.badRequest('You have already reviewed this');
    }

    const reviewData = {
      ...data,
      isVerified: false, // Can be set to true if verified purchase/transaction
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const review = await FirebaseAdminService.createDocument(Collections.REVIEWS, reviewData);

    // Update average ratings
    await this.updateAverageRatings(data.reviewType, {
      shopId: data.shopId,
      designerId: data.designerId,
      productId: data.productId,
      designId: data.designId
    });

    // Emit event
    await eventBus.emit('review.created', {
      reviewId: review.id,
      reviewType: data.reviewType,
      rating: data.rating,
      targetId: data.productId || data.shopId || data.designerId || data.designId || data.customizationRequestId
    });

    return review as Review;
  }

  /**
   * Get reviews with filters
   */
  async getReviews(filters: {
    customerId?: string;
    productId?: string;
    shopId?: string;
    designerId?: string;
    designId?: string;
    customizationRequestId?: string;
    reviewType?: string;
    limit?: number;
  }): Promise<Review[]> {
    const queryFilters = [];

    if (filters.customerId) {
      queryFilters.push({ field: 'customerId', operator: '==', value: filters.customerId });
    }
    if (filters.productId) {
      queryFilters.push({ field: 'productId', operator: '==', value: filters.productId });
    }
    if (filters.shopId) {
      queryFilters.push({ field: 'shopId', operator: '==', value: filters.shopId });
    }
    if (filters.designerId) {
      queryFilters.push({ field: 'designerId', operator: '==', value: filters.designerId });
    }
    if (filters.designId) {
      queryFilters.push({ field: 'designId', operator: '==', value: filters.designId });
    }
    if (filters.customizationRequestId) {
      queryFilters.push({ field: 'customizationRequestId', operator: '==', value: filters.customizationRequestId });
    }
    if (filters.reviewType) {
      queryFilters.push({ field: 'reviewType', operator: '==', value: filters.reviewType });
    }

    const reviews = await FirebaseAdminService.queryDocuments(
      Collections.REVIEWS,
      queryFilters as any,
      { field: 'createdAt', direction: 'desc' },
      filters.limit || 50
    );

    return reviews as Review[];
  }

  /**
   * Update average ratings for shop/designer
   */
  private async updateAverageRatings(
    reviewType: string,
    target: {
      shopId?: string;
      designerId?: string;
      productId?: string;
      designId?: string;
    }
  ): Promise<void> {
    try {
      if (reviewType === 'shop' && target.shopId) {
        const shopReviews = await this.getReviews({ shopId: target.shopId });
        const avgRating = shopReviews.length > 0 
          ? shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length 
          : 0;
        
        await FirebaseAdminService.updateDocument(Collections.SHOP_PROFILES, target.shopId, {
          ratings: {
            averageRating: avgRating,
            totalReviews: shopReviews.length
          } as any
        });
      }

      if (reviewType === 'designer' && target.designerId) {
        const designerReviews = await this.getReviews({ designerId: target.designerId });
        const avgRating = designerReviews.length > 0
          ? designerReviews.reduce((sum, r) => sum + r.rating, 0) / designerReviews.length
          : 0;
        
        await FirebaseAdminService.updateDocument(Collections.DESIGNER_PROFILES, target.designerId, {
          portfolioStats: {
            averageRating: avgRating
          } as any
        });
      }
    } catch (error) {
      console.error('Error updating average ratings:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Get average rating
   */
  async getAverageRating(
    reviewType: 'product' | 'shop' | 'designer' | 'design',
    targetId: string
  ): Promise<{ average: number; total: number }> {
    const filters: any = { reviewType };
    
    if (reviewType === 'product') filters.productId = targetId;
    if (reviewType === 'shop') filters.shopId = targetId;
    if (reviewType === 'designer') filters.designerId = targetId;
    if (reviewType === 'design') filters.designId = targetId;

    const reviews = await this.getReviews(filters);
    
    if (reviews.length === 0) {
      return { average: 0, total: 0 };
    }

    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    return {
      average: Math.round(average * 10) / 10, // Round to 1 decimal
      total: reviews.length
    };
  }

  /**
   * Get a single review by ID
   */
  async getReviewById(reviewId: string): Promise<Review | null> {
    const review = await FirebaseAdminService.getDocument(
      Collections.REVIEWS,
      reviewId
    );
    return review as Review | null;
  }

  /**
   * Add a reply to a review
   */
  async addReply(
    reviewId: string,
    authorId: string,
    authorName: string,
    authorRole: 'shop_owner' | 'designer' | 'admin',
    comment: string
  ): Promise<Review> {
    const review = await this.getReviewById(reviewId);
    if (!review) {
      throw AppError.notFound('Review not found');
    }

    if (review.reply) {
      throw AppError.badRequest('This review already has a reply');
    }

    const reply = {
      id: `reply-${Date.now()}`,
      authorId,
      authorName,
      authorRole,
      comment,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const updatedReview = await FirebaseAdminService.updateDocument(
      Collections.REVIEWS,
      reviewId,
      {
        reply,
        updatedAt: Timestamp.now()
      }
    );

    return updatedReview as Review;
  }

  /**
   * Update a review reply
   */
  async updateReply(
    reviewId: string,
    authorId: string,
    comment: string
  ): Promise<Review> {
    const review = await this.getReviewById(reviewId);
    if (!review || !review.reply) {
      throw AppError.notFound('Review or reply not found');
    }

    if (review.reply.authorId !== authorId) {
      throw AppError.forbidden('You can only update your own replies');
    }

    const updatedReply = {
      ...review.reply,
      comment,
      updatedAt: Timestamp.now()
    };

    const updatedReview = await FirebaseAdminService.updateDocument(
      Collections.REVIEWS,
      reviewId,
      {
        reply: updatedReply,
        updatedAt: Timestamp.now()
      }
    );

    return updatedReview as Review;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string, userRole: string): Promise<void> {
    const review = await this.getReviewById(reviewId);
    if (!review) {
      throw AppError.notFound('Review not found');
    }

    // Check permissions
    const canDelete = 
      review.customerId === userId ||
      userRole === 'admin' ||
      (review.reviewType === 'shop' && userRole === 'business_owner') ||
      (review.reviewType === 'designer' && userRole === 'designer') ||
      (review.reviewType === 'design' && userRole === 'designer');

    if (!canDelete) {
      throw AppError.forbidden('You do not have permission to delete this review');
    }

    await FirebaseAdminService.deleteDocument(Collections.REVIEWS, reviewId);

    // Update average ratings after deletion
    await this.updateAverageRatings(review.reviewType, {
      shopId: review.shopId,
      designerId: review.designerId,
      productId: review.productId
    });

    // Emit event
    await eventBus.emit('review.deleted', {
      reviewId,
      reviewType: review.reviewType,
      targetId: review.productId || review.shopId || review.designerId || review.customizationRequestId
    });
  }

  /**
   * Mark customization as completed and allow reviews
   */
  async completeCustomizationTransaction(
    customizationRequestId: string,
    customerId: string
  ): Promise<void> {
    const { CustomizationRepository } = await import('@/repositories/CustomizationRepository');
    const customizationRepo = new CustomizationRepository();
    
    const request = await customizationRepo.findById(customizationRequestId);
    if (!request) {
      throw AppError.notFound('Customization request not found');
    }

    if (request.customerId !== customerId) {
      throw AppError.forbidden('Unauthorized');
    }

    if (request.status !== 'ready_for_pickup') {
      throw AppError.badRequest('Transaction must be ready for pickup to complete');
    }

    // Update status to completed
    await customizationRepo.update(customizationRequestId, {
      status: 'completed' as any,
      completedAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any
    });

    // Emit event
    await eventBus.emit('customization.transaction.completed', {
      requestId: customizationRequestId,
      customerId: request.customerId,
      designerId: request.designerId,
      shopId: request.printingShopId
    });
  }
}


















