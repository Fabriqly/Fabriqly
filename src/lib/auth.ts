// lib/auth.ts - UPDATED VERSION WITH BETTER SESSION REFRESH
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { Collections } from '@/services/firebase';
import { UserRole } from '@/types/next-auth';
import { validateEnvironment } from './env-validation';
import { AuthErrorHandler, AuthErrorCode } from './auth-errors';
import { FirebaseAdminService } from '@/services/firebase-admin';

// Validate environment variables on startup
(async () => {
  try {
    await validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    throw error;
  }
})();

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
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Verify credentials using Firebase Client SDK
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          if (!userCredential.user) {
            return null;
          }

          // Get user data from Firestore
          const userDocRef = doc(db, Collections.USERS, userCredential.user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            console.error('User document not found in Firestore');
            return null;
          }

          const userData = userDoc.data();

          // Return user data for NextAuth session
          return {
            id: userCredential.user.uid,
            email: userCredential.user.email || '',
            name: userData.displayName || userCredential.user.displayName || credentials.email,
            image: userData.photoURL || userCredential.user.photoURL || '',
            role: userData.role as UserRole
          };
        } catch (error: any) {
          console.error('Credentials verification error:', error);
          // Firebase auth errors
          if (error.code === 'auth/invalid-credential' || 
              error.code === 'auth/user-not-found' || 
              error.code === 'auth/wrong-password') {
            return null;
          }
          return null;
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
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
    
    async jwt({ token, user, account, trigger, session }) {      
      // CRITICAL: Handle session update triggers
      if (trigger === 'update' && token.sub) {
        console.log('JWT: Session update triggered, refreshing user data...');
        try {
          const userDocRef = doc(db, Collections.USERS, token.sub);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('JWT: Fresh user data from DB:', userData);
            
            // Update all relevant token fields
            token.role = userData.role as UserRole;
            token.displayName = userData.displayName;
            token.photoURL = userData.photoURL;
            
            console.log('JWT: Updated token with fresh data:', {
              role: token.role,
              displayName: token.displayName,
              sub: token.sub
            });
          } else {
            console.log('JWT: User document not found during update');
          }
        } catch (error) {
          console.error('JWT: Error updating token during session update:', error);
        }
      }
      
      // Handle initial login
      if (account && user) {
        try {
          const userId = user.id || token.sub!;
          console.log('JWT: Processing initial login for user:', userId);
          
          if (account.provider === 'google') {
            const userDocRef = doc(db, Collections.USERS, userId);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
              // Create new user document
              const userData = {
                email: user.email!,
                displayName: user.name || '',
                photoURL: user.image || null,
                role: 'customer' as UserRole, // Default role
                isVerified: true,
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
              console.log('JWT: New Google user created:', userId);
              token.role = 'customer' as UserRole;
            } else {
              // Update existing user's last login and get current role
              const userData = userDoc.data();
              await setDoc(userDocRef, {
                ...userData,
                lastLoginAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }, { merge: true });
              
              token.role = userData.role as UserRole;
              console.log('JWT: Existing user login, role:', token.role);
            }
            
            // Set additional token data
            token.displayName = user.name;
            token.photoURL = user.image;
            token.provider = 'google';
          } else if (account.provider === 'credentials') {
            // Handle credentials provider (email/password login)
            console.log('JWT: Processing credentials login for user:', userId);
            console.log('JWT: User data from credentials provider:', { role: user.role, name: user.name });
            
            // Use the role and data already provided by the credentials provider
            token.role = user.role as UserRole;
            token.displayName = user.name;
            token.photoURL = user.image;
            token.provider = 'credentials';
            
            // Update last login time in Firestore (but don't override the role)
            try {
              const userDocRef = doc(db, Collections.USERS, userId);
              await setDoc(userDocRef, {
                lastLoginAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }, { merge: true });
              
              console.log('JWT: Credentials login successful, role:', token.role);
            } catch (error) {
              console.error('JWT: Error updating last login time:', error);
            }
          }
        } catch (error) {
          const authError = AuthErrorHandler.handleError(error);
          AuthErrorHandler.logError(authError, 'JWT callback');
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
        
        console.log('Session callback: Final session data:', {
          userId: session.user.id,
          role: session.user.role,
          email: session.user.email
        });
      }
      return session;
    },

    async redirect({ url, baseUrl, token }) {
      // Handle role-based redirects after authentication
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Role-based redirect after authentication
      if (token?.role === 'customer') {
        return `${baseUrl}/explore`;
      } else if (token?.role === 'admin') {
        return `${baseUrl}/dashboard/admin`;
      } else if (['business_owner', 'designer'].includes(token?.role as string)) {
        return `${baseUrl}/dashboard`;
      }
      
      // Default redirect to explore page for safety
      return `${baseUrl}/explore`;
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