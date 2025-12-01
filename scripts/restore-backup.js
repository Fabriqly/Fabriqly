#!/usr/bin/env node

/**
 * Restore Backup Script
 * 
 * This script restores data from a backup.
 * 
 * Usage: node scripts/restore-backup.js <backup-id> [options]
 * Options:
 *   --dry-run         Preview restore without making changes
 *   --overwrite       Overwrite existing data
 *   --collections     Comma-separated list of collections to restore
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

async function restoreBackup() {
  try {
    const args = process.argv.slice(2);
    const backupId = args[0];

    if (!backupId) {
      console.error('❌ Backup ID is required');
      console.error('Usage: node scripts/restore-backup.js <backup-id> [options]');
      process.exit(1);
    }

    console.log(`🔧 Restoring backup: ${backupId}`);

    // Parse options
    const options = {
      dryRun: args.includes('--dry-run'),
      overwrite: args.includes('--overwrite'),
      collections: undefined
    };

    const collectionsIndex = args.indexOf('--collections');
    if (collectionsIndex !== -1 && args[collectionsIndex + 1]) {
      options.collections = args[collectionsIndex + 1].split(',');
    }

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

    if (options.dryRun) {
      console.log('⚠️  DRY RUN MODE: No changes will be made');
    }

    if (options.overwrite) {
      console.log('⚠️  OVERWRITE MODE: Existing data will be overwritten');
    }

    // Restore backup
    const result = await RecoveryService.restoreBackup(backupId, options);

    console.log('✅ Restore completed!');
    console.log(`   Collections restored: ${result.restoredCollections.length}`);
    console.log(`   Files restored: ${result.restoredFiles}`);
    console.log(`   Records restored: ${result.restoredRecords}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
      result.errors.forEach((error, idx) => {
        console.log(`     ${idx + 1}. ${error}`);
      });
    }

    if (!result.success) {
      console.error('❌ Restore completed with errors');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error restoring backup:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  restoreBackup();
}

module.exports = { restoreBackup };

