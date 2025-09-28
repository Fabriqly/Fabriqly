// lib/auth.ts - UPDATED VERSION WITH BETTER SESSION REFRESH
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { Collections } from '@/services/firebase';
import bcrypt from 'bcryptjs';

// Type definitions
type UserRole = 'customer' | 'admin' | 'vendor';

// Utility function to check if email already exists
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // Check in Firebase Auth
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (signInMethods.length > 0) {
      return true;
    }

    // Also check in Firestore (in case of data inconsistencies)
    const usersRef = collection(db, Collections.USERS);
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email existence:', error);
    // If we can't check, assume it doesn't exist to allow the process to continue
    // Firebase Auth will handle the actual duplicate check
    return false;
  }
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
          if (credentials.action === 'signup') {
            // Check if email already exists
            const emailExists = await checkEmailExists(credentials.email);
            if (emailExists) {
              throw new Error('An account with this email already exists. Please try logging in instead.');
            }

            // Create new user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              credentials.email,
              credentials.password
            );
            
            // Create user document in Firestore
            const userData = {
              email: credentials.email,
              role: credentials.role || 'customer',
              isVerified: false,
              profile: {
                firstName: credentials.firstName,
                lastName: credentials.lastName,
                preferences: {
                  notifications: {
                    email: true,
                    sms: false,
                    push: true
                  },
                  theme: 'light'
                }
              }
            };

            await setDoc(doc(db, Collections.USERS, userCredential.user.uid), userData);

            return {
              id: userCredential.user.uid,
              email: credentials.email,
              role: (credentials.role || 'customer') as UserRole,
              name: credentials.firstName && credentials.lastName 
                ? `${credentials.firstName} ${credentials.lastName}` 
                : undefined
            };
          } else {
            // Sign in existing user
            const userCredential = await signInWithEmailAndPassword(
              auth,
              credentials.email,
              credentials.password
            );

            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, Collections.USERS, userCredential.user.uid));
            const userData = userDoc.data();

            return {
              id: userCredential.user.uid,
              email: credentials.email,
              role: (userData?.role || 'customer') as UserRole,
              ...userData
            };
          }
        } catch (error) {
          console.error('Credentials verification error:', error);
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
            console.error('Google signIn callback: No email provided by Google');
            return false;
          }

          console.log('Processing Google sign-in for:', user.email);
          // Allow sign-in, we'll handle duplicate detection in JWT callback

          return true;
        } catch (error) {
          console.error('Google signIn callback error:', error);
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
            console.log('Processing JWT for Google user:', user.email, 'with ID:', user.id);
            
            // First check if there's an existing user with this email
            const usersRef = collection(db, Collections.USERS);
            const emailQuery = query(usersRef, where('email', '==', user.email));
            const existingUserSnapshot = await getDocs(emailQuery);
            
            if (!existingUserSnapshot.empty) {
              console.log('Found existing user with email:', user.email);
              // Use the existing user's data
              const existingUserDoc = existingUserSnapshot.docs[0];
              const existingUserData = existingUserDoc.data();
              
              // Update token to use existing user's ID and data
              token.sub = existingUserDoc.id;
              token.role = existingUserData.role || 'customer';
              token.displayName = existingUserData.displayName || user.name;
              token.photoURL = user.image;
              
              console.log('Using existing user:', existingUserDoc.id, 'with role:', existingUserData.role);
              return token;
            }
            
            // No existing user found, create new one with Google ID
            const userDocRef = doc(db, Collections.USERS, userId);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
              console.log('Creating new user document for Google user:', user.id);
              
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
              token.firstName = userData.profile?.firstName;
              token.lastName = userData.profile?.lastName;
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
            token.firstName = userData.profile?.firstName;
            token.lastName = userData.profile?.lastName;
          } else if (account.provider === 'credentials') {
            // Handle credentials provider (email/password login)
            console.log('JWT: Processing credentials login for user:', userId);
            console.log('JWT: User data from credentials provider:', { role: user.role, name: user.name });
            
            // Use the role and data already provided by the credentials provider
            token.role = user.role as UserRole;
            token.displayName = user.name;
            token.photoURL = user.image;
            token.provider = 'credentials';
            
            // Get additional user data from Firestore
            try {
              const userDocRef = doc(db, Collections.USERS, userId);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                token.firstName = userData.profile?.firstName;
                token.lastName = userData.profile?.lastName;
              }
            } catch (error) {
              console.error('JWT: Error fetching user profile data:', error);
            }
            
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
          console.error('JWT callback error:', error);
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
        if (token.firstName) session.user.firstName = token.firstName as string;
        if (token.lastName) session.user.lastName = token.lastName as string;
        
        console.log('Session callback: Final session data:', {
          userId: session.user.id,
          role: session.user.role,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName
        });
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle role-based redirects after authentication
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
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