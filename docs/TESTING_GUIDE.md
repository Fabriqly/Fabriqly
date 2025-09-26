# Product System Testing Guide

## 🎯 Testing Overview
This guide covers testing the optimized product management system including API routes, components, and performance improvements.

## 📋 Prerequisites
- Node.js and npm installed
- Firebase project configured
- Next.js development server running
- Test user accounts with different roles (admin, business_owner, customer)

## 🔧 Setup Test Environment

### 1. Start Development Server
```bash
npm run dev
```

### 2. Create Test Data
```bash
# Run the test data script
node scripts/create-test-data.js
```

### 3. Login as Different User Types
- Admin user: Full access to all features
- Business Owner: Can create/edit/delete own products
- Customer: Read-only access

## 🧪 Manual Testing Scenarios

### **API Testing**

#### Test 1: Products List API Performance
**URL:** `GET /api/products`

**Test Cases:**
1. **Basic List**
   - Request: `GET /api/products`
   - Expected: Returns products with pagination
   - Check: Response time < 500ms

2. **Business Owner Filter**
   - Request: `GET /api/products?businessOwnerId=test-business-owner-id`
   - Expected: Only returns products for that business owner
   - Check: Uses proper Firestore constraints (not fetching all products)

3. **Search Functionality**
   - Request: `GET /api/products?search=t-shirt`
   - Expected: Returns products matching search term
   - Check: Search works across name, description, tags

4. **Category Filter**
   - Request: `GET /api/products?categoryId=test-category-id`
   - Expected: Returns products in that category
   - Check: Proper category filtering

5. **Price Range Filter**
   - Request: `GET /api/products?minPrice=10&maxPrice=50`
   - Expected: Returns products within price range
   - Check: Price filtering works correctly

6. **Combined Filters**
   - Request: `GET /api/products?categoryId=test&minPrice=20&isCustomizable=true`
   - Expected: Returns products matching all criteria
   - Check: Multiple filters work together

#### Test 2: Individual Product API
**URL:** `GET /api/products/[id]`

**Test Cases:**
1. **Valid Product**
   - Request: `GET /api/products/valid-product-id`
   - Expected: Returns product with full details (category, images, business owner)
   - Check: Caching works (second request should be faster)

2. **Invalid Product**
   - Request: `GET /api/products/invalid-id`
   - Expected: Returns 404 error
   - Check: Proper error handling

3. **Product with Images**
   - Request: `GET /api/products/product-with-images-id`
   - Expected: Returns product with image array
   - Check: Images are properly loaded and sorted

#### Test 3: Product Creation API
**URL:** `POST /api/products`

**Test Cases:**
1. **Valid Product Creation**
   ```json
   {
     "name": "Test Product",
     "description": "Test description",
     "categoryId": "valid-category-id",
     "price": 29.99,
     "stockQuantity": 10,
     "isCustomizable": true,
     "tags": ["test", "product"]
   }
   ```
   - Expected: Returns 201 with created product
   - Check: SKU is auto-generated, timestamps are set

2. **Invalid Data**
   ```json
   {
     "name": "",
     "description": "Test",
     "price": -10
   }
   ```
   - Expected: Returns 400 with validation errors
   - Check: Proper validation messages

3. **Duplicate SKU**
   ```json
   {
     "name": "Test Product 2",
     "description": "Test description",
     "categoryId": "valid-category-id",
     "price": 29.99,
     "sku": "existing-sku"
   }
   ```
   - Expected: Returns 400 with SKU duplicate error
   - Check: SKU uniqueness validation

4. **Unauthorized Access**
   - Request: POST without authentication
   - Expected: Returns 401 Unauthorized
   - Check: Proper authentication

#### Test 4: Product Update API
**URL:** `PUT /api/products/[id]`

**Test Cases:**
1. **Valid Update**
   ```json
   {
     "name": "Updated Product Name",
     "price": 39.99
   }
   ```
   - Expected: Returns updated product
   - Check: Only provided fields are updated

2. **Ownership Check**
   - Try updating product owned by different business owner
   - Expected: Returns 403 Forbidden
   - Check: Proper ownership validation

3. **Category Validation**
   ```json
   {
     "categoryId": "invalid-category-id"
   }
   ```
   - Expected: Returns 400 with category validation error
   - Check: Category existence validation

#### Test 5: Product Deletion API
**URL:** `DELETE /api/products/[id]`

**Test Cases:**
1. **Valid Deletion**
   - Request: DELETE with valid product ID
   - Expected: Returns success, product and related data deleted
   - Check: Cascade deletion works (images, colors deleted)

2. **Ownership Check**
   - Try deleting product owned by different business owner
   - Expected: Returns 403 Forbidden
   - Check: Proper ownership validation

### **Component Testing**

#### Test 6: ProductForm Component

**Test Cases:**
1. **Create Mode**
   - Navigate to `/dashboard/products/create`
   - Fill out form with valid data
   - Submit form
   - Expected: Product created successfully, redirected to products list

2. **Edit Mode**
   - Navigate to `/dashboard/products/edit/[id]`
   - Expected: Form pre-populated with existing data
   - Modify fields and submit
   - Expected: Product updated successfully

3. **Validation**
   - Submit form with empty required fields
   - Expected: Validation errors displayed
   - Check: User-friendly error messages

4. **Image Upload**
   - Upload images in edit mode
   - Expected: Images uploaded and displayed
   - Check: Image management works correctly

5. **Color Management**
   - Open color management section
   - Add/remove colors
   - Expected: Colors managed correctly
   - Check: Color changes persist

#### Test 7: ProductList Component

**Test Cases:**
1. **Product Display**
   - Navigate to `/dashboard/products`
   - Expected: Products displayed in grid/list view
   - Check: Proper loading states

2. **Search Functionality**
   - Use search bar to find products
   - Expected: Results filtered in real-time
   - Check: Debounced search works (no excessive API calls)

3. **Filtering**
   - Use category, price, status filters
   - Expected: Products filtered correctly
   - Check: Multiple filters work together

4. **Pagination**
   - Load more products
   - Expected: Additional products loaded
   - Check: Pagination works correctly

5. **View Modes**
   - Switch between grid and list view
   - Expected: Layout changes appropriately
   - Check: View mode persists

6. **Product Actions**
   - Edit product from list
   - Delete product from list
   - Expected: Actions work correctly
   - Check: Confirmation dialogs for destructive actions

### **Performance Testing**

#### Test 8: Caching Performance

**Test Cases:**
1. **Category Caching**
   - Load products list multiple times
   - Expected: Second load should be faster
   - Check: Categories cached and reused

2. **Image Caching**
   - Load individual product multiple times
   - Expected: Images cached after first load
   - Check: Faster subsequent loads

3. **Cache Invalidation**
   - Create/update/delete product
   - Load products list
   - Expected: Cache cleared, fresh data loaded
   - Check: Cache invalidation works

#### Test 9: Query Performance

**Test Cases:**
1. **Business Owner Query**
   - Load products for specific business owner
   - Expected: Uses proper Firestore constraints
   - Check: Not fetching all products (check network tab)

2. **Large Dataset**
   - Create 100+ test products
   - Load products list with filters
   - Expected: Performance remains good
   - Check: Response times < 1 second

## 🐛 Common Issues to Check

### **API Issues**
- [ ] CORS errors
- [ ] Authentication token issues
- [ ] Firebase permission errors
- [ ] Type validation errors
- [ ] Database connection issues

### **Component Issues**
- [ ] Form validation not working
- [ ] Image upload failures
- [ ] State management issues
- [ ] Memory leaks in components
- [ ] Infinite re-render loops

### **Performance Issues**
- [ ] Slow API responses
- [ ] Memory usage growing
- [ ] Cache not working
- [ ] Excessive database queries
- [ ] Large bundle sizes

## 📊 Performance Benchmarks

### **API Response Times**
- Products list: < 500ms
- Individual product: < 300ms
- Product creation: < 1s
- Product update: < 800ms
- Product deletion: < 600ms

### **Component Performance**
- Form loading: < 200ms
- Search debounce: 500ms delay
- Image upload: < 2s per image
- List rendering: < 100ms for 20 products

## 🔍 Debugging Tips

### **API Debugging**
1. Check browser network tab for API calls
2. Look for console errors in server logs
3. Verify Firebase rules and permissions
4. Check request/response payloads

### **Component Debugging**
1. Use React DevTools for state inspection
2. Check console for JavaScript errors
3. Verify props and state updates
4. Test with different user roles

### **Performance Debugging**
1. Use Chrome DevTools Performance tab
2. Monitor memory usage
3. Check bundle size with webpack-bundle-analyzer
4. Test with slow network conditions

## ✅ Testing Checklist

### **Functionality**
- [ ] All CRUD operations work
- [ ] Authentication and authorization work
- [ ] Form validation works
- [ ] Search and filtering work
- [ ] Image upload works
- [ ] Color management works

### **Performance**
- [ ] API responses are fast
- [ ] Caching works correctly
- [ ] Components render efficiently
- [ ] Memory usage is stable
- [ ] No memory leaks

### **User Experience**
- [ ] Loading states are shown
- [ ] Error messages are clear
- [ ] Forms are responsive
- [ ] Navigation works smoothly
- [ ] Mobile responsiveness

### **Security**
- [ ] Proper authentication required
- [ ] Authorization checks work
- [ ] Input validation prevents attacks
- [ ] Sensitive data not exposed
- [ ] CSRF protection works

## 🚀 Next Steps After Testing

1. **Fix any issues found**
2. **Optimize slow queries**
3. **Improve error handling**
4. **Add more test coverage**
5. **Document performance improvements**
6. **Deploy to staging environment**
7. **Conduct user acceptance testing**
8. **Deploy to production**

---

**Note:** This testing guide should be executed systematically to ensure all optimizations work correctly and performance improvements are realized.
