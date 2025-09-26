import { User } from '@/repositories/UserRepository';

export interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  role?: string;
}

export interface UpdateUserData {
  displayName?: string;
  role?: string;
  isVerified?: boolean;
  profile?: any;
}

export interface UserStats {
  total: number;
  verified: number;
  unverified: number;
  byRole: Record<string, number>;
}

export interface IUserService {
  createUser(userData: CreateUserData): Promise<User>;
  updateUser(userId: string, updateData: UpdateUserData, actorId: string): Promise<User>;
  deleteUser(userId: string, actorId: string): Promise<void>;
  getUser(userId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUsersByRole(role: string): Promise<User[]>;
  getUserStats(): Promise<UserStats>;
  verifyUser(userId: string, actorId: string): Promise<User>;
  updateUserRole(userId: string, newRole: string, actorId: string): Promise<User>;
  searchUsers(searchTerm: string): Promise<User[]>;
  validateUserData(userData: CreateUserData): { isValid: boolean; errors: string[] };
}
