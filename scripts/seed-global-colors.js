#!/usr/bin/env node

/**
 * Seed Global Colors
 * 
 * This script seeds the database with predefined global colors.
 * Run this once to populate the colors collection with standard colors.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Global colors data
const GLOBAL_COLORS = [
  // Basic Colors
  { colorName: 'Black', hexCode: '#000000', rgbCode: 'rgb(0, 0, 0)' },
  { colorName: 'White', hexCode: '#FFFFFF', rgbCode: 'rgb(255, 255, 255)' },
  { colorName: 'Gray', hexCode: '#808080', rgbCode: 'rgb(128, 128, 128)' },
  { colorName: 'Silver', hexCode: '#C0C0C0', rgbCode: 'rgb(192, 192, 192)' },
  
  // Primary Colors
  { colorName: 'Red', hexCode: '#FF0000', rgbCode: 'rgb(255, 0, 0)' },
  { colorName: 'Green', hexCode: '#008000', rgbCode: 'rgb(0, 128, 0)' },
  { colorName: 'Blue', hexCode: '#0000FF', rgbCode: 'rgb(0, 0, 255)' },
  
  // Extended Colors
  { colorName: 'Navy Blue', hexCode: '#000080', rgbCode: 'rgb(0, 0, 128)' },
  { colorName: 'Royal Blue', hexCode: '#4169E1', rgbCode: 'rgb(65, 105, 225)' },
  { colorName: 'Sky Blue', hexCode: '#87CEEB', rgbCode: 'rgb(135, 206, 235)' },
  { colorName: 'Forest Green', hexCode: '#228B22', rgbCode: 'rgb(34, 139, 34)' },
  { colorName: 'Lime Green', hexCode: '#32CD32', rgbCode: 'rgb(50, 205, 50)' },
  { colorName: 'Dark Red', hexCode: '#8B0000', rgbCode: 'rgb(139, 0, 0)' },
  { colorName: 'Crimson', hexCode: '#DC143C', rgbCode: 'rgb(220, 20, 60)' },
  
  // Neutral Colors
  { colorName: 'Beige', hexCode: '#F5F5DC', rgbCode: 'rgb(245, 245, 220)' },
  { colorName: 'Ivory', hexCode: '#FFFFF0', rgbCode: 'rgb(255, 255, 240)' },
  { colorName: 'Cream', hexCode: '#FFF8DC', rgbCode: 'rgb(255, 248, 220)' },
  { colorName: 'Tan', hexCode: '#D2B48C', rgbCode: 'rgb(210, 180, 140)' },
  { colorName: 'Brown', hexCode: '#A52A2A', rgbCode: 'rgb(165, 42, 42)' },
  { colorName: 'Dark Brown', hexCode: '#654321', rgbCode: 'rgb(101, 67, 33)' },
  
  // Purple/Violet Colors
  { colorName: 'Purple', hexCode: '#800080', rgbCode: 'rgb(128, 0, 128)' },
  { colorName: 'Violet', hexCode: '#8A2BE2', rgbCode: 'rgb(138, 43, 226)' },
  { colorName: 'Lavender', hexCode: '#E6E6FA', rgbCode: 'rgb(230, 230, 250)' },
  
  // Orange/Yellow Colors
  { colorName: 'Orange', hexCode: '#FFA500', rgbCode: 'rgb(255, 165, 0)' },
  { colorName: 'Dark Orange', hexCode: '#FF8C00', rgbCode: 'rgb(255, 140, 0)' },
  { colorName: 'Yellow', hexCode: '#FFFF00', rgbCode: 'rgb(255, 255, 0)' },
  { colorName: 'Gold', hexCode: '#FFD700', rgbCode: 'rgb(255, 215, 0)' },
  
  // Pink Colors
  { colorName: 'Pink', hexCode: '#FFC0CB', rgbCode: 'rgb(255, 192, 203)' },
  { colorName: 'Hot Pink', hexCode: '#FF69B4', rgbCode: 'rgb(255, 105, 180)' },
  { colorName: 'Rose', hexCode: '#FF007F', rgbCode: 'rgb(255, 0, 127)' },
  
  // Teal/Cyan Colors
  { colorName: 'Teal', hexCode: '#008080', rgbCode: 'rgb(0, 128, 128)' },
  { colorName: 'Cyan', hexCode: '#00FFFF', rgbCode: 'rgb(0, 255, 255)' },
  { colorName: 'Turquoise', hexCode: '#40E0D0', rgbCode: 'rgb(64, 224, 208)' },
  
  // Dark Colors
  { colorName: 'Dark Gray', hexCode: '#A9A9A9', rgbCode: 'rgb(169, 169, 169)' },
  { colorName: 'Charcoal', hexCode: '#36454F', rgbCode: 'rgb(54, 69, 79)' },
  { colorName: 'Midnight Blue', hexCode: '#191970', rgbCode: 'rgb(25, 25, 112)' },
];

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found. Please create it with your Firebase credentials.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return envVars;
}

// Load environment variables
const envVars = loadEnvFile();

// Initialize Firebase Admin
let privateKey = envVars.FIREBASE_PRIVATE_KEY;

// Remove quotes if present and replace literal \n with actual newlines
if (privateKey) {
  privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
}

if (!privateKey || !envVars.FIREBASE_CLIENT_EMAIL || !envVars.FIREBASE_PROJECT_ID) {
  console.error('❌ Firebase Admin SDK environment variables are not set');
  console.error('Required variables: FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID');
  console.error('Please check your .env.local file');
  process.exit(1);
}

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert({
    projectId: envVars.FIREBASE_PROJECT_ID,
    clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
  projectId: envVars.FIREBASE_PROJECT_ID,
  storageBucket: `${envVars.FIREBASE_PROJECT_ID}.appspot.com`,
});

const db = getFirestore();

async function seedGlobalColors() {
  try {
    console.log('🚀 Starting global colors seeding...');
    console.log(`📊 Found ${GLOBAL_COLORS.length} colors to seed`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const colorData of GLOBAL_COLORS) {
      try {
        // Check if color already exists by name
        const existingByName = await db.collection('colors')
          .where('colorName', '==', colorData.colorName)
          .get();

        if (!existingByName.empty) {
          console.log(`⏭️  Skipping ${colorData.colorName} - already exists`);
          skipped++;
          continue;
        }

        // Check if hex code already exists
        const existingByHex = await db.collection('colors')
          .where('hexCode', '==', colorData.hexCode)
          .get();

        if (!existingByHex.empty) {
          console.log(`⏭️  Skipping ${colorData.colorName} - hex code ${colorData.hexCode} already exists`);
          skipped++;
          continue;
        }

        // Create the color document
        const colorDoc = {
          ...colorData,
          isActive: true,
          createdAt: new Date(),
          // No businessOwnerId means it's a global color
        };

        const docRef = await db.collection('colors').add(colorDoc);
        console.log(`✅ Created global color: ${colorData.colorName} (${colorData.hexCode}) - ID: ${docRef.id}`);
        created++;

      } catch (error) {
        console.error(`❌ Error creating color ${colorData.colorName}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Seeding Results:');
    console.log(`✅ Created: ${created} colors`);
    console.log(`⏭️  Skipped: ${skipped} colors (already exist)`);
    console.log(`❌ Errors: ${errors} colors`);

    if (created > 0) {
      console.log('\n🎉 Global colors seeding completed successfully!');
      console.log('💡 Global colors are now available for all users and business owners.');
    } else if (skipped === GLOBAL_COLORS.length) {
      console.log('\nℹ️  All global colors already exist in the database.');
    } else {
      console.log('\n⚠️  Seeding completed with some issues. Check the errors above.');
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Global Colors Seeding Script

Usage: node seed-global-colors.js [options]

Options:
  --help, -h          Show this help message
  --force            Force re-seeding (will skip existing colors anyway)

Description:
  This script seeds the database with predefined global colors that are
  available to all users and business owners. Global colors don't have
  a businessOwnerId, making them accessible to everyone.

Prerequisites:
  - .env.local file with FIREBASE_SERVICE_ACCOUNT_KEY
  - Firebase project properly configured

Examples:
  node seed-global-colors.js
  node seed-global-colors.js --help
`);
  process.exit(0);
}

// Run the seeding
seedGlobalColors()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
