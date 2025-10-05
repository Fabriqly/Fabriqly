#!/usr/bin/env node

/**
 * Create Sample Products
 * 
 * This script creates sample products for testing the application.
 * Run this to populate the database with test products.
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Sample products data
const SAMPLE_PRODUCTS = [
  {
    name: "Custom T-Shirt",
    description: "High-quality cotton t-shirt perfect for custom designs. Available in multiple colors and sizes.",
    shortDescription: "Custom cotton t-shirt",
    categoryId: "clothing",
    price: 24.99,
    stockQuantity: 100,
    sku: "TSHIRT-001",
    status: "active",
    isCustomizable: true,
    isDigital: false,
    tags: ["clothing", "t-shirt", "custom", "cotton"],
    specifications: {
      material: "100% Cotton",
      weight: "180 GSM",
      care: "Machine wash cold, tumble dry low"
    },
    seoTitle: "Custom T-Shirt - High Quality Cotton",
    seoDescription: "Create custom designs on our premium cotton t-shirts. Perfect for personal use or business branding."
  },
  {
    name: "Designer Hoodie",
    description: "Comfortable and stylish hoodie made from premium materials. Perfect for custom graphics and designs.",
    shortDescription: "Premium custom hoodie",
    categoryId: "clothing",
    price: 49.99,
    stockQuantity: 50,
    sku: "HOODIE-001",
    status: "active",
    isCustomizable: true,
    isDigital: false,
    tags: ["clothing", "hoodie", "custom", "premium"],
    specifications: {
      material: "80% Cotton, 20% Polyester",
      weight: "280 GSM",
      care: "Machine wash cold, tumble dry low"
    },
    seoTitle: "Custom Hoodie - Premium Quality",
    seoDescription: "Design your own hoodie with our premium quality materials. Perfect for custom graphics and branding."
  },
  {
    name: "Logo Design Service",
    description: "Professional logo design service for businesses and individuals. Get a custom logo designed by our expert designers.",
    shortDescription: "Professional logo design",
    categoryId: "graphics",
    price: 99.99,
    stockQuantity: 0,
    sku: "LOGO-001",
    status: "active",
    isCustomizable: true,
    isDigital: true,
    tags: ["design", "logo", "graphics", "service"],
    specifications: {
      format: "Vector (AI, EPS, PDF)",
      revisions: "3 rounds of revisions included",
      delivery: "3-5 business days"
    },
    seoTitle: "Professional Logo Design Service",
    seoDescription: "Get a custom logo designed by professional designers. Perfect for businesses and personal branding."
  },
  {
    name: "Custom Mug",
    description: "High-quality ceramic mug perfect for custom designs. Great for gifts or personal use.",
    shortDescription: "Custom ceramic mug",
    categoryId: "merchandise",
    price: 12.99,
    stockQuantity: 200,
    sku: "MUG-001",
    status: "active",
    isCustomizable: true,
    isDigital: false,
    tags: ["merchandise", "mug", "custom", "ceramic"],
    specifications: {
      material: "Ceramic",
      capacity: "11 oz",
      care: "Dishwasher safe"
    },
    seoTitle: "Custom Ceramic Mug - Perfect for Gifts",
    seoDescription: "Create custom designs on our high-quality ceramic mugs. Perfect for gifts or personal use."
  },
  {
    name: "Business Card Design",
    description: "Professional business card design service. Get custom business cards designed for your business.",
    shortDescription: "Professional business card design",
    categoryId: "graphics",
    price: 49.99,
    stockQuantity: 0,
    sku: "BCARD-001",
    status: "active",
    isCustomizable: true,
    isDigital: true,
    tags: ["design", "business", "cards", "print"],
    specifications: {
      format: "Print-ready (PDF, AI)",
      size: "3.5\" x 2\"",
      delivery: "2-3 business days"
    },
    seoTitle: "Professional Business Card Design",
    seoDescription: "Get professional business cards designed for your business. Print-ready files included."
  },
  {
    name: "Custom Sticker Pack",
    description: "High-quality vinyl stickers perfect for custom designs. Weather-resistant and durable.",
    shortDescription: "Custom vinyl stickers",
    categoryId: "merchandise",
    price: 8.99,
    stockQuantity: 500,
    sku: "STICKER-001",
    status: "active",
    isCustomizable: true,
    isDigital: false,
    tags: ["merchandise", "stickers", "custom", "vinyl"],
    specifications: {
      material: "Vinyl",
      finish: "Matte or Glossy",
      weatherResistant: true
    },
    seoTitle: "Custom Vinyl Stickers - Weather Resistant",
    seoDescription: "Create custom vinyl stickers with your designs. Weather-resistant and perfect for outdoor use."
  }
];

async function createSampleProducts() {
  try {
    console.log('🚀 Creating sample products...');

    // First, let's check if we have any categories
    const categoriesSnapshot = await db.collection('categories').get();
    
    if (categoriesSnapshot.empty) {
      console.log('⚠️ No categories found. Creating sample categories first...');
      
      const sampleCategories = [
        { name: 'Clothing', description: 'Apparel and clothing items', slug: 'clothing', isActive: true },
        { name: 'Graphics', description: 'Design and graphics services', slug: 'graphics', isActive: true },
        { name: 'Merchandise', description: 'Custom merchandise and promotional items', slug: 'merchandise', isActive: true }
      ];

      for (const categoryData of sampleCategories) {
        const categoryRef = await db.collection('categories').add({
          ...categoryData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Created category: ${categoryData.name} (${categoryRef.id})`);
      }
    }

    // Get categories for product creation
    const categoriesSnapshot2 = await db.collection('categories').get();
    const categories = {};
    categoriesSnapshot2.forEach(doc => {
      const data = doc.data();
      categories[data.slug] = doc.id;
    });

    console.log('📦 Available categories:', categories);

    // Create a sample business owner user if none exists
    let businessOwnerId;
    const usersSnapshot = await db.collection('users').where('role', '==', 'business_owner').limit(1).get();
    
    if (usersSnapshot.empty) {
      console.log('👤 Creating sample business owner...');
      const userRef = await db.collection('users').add({
        email: 'business@fabriqly.com',
        name: 'Sample Business Owner',
        role: 'business_owner',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      businessOwnerId = userRef.id;
      console.log(`✅ Created business owner: ${businessOwnerId}`);
    } else {
      businessOwnerId = usersSnapshot.docs[0].id;
      console.log(`✅ Using existing business owner: ${businessOwnerId}`);
    }

    // Create sample products
    let createdCount = 0;
    for (const productData of SAMPLE_PRODUCTS) {
      try {
        // Map category names to IDs
        const categoryId = categories[productData.categoryId] || categories['clothing'];
        
        const productRef = await db.collection('products').add({
          ...productData,
          categoryId,
          businessOwnerId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Created product: ${productData.name} (${productRef.id})`);
        createdCount++;
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to create product ${productData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdCount} sample products!`);
    console.log('\n📋 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Visit http://localhost:3000/explore to see the products');
    console.log('3. Login as the business owner to manage products');
    console.log('4. Create more products using the dashboard');
    
  } catch (error) {
    console.error('❌ Error creating sample products:', error);
    process.exit(1);
  }
}

// Run the script
createSampleProducts()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
