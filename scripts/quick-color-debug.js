// Quick test to check what's happening with color creation
// Run this in your browser console while logged in as admin

console.log('🔍 Quick Color Creation Debug...');

async function quickColorDebug() {
  try {
    console.log('1. Creating a test color to see server logs...');
    
    const testColor = {
      colorName: `Debug Test ${Date.now()}`,
      hexCode: '#FF0000',
      rgbCode: 'rgb(255, 0, 0)',
      isActive: true
    };

    console.log('Creating color:', testColor);

    const response = await fetch('/api/colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testColor),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Color created successfully:', data.color.colorName);
      console.log('Color ID:', data.color.id);
      
      console.log('\n2. Check your server console (terminal) for these messages:');
      console.log('Look for:');
      console.log('- "Color creation - Session check:"');
      console.log('- "Logging color creation activity..."');
      console.log('- "✅ Color creation activity logged successfully"');
      console.log('- Any error messages starting with "❌"');
      
      console.log('\n3. Waiting 3 seconds then checking activities...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const activitiesResponse = await fetch('/api/activities?limit=5');
      const activitiesData = await activitiesResponse.json();
      
      if (activitiesResponse.ok) {
        const colorActivities = activitiesData.activities.filter(
          activity => activity.type === 'color_created'
        );
        
        console.log(`Found ${colorActivities.length} color creation activities`);
        
        if (colorActivities.length > 0) {
          console.log('Recent color creation activities:');
          colorActivities.forEach((activity, index) => {
            console.log(`${index + 1}. ${activity.title} - ${activity.targetName}`);
          });
        } else {
          console.log('❌ No color creation activities found');
          console.log('This confirms the activity logging is failing');
        }
      }
      
    } else {
      console.error('❌ Color creation failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function
window.quickColorDebug = quickColorDebug;

console.log('Quick debug loaded! Use:');
console.log('- quickColorDebug() - Test color creation and check server logs');

// Auto-run the test
quickColorDebug();
