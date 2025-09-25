// Test script for draft product workflow
// This demonstrates the new draft product functionality

console.log('🧪 Testing Draft Product Workflow...');

// Test 1: Create a draft product
async function testCreateDraftProduct() {
  console.log('📝 Test 1: Creating draft product...');
  
  const draftProductData = {
    name: 'Test Draft Product',
    description: 'This is a test draft product',
    shortDescription: 'Test draft',
    categoryId: 'test-category-id',
    price: 99.99,
    stockQuantity: 10,
    sku: 'TEST-DRAFT-001',
    status: 'draft',
    isCustomizable: false,
    isDigital: false,
    tags: ['test', 'draft'],
    specifications: {},
    seoTitle: 'Test Draft Product',
    seoDescription: 'A test draft product for testing'
  };

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftProductData),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Draft product created successfully:', data.product.id);
      return data.product.id;
    } else {
      const error = await response.json();
      console.error('❌ Failed to create draft product:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating draft product:', error);
    return null;
  }
}

// Test 2: Upload images to draft product
async function testUploadImagesToDraft(productId) {
  console.log('📸 Test 2: Uploading images to draft product...');
  
  if (!productId) {
    console.log('⏭️ Skipping image upload test - no product ID');
    return;
  }

  // Create a mock file for testing
  const mockFile = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('images', mockFile);

  try {
    const response = await fetch(`/api/products/${productId}/images`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Images uploaded successfully:', data.images.length);
    } else {
      const error = await response.json();
      console.error('❌ Failed to upload images:', error);
    }
  } catch (error) {
    console.error('❌ Error uploading images:', error);
  }
}

// Test 3: Publish draft product
async function testPublishDraft(productId) {
  console.log('🚀 Test 3: Publishing draft product...');
  
  if (!productId) {
    console.log('⏭️ Skipping publish test - no product ID');
    return;
  }

  try {
    const response = await fetch(`/api/products/${productId}/publish`, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Product published successfully:', data.product.status);
    } else {
      const error = await response.json();
      console.error('❌ Failed to publish product:', error);
    }
  } catch (error) {
    console.error('❌ Error publishing product:', error);
  }
}

// Run all tests
async function runTests() {
  console.log('🎯 Starting Draft Product Workflow Tests...\n');
  
  // Test 1: Create draft
  const productId = await testCreateDraftProduct();
  
  // Test 2: Upload images
  await testUploadImagesToDraft(productId);
  
  // Test 3: Publish
  await testPublishDraft(productId);
  
  console.log('\n🎉 All tests completed!');
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  window.testDraftWorkflow = runTests;
  console.log('💡 Run testDraftWorkflow() in the browser console to test the draft product workflow');
}

export { runTests, testCreateDraftProduct, testUploadImagesToDraft, testPublishDraft };
