// Test script to verify product publishing activity logging
// Run this in your browser console while logged in as admin or business owner

console.log('🧪 Testing Product Publishing Activity Logging...');

async function testProductPublishingActivity() {
  try {
    console.log('=== STEP 1: Create a Draft Product ===');
    
    // Create a draft product first
    const draftProduct = {
      name: `Test Draft Product ${Date.now()}`,
      description: 'Test product for publishing activity testing',
      shortDescription: 'Test draft product',
      categoryId: 'test-category', // You may need to use a real category ID
      price: 29.99,
      stockQuantity: 10,
      sku: `TEST-DRAFT-${Date.now()}`,
      status: 'draft',
      isCustomizable: false,
      isDigital: false,
      tags: ['test', 'draft']
    };
    
    console.log('Creating draft product:', draftProduct.name);
    
    const createResponse = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftProduct)
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('✅ Draft product created successfully:', createData.product.name);
      console.log('Product ID:', createData.product.id);
      
      // Wait for activity logging
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('\n=== STEP 2: Publish the Product ===');
      
      // Publish the product
      const publishResponse = await fetch(`/api/products/${createData.product.id}/publish`, {
        method: 'POST'
      });
      
      const publishData = await publishResponse.json();
      
      if (publishResponse.ok) {
        console.log('✅ Product published successfully');
        
        // Wait for activity logging
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n=== STEP 3: Check Publishing Activity ===');
        
        // Check for publishing activity
        const activitiesResponse = await fetch('/api/activities?limit=10');
        const activitiesData = await activitiesResponse.json();
        
        if (activitiesResponse.ok) {
          const publishActivities = activitiesData.activities.filter(
            activity => activity.type === 'product_published'
          );
          
          console.log(`Found ${publishActivities.length} product publishing activities:`);
          
          publishActivities.forEach((activity, index) => {
            console.log(`${index + 1}. ${activity.title} - ${activity.targetName}`);
            console.log(`   Description: ${activity.description}`);
            console.log(`   Actor: ${activity.actor?.name || 'System'}`);
            console.log(`   Created: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
            console.log(`   Metadata:`, activity.metadata);
            console.log('');
          });
          
          if (publishActivities.length > 0) {
            console.log('🎉 SUCCESS: Product publishing activity logged!');
          } else {
            console.log('⚠️ No product publishing activities found');
          }
        }
        
        console.log('\n=== STEP 4: Test Unpublishing (Make Inactive) ===');
        
        // Test unpublishing by making the product inactive
        const unpublishResponse = await fetch(`/api/products/${createData.product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'inactive'
          })
        });
        
        if (unpublishResponse.ok) {
          console.log('✅ Product unpublished (made inactive)');
          
          // Wait for activity logging
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check for unpublishing activity
          const unpublishActivitiesResponse = await fetch('/api/activities?limit=10');
          const unpublishActivitiesData = await unpublishActivitiesResponse.json();
          
          if (unpublishActivitiesResponse.ok) {
            const unpublishActivities = unpublishActivitiesData.activities.filter(
              activity => activity.type === 'product_unpublished'
            );
            
            console.log(`Found ${unpublishActivities.length} product unpublishing activities:`);
            
            unpublishActivities.forEach((activity, index) => {
              console.log(`${index + 1}. ${activity.title} - ${activity.targetName}`);
              console.log(`   Description: ${activity.description}`);
              console.log(`   Created: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
            });
            
            if (unpublishActivities.length > 0) {
              console.log('🎉 SUCCESS: Product unpublishing activity logged!');
            }
          }
        }
        
        console.log('\n=== STEP 5: Test Republishing (Make Active Again) ===');
        
        // Test republishing by making the product active again
        const republishResponse = await fetch(`/api/products/${createData.product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'active'
          })
        });
        
        if (republishResponse.ok) {
          console.log('✅ Product republished (made active)');
          
          // Wait for activity logging
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check for republishing activity
          const republishActivitiesResponse = await fetch('/api/activities?limit=10');
          const republishActivitiesData = await republishActivitiesResponse.json();
          
          if (republishActivitiesResponse.ok) {
            const republishActivities = republishActivitiesData.activities.filter(
              activity => activity.type === 'product_republished'
            );
            
            console.log(`Found ${republishActivities.length} product republishing activities:`);
            
            republishActivities.forEach((activity, index) => {
              console.log(`${index + 1}. ${activity.title} - ${activity.targetName}`);
              console.log(`   Description: ${activity.description}`);
              console.log(`   Created: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
            });
            
            if (republishActivities.length > 0) {
              console.log('🎉 SUCCESS: Product republishing activity logged!');
            }
          }
        }
        
        console.log('\n=== SUMMARY ===');
        console.log('Check your server console for:');
        console.log('- "✅ Product publication activity logged successfully"');
        console.log('- "✅ Product unpublishing activity logged successfully"');
        console.log('- "✅ Product republishing activity logged successfully"');
        
      } else {
        console.error('❌ Product publishing failed:', publishData.error);
      }
    } else {
      console.error('❌ Draft product creation failed:', createData.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function
window.testProductPublishingActivity = testProductPublishingActivity;

console.log('Test function loaded! Use:');
console.log('- testProductPublishingActivity() - Test product publishing activity logging');

// Auto-run the test
testProductPublishingActivity();
