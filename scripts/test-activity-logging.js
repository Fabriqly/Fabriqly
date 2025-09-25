// Test script to verify activity logging is working
// Run this in your browser console while on localhost:3000

console.log('🧪 Testing Activity Logging...');

// Test function to create a product and then delete it to test activity logging
async function testProductActivityLogging() {
  try {
    console.log('1. Creating a test product...');
    
    const testProduct = {
      name: 'Test Activity Product',
      description: 'This is a test product to verify activity logging',
      shortDescription: 'Test product for activity logging',
      categoryId: 'test-category-id', // You'll need to use a real category ID
      price: 29.99,
      stockQuantity: 10,
      status: 'draft',
      isCustomizable: false,
      isDigital: false,
      tags: ['test', 'activity']
    };

    const createResponse = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error('❌ Failed to create test product:', error);
      return;
    }

    const createData = await createResponse.json();
    console.log('✅ Test product created:', createData.product.id);

    // Wait a moment for the activity to be logged
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('2. Checking for product creation activity...');
    const activitiesResponse = await fetch('/api/activities?limit=5');
    const activitiesData = await activitiesResponse.json();
    
    if (activitiesResponse.ok) {
      const creationActivity = activitiesData.activities.find(
        activity => activity.type === 'product_created' && activity.targetId === createData.product.id
      );
      
      if (creationActivity) {
        console.log('✅ Product creation activity logged:', creationActivity.title);
      } else {
        console.log('⚠️ Product creation activity not found');
      }
    }

    console.log('3. Deleting the test product...');
    const deleteResponse = await fetch(`/api/products/${createData.product.id}`, {
      method: 'DELETE',
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      console.error('❌ Failed to delete test product:', error);
      return;
    }

    console.log('✅ Test product deleted');

    // Wait a moment for the activity to be logged
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('4. Checking for product deletion activity...');
    const activitiesResponse2 = await fetch('/api/activities?limit=5');
    const activitiesData2 = await activitiesResponse2.json();
    
    if (activitiesResponse2.ok) {
      const deletionActivity = activitiesData2.activities.find(
        activity => activity.type === 'product_deleted' && activity.targetId === createData.product.id
      );
      
      if (deletionActivity) {
        console.log('✅ Product deletion activity logged:', deletionActivity.title);
        console.log('🎉 Activity logging is working correctly!');
      } else {
        console.log('⚠️ Product deletion activity not found');
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Test function to check recent activities
async function checkRecentActivities() {
  try {
    console.log('📊 Checking recent activities...');
    
    const response = await fetch('/api/activities?limit=10');
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Found ${data.activities.length} recent activities:`);
      data.activities.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.title} - ${activity.type} (${activity.priority})`);
        console.log(`   Description: ${activity.description}`);
        console.log(`   Actor: ${activity.actor?.name || 'System'}`);
        console.log(`   Target: ${activity.target?.name || 'N/A'}`);
        console.log(`   Time: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
        console.log('');
      });
    } else {
      console.error('❌ Failed to fetch activities:', data.error);
    }
  } catch (error) {
    console.error('❌ Error checking activities:', error);
  }
}

// Export functions for manual testing
window.testActivityLogging = {
  testProductActivityLogging,
  checkRecentActivities
};

console.log('Test functions loaded! Use:');
console.log('- testActivityLogging.testProductActivityLogging()');
console.log('- testActivityLogging.checkRecentActivities()');

// Auto-run the check
checkRecentActivities();
