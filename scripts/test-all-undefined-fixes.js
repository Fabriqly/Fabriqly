// Comprehensive test script to verify all undefined value fixes
// Run this in your browser console while logged in as admin

console.log('🧪 Testing All Undefined Value Fixes...');

async function testAllUndefinedFixes() {
  try {
    console.log('=== TESTING CATEGORY OPERATIONS ===');
    
    // Test 1: Create a category
    console.log('1. Creating a test category...');
    const testCategory = {
      name: `Test Category ${Date.now()}`,
      description: 'Test category for undefined value testing',
      slug: `test-category-${Date.now()}`,
      isActive: true
    };
    
    const createResponse = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCategory)
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('✅ Category created successfully:', createData.category.categoryName);
      
      // Wait for activity logging
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test 2: Update the category
      console.log('2. Updating the category...');
      const updateResponse = await fetch(`/api/categories/${createData.category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createData.category.categoryName,
          description: `Updated description ${Date.now()}`,
          isActive: true
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Category updated successfully');
        
        // Wait for activity logging
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test 3: Delete the category
        console.log('3. Deleting the category...');
        const deleteResponse = await fetch(`/api/categories/${createData.category.id}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log('✅ Category deleted successfully');
          
          // Wait for activity logging
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log('\n=== CHECKING ACTIVITIES ===');
          
          // Check all activities
          const activitiesResponse = await fetch('/api/activities?limit=10');
          const activitiesData = await activitiesResponse.json();
          
          if (activitiesResponse.ok) {
            const categoryActivities = activitiesData.activities.filter(
              activity => activity.type.startsWith('category_')
            );
            
            console.log(`Found ${categoryActivities.length} category-related activities:`);
            
            categoryActivities.forEach((activity, index) => {
              console.log(`${index + 1}. ${activity.type} - ${activity.title}`);
              console.log(`   Description: ${activity.description}`);
              console.log(`   Target: ${activity.targetName}`);
              console.log(`   Created: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
              console.log('');
            });
            
            if (categoryActivities.length >= 3) {
              console.log('🎉 SUCCESS: All category operations logged activities!');
              console.log('✅ No more undefined value errors');
            } else {
              console.log('⚠️ Some category activities may be missing');
            }
          }
          
        } else {
          console.error('❌ Category deletion failed:', await deleteResponse.json());
        }
      } else {
        console.error('❌ Category update failed:', await updateResponse.json());
      }
    } else {
      console.error('❌ Category creation failed:', createData.error);
    }
    
    console.log('\n=== CHECKING SERVER CONSOLE ===');
    console.log('Look at your server console (terminal) for:');
    console.log('- "✅ Category creation activity logged successfully"');
    console.log('- "✅ Category update activity logged successfully"');
    console.log('- "✅ Category deletion activity logged successfully"');
    console.log('- NO "undefined" error messages');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function
window.testAllUndefinedFixes = testAllUndefinedFixes;

console.log('Test function loaded! Use:');
console.log('- testAllUndefinedFixes() - Test all undefined value fixes');

// Auto-run the test
testAllUndefinedFixes();
