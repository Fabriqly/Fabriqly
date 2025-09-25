// Test script to verify category update activity logging fix
// Run this in your browser console while logged in as admin

console.log('🧪 Testing Category Update Activity Fix...');

async function testCategoryUpdateFix() {
  try {
    console.log('1. Getting existing categories...');
    
    const categoriesResponse = await fetch('/api/categories');
    const categoriesData = await categoriesResponse.json();
    
    if (!categoriesResponse.ok || !categoriesData.categories || categoriesData.categories.length === 0) {
      console.error('❌ No categories found to test with');
      return;
    }
    
    const testCategory = categoriesData.categories[0];
    console.log('Using category for test:', testCategory.categoryName || testCategory.name);
    
    console.log('\n2. Updating category to test activity logging...');
    
    const updateData = {
      name: testCategory.categoryName || testCategory.name,
      description: `Updated description ${Date.now()}`,
      isActive: true
    };
    
    console.log('Update data:', updateData);
    
    const updateResponse = await fetch(`/api/categories/${testCategory.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    const updateResult = await updateResponse.json();
    
    if (updateResponse.ok) {
      console.log('✅ Category updated successfully');
      
      console.log('\n3. Check your server console for:');
      console.log('- "✅ Category update activity logged successfully" (should appear now)');
      console.log('- No more "undefined" errors');
      
      console.log('\n4. Waiting 3 seconds then checking activities...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const activitiesResponse = await fetch('/api/activities?limit=5');
      const activitiesData = await activitiesResponse.json();
      
      if (activitiesResponse.ok) {
        const categoryActivities = activitiesData.activities.filter(
          activity => activity.type === 'category_updated'
        );
        
        console.log(`Found ${categoryActivities.length} category update activities`);
        
        if (categoryActivities.length > 0) {
          console.log('✅ SUCCESS: Category update activities found!');
          console.log('Recent category update activities:');
          categoryActivities.forEach((activity, index) => {
            console.log(`${index + 1}. ${activity.title} - ${activity.targetName}`);
            console.log(`   Description: ${activity.description}`);
            console.log(`   Changed fields: ${activity.metadata?.changedFields?.join(', ') || 'N/A'}`);
            console.log(`   Created: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
          });
        } else {
          console.log('❌ Still no category update activities found');
        }
      }
      
    } else {
      console.error('❌ Category update failed:', updateResult.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function
window.testCategoryUpdateFix = testCategoryUpdateFix;

console.log('Test function loaded! Use:');
console.log('- testCategoryUpdateFix() - Test the category update fix');

// Auto-run the test
testCategoryUpdateFix();
