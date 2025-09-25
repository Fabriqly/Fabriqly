// Test script to verify category deletion activity logging fix
// Run this in your browser console while logged in as admin

console.log('🧪 Testing Category Deletion Activity Fix...');

async function testCategoryDeletionFix() {
  try {
    console.log('1. Getting existing categories...');
    
    const categoriesResponse = await fetch('/api/categories');
    const categoriesData = await categoriesResponse.json();
    
    if (!categoriesResponse.ok || !categoriesData.categories || categoriesData.categories.length === 0) {
      console.error('❌ No categories found to test with');
      return;
    }
    
    // Find a category that can be deleted (no subcategories)
    const deletableCategory = categoriesData.categories.find(cat => 
      !cat.subcategories || cat.subcategories.length === 0
    );
    
    if (!deletableCategory) {
      console.log('⚠️ No deletable categories found (all have subcategories)');
      console.log('Creating a test category first...');
      
      // Create a test category
      const testCategory = {
        name: `Test Delete ${Date.now()}`,
        description: 'Test category for deletion',
        slug: `test-delete-${Date.now()}`,
        isActive: true
      };
      
      const createResponse = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCategory),
      });
      
      const createData = await createResponse.json();
      
      if (createResponse.ok) {
        console.log('✅ Test category created:', createData.category.categoryName);
        deletableCategory = createData.category;
      } else {
        console.error('❌ Failed to create test category:', createData.error);
        return;
      }
    }
    
    console.log('Using category for deletion test:', deletableCategory.categoryName || deletableCategory.name);
    
    console.log('\n2. Deleting category to test activity logging...');
    
    const deleteResponse = await fetch(`/api/categories/${deletableCategory.id}`, {
      method: 'DELETE',
    });
    
    const deleteResult = await deleteResponse.json();
    
    if (deleteResponse.ok) {
      console.log('✅ Category deleted successfully');
      
      console.log('\n3. Check your server console for:');
      console.log('- "✅ Category deletion activity logged successfully" (should appear now)');
      console.log('- No more "undefined" errors');
      
      console.log('\n4. Waiting 3 seconds then checking activities...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const activitiesResponse = await fetch('/api/activities?limit=5');
      const activitiesData = await activitiesResponse.json();
      
      if (activitiesResponse.ok) {
        const categoryActivities = activitiesData.activities.filter(
          activity => activity.type === 'category_deleted'
        );
        
        console.log(`Found ${categoryActivities.length} category deletion activities`);
        
        if (categoryActivities.length > 0) {
          console.log('✅ SUCCESS: Category deletion activities found!');
          console.log('Recent category deletion activities:');
          categoryActivities.forEach((activity, index) => {
            console.log(`${index + 1}. ${activity.title} - ${activity.targetName}`);
            console.log(`   Description: ${activity.description}`);
            console.log(`   Created: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
          });
        } else {
          console.log('❌ Still no category deletion activities found');
        }
      }
      
    } else {
      console.error('❌ Category deletion failed:', deleteResult.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function
window.testCategoryDeletionFix = testCategoryDeletionFix;

console.log('Test function loaded! Use:');
console.log('- testCategoryDeletionFix() - Test the category deletion fix');

// Auto-run the test
testCategoryDeletionFix();
