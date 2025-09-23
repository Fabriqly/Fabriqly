# Product Catalog Testing Workflow & Best Practices

## 🎯 Testing Philosophy

The Fabriqly product catalog system follows a comprehensive testing approach that covers:
- **Unit Testing**: Individual components and functions
- **Integration Testing**: API endpoints and database interactions  
- **End-to-End Testing**: Complete user workflows
- **Performance Testing**: Load and response time testing
- **Security Testing**: Authentication and authorization

## 📋 Pre-Testing Setup

### 1. Environment Preparation
```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Firebase credentials

# Start the development server
npm run dev
```

### 2. Database Setup
1. **Create Firestore collections**:
   - `products`
   - `productCategories` 
   - `productImages`
   - `productVariants`

2. **Set up Firebase Storage** for image uploads

3. **Configure Firestore security rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - readable by all, writable by business owners
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'business_owner' || 
         request.auth.token.role == 'admin');
    }
    
    // Categories - readable by all, writable by admin
    match /productCategories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
  }
}
```

### 3. Test Data Creation
```bash
# Run the test data setup script
node scripts/setup-test-data.js
```

## 🔄 Testing Workflow

### Phase 1: Development Testing (During Development)

#### 1.1 Component Testing
```bash
# Test individual components
npm run test:components

# Access component test page
http://localhost:3000/test-product-catalog
```

**What to test:**
- Component rendering
- Props handling
- State management
- Event handlers
- Error boundaries

#### 1.2 API Testing
```bash
# Test API endpoints
npm run test:api

# Manual API testing
curl -X GET "http://localhost:3000/api/products"
```

**What to test:**
- Endpoint availability
- Request/response format
- Error handling
- Authentication requirements
- Data validation

### Phase 2: Integration Testing (Feature Complete)

#### 2.1 Workflow Testing
```bash
# Run integration tests
npm run test:integration
```

**Test scenarios:**
1. **Customer Journey**:
   - Browse products → Search → Filter → View details
   - Test responsive design on mobile/tablet
   - Test accessibility features

2. **Business Owner Journey**:
   - Login → Dashboard → Create product → Upload images → Manage colors
   - Test form validation
   - Test file uploads

3. **Admin Journey**:
   - Login → Admin panel → Manage categories → View analytics

#### 2.2 Cross-Browser Testing
- **Chrome**: Latest version
- **Firefox**: Latest version  
- **Safari**: Latest version
- **Edge**: Latest version
- **Mobile browsers**: iOS Safari, Chrome Mobile

### Phase 3: Pre-Production Testing

#### 3.1 Performance Testing
```bash
# Load testing
npm run test:performance

# Response time testing
npm run test:response-time
```

**Metrics to monitor:**
- API response times (< 200ms)
- Page load times (< 2s)
- Image upload times (< 5s)
- Database query performance

#### 3.2 Security Testing
```bash
# Security scan
npm run test:security
```

**Security checks:**
- Authentication bypass attempts
- Authorization testing
- Input validation
- XSS prevention
- CSRF protection

### Phase 4: Production Testing

#### 4.1 Smoke Testing
```bash
# Quick production health check
npm run test:smoke
```

**Critical paths:**
- Homepage loads
- Product catalog loads
- Search works
- User can register/login

#### 4.2 Monitoring Setup
- **Error tracking**: Sentry or similar
- **Performance monitoring**: Web Vitals
- **Uptime monitoring**: Pingdom or similar
- **Database monitoring**: Firebase console

## 🛠 Testing Tools & Commands

### Automated Testing Scripts

#### API Testing
```bash
# Test all API endpoints
npm run test:api

# Test specific endpoint
node scripts/test-api.js --endpoint="/api/products"

# Test with custom base URL
TEST_BASE_URL="https://staging.fabriqly.com" npm run test:api
```

#### Integration Testing
```bash
# Test complete workflows
npm run test:integration

# Test specific workflow
node scripts/test-integration.js --workflow="customer"
```

#### Component Testing
```bash
# Test React components
npm run test:components

# Test specific component
npm run test:components -- --component="ProductCatalog"
```

### Manual Testing Tools

#### Browser DevTools Testing
1. **Console Testing**:
```javascript
// Test API calls in browser console
fetch('/api/products')
  .then(response => response.json())
  .then(data => console.log(data));

// Test component state
window.React = require('react');
// Access component instances for testing
```

2. **Network Testing**:
- Monitor API requests
- Test offline scenarios
- Simulate slow connections
- Test with throttled bandwidth

3. **Responsive Testing**:
- Test different screen sizes
- Test touch interactions
- Test mobile-specific features

## 📊 Testing Metrics & KPIs

### Performance Metrics
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 200ms
- **Time to Interactive**: < 3 seconds
- **First Contentful Paint**: < 1.5 seconds

### Quality Metrics
- **Test Coverage**: > 80%
- **Bug Escape Rate**: < 5%
- **Critical Bug Count**: 0
- **User Acceptance Rate**: > 95%

### User Experience Metrics
- **Task Completion Rate**: > 90%
- **Error Rate**: < 2%
- **User Satisfaction Score**: > 4.5/5
- **Support Ticket Volume**: < 1% of users

## 🐛 Bug Reporting & Tracking

### Bug Report Template
```markdown
## Bug Report

### Environment
- **Browser**: Chrome 120.0
- **OS**: Windows 11
- **Device**: Desktop
- **Screen Resolution**: 1920x1080

### Steps to Reproduce
1. Navigate to /products
2. Click on "Filter" button
3. Select "Customizable" checkbox
4. Click "Apply Filters"

### Expected Behavior
Products should be filtered to show only customizable items.

### Actual Behavior
All products are still displayed.

### Additional Information
- Console errors: None
- Network requests: All successful
- Screenshots: [Attach if relevant]
```

### Bug Priority Levels
- **P0 - Critical**: System down, data loss, security breach
- **P1 - High**: Core functionality broken
- **P2 - Medium**: Feature not working as expected
- **P3 - Low**: Minor UI issues, enhancements

## 🔧 Debugging Strategies

### 1. Frontend Debugging
```javascript
// Add debug logging
console.log('Product data:', products);
console.log('Filter state:', filters);

// Use React DevTools
// Install React Developer Tools browser extension

// Test component isolation
import { ProductCard } from '@/components/products/ProductCard';
// Test with mock data
```

### 2. Backend Debugging
```javascript
// Add API logging
console.log('Request body:', body);
console.log('User session:', session);

// Test database queries
const products = await FirebaseAdminService.queryDocuments(
  Collections.PRODUCTS,
  constraints
);
console.log('Query result:', products);
```

### 3. Database Debugging
- Use Firebase Console to inspect data
- Check Firestore security rules
- Monitor database performance
- Review query patterns

## 📈 Continuous Testing

### Automated Testing Pipeline
```yaml
# .github/workflows/test.yml
name: Product Catalog Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:api
      - run: npm run test:integration
      - run: npm run build
```

### Testing Schedule
- **Daily**: Automated API tests
- **Weekly**: Full integration test suite
- **Before Release**: Complete testing workflow
- **Post-Deployment**: Smoke tests

## 🎓 Testing Best Practices

### 1. Test Data Management
- Use consistent test data
- Clean up test data after tests
- Use factories for test data generation
- Separate test and production data

### 2. Test Environment Isolation
- Use separate Firebase project for testing
- Mock external services
- Use environment variables for configuration
- Isolate test databases

### 3. Test Documentation
- Document test scenarios
- Keep test data up to date
- Document known issues
- Maintain testing checklists

### 4. Team Collaboration
- Share test results
- Document testing procedures
- Train team members on testing tools
- Regular testing reviews

## 🚀 Advanced Testing Scenarios

### Load Testing
```bash
# Test with multiple concurrent users
npm run test:load -- --users=100 --duration=300s
```

### Stress Testing
```bash
# Test system limits
npm run test:stress -- --max-users=500
```

### Chaos Testing
```bash
# Test system resilience
npm run test:chaos -- --failures=network,db
```

## 📚 Resources & References

### Documentation
- [Product Catalog System Documentation](./PRODUCT_CATALOG_SYSTEM.md)
- [API Testing Guide](./PRODUCT_CATALOG_TESTING_GUIDE.md)
- [Firebase Setup Guide](./FIREBASE_SETUP.md)

### Tools
- **Testing Framework**: Custom scripts + Jest (if added)
- **API Testing**: Custom scripts + curl
- **Performance Testing**: Lighthouse + custom scripts
- **Monitoring**: Firebase Analytics + custom metrics

### External Resources
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)
- [Firebase Testing Guide](https://firebase.google.com/docs/test-lab)
- [React Testing Best Practices](https://react.dev/learn/testing)

---

## 🎯 Quick Testing Checklist

### Before Each Release
- [ ] All API endpoints tested
- [ ] All user workflows tested
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Accessibility requirements met
- [ ] Error handling verified
- [ ] Data validation tested
- [ ] Authentication/authorization tested

### Daily Testing
- [ ] Smoke tests pass
- [ ] Critical user paths work
- [ ] API endpoints respond correctly
- [ ] No critical errors in logs
- [ ] Performance metrics within limits

This comprehensive testing workflow ensures the Fabriqly product catalog system maintains high quality and reliability across all user scenarios and system conditions.

