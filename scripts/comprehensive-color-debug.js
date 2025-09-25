// Comprehensive test to identify color creation activity logging issue
// Run this in your browser console while logged in as admin

console.log('🔍 Comprehensive Color Creation Debug Test...');

async function comprehensiveColorTest() {
  try {
    console.log('=== STEP 1: Check Authentication ===');
    
    // Check if we're properly authenticated
    const authResponse = await fetch('/api/auth/session');
    const authData = await authResponse.json();
    
    if (authResponse.ok && authData.user) {
      console.log('✅ Authentication OK:', {
        role: authData.user.role,
        id: authData.user.id,
        name: authData.user.name
      });
    } else {
      console.error('❌ Authentication failed:', authData);
      return;
    }
    
    console.log('\n=== STEP 2: Test Activity API Directly ===');
    
    // Test creating an activity directly
    const directActivity = {
      type: 'test_direct',
      title: 'Direct Activity Test',
      description: 'Testing direct activity creation',
      priority: 'low',
      status: 'active',
      actorId: authData.user.id,
      targetId: 'test-direct',
      targetType: 'test',
      targetName: 'Direct Test',
      metadata: { test: true }
    };
    
    const directResponse = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(directActivity)
    });
    
    const directData = await directResponse.json();
    
    if (directResponse.ok) {
      console.log('✅ Direct activity creation works:', directData.activity.id);
    } else {
      console.error('❌ Direct activity creation failed:', directData.error);
      console.log('This means the activity API itself has issues');
      return;
    }
    
    console.log('\n=== STEP 3: Test Color Creation ===');
    
    // Create a test color
    const testColor = {
      colorName: `Debug Test ${Date.now()}`,
      hexCode: '#FF5733',
      rgbCode: 'rgb(255, 87, 51)',
      isActive: true
    };
    
    console.log('Creating color:', testColor);
    
    const colorResponse = await fetch('/api/colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testColor)
    });
    
    const colorData = await colorResponse.json();
    
    if (colorResponse.ok) {
      console.log('✅ Color creation successful:', colorData.color.colorName);
      console.log('Color ID:', colorData.color.id);
      
      console.log('\n=== STEP 4: Check Server Console ===');
      console.log('Look at your server console (terminal) for these messages:');
      console.log('- "Color creation - Session check:"');
      console.log('- "Logging color creation activity..."');
      console.log('- "✅ Color creation activity logged successfully"');
      console.log('- Any error messages');
      
      console.log('\n=== STEP 5: Wait and Check Activities ===');
      
      // Wait for activity logging
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const activitiesResponse = await fetch('/api/activities?limit=10');
      const activitiesData = await activitiesResponse.json();
      
      if (activitiesResponse.ok) {
        console.log(`Total activities: ${activitiesData.activities.length}`);
        
        const recentActivities = activitiesData.activities.slice(0, 5);
        console.log('Recent activities:');
        recentActivities.forEach((activity, index) => {
          console.log(`${index + 1}. ${activity.type} - ${activity.title}`);
          console.log(`   Target ID: ${activity.targetId}`);
          console.log(`   Created: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
        });
        
        const colorActivity = activitiesData.activities.find(
          activity => activity.type === 'color_created' && activity.targetId === colorData.color.id
        );
        
        if (colorActivity) {
          console.log('\n✅ SUCCESS: Color creation activity found!');
          console.log('Activity details:', colorActivity);
        } else {
          console.log('\n❌ ISSUE: Color creation activity not found');
          console.log('This means the activity logging in the color API is failing');
          
          // Check if there are any color activities at all
          const anyColorActivities = activitiesData.activities.filter(
            activity => activity.type.startsWith('color_')
          );
          
          if (anyColorActivities.length > 0) {
            console.log('But there are other color activities:', anyColorActivities.length);
            anyColorActivities.forEach(activity => {
              console.log(`- ${activity.type}: ${activity.title}`);
            });
          } else {
            console.log('No color activities found at all');
          }
        }
      } else {
        console.error('❌ Failed to fetch activities:', activitiesData.error);
      }
      
    } else {
      console.error('❌ Color creation failed:', colorData.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function
window.comprehensiveColorTest = comprehensiveColorTest;

console.log('Comprehensive test loaded! Use:');
console.log('- comprehensiveColorTest() - Run full diagnostic test');

// Auto-run the test
comprehensiveColorTest();
