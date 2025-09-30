import { BaseRepository, QueryFilter } from './BaseRepository';
import { Collections } from '@/services/firebase';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Timestamp } from 'firebase/firestore';

export interface UserLike {
  id: string;
  userId: string;
  designId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class UserLikeRepository extends BaseRepository<UserLike> {
  constructor() {
    super(Collections.USER_LIKES);
  }

  // Check if user has liked a design
  async hasUserLikedDesign(userId: string, designId: string): Promise<boolean> {
    try {
      const filters: QueryFilter[] = [
        { field: 'userId', operator: '==', value: userId },
        { field: 'designId', operator: '==', value: designId }
      ];

      const results = await FirebaseAdminService.queryDocuments(
        this.collection,
        filters,
        undefined,
        1
      );

      return results.length > 0;
    } catch (error) {
      console.error('Error checking user like:', error);
      return false;
    }
  }

  // Add a like
  async addLike(userId: string, designId: string): Promise<void> {
    try {
      // Check if like already exists
      const exists = await this.hasUserLikedDesign(userId, designId);
      if (exists) {
        return; // Already liked
      }

      const likeData: Omit<UserLike, 'id'> = {
        userId,
        designId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await this.create(likeData);
    } catch (error) {
      console.error('Error adding like:', error);
      throw error;
    }
  }

  // Remove a like
  async removeLike(userId: string, designId: string): Promise<void> {
    try {
      const filters: QueryFilter[] = [
        { field: 'userId', operator: '==', value: userId },
        { field: 'designId', operator: '==', value: designId }
      ];

      const results = await FirebaseAdminService.queryDocuments(
        this.collection,
        filters,
        undefined,
        1
      );
      
      if (results.length > 0) {
        const likeDoc = results[0] as UserLike;
        await this.delete(likeDoc.id);
      }
    } catch (error) {
      console.error('Error removing like:', error);
      throw error;
    }
  }

  // Get all designs liked by a user
  async getUserLikedDesigns(userId: string): Promise<string[]> {
    try {
      const filters: QueryFilter[] = [
        { field: 'userId', operator: '==', value: userId }
      ];

      const results = await FirebaseAdminService.queryDocuments(
        this.collection,
        filters,
        { field: 'createdAt', direction: 'desc' }
      );

      return results.map((doc: any) => doc.designId);
    } catch (error) {
      console.error('Error getting user liked designs:', error);
      return [];
    }
  }

  // Get all users who liked a design
  async getDesignLikedByUsers(designId: string): Promise<string[]> {
    try {
      const filters: QueryFilter[] = [
        { field: 'designId', operator: '==', value: designId }
      ];

      const results = await FirebaseAdminService.queryDocuments(
        this.collection,
        filters,
        { field: 'createdAt', direction: 'desc' }
      );

      return results.map((doc: any) => doc.userId);
    } catch (error) {
      console.error('Error getting design liked by users:', error);
      return [];
    }
  }
}
