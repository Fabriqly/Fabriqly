// Test script to create multiple activities for pagination testing
// Run this in your browser console while logged in as admin

console.log('🧪 Creating Test Activities for Pagination...');

async function createTestActivities() {
  try {
    console.log('Creating test activities to test pagination...');
    
    const testActivities = [];
    
    // Create test categories
    for (let i = 1; i <= 15; i++) {
      const categoryData = {
        name: `Test Category ${i}`,
        description: `Test category ${i} for pagination testing`,
        slug: `test-category-${i}`,
        isActive: true
      };
      
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
          const data = await response.json();
          testActivities.push(`Category: ${data.category.categoryName}`);
          console.log(`✅ Created category ${i}: ${data.category.categoryName}`);
          
          // Wait a bit between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          const error = await response.json();
          console.log(`⚠️ Failed to create category ${i}:`, error.error);
        }
      } catch (error) {
        console.log(`❌ Error creating category ${i}:`, error.message);
      }
    }
    
    console.log(`\n✅ Created ${testActivities.length} test activities`);
    console.log('Activities created:', testActivities);
    
    console.log('\nNow test the pagination:');
    console.log('1. Go to /dashboard/admin/activities');
    console.log('2. You should now see more than 10 activities');
    console.log('3. Test the pagination controls:');
    console.log('   - Change page size to 10, 20, 50');
    console.log('   - Click Next/Previous buttons');
    console.log('   - Click page numbers');
    
    // Test pagination API directly
    console.log('\n4. Testing pagination API:');
    
    const page1Response = await fetch('/api/activities?limit=10&offset=0');
    const page1Data = await page1Response.json();
    
    if (page1Response.ok) {
      console.log('Page 1 (10 activities):', page1Data.activities.length);
      console.log('Total activities:', page1Data.pagination?.total);
      console.log('Has more:', page1Data.pagination?.hasMore);
    }
    
    const page2Response = await fetch('/api/activities?limit=10&offset=10');
    const page2Data = await page2Response.json();
    
    if (page2Response.ok) {
      console.log('Page 2 (10 activities):', page2Data.activities.length);
      console.log('Total activities:', page2Data.pagination?.total);
      console.log('Has more:', page2Data.pagination?.hasMore);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Function to clean up test activities
async function cleanupTestActivities() {
  try {
    console.log('🧹 Cleaning up test activities...');
    
    // Get all categories
    const response = await fetch('/api/categories');
    const data = await response.json();
    
    if (response.ok) {
      const testCategories = data.categories.filter(cat => 
        cat.categoryName?.startsWith('Test Category')
      );
      
      console.log(`Found ${testCategories.length} test categories to delete`);
      
      for (const category of testCategories) {
        try {
          const deleteResponse = await fetch(`/api/categories/${category.id}`, {
            method: 'DELETE'
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ Deleted: ${category.categoryName}`);
          }
        } catch (error) {
          console.log(`❌ Failed to delete: ${category.categoryName}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Export functions
window.createTestActivities = createTestActivities;
window.cleanupTestActivities = cleanupTestActivities;

console.log('Test functions loaded! Use:');
console.log('- createTestActivities() - Create test activities for pagination');
console.log('- cleanupTestActivities() - Clean up test activities');

// Auto-run the test
createTestActivities();

