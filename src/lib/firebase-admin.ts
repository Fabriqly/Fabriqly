
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { validateEnvironment } from './env-validation';

// Validate environment variables on startup
(async () => {
  try {
    await validateEnvironment();
  } catch (error) {
    console.error('❌ Firebase Admin environment validation failed:', error);
    throw error;
  }
})();

import * as admin from "firebase-admin";


// More robust private key handling
function getPrivateKey(): string {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
  }
  
  // Handle different private key formats
  let processedKey = privateKey;
  
  // If the key contains literal \n, replace with actual newlines
  if (processedKey.includes('\\n')) {
    processedKey = processedKey.replace(/\\n/g, '\n');
  }
  
  // Ensure proper PEM format
  if (!processedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: missing BEGIN marker');
  }
  
  if (!processedKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: missing END marker');
  }
  
  return processedKey;
}

if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    };
    
    console.log('Initializing Firebase Admin with project:', serviceAccount.projectId);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
