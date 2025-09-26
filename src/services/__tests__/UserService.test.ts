import { UserService } from '../UserService';
import { UserRepository } from '@/repositories/UserRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { AppError } from '@/errors/AppError';
import { CreateUserData, UpdateUserData } from '@/services/interfaces/IUserService';

// Mock dependencies
jest.mock('@/repositories/UserRepository');
jest.mock('@/repositories/ActivityRepository');
jest.mock('@/services/firebase-admin');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockActivityRepository: jest.Mocked<ActivityRepository>;
  let mockFirebaseAdminService: jest.Mocked<typeof FirebaseAdminService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockActivityRepository = new ActivityRepository() as jest.Mocked<ActivityRepository>;
    mockFirebaseAdminService = FirebaseAdminService as jest.Mocked<typeof FirebaseAdminService>;

    userService = new UserService(mockUserRepository, mockActivityRepository);
  });

  describe('createUser', () => {
    const validUserData: CreateUserData = {
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
      role: 'customer'
    };

    const mockFirebaseUser = {
      uid: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'customer',
      isVerified: false,
      profile: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create user successfully', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockFirebaseAdminService.createUser.mockResolvedValue(mockFirebaseUser as any);
      mockActivityRepository.create.mockResolvedValue({} as any);

      // Act
      const result = await userService.createUser(validUserData);

      // Assert
      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockFirebaseAdminService.createUser).toHaveBeenCalledWith(validUserData);
      expect(mockActivityRepository.create).toHaveBeenCalled();
    });

    it('should throw validation error for invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      await expect(userService.createUser(invalidData))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error when user already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com'
      } as any);

      await expect(userService.createUser(validUserData))
        .rejects
        .toThrow(AppError);
    });

    it('should throw validation error for short password', async () => {
      const invalidData = { ...validUserData, password: '123' };

      await expect(userService.createUser(invalidData))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('updateUser', () => {
    const existingUser = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'customer'
    };

    const updateData: UpdateUserData = {
      displayName: 'Updated User',
      role: 'business_owner'
    };

    it('should update user successfully', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(existingUser as any);
      mockUserRepository.update.mockResolvedValue({
        ...existingUser,
        ...updateData
      } as any);
      mockActivityRepository.create.mockResolvedValue({} as any);

      // Act
      const result = await userService.updateUser('user-1', updateData, 'admin-1');

      // Assert
      expect(result.displayName).toBe('Updated User');
      expect(result.role).toBe('business_owner');
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-1', updateData);
      expect(mockActivityRepository.create).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.updateUser('non-existent', updateData, 'admin-1'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw validation error for invalid role', async () => {
      mockUserRepository.findById.mockResolvedValue(existingUser as any);
      const invalidUpdateData = { ...updateData, role: 'invalid_role' };

      await expect(userService.updateUser('user-1', invalidUpdateData, 'admin-1'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('deleteUser', () => {
    const existingUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'customer'
    };

    it('should delete user successfully', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(existingUser as any);
      mockFirebaseAdminService.deleteUser.mockResolvedValue();
      mockActivityRepository.create.mockResolvedValue({} as any);

      // Act
      await userService.deleteUser('user-1', 'admin-1');

      // Assert
      expect(mockFirebaseAdminService.deleteUser).toHaveBeenCalledWith('user-1');
      expect(mockActivityRepository.create).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.deleteUser('non-existent', 'admin-1'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getUser', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    it('should return user when found', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser as any);

      const result = await userService.getUser('user-1');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.getUser('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    it('should return user when found by email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      const result = await userService.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user not found by email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUsersByRole', () => {
    const mockUsers = [
      { id: 'user-1', email: 'admin1@example.com', role: 'admin' },
      { id: 'user-2', email: 'admin2@example.com', role: 'admin' }
    ];

    it('should return users by role', async () => {
      mockUserRepository.findByRole.mockResolvedValue(mockUsers as any);

      const result = await userService.getUsersByRole('admin');

      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.findByRole).toHaveBeenCalledWith('admin');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        total: 100,
        verified: 80,
        unverified: 20,
        byRole: { admin: 5, customer: 90, business_owner: 5 }
      };

      mockUserRepository.getUserStats.mockResolvedValue(mockStats);

      const result = await userService.getUserStats();

      expect(result).toEqual(mockStats);
      expect(mockUserRepository.getUserStats).toHaveBeenCalled();
    });
  });

  describe('validateUserData', () => {
    it('should return valid result for correct data', () => {
      const validData: CreateUserData = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        role: 'customer'
      };

      const result = userService.validateUserData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        role: 'customer'
      };

      const result = userService.validateUserData(invalidData as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid email is required');
    });

    it('should return invalid result for short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        role: 'customer'
      };

      const result = userService.validateUserData(invalidData as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 6 characters long');
    });

    it('should return invalid result for invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid_role'
      };

      const result = userService.validateUserData(invalidData as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid role');
    });
  });
});
