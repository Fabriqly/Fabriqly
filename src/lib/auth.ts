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

import { UserRole } from '@/types/next-auth';

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
        password: { label: 'Password', type: 'password' },
        action: { label: 'Action', type: 'text' }, // 'signin' or 'signup'
        firstName: { label: 'First Name', type: 'text' },
        lastName: { label: 'Last Name', type: 'text' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
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
        } catch (error: any) {
          console.error('Auth error:', error);
          throw new Error(error.message || 'Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback - Provider:', account?.provider);
      console.log('SignIn callback - User:', user);
      
      if (account?.provider === 'google') {
        try {
          console.log('Processing Google sign-in for:', user.email);
          // Allow sign-in, we'll handle duplicate detection in JWT callback
          return true;
        } catch (error) {
          console.error('Error in Google sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      console.log('JWT Callback - Token:', token);
      console.log('JWT Callback - User:', user);
      console.log('JWT Callback - Account:', account);
      
      if (account && user) {
        // First time JWT callback is run, user object is available
        if (account.provider === 'google') {
          try {
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
            const userDoc = await getDoc(doc(db, Collections.USERS, user.id!));
            
            if (!userDoc.exists()) {
              console.log('Creating new user document for Google user:', user.id);
              
              // Create new user document
              const userData = {
                email: user.email,
                displayName: user.name,
                photoURL: user.image,
                role: 'customer',
                isVerified: true,
                profile: {
                  firstName: user.name?.split(' ')[0] || '',
                  lastName: user.name?.split(' ').slice(1).join(' ') || '',
                  preferences: {
                    notifications: {
                      email: true,
                      sms: false,
                      push: true
                    },
                    theme: 'light'
                  }
                },
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              await setDoc(doc(db, Collections.USERS, user.id!), userData);
              console.log('✅ Google user document created successfully:', user.id, 'for email:', user.email);
              token.role = 'customer' as UserRole;
            } else {
              console.log('User document exists, getting role...');
              const userData = userDoc.data();
              token.role = userData.role as UserRole;
              console.log('Existing user role:', userData.role);
            }
            
            token.displayName = user.name;
            token.photoURL = user.image;
          } catch (error) {
            console.error('❌ Error in JWT callback:', error);
            token.role = 'customer' as UserRole; // Fallback
          }
        } else {
          token.role = user.role;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
