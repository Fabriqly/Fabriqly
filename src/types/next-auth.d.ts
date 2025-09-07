import 'next-auth';

// Define the user roles as a union type for better type safety
export type UserRole = 'customer' | 'designer' | 'business_owner' | 'admin';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    sub: string; // Explicitly include sub for user ID
    displayName?: string;
    photoURL?: string;
  }
}

// Additional type for your useAuth hook
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: UserRole;
}

// Type for role permissions
export type Permission = 
  | 'shop:create' | 'shop:read' | 'shop:update' | 'shop:delete'
  | 'product:create' | 'product:read' | 'product:update' | 'product:delete'
  | 'design:create' | 'design:read' | 'design:update' | 'design:delete'
  | 'order:create' | 'order:read' | 'order:update'
  | 'review:create' | 'profile:read' | 'profile:update'
  | '*'; // Admin wildcard permission