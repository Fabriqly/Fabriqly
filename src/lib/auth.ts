// lib/auth.ts - SIMPLIFIED & SECURE VERSION
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Collections } from '@/services/firebase';
import { UserRole } from '@/types/next-auth';
import { validateEnvironment } from './env-validation';
import { AuthErrorHandler, AuthErrorCode } from './auth-errors';

// Validate environment variables on startup
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  throw error;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          response_type: "code",
          prompt: "select_account"
        }
      }
    }),
    // Remove Firebase credentials provider for simplicity
    // Use Firebase only for data storage, not authentication
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Validate required user data
          if (!user.email) {
            const authError = AuthErrorHandler.createError(
              AuthErrorCode.GOOGLE_AUTH_FAILED,
              { reason: 'No email provided by Google' }
            );
            AuthErrorHandler.logError(authError, 'Google signIn callback');
            return false;
          }
          
          return true;
        } catch (error) {
          const authError = AuthErrorHandler.handleError(error);
          AuthErrorHandler.logError(authError, 'Google signIn callback');
          return false;
        }
      }
      return true;
    },
    
    async jwt({ token, user, account }) {      
      if (account && user) {
        try {
          // Create consistent user ID (use Google's sub or generate one)
          const userId = user.id || token.sub!;
          
          if (account.provider === 'google') {
            // Check if user document exists
            const userDocRef = doc(db, Collections.USERS, userId);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
              // Create new user document with secure defaults
              const userData = {
                email: user.email!,
                displayName: user.name || '',
                photoURL: user.image || null,
                role: 'customer' as UserRole, // Default role
                isVerified: true, // Google users are pre-verified
                provider: 'google',
                profile: {
                  firstName: user.name?.split(' ')[0] || '',
                  lastName: user.name?.split(' ').slice(1).join(' ') || '',
                  preferences: {
                    notifications: {
                      email: true,
                      sms: false,
                      push: true
                    },
                    theme: 'light' as const
                  }
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
              };
              
              await setDoc(userDocRef, userData);
              console.log('✅ New Google user created:', userId);
              token.role = 'customer' as UserRole;
            } else {
              // Update existing user's last login
              const userData = userDoc.data();
              await setDoc(userDocRef, {
                ...userData,
                lastLoginAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }, { merge: true });
              
              token.role = userData.role as UserRole;
            }
            
            // Add additional token data
            token.displayName = user.name;
            token.photoURL = user.image;
            token.provider = 'google';
          }
        } catch (error) {
          const authError = AuthErrorHandler.handleError(error);
          AuthErrorHandler.logError(authError, 'JWT callback');
          // Don't fail the authentication, use defaults
          token.role = 'customer' as UserRole;
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        
        // Add custom properties if available
        if (token.displayName) session.user.name = token.displayName as string;
        if (token.photoURL) session.user.image = token.photoURL as string;
      }
      return session;
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/auth/error',
    signOut: '/auth/signout'
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  // Enhanced security options
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
};