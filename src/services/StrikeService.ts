import { FirebaseAdminService } from './firebase-admin';
import { Collections } from './firebase';
import { AppError } from '@/errors/AppError';
import { Timestamp } from 'firebase-admin/firestore';
import { eventBus } from '@/events/EventBus';

const STRIKE_THRESHOLD = parseInt(process.env.DISPUTE_STRIKE_THRESHOLD || '3');

export class StrikeService {
  /**
   * Issue a strike to a user (designer or shop owner)
   */
  async issueStrike(
    userId: string,
    disputeId: string,
    reason: string,
    issuedBy?: string
  ): Promise<void> {
    try {
      console.log(`[StrikeService] Issuing strike to user: ${userId}, dispute: ${disputeId}`);

      // Find user's role to determine which profile to update
      const user = await FirebaseAdminService.getDocument(Collections.USERS, userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const userRole = user.role;
      let profile: any = null;
      let profileCollection: string;

      // Get the appropriate profile
      if (userRole === 'designer') {
        profileCollection = Collections.DESIGNER_PROFILES;
        // Find designer profile by userId
        const profiles = await FirebaseAdminService.queryDocuments(
          profileCollection,
          [{ field: 'userId', operator: '==', value: userId }],
          undefined,
          1
        );
        profile = profiles.length > 0 ? profiles[0] : null;
      } else if (userRole === 'business_owner') {
        profileCollection = Collections.SHOP_PROFILES;
        // Find shop profile by userId
        const profiles = await FirebaseAdminService.queryDocuments(
          profileCollection,
          [{ field: 'userId', operator: '==', value: userId }],
          undefined,
          1
        );
        profile = profiles.length > 0 ? profiles[0] : null;
      } else {
        throw AppError.badRequest('Strikes can only be issued to designers or shop owners');
      }

      if (!profile) {
        throw AppError.notFound(`${userRole} profile not found`);
      }

      // Initialize strike fields if they don't exist
      const currentStrikes = profile.strikes || 0;
      const strikeHistory = profile.strikeHistory || [];

      // Add strike to history
      const newStrike = {
        disputeId,
        reason,
        issuedAt: Timestamp.now(),
        issuedBy: issuedBy || 'system'
      };

      strikeHistory.push(newStrike);
      const newStrikeCount = currentStrikes + 1;

      // Update profile
      const updateData: any = {
        strikes: newStrikeCount,
        strikeHistory: strikeHistory as any,
        updatedAt: Timestamp.now() as any
      };

      // Check if threshold reached
      if (newStrikeCount >= STRIKE_THRESHOLD && !profile.isSuspended) {
        updateData.isSuspended = true;
        updateData.suspensionReason = `Account suspended due to ${newStrikeCount} strikes. Last strike: ${reason}`;
        updateData.isActive = false;

        // Emit suspension event
        await eventBus.emit('account.suspended', {
          userId,
          profileId: profile.id,
          strikeCount: newStrikeCount,
          reason: updateData.suspensionReason
        });
      }

      await FirebaseAdminService.updateDocument(profileCollection, profile.id, updateData);

      console.log(`[StrikeService] Strike issued. Total strikes: ${newStrikeCount}`);
      
      if (newStrikeCount >= STRIKE_THRESHOLD) {
        console.log(`[StrikeService] Account suspended due to strike threshold`);
      }

      // Emit strike event
      await eventBus.emit('strike.issued', {
        userId,
        profileId: profile.id,
        disputeId,
        reason,
        totalStrikes: newStrikeCount,
        suspended: newStrikeCount >= STRIKE_THRESHOLD
      });
    } catch (error: any) {
      console.error('[StrikeService] Failed to issue strike:', error);
      throw AppError.internal('Failed to issue strike', error);
    }
  }

  /**
   * Remove a strike (admin only, for appeals)
   */
  async removeStrike(
    userId: string,
    strikeIndex: number,
    removedBy: string,
    reason: string
  ): Promise<void> {
    try {
      console.log(`[StrikeService] Removing strike from user: ${userId}, index: ${strikeIndex}`);

      // Find user's role
      const user = await FirebaseAdminService.getDocument(Collections.USERS, userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const userRole = user.role;
      let profile: any = null;
      let profileCollection: string;

      if (userRole === 'designer') {
        profileCollection = Collections.DESIGNER_PROFILES;
        const profiles = await FirebaseAdminService.queryDocuments(
          profileCollection,
          [{ field: 'userId', operator: '==', value: userId }],
          undefined,
          1
        );
        profile = profiles.length > 0 ? profiles[0] : null;
      } else if (userRole === 'business_owner') {
        profileCollection = Collections.SHOP_PROFILES;
        const profiles = await FirebaseAdminService.queryDocuments(
          profileCollection,
          [{ field: 'userId', operator: '==', value: userId }],
          undefined,
          1
        );
        profile = profiles.length > 0 ? profiles[0] : null;
      } else {
        throw AppError.badRequest('Strikes can only be removed from designers or shop owners');
      }

      if (!profile) {
        throw AppError.notFound(`${userRole} profile not found`);
      }

      const strikeHistory = profile.strikeHistory || [];
      if (strikeIndex < 0 || strikeIndex >= strikeHistory.length) {
        throw AppError.badRequest('Invalid strike index');
      }

      // Remove strike from history
      strikeHistory.splice(strikeIndex, 1);
      const newStrikeCount = Math.max(0, (profile.strikes || 0) - 1);

      // Update profile
      const updateData: any = {
        strikes: newStrikeCount,
        strikeHistory: strikeHistory as any,
        updatedAt: Timestamp.now() as any
      };

      // If strikes are below threshold and account was suspended, unsuspend
      if (newStrikeCount < STRIKE_THRESHOLD && profile.isSuspended) {
        updateData.isSuspended = false;
        updateData.suspensionReason = undefined;
        updateData.isActive = true;

        // Emit unsuspension event
        await eventBus.emit('account.unsuspended', {
          userId,
          profileId: profile.id,
          reason: `Strike removed: ${reason}`
        });
      }

      await FirebaseAdminService.updateDocument(profileCollection, profile.id, updateData);

      console.log(`[StrikeService] Strike removed. Total strikes: ${newStrikeCount}`);

      // Emit event
      await eventBus.emit('strike.removed', {
        userId,
        profileId: profile.id,
        strikeIndex,
        removedBy,
        reason,
        totalStrikes: newStrikeCount
      });
    } catch (error: any) {
      console.error('[StrikeService] Failed to remove strike:', error);
      throw AppError.internal('Failed to remove strike', error);
    }
  }

  /**
   * Get strike history for a user
   */
  async getStrikeHistory(userId: string): Promise<{
    strikes: number;
    strikeHistory: Array<{
      disputeId: string;
      reason: string;
      issuedAt: Date;
      issuedBy?: string;
    }>;
    isSuspended: boolean;
    suspensionReason?: string;
  }> {
    try {
      const user = await FirebaseAdminService.getDocument(Collections.USERS, userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const userRole = user.role;
      let profile: any = null;
      let profileCollection: string;

      if (userRole === 'designer') {
        profileCollection = Collections.DESIGNER_PROFILES;
        const profiles = await FirebaseAdminService.queryDocuments(
          profileCollection,
          [{ field: 'userId', operator: '==', value: userId }],
          undefined,
          1
        );
        profile = profiles.length > 0 ? profiles[0] : null;
      } else if (userRole === 'business_owner') {
        profileCollection = Collections.SHOP_PROFILES;
        const profiles = await FirebaseAdminService.queryDocuments(
          profileCollection,
          [{ field: 'userId', operator: '==', value: userId }],
          undefined,
          1
        );
        profile = profiles.length > 0 ? profiles[0] : null;
      } else {
        return {
          strikes: 0,
          strikeHistory: [],
          isSuspended: false
        };
      }

      if (!profile) {
        return {
          strikes: 0,
          strikeHistory: [],
          isSuspended: false
        };
      }

      const strikeHistory = (profile.strikeHistory || []).map((strike: any) => ({
        disputeId: strike.disputeId,
        reason: strike.reason,
        issuedAt: strike.issuedAt?.toDate ? strike.issuedAt.toDate() : new Date(strike.issuedAt),
        issuedBy: strike.issuedBy
      }));

      return {
        strikes: profile.strikes || 0,
        strikeHistory,
        isSuspended: profile.isSuspended || false,
        suspensionReason: profile.suspensionReason
      };
    } catch (error: any) {
      console.error('[StrikeService] Failed to get strike history:', error);
      throw AppError.internal('Failed to get strike history', error);
    }
  }
}






