import { BaseRepository, QueryFilter } from './BaseRepository';
import { Collections } from '@/services/firebase';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  isVerified: boolean;
  photoURL?: string;
  profile?: {
    preferences?: {
      notifications?: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
      theme?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(Collections.USERS);
  }

  async findByEmail(email: string): Promise<User | null> {
    const results = await this.findAll({
      filters: [{ field: 'email', operator: '==', value: email }]
    });
    return results.length > 0 ? results[0] : null;
  }

  async findByRole(role: string): Promise<User[]> {
    return this.findAll({
      filters: [{ field: 'role', operator: '==', value: role }]
    });
  }

  async findVerifiedUsers(): Promise<User[]> {
    return this.findAll({
      filters: [{ field: 'isVerified', operator: '==', value: true }]
    });
  }

  async findUnverifiedUsers(): Promise<User[]> {
    return this.findAll({
      filters: [{ field: 'isVerified', operator: '==', value: false }]
    });
  }

  async findAdmins(): Promise<User[]> {
    return this.findByRole('admin');
  }

  async findBusinessOwners(): Promise<User[]> {
    return this.findByRole('business_owner');
  }

  async findCustomers(): Promise<User[]> {
    return this.findByRole('customer');
  }

  async findDesigners(): Promise<User[]> {
    return this.findByRole('designer');
  }

  async getUserStats(): Promise<{
    total: number;
    verified: number;
    unverified: number;
    byRole: Record<string, number>;
  }> {
    const allUsers = await this.findAll();
    const verifiedUsers = await this.findVerifiedUsers();
    
    const stats = {
      total: allUsers.length,
      verified: verifiedUsers.length,
      unverified: allUsers.length - verifiedUsers.length,
      byRole: {} as Record<string, number>
    };

    // Count by role
    allUsers.forEach(user => {
      const role = user.role || 'unknown';
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
    });

    return stats;
  }

  async updateUserRole(userId: string, newRole: string): Promise<User> {
    return this.update(userId, { role: newRole });
  }

  async verifyUser(userId: string): Promise<User> {
    return this.update(userId, { isVerified: true });
  }

  async updateUserProfile(userId: string, profile: Partial<User['profile']>): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedProfile = {
      ...user.profile,
      ...profile
    };

    return this.update(userId, { profile: updatedProfile });
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a simplified implementation - in production, you'd use Algolia or similar
    const filters: QueryFilter[] = [];

    return this.findAll({ filters });
  }

  async getRecentUsers(limit: number = 10): Promise<User[]> {
    return this.findAll({
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    });
  }

  async getUsersByRegistrationDate(startDate: Date, endDate: Date): Promise<User[]> {
    return this.findAll({
      filters: [
        { field: 'createdAt', operator: '>=', value: startDate },
        { field: 'createdAt', operator: '<=', value: endDate }
      ]
    });
  }
}
