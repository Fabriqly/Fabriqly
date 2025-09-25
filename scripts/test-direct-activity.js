// Test script to directly test activity creation
// Run this in your browser console while logged in as admin

console.log('🧪 Testing Direct Activity Creation...');

async function testDirectActivityCreation() {
  try {
    console.log('1. Testing direct activity creation...');
    
    const testActivity = {
      type: 'color_created',
      title: 'Test Color Activity',
      description: 'Testing direct activity creation',
      priority: 'low',
      status: 'active',
      actorId: 'test-actor',
      targetId: 'test-target',
      targetType: 'color',
      targetName: 'Test Color',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    console.log('Test activity data:', testActivity);

    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testActivity),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Direct activity creation successful:', data.activity.id);
      
      // Wait and check if it appears in the list
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('2. Checking if activity appears in list...');
      const activitiesResponse = await fetch('/api/activities?limit=5');
      const activitiesData = await activitiesResponse.json();
      
      if (activitiesResponse.ok) {
        const ourActivity = activitiesData.activities.find(
          activity => activity.id === data.activity.id
        );
        
        if (ourActivity) {
          console.log('✅ Activity appears in list:', ourActivity.title);
        } else {
          console.log('⚠️ Activity not found in list');
          console.log('Available activities:', activitiesData.activities.map(a => ({ id: a.id, title: a.title })));
        }
      }
    } else {
      console.error('❌ Direct activity creation failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Test function to check if we can create activities at all
async function testActivityAPI() {
  try {
    console.log('📊 Testing Activity API endpoints...');
    
    // Test GET
    console.log('1. Testing GET /api/activities...');
    const getResponse = await fetch('/api/activities?limit=5');
    const getData = await getResponse.json();
    
    if (getResponse.ok) {
      console.log('✅ GET /api/activities works:', getData.activities.length, 'activities found');
    } else {
      console.error('❌ GET /api/activities failed:', getData.error);
    }
    
    // Test POST
    console.log('2. Testing POST /api/activities...');
    const testActivity = {
      type: 'test_event',
      title: 'API Test Activity',
      description: 'Testing if POST works',
      priority: 'low',
      status: 'active',
      actorId: 'api-test',
      targetId: 'test-target',
      targetType: 'test',
      targetName: 'Test Target',
      metadata: { test: true }
    };
    
    const postResponse = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testActivity),
    });
    
    const postData = await postResponse.json();
    
    if (postResponse.ok) {
      console.log('✅ POST /api/activities works:', postData.activity.id);
    } else {
      console.error('❌ POST /api/activities failed:', postData.error);
      console.error('Response status:', postResponse.status);
    }
    
  } catch (error) {
    console.error('❌ API test error:', error);
  }
}

// Export functions
window.testDirectActivityCreation = testDirectActivityCreation;
window.testActivityAPI = testActivityAPI;

console.log('Test functions loaded! Use:');
console.log('- testDirectActivityCreation() - Test direct activity creation');
console.log('- testActivityAPI() - Test activity API endpoints');

// Auto-run the API test
testActivityAPI();
