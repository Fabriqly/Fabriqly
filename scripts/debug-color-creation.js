// Simple test script to debug color creation activity logging
// Run this in your browser console while logged in as admin

console.log('🔍 Debugging Color Creation Activity Logging...');

async function testColorCreationDebug() {
  try {
    console.log('1. Creating a test color with detailed logging...');
    
    const testColor = {
      colorName: `Debug Test Color ${Date.now()}`,
      hexCode: '#FF5733',
      rgbCode: 'rgb(255, 87, 51)',
      isActive: true
    };

    console.log('Test color data:', testColor);

    const response = await fetch('/api/colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testColor),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Test color created successfully:', data.color.colorName);
      console.log('Color ID:', data.color.id);
      
      // Wait a moment for the activity to be logged
      console.log('2. Waiting 3 seconds for activity logging...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('3. Checking for color creation activity...');
      const activitiesResponse = await fetch('/api/activities?limit=10');
      const activitiesData = await activitiesResponse.json();
      
      console.log('Activities response status:', activitiesResponse.status);
      console.log('Activities data:', activitiesData);
      
      if (activitiesResponse.ok) {
        console.log(`Total activities found: ${activitiesData.activities.length}`);
        
        const colorActivities = activitiesData.activities.filter(
          activity => activity.type === 'color_created'
        );
        
        console.log(`Color creation activities found: ${colorActivities.length}`);
        
        if (colorActivities.length > 0) {
          console.log('Recent color creation activities:');
          colorActivities.forEach((activity, index) => {
            console.log(`${index + 1}. ${activity.title} - Target ID: ${activity.targetId}`);
            console.log(`   Description: ${activity.description}`);
            console.log(`   Actor: ${activity.actor?.name || 'System'}`);
            console.log(`   Created: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
            console.log('');
          });
          
          const ourActivity = colorActivities.find(
            activity => activity.targetId === data.color.id
          );
          
          if (ourActivity) {
            console.log('✅ Found our color creation activity!');
            console.log('Activity details:', ourActivity);
          } else {
            console.log('⚠️ Our color creation activity not found');
            console.log('Available target IDs:', colorActivities.map(a => a.targetId));
            console.log('Our color ID:', data.color.id);
          }
        } else {
          console.log('❌ No color creation activities found at all');
          console.log('All activity types:', [...new Set(activitiesData.activities.map(a => a.type))]);
        }
      } else {
        console.error('❌ Failed to fetch activities:', activitiesData.error);
      }
      
    } else {
      console.error('❌ Failed to create test color:', data.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    console.error('Error stack:', error.stack);
  }
}

// Test function to check server logs
async function checkServerLogs() {
  console.log('📊 To check server logs:');
  console.log('1. Open your terminal/command prompt');
  console.log('2. Look for messages like:');
  console.log('   - "Logging color creation activity..."');
  console.log('   - "✅ Color creation activity logged successfully"');
  console.log('   - "❌ Error logging color creation activity"');
  console.log('3. If you see errors, they will show the exact problem');
}

// Export functions
window.testColorCreationDebug = testColorCreationDebug;
window.checkServerLogs = checkServerLogs;

console.log('Debug functions loaded! Use:');
console.log('- testColorCreationDebug() - Test color creation with detailed logging');
console.log('- checkServerLogs() - Instructions for checking server logs');

// Auto-run the test
testColorCreationDebug();
