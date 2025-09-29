#!/usr/bin/env node

/**
 * 🔐 Admin Account Creation Script
 * 
 * This script creates the first admin account for your Fabriqly application.
 * Run this once to establish the initial admin user.
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
    console.error('❌ Firebase Admin SDK environment variables are not set');
    console.error('Required: FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID');
    process.exit(1);
  }

  const cleanPrivateKey = privateKey.replace(/^["']|["']$/g, '');

  try {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: cleanPrivateKey,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    process.exit(1);
  }
}

// Initialize Firebase
const app = initializeFirebaseAdmin();
const auth = getAuth(app);
const db = getFirestore(app);

// Admin account creation function
async function createAdminAccount(email, password, name) {
  try {
    console.log(`🚀 Creating admin account for: ${email}`);
    
    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log(`⚠️  User ${email} already exists!`);
      
      // Check if they're already an admin
      const userDoc = await db.collection('users').doc(existingUser.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          console.log(`✅ User ${email} is already an admin!`);
          return { success: true, message: 'User is already an admin' };
        } else {
          // Update their role to admin
          await db.collection('users').doc(existingUser.uid).update({
            role: 'admin',
            updatedAt: Timestamp.now()
          });
          console.log(`✅ Updated ${email} to admin role!`);
          return { success: true, message: 'User role updated to admin' };
        }
      }
    } catch (error) {
      // User doesn't exist, continue with creation
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create new Firebase Auth user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: true // Mark as verified for admin accounts
    });

    console.log(`✅ Firebase Auth user created: ${userRecord.uid}`);

    // Create user document in Firestore
    const userDoc = {
      email: email,
      displayName: name,
      role: 'admin',
      isVerified: true,
      profile: {
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          theme: 'light'
        }
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc);

    console.log(`✅ Firestore user document created for: ${email}`);
    console.log(`🎉 Admin account created successfully!`);
    
    return {
      success: true,
      uid: userRecord.uid,
      email: email,
      message: 'Admin account created successfully'
    };

  } catch (error) {
    console.error(`❌ Error creating admin account:`, error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.log(`💡 Try logging in with this email or check if user exists`);
    } else if (error.code === 'auth/weak-password') {
      console.log(`💡 Password must be at least 6 characters`);
    } else if (error.code === 'auth/invalid-email') {
      console.log(`💡 Invalid email format`);
    }
    
    throw error;
  }
}

// Interactive prompt for admin details
async function promptForAdminDetails() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n🔐 Admin Account Creation');
    console.log('========================\n');

    rl.question('📧 Admin Email: ', (email) => {
      rl.question('🔒 Admin Password (min 6 chars): ', (password) => {
        rl.question('👤 Admin Full Name: ', (name) => {
          rl.close();
          resolve({ email, password, name });
        });
      });
    });
  });
}

// Main execution
async function main() {
  try {
    console.log('🎯 Fabriqly Admin Account Creation');
    console.log('==================================');

    // Check for command line arguments
    if (process.argv.length >= 5) {
      const email = process.argv[2];
      const password = process.argv[3];
      const name = process.argv[4];
      
      console.log(`Using provided credentials:`);
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Name: ${name}`);
      console.log(`🔒 Password: ${'*'.repeat(password.length)}\n`);
      
      const result = await createAdminAccount(email, password, name);
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    } else {
      // Interactive mode
      const { email, password, name } = await promptForAdminDetails();
      
      if (!email || !password || !name) {
        console.error('❌ All fields are required!');
        process.exit(1);
      }
      
      if (password.length < 6) {
        console.error('❌ Password must be at least 6 characters!');
        process.exit(1);
      }
      
      const result = await createAdminAccount(email, password, name);
      console.log(`\n${result.message}`);
      process.exit(result.success ? 0 : 1);
    }
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Ensure .env.local has Firebase admin credentials');
    console.log('   - Check Firebase project permissions');
    console.log('   - Verify email format is valid');
    process.exit(1);
  }
}

// Usage examples
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('🔐 Admin Account Creation Script');
    console.log('=================================');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/create-admin-account.js');
    console.log('  node scripts/create-admin-account.js <email> <password> <name>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/create-admin-account.js');
    console.log('  node scripts/create-admin-account.js admin@fabriqly.com AdminPass123 "Admin User"');
    console.log('');
    console.log('Environment Requirements:');
    console.log('  - .env.local file with Firebase admin credentials');
    console.log('  - FIREBASE_PRIVATE_KEY');
    console.log('  - FIREBASE_CLIENT_EMAIL');
    console.log('  - FIREBASE_PROJECT_ID');
    process.exit(0);
  }
  
  main();
}

module.exports = {
  createAdminAccount,
  initializeFirebaseAdmin
};
