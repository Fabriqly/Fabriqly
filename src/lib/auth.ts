// lib/auth.ts - FINAL MERGED VERSION
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { Collections } from '@/services/firebase';
import { UserRole } from '@/types/next-auth';
import { AuthErrorHandler, AuthErrorCode } from './auth-errors';
import { FirebaseAdminService } from '@/services/firebase-admin';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: 'offline',
          response_type: 'code',
          prompt: 'select_account'
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
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );

          if (!userCredential.user) {
            return null;
          }

          const userDocRef = doc(db, Collections.USERS, userCredential.user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            console.error('User document not found in Firestore');
            return null;
          }

          const userData = userDoc.data();

          return {
            id: userCredential.user.uid,
            email: userCredential.user.email || '',
            name:
              userData.displayName ||
              userCredential.user.displayName ||
              credentials.email,
            image: userData.photoURL || userCredential.user.photoURL || '',
            role: userData.role as UserRole
          };
        } catch (error: any) {
          console.error('Credentials verification error:', error);

          if (
            error.code === 'auth/invalid-credential' ||
            error.code === 'auth/user-not-found' ||
            error.code === 'auth/wrong-password'
          ) {
            return null;
          }

          if (
            error?.code === 'auth/internal-error' &&
            error?.message?.includes('PERMISSION_DENIED')
          ) {
            console.error(
              '❌ Firebase Admin SDK permission error. Please check IAM roles for the service account.'
            );
            console.error(
              'Required role: roles/serviceusage.serviceUsageConsumer'
            );
            console.error('Project: fabriqly-f88c3');
            console.error(
              'Visit: https://console.developers.google.com/iam-admin/iam/project?project=fabriqly-f88c3'
            );
          }

          return null;
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account }) {
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

          try {
            console.log('🔄 Attempting to create Google user in Firebase Auth:', {
              uid: user.id,
              email: user.email,
              name: user.name
            });

            const firebaseUser =
              await FirebaseAdminService.createUserInFirebaseAuth({
                uid: user.id!,
                email: user.email,
                displayName: user.name || '',
                photoURL: user.image || '',
                emailVerified: true
              });

            console.log('✅ Google user synced with Firebase Auth:', {
              uid: firebaseUser.uid,
              email: firebaseUser.email
            });

            user.id = firebaseUser.uid;
          } catch (error: any) {
            console.error('❌ Failed to sync Google user with Firebase Auth:', {
              error: error.message,
              code: error.code,
              uid: user.id,
              email: user.email
            });

            if (
              error.code !== 'auth/uid-already-exists' &&
              error.code !== 'auth/email-already-exists'
            ) {
              return false;
            }

            if (error.code === 'auth/email-already-exists') {
              try {
                const existingUser =
                  await FirebaseAdminService.getUserByEmail(user.email);
                if (existingUser) {
                  user.id = existingUser.uid;
                  console.log(
                    '✅ Using existing Firebase Auth user:',
                    existingUser.uid
                  );
                }
              } catch (getError) {
                console.error('❌ Failed to get existing user:', getError);
              }
            }
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

    async jwt({ token, user, account, trigger }) {
      if (trigger === 'update' && token.sub) {
        console.log('JWT: Session update triggered, refreshing user data...');
        try {
          const userDocRef = doc(db, Collections.USERS, token.sub);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            token.role = userData.role as UserRole;
            token.displayName = userData.displayName;
            token.photoURL = userData.photoURL;
          }
        } catch (error) {
          console.error('JWT: Error updating token during session update:', error);
        }
      }

      if (account && user) {
        try {
          const userId = user.id || token.sub!;

          if (account.provider === 'google') {
            let firebaseUserId = userId;
            try {
              const existingUser =
                await FirebaseAdminService.getUserByEmail(user.email!);
              if (existingUser) {
                firebaseUserId = existingUser.uid;
              }
            } catch {
              // ignore
            }

            const userDocRef = doc(db, Collections.USERS, firebaseUserId);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
              const userData = {
                email: user.email!,
                displayName: user.name || '',
                photoURL: user.image || null,
                role: 'customer' as UserRole,
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
              token.sub = firebaseUserId;
              token.role = 'customer' as UserRole;
            } else {
              const userData = userDoc.data();
              await setDoc(
                userDocRef,
                {
                  ...userData,
                  lastLoginAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                },
                { merge: true }
              );

              token.role = userData.role as UserRole;
            }

            token.displayName = user.name;
            token.photoURL = user.image;
            token.provider = 'google';
          } else if (account.provider === 'credentials') {
            token.role = user.role as UserRole;
            token.displayName = user.name;
            token.photoURL = user.image;
            token.provider = 'credentials';

            try {
              const userDocRef = doc(db, Collections.USERS, userId);
              await setDoc(
                userDocRef,
                {
                  lastLoginAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                },
                { merge: true }
              );
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
        if (token.displayName) session.user.name = token.displayName;
        if (token.photoURL) session.user.image = token.photoURL;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }

      // Role-based redirect after authentication
      if (user?.role === 'customer') {
        return `${baseUrl}/explore`;
      } else if (user?.role === 'designer') {
        return `${baseUrl}/dashboard/designs`;
      } else if (user?.role === 'admin') {
        return `${baseUrl}/dashboard/admin`;
      } else if (user?.role === 'business') {
        return `${baseUrl}/dashboard/business`;
      }

      // Default redirect
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
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
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

  debug: process.env.NODE_ENV === 'development'
};
