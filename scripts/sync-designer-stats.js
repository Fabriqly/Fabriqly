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

async function syncDesignerStats() {
  try {
    console.log('🔄 Starting designer stats synchronization...');

    // Get all designer profiles
    const designerProfilesSnapshot = await db.collection('designerProfiles').get();
    
    console.log(`📊 Found ${designerProfilesSnapshot.size} designer profiles`);

    // Get all designs
    const designsSnapshot = await db.collection('designs').get();
    
    console.log(`🎨 Found ${designsSnapshot.size} designs`);

    // Debug: Show some design data
    if (designsSnapshot.size > 0) {
      console.log('🔍 Sample design data:');
      designsSnapshot.docs.slice(0, 2).forEach((doc, index) => {
        const data = doc.data();
        console.log(`  Design ${index + 1}:`, {
          id: doc.id,
          designerId: data.designerId,
          designName: data.designName,
          downloadCount: data.downloadCount,
          viewCount: data.viewCount,
          likesCount: data.likesCount
        });
      });
    }

    // Group designs by designer
    const designsByDesigner = {};
    designsSnapshot.forEach((designDoc) => {
      const design = designDoc.data();
      const designerId = design.designerId;
      
      if (!designsByDesigner[designerId]) {
        designsByDesigner[designerId] = {
          totalDesigns: 0,
          totalDownloads: 0,
          totalViews: 0,
          totalLikes: 0
        };
      }
      
      designsByDesigner[designerId].totalDesigns += 1;
      designsByDesigner[designerId].totalDownloads += design.downloadCount || 0;
      designsByDesigner[designerId].totalViews += design.viewCount || 0;
      designsByDesigner[designerId].totalLikes += design.likesCount || 0;
    });

    console.log(`📈 Calculated stats for ${Object.keys(designsByDesigner).length} designers`);

    // Update each designer profile
    let updatedCount = 0;
    for (const designerDoc of designerProfilesSnapshot.docs) {
      const designerId = designerDoc.id;
      const designerData = designerDoc.data();
      const realTimeStats = designsByDesigner[designerId];

      if (realTimeStats) {
        const newPortfolioStats = {
          totalDesigns: realTimeStats.totalDesigns,
          totalDownloads: realTimeStats.totalDownloads,
          totalViews: realTimeStats.totalViews,
          averageRating: designerData.portfolioStats?.averageRating || 0
        };

        // Check if stats need updating
        const currentStats = designerData.portfolioStats || {};
        const needsUpdate = 
          currentStats.totalDesigns !== newPortfolioStats.totalDesigns ||
          currentStats.totalDownloads !== newPortfolioStats.totalDownloads ||
          currentStats.totalViews !== newPortfolioStats.totalViews;

        if (needsUpdate) {
          await db.collection('designerProfiles').doc(designerId).update({
            portfolioStats: newPortfolioStats,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`✅ Updated ${designerData.businessName}: ${newPortfolioStats.totalDesigns} designs, ${newPortfolioStats.totalViews} views, ${newPortfolioStats.totalDownloads} downloads`);
          updatedCount++;
        } else {
          console.log(`⏭️  Skipped ${designerData.businessName}: stats already up to date`);
        }
      } else {
        // No designs found for this designer
        const newPortfolioStats = {
          totalDesigns: 0,
          totalDownloads: 0,
          totalViews: 0,
          averageRating: designerData.portfolioStats?.averageRating || 0
        };

        await db.collection('designerProfiles').doc(designerId).update({
          portfolioStats: newPortfolioStats,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`🔄 Reset ${designerData.businessName}: no designs found`);
        updatedCount++;
      }
    }

    console.log(`🎉 Synchronization complete! Updated ${updatedCount} designer profiles.`);
    
  } catch (error) {
    console.error('❌ Error syncing designer stats:', error);
    process.exit(1);
  }
}

// Run the sync
syncDesignerStats()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
