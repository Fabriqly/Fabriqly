import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Collections } from '@/services/firebase';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
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
    async jwt({ token, user, account }) {
      if (account && user) {
        // First time JWT callback is run, user object is available
        if (account.provider === 'google') {
          // Handle Google sign-in
          const userDoc = await getDoc(doc(db, Collections.USERS, user.id));
          
          if (!userDoc.exists()) {
            // Create new user document for Google users
            const userData = {
              email: user.email,
              displayName: user.name,
              photoURL: user.image,
              role: 'customer',
              isVerified: true,
              profile: {
                firstName: user.name?.split(' ')[0],
                lastName: user.name?.split(' ')[1],
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
            
            await setDoc(doc(db, Collections.USERS, user.id), userData);
            token.role = 'customer';
          } else {
            const userData = userDoc.data();
            token.role = userData.role;
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
    signUp: '/register',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
