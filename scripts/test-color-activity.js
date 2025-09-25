// Test script to verify color operation activity logging
// Run this in your browser console while logged in as admin or business owner

console.log('🧪 Testing Color Operation Activity Logging...');

async function testColorCreationActivity() {
  try {
    console.log('1. Creating a test color...');
    
    const testColor = {
      colorName: `Test Color ${Date.now()}`,
      hexCode: '#FF5733',
      rgbCode: 'rgb(255, 87, 51)',
      isActive: true
    };

    const response = await fetch('/api/colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testColor),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Test color created successfully:', data.color.colorName);
      
      // Wait a moment for the activity to be logged
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('2. Checking for color creation activity...');
      const activitiesResponse = await fetch('/api/activities?limit=5');
      const activitiesData = await activitiesResponse.json();
      
      if (activitiesResponse.ok) {
        const colorActivity = activitiesData.activities.find(
          activity => activity.type === 'color_created' && activity.targetId === data.color.id
        );
        
        if (colorActivity) {
          console.log('✅ Color creation activity logged:', colorActivity.title);
          console.log('Activity details:', colorActivity);
          console.log('🎉 Color creation activity logging is working!');
          
          // Test color update
          console.log('3. Testing color update...');
          const updateResponse = await fetch(`/api/colors/${data.color.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              colorName: `Updated ${testColor.colorName}`,
              hexCode: '#33FF57'
            }),
          });
          
          if (updateResponse.ok) {
            console.log('✅ Color updated successfully');
            
            // Wait and check for update activity
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const updateActivitiesResponse = await fetch('/api/activities?limit=5');
            const updateActivitiesData = await updateActivitiesResponse.json();
            
            if (updateActivitiesResponse.ok) {
              const updateActivity = updateActivitiesData.activities.find(
                activity => activity.type === 'color_updated' && activity.targetId === data.color.id
              );
              
              if (updateActivity) {
                console.log('✅ Color update activity logged:', updateActivity.title);
                console.log('🎉 Color update activity logging is working!');
              } else {
                console.log('⚠️ Color update activity not found');
              }
            }
          }
          
          // Test color deletion
          console.log('4. Testing color deletion...');
          const deleteResponse = await fetch(`/api/colors/${data.color.id}`, {
            method: 'DELETE',
          });
          
          if (deleteResponse.ok) {
            console.log('✅ Color deleted successfully');
            
            // Wait and check for deletion activity
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const deleteActivitiesResponse = await fetch('/api/activities?limit=5');
            const deleteActivitiesData = await deleteActivitiesResponse.json();
            
            if (deleteActivitiesResponse.ok) {
              const deleteActivity = deleteActivitiesData.activities.find(
                activity => activity.type === 'color_deleted' && activity.targetId === data.color.id
              );
              
              if (deleteActivity) {
                console.log('✅ Color deletion activity logged:', deleteActivity.title);
                console.log('🎉 Color deletion activity logging is working!');
              } else {
                console.log('⚠️ Color deletion activity not found');
              }
            }
          } else {
            console.log('⚠️ Could not delete color (might be in use)');
          }
          
        } else {
          console.log('⚠️ Color creation activity not found');
          console.log('Recent activities:', activitiesData.activities.map(a => ({ type: a.type, title: a.title })));
        }
      } else {
        console.error('❌ Failed to fetch activities:', activitiesData.error);
      }
      
    } else {
      console.error('❌ Failed to create test color:', data.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Test function to check all recent activities
async function checkColorActivities() {
  try {
    console.log('📊 Checking all recent color activities...');
    
    const response = await fetch('/api/activities?limit=20');
    const data = await response.json();
    
    if (response.ok) {
      const colorActivities = data.activities.filter(activity => 
        activity.type.startsWith('color_')
      );
      
      console.log(`✅ Found ${colorActivities.length} color-related activities:`);
      
      colorActivities.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.title} - ${activity.type} (${activity.priority})`);
        console.log(`   Description: ${activity.description}`);
        console.log(`   Actor: ${activity.actor?.name || 'System'}`);
        console.log(`   Target: ${activity.target?.name || 'N/A'}`);
        console.log(`   Time: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
        console.log('');
      });
      
      if (colorActivities.length === 0) {
        console.log('No color activities found. Try creating a color first.');
      }
    } else {
      console.error('❌ Failed to fetch activities:', data.error);
    }
  } catch (error) {
    console.error('❌ Error checking activities:', error);
  }
}

// Export functions for manual testing
window.testColorCreationActivity = testColorCreationActivity;
window.checkColorActivities = checkColorActivities;

console.log('Test functions loaded! Use:');
console.log('- testColorCreationActivity()');
console.log('- checkColorActivities()');

// Auto-run the check
checkColorActivities();
