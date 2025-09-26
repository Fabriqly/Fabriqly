import { UserRepository, User } from '@/repositories/UserRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { ActivityType } from '@/types/activity';

export interface UserValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface UserStats {
  total: number;
  verified: number;
  unverified: number;
  byRole: Record<string, number>;
}

export class UserService {
  private userRepository: UserRepository;
  private activityRepository: ActivityRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.activityRepository = new ActivityRepository();
  }

  async createUser(userData: {
    email: string;
    password: string;
    displayName?: string;
    role?: string;
  }): Promise<User> {
    // Validate user data
    const validation = this.validateUserData(userData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user using Firebase Admin Service
    const firebaseUser = await FirebaseAdminService.createUser(userData);

    // Convert Firebase user to User interface format
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      role: firebaseUser.role,
      isVerified: firebaseUser.isVerified,
      profile: firebaseUser.profile,
      createdAt: firebaseUser.createdAt instanceof Date ? firebaseUser.createdAt : firebaseUser.createdAt.toDate(),
      updatedAt: firebaseUser.updatedAt instanceof Date ? firebaseUser.updatedAt : firebaseUser.updatedAt.toDate()
    };

    // Log activity
    await this.logUserActivity('user_registered', user.id, 'system', {
      email: user.email,
      role: user.role
    });

    return user;
  }

  async updateUser(userId: string, updateData: Partial<User>, actorId: string): Promise<User> {
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Validate update data
    const validation = this.validateUserUpdate(updateData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const updatedUser = await this.userRepository.update(userId, updateData);

    // Log activity
    await this.logUserActivity('user_updated', userId, actorId, {
      email: updatedUser.email,
      changedFields: Object.keys(updateData)
    });

    return updatedUser;
  }

  async deleteUser(userId: string, actorId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete user using Firebase Admin Service
    await FirebaseAdminService.deleteUser(userId);

    // Log activity
    await this.logUserActivity('user_deleted', userId, actorId, {
      email: user.email,
      role: user.role
    });
  }

  async getUser(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return this.userRepository.findByRole(role);
  }

  async getVerifiedUsers(): Promise<User[]> {
    return this.userRepository.findVerifiedUsers();
  }

  async getUnverifiedUsers(): Promise<User[]> {
    return this.userRepository.findUnverifiedUsers();
  }

  async getAdmins(): Promise<User[]> {
    return this.userRepository.findAdmins();
  }

  async getBusinessOwners(): Promise<User[]> {
    return this.userRepository.findBusinessOwners();
  }

  async getCustomers(): Promise<User[]> {
    return this.userRepository.findCustomers();
  }

  async getDesigners(): Promise<User[]> {
    return this.userRepository.findDesigners();
  }

  async updateUserRole(userId: string, newRole: string, actorId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate role
    const validRoles = ['admin', 'business_owner', 'customer', 'designer'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }

    const updatedUser = await this.userRepository.updateUserRole(userId, newRole);

    // Log activity
    await this.logUserActivity('admin_action', userId, actorId, {
      email: user.email,
      oldRole: user.role,
      newRole,
      action: 'role_updated'
    });

    return updatedUser;
  }

  async verifyUser(userId: string, actorId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await this.userRepository.verifyUser(userId);

    // Log activity
    await this.logUserActivity('admin_action', userId, actorId, {
      email: user.email,
      action: 'user_verified'
    });

    return updatedUser;
  }

  async updateUserProfile(userId: string, profile: Partial<User['profile']>, actorId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await this.userRepository.updateUserProfile(userId, profile);

    // Log activity
    await this.logUserActivity('user_updated', userId, actorId, {
      email: user.email,
      action: 'profile_updated'
    });

    return updatedUser;
  }

  async getUserStats(): Promise<UserStats> {
    return this.userRepository.getUserStats();
  }

  async getRecentUsers(limit: number = 10): Promise<User[]> {
    return this.userRepository.getRecentUsers(limit);
  }

  async getUsersByRegistrationDate(startDate: Date, endDate: Date): Promise<User[]> {
    return this.userRepository.getUsersByRegistrationDate(startDate, endDate);
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    return this.userRepository.searchUsers(searchTerm);
  }

  private validateUserData(userData: {
    email: string;
    password: string;
    displayName?: string;
    role?: string;
  }): UserValidationResult {
    const errors: string[] = [];

    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Valid email is required');
    }

    if (!userData.password || userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (userData.role && !['admin', 'business_owner', 'customer', 'designer'].includes(userData.role)) {
      errors.push('Invalid role');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateUserUpdate(updateData: Partial<User>): UserValidationResult {
    const errors: string[] = [];

    if (updateData.email && !this.isValidEmail(updateData.email)) {
      errors.push('Valid email is required');
    }

    if (updateData.role && !['admin', 'business_owner', 'customer', 'designer'].includes(updateData.role)) {
      errors.push('Invalid role');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async logUserActivity(
    type: ActivityType,
    userId: string,
    actorId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await this.activityRepository.create({
        type,
        title: this.getActivityTitle(type),
        description: this.getActivityDescription(type, metadata),
        priority: 'low',
        status: 'active',
        actorId,
        targetId: userId,
        targetType: 'user',
        targetName: metadata.email || 'Unknown User',
        metadata,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Don't fail the operation if activity logging fails
    }
  }

  private getActivityTitle(type: ActivityType): string {
    const titles: Partial<Record<ActivityType, string>> = {
      'user_registered': 'User Registered',
      'user_updated': 'User Updated',
      'user_deleted': 'User Deleted',
      'admin_action': 'Admin Action',
      'system_event': 'System Event'
    };
    return titles[type] || 'User Activity';
  }

  private getActivityDescription(type: ActivityType, metadata: Record<string, any>): string {
    const email = metadata.email || 'User';
    
    switch (type) {
      case 'user_registered':
        return `User "${email}" has been registered`;
      case 'user_updated':
        return `User "${email}" has been updated`;
      case 'user_deleted':
        return `User "${email}" has been deleted`;
      case 'admin_action':
        return `Admin action performed on user "${email}"`;
      case 'system_event':
        return `System event for user "${email}"`;
      default:
        return `User "${email}" activity`;
    }
  }
}
