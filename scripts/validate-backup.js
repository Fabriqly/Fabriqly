#!/usr/bin/env node

/**
 * Validate Backup Script
 * 
 * This script validates the integrity of a backup.
 * 
 * Usage: node scripts/validate-backup.js <backup-id>
 */

require('dotenv').config();

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
// Note: This script requires TypeScript compilation or using ts-node
// For now, we'll use a workaround by importing the compiled version
// In production, compile TypeScript first: npm run build
const path = require('path');

// Try to use ts-node if available, otherwise expect compiled JS
let RecoveryService;
try {
  // Try to load from compiled output
  RecoveryService = require(path.join(__dirname, '../dist/services/RecoveryService')).RecoveryService;
} catch (e) {
  console.error('❌ RecoveryService not found. Please compile TypeScript first: npm run build');
  process.exit(1);
}

async function validateBackup() {
  try {
    const args = process.argv.slice(2);
    const backupId = args[0];

    if (!backupId) {
      console.error('❌ Backup ID is required');
      console.error('Usage: node scripts/validate-backup.js <backup-id>');
      process.exit(1);
    }

    console.log(`🔧 Validating backup: ${backupId}`);

    // Initialize Firebase Admin
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : null;

    if (!serviceAccount) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
        console.error('❌ Firebase Admin SDK environment variables are required');
        process.exit(1);
      }

      try {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey.replace(/^["']|["']$/g, ''),
          }),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      } catch (error) {
        if (error.code !== 'app/duplicate-app') {
          throw error;
        }
      }
    } else {
      try {
        initializeApp({
          credential: cert(serviceAccount)
        });
      } catch (error) {
        if (error.code !== 'app/duplicate-app') {
          throw error;
        }
      }
    }

    // Validate backup
    const validation = await RecoveryService.validateBackup(backupId);

    if (validation.valid) {
      console.log('✅ Backup is valid!');
      process.exit(0);
    } else {
      console.error('❌ Backup validation failed:');
      validation.errors.forEach((error, idx) => {
        console.error(`   ${idx + 1}. ${error}`);
      });
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error validating backup:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  validateBackup();
}

module.exports = { validateBackup };

