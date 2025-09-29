// Script to sync existing Google OAuth users between Firebase Auth and Firestore
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to add this file

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();
const auth = admin.auth();

async function syncExistingUsers() {
  try {
    console.log('🔄 Starting sync of existing Google OAuth users...');
    
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users in Firestore`);
    
    let syncedCount = 0;
    let errorCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Only process Google OAuth users
      if (userData.provider !== 'google') {
        continue;
      }
      
      console.log(`\n🔄 Processing user: ${userData.email} (${userId})`);
      
      try {
        // Check if user exists in Firebase Auth
        let firebaseUser;
        try {
          firebaseUser = await auth.getUser(userId);
          console.log('✅ User exists in Firebase Auth');
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            console.log('❌ User not found in Firebase Auth, creating...');
            
            // Create user in Firebase Auth
            firebaseUser = await auth.createUser({
              uid: userId,
              email: userData.email,
              displayName: userData.displayName || undefined,
              photoURL: userData.photoURL || undefined,
              emailVerified: true
            });
            console.log('✅ User created in Firebase Auth');
            syncedCount++;
          } else {
            throw error;
          }
        }
        
        // Update Firestore user with sync status
        await userDoc.ref.update({
          syncedWithAuth: true,
          lastSyncAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`❌ Error syncing user ${userData.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Sync completed!`);
    console.log(`📊 Total users processed: ${usersSnapshot.size}`);
    console.log(`✅ Users synced: ${syncedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
  } finally {
    process.exit(0);
  }
}

// Run the sync
syncExistingUsers();
