#!/usr/bin/env node

/**
 * Create Backup Script
 * 
 * This script creates a full system backup including Firestore, Supabase Storage, and MySQL.
 * 
 * Usage: node scripts/create-backup.js [options]
 * Options:
 *   --firestore-only    Backup only Firestore collections
 *   --storage-only     Backup only Supabase Storage
 *   --mysql-only       Backup only MySQL database
 *   --no-gcs          Don't upload to Google Cloud Storage
 *   --collections      Comma-separated list of collections to backup
 */

require('dotenv').config();

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { BackupService } = require('../src/services/BackupService');

async function createBackup() {
  try {
    console.log('🔧 Creating system backup...');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {
      includeFirestore: !args.includes('--storage-only') && !args.includes('--mysql-only'),
      includeStorage: !args.includes('--firestore-only') && !args.includes('--mysql-only'),
      includeMySQL: !args.includes('--firestore-only') && !args.includes('--storage-only'),
      uploadToGCS: !args.includes('--no-gcs'),
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

    // Create backup
    const backup = await BackupService.createBackup(options);

    console.log('✅ Backup created successfully!');
    console.log(`   Backup ID: ${backup.id}`);
    console.log(`   Type: ${backup.type}`);
    console.log(`   Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Status: ${backup.status}`);
    console.log(`   Local Path: ${backup.storageLocations.local}`);
    if (backup.storageLocations.gcs) {
      console.log(`   GCS Path: ${backup.storageLocations.gcs}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };


