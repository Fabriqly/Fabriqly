// Script to initialize the activities collection in Firebase
// This ensures the collection exists and has proper structure

// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Simple .env.local loader
function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    console.error('Error loading .env.local:', error.message);
  }
}

// Load environment variables
loadEnvFile(path.join(__dirname, '..', '.env.local'));

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
    throw new Error('Firebase Admin SDK environment variables are not set');
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
};

// Initialize Firebase
const adminApp = initializeFirebaseAdmin();
const db = getFirestore(adminApp);

// Sample activity to initialize the collection
const sampleActivity = {
  type: 'system_event',
  title: 'Activities Collection Initialized',
  description: 'The activities collection has been initialized successfully',
      priority: 'medium',
  status: 'active',
  actorId: 'system',
  targetId: 'activities-collection',
  targetType: 'collection',
  targetName: 'activities',
  metadata: {
    initialization: true,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  },
  systemEvent: {
    eventName: 'collection_initialized',
    eventData: {
      collectionName: 'activities',
      initializedAt: new Date().toISOString()
    }
  },
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

async function initializeActivitiesCollection() {
  try {
    console.log('🚀 Initializing activities collection...');
    
    // Check if collection already has documents
    const existingDocs = await db.collection('activities').limit(1).get();
    
    if (existingDocs.empty) {
      console.log('📝 Creating initial activity document...');
      
      // Add the sample activity to initialize the collection
      const docRef = await db.collection('activities').add(sampleActivity);
      
      console.log('✅ Activities collection initialized successfully!');
      console.log(`📄 Initial document ID: ${docRef.id}`);
      
      // Clean up the initialization document after a short delay
      setTimeout(async () => {
        try {
          await docRef.delete();
          console.log('🧹 Cleaned up initialization document');
        } catch (error) {
          console.log('⚠️ Could not clean up initialization document:', error.message);
        }
      }, 5000);
      
    } else {
      console.log('✅ Activities collection already exists with documents');
    }
    
    // Verify collection exists by trying to query it
    const testQuery = await db.collection('activities').limit(1).get();
    console.log(`📊 Collection verification: Found ${testQuery.size} document(s)`);
    
  } catch (error) {
    console.error('❌ Error initializing activities collection:', error);
    throw error;
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeActivitiesCollection()
    .then(() => {
      console.log('🎉 Activities collection initialization completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeActivitiesCollection };