import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { validateEnvironment } from './env-validation';

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

// Validate environment variables on startup
(async () => {
  try {
    await validateEnvironment();
  } catch (error) {
    console.error('❌ Firebase Admin environment validation failed:', error);
    throw error;
  }
})();

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
      const missing = [];
      if (!process.env.FIREBASE_PROJECT_ID) missing.push('FIREBASE_PROJECT_ID');
      if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push('FIREBASE_CLIENT_EMAIL');
      if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
      throw new Error(`Firebase Admin SDK environment variables are missing: ${missing.join(', ')}`);
    }

    // Clean up the private key (remove quotes if present)
    const cleanPrivateKey = privateKey.replace(/^["']|["']$/g, '');


    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: cleanPrivateKey,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
  }
  
  return getApps()[0];
};

// Initialize the admin app
const adminApp = initializeFirebaseAdmin();

// Export admin services
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);

export default adminApp;
