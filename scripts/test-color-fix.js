// Test script to verify the color creation fix
// Run this in your browser console while logged in as admin

console.log('🧪 Testing Color Creation Fix...');

async function testColorCreationFix() {
  try {
    console.log('1. Creating a test color to verify the fix...');
    
    const testColor = {
      colorName: `Test Fix ${Date.now()}`,
      hexCode: '#00FF00',
      rgbCode: 'rgb(0, 255, 0)',
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
      
      console.log('\n2. Check your server console for:');
      console.log('- "✅ Color creation activity logged successfully" (should appear now)');
      console.log('- No more "undefined" errors');
      
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
          console.log('✅ SUCCESS: Color creation activities found!');
          console.log('Recent color creation activities:');
          colorActivities.forEach((activity, index) => {
            console.log(`${index + 1}. ${activity.title} - ${activity.targetName}`);
            console.log(`   Description: ${activity.description}`);
            console.log(`   Created: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
          });
        } else {
          console.log('❌ Still no color creation activities found');
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
window.testColorCreationFix = testColorCreationFix;

console.log('Test function loaded! Use:');
console.log('- testColorCreationFix() - Test the color creation fix');

// Auto-run the test
testColorCreationFix();
