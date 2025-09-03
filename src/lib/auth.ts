import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Collections } from '@/services/firebase';
import bcrypt from 'bcryptjs';

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
              role: credentials.role || 'customer',
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
              role: userData?.role || 'customer',
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
          
          // Just return true for now to allow sign-in
          // We'll create the Firestore document in the JWT callback
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
            console.log('Creating/getting user document for Google user:', user.email, 'with ID:', user.id);
            
            // Create or get user document in Firestore
            const userDoc = await getDoc(doc(db, Collections.USERS, user.id!));
            
            if (!userDoc.exists()) {
              console.log('User document does not exist, creating new one...');
              
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
              token.role = 'customer';
            } else {
              console.log('User document exists, getting role...');
              const userData = userDoc.data();
              token.role = userData.role;
              console.log('Existing user role:', userData.role);
            }
            
            token.displayName = user.name;
            token.photoURL = user.image;
          } catch (error) {
            console.error('❌ Error in JWT callback:', error);
            token.role = 'customer'; // Fallback
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
        session.user.role = token.role as string;
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
