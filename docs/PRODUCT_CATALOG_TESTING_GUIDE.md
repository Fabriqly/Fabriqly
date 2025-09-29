# Product Catalog API Testing Guide

This guide provides comprehensive testing instructions for the Fabriqly product catalog system.

## 🚀 Quick Start Testing

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Access the Testing Dashboard
Open your browser and navigate to:
```
http://localhost:3000/test-product-catalog
```

### 3. Run Automated Tests
```bash
# Run all API tests
npm run test:api

# Run integration tests
npm run test:integration

# Run all catalog tests
npm run test:catalog
```

## 🧪 Manual Testing Methods

### Method 1: Web Interface Testing
1. **Navigate to the test page**: `http://localhost:3000/test-product-catalog`
2. **Use the interactive dashboard** with tabs for:
   - **Overview**: Quick actions and system status
   - **API Tests**: Individual endpoint testing
   - **Components**: React component testing
   - **Integration**: Complete workflow testing

### Method 2: Browser Testing
1. **Customer Experience**: `http://localhost:3000/products`
2. **Business Owner Dashboard**: `http://localhost:3000/dashboard/products`
3. **Admin Panel**: `http://localhost:3000/dashboard/admin/categories`

### Method 3: API Testing with curl

#### Test Categories API
```bash
# Get all categories
curl -X GET "http://localhost:3000/api/categories" \
  -H "Content-Type: application/json"

# Get specific category
curl -X GET "http://localhost:3000/api/categories/{categoryId}" \
  -H "Content-Type: application/json"
```

#### Test Products API
```bash
# Get all products
curl -X GET "http://localhost:3000/api/products" \
  -H "Content-Type: application/json"

# Get products with filters
curl -X GET "http://localhost:3000/api/products?search=test&isCustomizable=true&minPrice=10&maxPrice=100" \
  -H "Content-Type: application/json"

# Get specific product
curl -X GET "http://localhost:3000/api/products/{productId}" \
  -H "Content-Type: application/json"

# Create new product (requires authentication)
curl -X POST "http://localhost:3000/api/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Product",
    "description": "This is a test product",
    "shortDescription": "Test Product",
    "categoryId": "test-category-id",
    "price": 29.99,
    "stockQuantity": 10,
    "isCustomizable": true,
    "isDigital": false,
    "tags": ["test", "catalog"],
    "specifications": {
      "material": "Cotton",
      "size": "M"
    }
  }'

# Update product (requires authentication)
curl -X PUT "http://localhost:3000/api/products/{productId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Test Product",
    "price": 39.99
  }'

# Delete product (requires authentication)
curl -X DELETE "http://localhost:3000/api/products/{productId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Product Images API
```bash
# Get product images
curl -X GET "http://localhost:3000/api/products/{productId}/images" \
  -H "Content-Type: application/json"

# Upload product image (requires authentication)
curl -X POST "http://localhost:3000/api/products/{productId}/images" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "isPrimary=true" \
  -F "sortOrder=1"

# Update image details (requires authentication)
curl -X PUT "http://localhost:3000/api/products/{productId}/images/{imageId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "isPrimary": true,
    "sortOrder": 1
  }'

# Delete image (requires authentication)
curl -X DELETE "http://localhost:3000/api/products/{productId}/images/{imageId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Product Colors API
```bash
# Get product colors
curl -X GET "http://localhost:3000/api/products/{productId}/colors" \
  -H "Content-Type: application/json"

# Add product color (requires authentication)
curl -X POST "http://localhost:3000/api/products/{productId}/colors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Blue",
    "hexCode": "#0000FF",
    "isAvailable": true
  }'

# Update color (requires authentication)
curl -X PUT "http://localhost:3000/api/products/{productId}/colors/{colorId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "isAvailable": false
  }'

# Delete color (requires authentication)
curl -X DELETE "http://localhost:3000/api/products/{productId}/colors/{colorId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔍 Testing Scenarios

### Scenario 1: Customer Product Browsing
1. **Navigate to products page**: `/products`
2. **Test search functionality**: Search for "test" or "product"
3. **Test filtering**: Filter by category, price range, customizable products
4. **Test sorting**: Sort by name, price, date
5. **Test pagination**: Navigate through multiple pages
6. **Test product details**: Click on a product to view details

### Scenario 2: Business Owner Product Management
1. **Navigate to dashboard**: `/dashboard/products`
2. **Create new product**: Click "Create Product" button
3. **Fill product form**: Add name, description, price, category
4. **Upload images**: Test image upload functionality
5. **Add colors**: Test color variant management
6. **Edit product**: Modify existing product details
7. **Test product status**: Change product status (active/inactive)

### Scenario 3: Admin Category Management
1. **Navigate to admin panel**: `/dashboard/admin/categories`
2. **Create category**: Add new product category
3. **Edit category**: Modify category details
4. **Test hierarchy**: Create subcategories
5. **Test breadcrumbs**: Verify category navigation

### Scenario 4: API Error Handling
1. **Test invalid endpoints**: Try accessing non-existent endpoints
2. **Test authentication**: Try accessing protected endpoints without auth
3. **Test validation**: Submit invalid data to API endpoints
4. **Test rate limiting**: Make multiple rapid requests

## 🐛 Common Issues and Solutions

### Issue: "Cannot connect to API"
**Solution**: 
- Ensure the development server is running (`npm run dev`)
- Check that the server is running on the correct port (3000)
- Verify Firebase configuration in `.env.local`

### Issue: "Authentication required"
**Solution**:
- Make sure you're logged in as a business owner or admin
- Check that NextAuth is properly configured
- Verify session is active in browser dev tools

### Issue: "Category not found"
**Solution**:
- Create test categories first using the admin panel
- Use existing category IDs from the database
- Check category ID format and validity

### Issue: "Image upload fails"
**Solution**:
- Verify Firebase Storage is configured
- Check file size limits
- Ensure proper file format (jpg, png, etc.)
- Check Firebase Storage rules

### Issue: "Products not loading"
**Solution**:
- Check Firestore database connection
- Verify collection names match the code
- Check Firestore security rules
- Ensure proper indexing for queries

## 📊 Testing Checklist

### ✅ API Endpoints
- [ ] GET /api/categories
- [ ] GET /api/categories/{id}
- [ ] GET /api/products
- [ ] GET /api/products/{id}
- [ ] POST /api/products
- [ ] PUT /api/products/{id}
- [ ] DELETE /api/products/{id}
- [ ] GET /api/products/{id}/images
- [ ] POST /api/products/{id}/images
- [ ] PUT /api/products/{id}/images/{imageId}
- [ ] DELETE /api/products/{id}/images/{imageId}
- [ ] GET /api/products/{id}/colors
- [ ] POST /api/products/{id}/colors
- [ ] PUT /api/products/{id}/colors/{colorId}
- [ ] DELETE /api/products/{id}/colors/{colorId}

### ✅ Frontend Components
- [ ] ProductCatalog component renders
- [ ] ProductCard component displays correctly
- [ ] ProductDetail component shows all information
- [ ] ProductForm component validates input
- [ ] ProductList component manages products
- [ ] ImageUploader component uploads files
- [ ] CategorySelector component works
- [ ] ColorSelector component functions

### ✅ User Workflows
- [ ] Customer can browse products
- [ ] Customer can search and filter
- [ ] Customer can view product details
- [ ] Business owner can create products
- [ ] Business owner can edit products
- [ ] Business owner can manage images
- [ ] Business owner can manage colors
- [ ] Admin can manage categories

### ✅ Error Handling
- [ ] Invalid API requests return proper errors
- [ ] Missing authentication shows appropriate messages
- [ ] Network errors are handled gracefully
- [ ] Form validation works correctly
- [ ] File upload errors are displayed

## 🚀 Performance Testing

### Load Testing
```bash
# Test with multiple concurrent requests
for i in {1..10}; do
  curl -X GET "http://localhost:3000/api/products" &
done
wait
```

### Response Time Testing
```bash
# Measure response time
time curl -X GET "http://localhost:3000/api/products"
```

## 📝 Test Data Setup

### Create Test Categories
```bash
curl -X POST "http://localhost:3000/api/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Category",
    "slug": "test-category",
    "description": "A test category for testing",
    "isActive": true
  }'
```

### Create Test Products
Use the test product data provided in the testing scripts or create your own test data following the Product interface structure.

## 🔧 Debugging Tips

1. **Check browser console** for JavaScript errors
2. **Check network tab** for failed API requests
3. **Check Firebase console** for database issues
4. **Use the test pages** for isolated component testing
5. **Check server logs** for backend errors
6. **Verify environment variables** are set correctly

## 📞 Getting Help

If you encounter issues during testing:
1. Check the console logs for error messages
2. Verify your Firebase configuration
3. Ensure all dependencies are installed
4. Check the documentation in `/docs/PRODUCT_CATALOG_SYSTEM.md`
5. Use the debug pages at `/test-auth`, `/debug-firebase`, etc.

