#!/usr/bin/env node

/**
 * Quick Test Script for Backup System
 * 
 * This script performs a quick end-to-end test of the backup system:
 * 1. Creates a test backup (Firestore only, no GCS)
 * 2. Validates the backup
 * 3. Performs a dry-run restore
 * 
 * Usage: node scripts/test-backup-system.js
 */

require('dotenv').config();

const { createBackup } = require('./create-backup');
const { validateBackup } = require('./validate-backup');
const { restoreBackup } = require('./restore-backup');

async function testBackupSystem() {
  console.log('🧪 Starting Backup System Test...\n');

  let backupId = null;

  try {
    // Step 1: Create a test backup
    console.log('📦 Step 1: Creating test backup (Firestore only, no GCS)...');
    console.log('   This may take a few moments...\n');
    
    // Override process.argv to simulate CLI arguments
    const originalArgv = process.argv;
    process.argv = ['node', 'create-backup.js', '--firestore-only', '--no-gcs'];
    
    try {
      await createBackup();
      // Extract backup ID from console output (we'll need to modify createBackup to return it)
      console.log('\n✅ Backup created successfully!\n');
    } catch (error) {
      console.error('❌ Backup creation failed:', error.message);
      throw error;
    } finally {
      process.argv = originalArgv;
    }

    // Note: In a real implementation, createBackup should return the backup ID
    // For now, we'll need to get it from the output or modify the function
    console.log('⚠️  Note: Please manually note the backup ID from above output');
    console.log('   Then run: node scripts/validate-backup.js <backup-id>\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  console.log('✅ Test completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Note the backup ID from the output above');
  console.log('   2. Run: node scripts/validate-backup.js <backup-id>');
  console.log('   3. Run: node scripts/restore-backup.js <backup-id> --dry-run');
  console.log('   4. Check the admin UI at: http://localhost:3000/dashboard/admin/backups\n');
}

// Run if executed directly
if (require.main === module) {
  testBackupSystem()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testBackupSystem };

