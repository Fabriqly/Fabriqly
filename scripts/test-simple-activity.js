// Simple test to verify activity logging is working
// Run this in your browser console while logged in as admin or business owner

console.log('🧪 Testing Activity Logging...');

async function testActivityCreation() {
  try {
    console.log('Creating a test activity...');
    
    const testActivity = {
      type: 'product_deleted',
      title: 'Test Product Deletion',
      description: 'This is a test activity to verify logging works',
      priority: 'medium',
      actorId: 'test-user-123',
      targetId: 'test-product-123',
      targetType: 'product',
      targetName: 'Test Product',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testActivity),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Activity created successfully!');
      console.log('Activity ID:', data.activity.id);
      console.log('Activity data:', data.activity);
      
      // Wait a moment then check if it appears in the list
      setTimeout(async () => {
        console.log('Checking if activity appears in the list...');
        const listResponse = await fetch('/api/activities?limit=5');
        const listData = await listResponse.json();
        
        if (listResponse.ok) {
          const testActivity = listData.activities.find(
            activity => activity.id === data.activity.id
          );
          
          if (testActivity) {
            console.log('✅ Activity found in list:', testActivity.title);
            console.log('🎉 Activity logging is working correctly!');
          } else {
            console.log('⚠️ Activity not found in list');
          }
        } else {
          console.error('❌ Failed to fetch activities:', listData.error);
        }
      }, 1000);
      
    } else {
      console.error('❌ Failed to create activity:', data.error);
      console.log('Response status:', response.status);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function for manual testing
window.testActivityCreation = testActivityCreation;

console.log('Test function loaded! Use: testActivityCreation()');

// Auto-run the test
testActivityCreation();
