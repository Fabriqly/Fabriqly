# Design Management System - Testing Guide

## 🧪 **Testing Overview**

This guide covers comprehensive testing for the Design Management system, including API endpoints, frontend components, and user workflows.

## 📋 **Prerequisites**

### **Environment Setup**
```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local

# Required environment variables:
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Test Data Setup**
```bash
# Run the development server
npm run dev

# Create test users with different roles
# Use the admin script to create test accounts
node scripts/create-admin-account.js
```

## 🔧 **API Testing**

### **1. Design CRUD Operations**

#### **Create Design**
```bash
# Test design creation
curl -X POST http://localhost:3000/api/designs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "designName": "Test Design",
    "description": "A test design for testing purposes",
    "categoryId": "category-id",
    "designFileUrl": "https://example.com/design.png",
    "thumbnailUrl": "https://example.com/thumbnail.png",
    "designType": "template",
    "fileFormat": "png",
    "tags": ["test", "design"],
    "isPublic": true,
    "pricing": {
      "isFree": true,
      "currency": "USD"
    }
  }'
```

#### **Get Designs**
```bash
# Get all designs
curl http://localhost:3000/api/designs

# Get designs with filters
curl "http://localhost:3000/api/designs?categoryId=cat1&isFree=true&limit=10"

# Get specific design
curl http://localhost:3000/api/designs/DESIGN_ID
```

#### **Update Design**
```bash
curl -X PUT http://localhost:3000/api/designs/DESIGN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "designName": "Updated Design Name",
    "description": "Updated description"
  }'
```

#### **Delete Design**
```bash
curl -X DELETE http://localhost:3000/api/designs/DESIGN_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **2. Design Interactions**

#### **Download Design**
```bash
curl -X POST http://localhost:3000/api/designs/DESIGN_ID/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Like Design**
```bash
curl -X POST http://localhost:3000/api/designs/DESIGN_ID/like \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Unlike Design**
```bash
curl -X DELETE http://localhost:3000/api/designs/DESIGN_ID/like \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Design Collections**

#### **Get Popular Designs**
```bash
curl http://localhost:3000/api/designs/popular?limit=10
```

#### **Get Featured Designs**
```bash
curl http://localhost:3000/api/designs/featured?limit=10
```

#### **Get Free Designs**
```bash
curl http://localhost:3000/api/designs/free?limit=10
```

#### **Get Design Stats**
```bash
curl http://localhost:3000/api/designs/stats?designerId=DESIGNER_ID
```

## 🎨 **Frontend Testing**

### **1. Design Catalog Page**

#### **Test URL**: `http://localhost:3000/designs`

**Test Cases:**
1. **Page Load**
   - [ ] Page loads without errors
   - [ ] Featured designs section displays
   - [ ] Popular designs section displays
   - [ ] Free designs section displays

2. **Search Functionality**
   - [ ] Search input accepts text
   - [ ] Search results filter correctly
   - [ ] Empty search shows all designs
   - [ ] Invalid search shows "no results"

3. **Filtering**
   - [ ] Category filter works
   - [ ] Design type filter works
   - [ ] Price filter works (free/paid)
   - [ ] Featured filter works
   - [ ] Multiple filters can be combined

4. **Sorting**
   - [ ] Sort by newest works
   - [ ] Sort by popular works
   - [ ] Sort by most viewed works
   - [ ] Sort by most liked works
   - [ ] Sort order toggles correctly

5. **View Modes**
   - [ ] Grid view displays correctly
   - [ ] List view displays correctly
   - [ ] View toggle works

### **2. Design Detail Page**

#### **Test URL**: `http://localhost:3000/designs/[DESIGN_ID]`

**Test Cases:**
1. **Page Load**
   - [ ] Design details display correctly
   - [ ] Images load properly
   - [ ] Designer information shows
   - [ ] Tags display correctly

2. **Image Gallery**
   - [ ] Main image displays
   - [ ] Thumbnail navigation works
   - [ ] Image switching works
   - [ ] Fallback for missing images

3. **Interactions**
   - [ ] Download button works (for authenticated users)
   - [ ] Like button works
   - [ ] Share functionality works
   - [ ] View count increments

4. **Responsive Design**
   - [ ] Mobile layout works
   - [ ] Tablet layout works
   - [ ] Desktop layout works

### **3. Designer Dashboard**

#### **Test URL**: `http://localhost:3000/dashboard/designs`

**Test Cases:**
1. **Authentication**
   - [ ] Redirects to login if not authenticated
   - [ ] Shows unauthorized for non-designers
   - [ ] Allows access for designers and admins

2. **Dashboard Content**
   - [ ] Stats cards display correctly
   - [ ] Design list shows user's designs
   - [ ] Search works for own designs
   - [ ] View modes work

3. **Design Management**
   - [ ] Upload new design form opens
   - [ ] Edit design form opens
   - [ ] Delete confirmation works
   - [ ] Form validation works

4. **Stats Display**
   - [ ] Total designs count is correct
   - [ ] Total views count is correct
   - [ ] Total downloads count is correct
   - [ ] Total likes count is correct

## 🔐 **Authentication Testing**

### **1. Role-Based Access**

#### **Test with Different User Roles**

**Customer Role:**
- [ ] Can browse public designs
- [ ] Can view design details
- [ ] Can download free designs
- [ ] Can like designs
- [ ] Cannot access designer dashboard
- [ ] Cannot upload designs

**Designer Role:**
- [ ] Can access designer dashboard
- [ ] Can upload designs
- [ ] Can edit own designs
- [ ] Can delete own designs
- [ ] Cannot edit other designers' designs

**Admin Role:**
- [ ] Can access all features
- [ ] Can edit any design
- [ ] Can delete any design
- [ ] Can view all analytics

### **2. Authentication Flow**

**Test Cases:**
1. **Unauthenticated Access**
   - [ ] Public pages accessible
   - [ ] Protected pages redirect to login
   - [ ] API calls return 401 for protected endpoints

2. **Login Flow**
   - [ ] Login form works
   - [ ] Successful login redirects correctly
   - [ ] Failed login shows error

3. **Session Management**
   - [ ] Session persists across page reloads
   - [ ] Session expires appropriately
   - [ ] Logout works correctly

## 📁 **File Upload Testing**

### **1. File Validation**

**Test Cases:**
1. **Supported Formats**
   - [ ] PNG files upload successfully
   - [ ] JPG files upload successfully
   - [ ] SVG files upload successfully
   - [ ] PDF files upload successfully

2. **File Size Limits**
   - [ ] Files under 20MB upload successfully
   - [ ] Files over 20MB show error
   - [ ] Error message is clear

3. **File Type Validation**
   - [ ] Unsupported formats show error
   - [ ] Error message is clear
   - [ ] Upload button disabled for invalid files

### **2. Upload Process**

**Test Cases:**
1. **Upload Flow**
   - [ ] File selection works
   - [ ] Upload progress shows
   - [ ] Success message displays
   - [ ] Error handling works

2. **Multiple Files**
   - [ ] Thumbnail upload works
   - [ ] Preview upload works
   - [ ] Main design file upload works

## 🧪 **Automated Testing**

### **1. Unit Tests**

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- DesignService.test.ts
```

### **2. Integration Tests**

```bash
# Run integration tests
npm run test:integration

# Test API endpoints
npm run test:api
```

### **3. E2E Tests**

```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- designs.spec.ts
```

## 🐛 **Common Issues & Debugging**

### **1. File Upload Issues**

**Problem**: Files not uploading
**Solutions**:
- Check Supabase storage configuration
- Verify file size limits
- Check network connectivity
- Review browser console for errors

### **2. Authentication Issues**

**Problem**: 401 Unauthorized errors
**Solutions**:
- Check JWT token validity
- Verify user role permissions
- Check session expiration
- Review middleware configuration

### **3. Database Issues**

**Problem**: Data not saving/loading
**Solutions**:
- Check Firestore rules
- Verify collection names
- Check field validation
- Review error logs

### **4. Performance Issues**

**Problem**: Slow loading times
**Solutions**:
- Check image optimization
- Verify database indexes
- Review query performance
- Check network requests

## 📊 **Performance Testing**

### **1. Load Testing**

```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### **2. Image Optimization Testing**

**Test Cases:**
- [ ] Thumbnails load quickly
- [ ] Large images are optimized
- [ ] Lazy loading works
- [ ] Fallback images display

### **3. Database Performance**

**Test Cases:**
- [ ] Queries execute quickly
- [ ] Pagination works efficiently
- [ ] Filters don't cause timeouts
- [ ] Large datasets handle well

## 🔍 **Browser Testing**

### **1. Cross-Browser Compatibility**

**Test in:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### **2. Mobile Testing**

**Test on:**
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive design
- [ ] Touch interactions

### **3. Accessibility Testing**

**Test Cases:**
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast meets standards
- [ ] Alt text for images

## 📝 **Test Checklist**

### **Pre-Release Testing**

- [ ] All API endpoints tested
- [ ] Frontend components tested
- [ ] Authentication flows tested
- [ ] File upload tested
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness verified
- [ ] Performance benchmarks met
- [ ] Security vulnerabilities checked
- [ ] Error handling verified
- [ ] User experience validated

### **Post-Release Monitoring**

- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Monitor user feedback
- [ ] Check analytics data
- [ ] Monitor file storage usage
- [ ] Track database performance

## 🚀 **Deployment Testing**

### **1. Staging Environment**

```bash
# Deploy to staging
npm run build
npm run start

# Test all functionality
# Verify environment variables
# Check external service connections
```

### **2. Production Deployment**

```bash
# Deploy to production
npm run build:prod
npm run start:prod

# Monitor deployment
# Check health endpoints
# Verify all services running
```

This comprehensive testing guide ensures the Design Management system is thoroughly tested and ready for production use.
