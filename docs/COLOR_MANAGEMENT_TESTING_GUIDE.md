# Color Management Testing Guide

## 🧪 Testing the Color Management System

This guide covers comprehensive testing of the color management features in Fabriqly.

## 📋 Quick Test Checklist

### ✅ Basic Functionality Tests

#### 1. **Admin Dashboard Access**
- [ ] Navigate to `/dashboard/admin/colors`
- [ ] Verify ColorManagement component loads
- [ ] Check that admin user can see all colors (global + custom)
- [ ] Verify business owner can only see global + their own colors

#### 2. **Color CRUD Operations**
- [ ] **Create Color**: Click "Add Color" button
  - [ ] Fill form with valid data (name, hex, rgb)
  - [ ] Verify color preview updates in real-time
  - [ ] Submit and check color appears in list
- [ ] **Edit Color**: Click edit button on existing color
  - [ ] Modify color properties
  - [ ] Verify changes are saved
- [ ] **Delete Color**: Click delete button
  - [ ] Confirm deletion dialog
  - [ ] Verify color is removed from list

#### 3. **Filtering & Search**
- [ ] **Search by Name**: Type color name in search box
- [ ] **Search by Hex**: Type hex code in search box
- [ ] **Filter by Type**: Switch between "All", "Global", "Custom"
- [ ] **Show/Hide Inactive**: Toggle inactive colors visibility

#### 4. **Bulk Operations**
- [ ] **Select Individual Colors**: Check individual color checkboxes
- [ ] **Select All**: Use "Select All" checkbox
- [ ] **Bulk Delete**: Select multiple colors and delete
- [ ] **Verify Results**: Check success/error messages

### ✅ API Endpoint Tests

#### Test Individual Endpoints

```bash
# 1. Get all colors
curl -X GET "http://localhost:3000/api/colors" \
  -H "Content-Type: application/json"

# 2. Create a new color
curl -X POST "http://localhost:3000/api/colors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "colorName": "Test Red",
    "hexCode": "#FF0000",
    "rgbCode": "rgb(255, 0, 0)",
    "isActive": true
  }'

# 3. Get specific color
curl -X GET "http://localhost:3000/api/colors/COLOR_ID" \
  -H "Content-Type: application/json"

# 4. Update color
curl -X PUT "http://localhost:3000/api/colors/COLOR_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "colorName": "Updated Red",
    "hexCode": "#FF0000",
    "rgbCode": "rgb(255, 0, 0)",
    "isActive": false
  }'

# 5. Delete color
curl -X DELETE "http://localhost:3000/api/colors/COLOR_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Bulk Operations

```bash
# Bulk create colors
curl -X POST "http://localhost:3000/api/colors/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "colors": [
      {
        "colorName": "Bulk Blue",
        "hexCode": "#0000FF",
        "rgbCode": "rgb(0, 0, 255)"
      },
      {
        "colorName": "Bulk Green",
        "hexCode": "#00FF00",
        "rgbCode": "rgb(0, 255, 0)"
      }
    ]
  }'

# Bulk delete colors
curl -X DELETE "http://localhost:3000/api/colors/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "colorIds": ["COLOR_ID_1", "COLOR_ID_2"]
  }'
```

### ✅ Product-Color Integration Tests

#### Test Product Color Assignment

```bash
# 1. Get product colors
curl -X GET "http://localhost:3000/api/products/PRODUCT_ID/colors" \
  -H "Content-Type: application/json"

# 2. Add color to product
curl -X POST "http://localhost:3000/api/products/PRODUCT_ID/colors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "colorId": "COLOR_ID",
    "priceAdjustment": 5.00,
    "isAvailable": true,
    "stockQuantity": 100
  }'

# 3. Remove specific color from product
curl -X DELETE "http://localhost:3000/api/products/PRODUCT_ID/colors/COLOR_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Remove all colors from product
curl -X DELETE "http://localhost:3000/api/products/PRODUCT_ID/colors" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🛠️ Test Utilities

### Manual Testing Script

Create a simple test script to verify functionality:

```javascript
// test-color-management.js
const testColorManagement = async () => {
  console.log('🧪 Testing Color Management System...');
  
  // Test 1: Load colors
  try {
    const response = await fetch('/api/colors');
    const data = await response.json();
    console.log('✅ Colors loaded:', data.colors.length, 'colors found');
  } catch (error) {
    console.error('❌ Failed to load colors:', error);
  }
  
  // Test 2: Create test color
  try {
    const testColor = {
      colorName: 'Test Color',
      hexCode: '#FF5733',
      rgbCode: 'rgb(255, 87, 51)',
      isActive: true
    };
    
    const response = await fetch('/api/colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testColor)
    });
    
    if (response.ok) {
      console.log('✅ Test color created successfully');
    } else {
      console.error('❌ Failed to create test color');
    }
  } catch (error) {
    console.error('❌ Error creating test color:', error);
  }
};

// Run tests
testColorManagement();
```

## 🔍 Error Scenarios to Test

### Validation Errors
- [ ] **Empty Fields**: Try creating color with missing name/hex/rgb
- [ ] **Invalid Hex**: Try hex codes like "#GGGGGG", "FF0000", "#FF00"
- [ ] **Invalid RGB**: Try rgb codes like "rgb(300,0,0)", "rgb(0,0)"
- [ ] **Duplicate Names**: Try creating colors with existing names
- [ ] **Duplicate Hex**: Try creating colors with existing hex codes

### Permission Errors
- [ ] **Unauthorized Access**: Try API calls without authentication
- [ ] **Wrong Role**: Try admin operations as regular user
- [ ] **Ownership**: Try editing/deleting other users' colors as business owner

### Business Logic Errors
- [ ] **Delete Used Color**: Try deleting color that's assigned to products
- [ ] **Bulk Limits**: Try creating/deleting more than 50 colors at once
- [ ] **Non-existent Color**: Try operations on invalid color IDs

## 🎯 Frontend Testing

### Browser Testing
1. **Open Developer Tools** (F12)
2. **Navigate to** `/dashboard/admin/colors`
3. **Check Console** for any JavaScript errors
4. **Test Interactions**:
   - Click buttons and verify responses
   - Fill forms and check validation
   - Test drag-and-drop if applicable
   - Verify responsive design on different screen sizes

### UI/UX Testing
- [ ] **Loading States**: Verify loading spinners appear
- [ ] **Empty States**: Test with no colors
- [ ] **Error Messages**: Verify error messages are user-friendly
- [ ] **Success Feedback**: Check success notifications
- [ ] **Accessibility**: Test with keyboard navigation

## 📊 Performance Testing

### Load Testing
```bash
# Test with many colors
for i in {1..100}; do
  curl -X POST "http://localhost:3000/api/colors" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d "{
      \"colorName\": \"Test Color $i\",
      \"hexCode\": \"#$(printf '%06X' $((RANDOM % 16777216)))\",
      \"rgbCode\": \"rgb($((RANDOM % 256)), $((RANDOM % 256)), $((RANDOM % 256)))\"
    }"
done
```

## 🚀 Production Testing

### Pre-deployment Checklist
- [ ] **Database Migration**: Ensure color collections exist
- [ ] **Environment Variables**: Verify Firebase configuration
- [ ] **Permissions**: Check user roles and permissions
- [ ] **Error Handling**: Test all error scenarios
- [ ] **Performance**: Test with realistic data volumes

### Post-deployment Verification
- [ ] **Smoke Test**: Basic functionality works
- [ ] **Integration Test**: Colors work with products
- [ ] **User Acceptance**: Test with real users
- [ ] **Monitoring**: Check logs for errors

## 📝 Test Results Template

```
## Color Management Test Results

**Date:** [DATE]
**Tester:** [NAME]
**Environment:** [DEV/STAGING/PROD]

### ✅ Passed Tests
- [ ] Admin dashboard loads
- [ ] Color CRUD operations work
- [ ] Filtering and search work
- [ ] Bulk operations work
- [ ] API endpoints respond correctly

### ❌ Failed Tests
- [ ] [DESCRIPTION OF FAILURE]

### 🐛 Bugs Found
- [ ] [BUG DESCRIPTION]

### 📈 Performance Notes
- [ ] [PERFORMANCE OBSERVATIONS]

### 💡 Recommendations
- [ ] [IMPROVEMENT SUGGESTIONS]
```

## 🆘 Troubleshooting

### Common Issues

1. **Colors not loading**
   - Check Firebase connection
   - Verify user authentication
   - Check browser console for errors

2. **Permission errors**
   - Verify user role in session
   - Check API authentication headers
   - Ensure proper user permissions

3. **Form validation errors**
   - Check hex code format (#RRGGBB)
   - Verify RGB format (rgb(r,g,b))
   - Ensure color name is unique

4. **Bulk operations failing**
   - Check request size limits
   - Verify all color IDs exist
   - Check for usage conflicts

### Debug Commands

```bash
# Check Firebase connection
npm run firebase:test

# Check API endpoints
npm run test:api

# Check database collections
firebase firestore:get colors --limit 5
```

---

**Need Help?** Check the console logs, verify your authentication, and ensure all dependencies are properly installed.
