# Order System Testing Guide

## 🎯 Overview

This comprehensive guide covers testing the complete order system including:
- Shopping cart functionality
- Checkout process
- Order management
- Status tracking
- API endpoints
- Frontend components

## 📋 Prerequisites

- Node.js and npm installed
- Firebase project configured
- Next.js development server running
- Test user accounts with different roles

## 🔧 Setup Test Environment

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Run Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:api
npm run test:components
npm run test:services
npm run test:repositories

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 🧪 Test Categories

### 1. Unit Tests

#### Service Layer Tests
```bash
npm run test:services
```

**Files tested:**
- `src/services/__tests__/OrderService.test.ts`
- `src/repositories/__tests__/OrderRepository.test.ts`

**What's tested:**
- Order creation and validation
- Status transitions
- Permission checks
- Data filtering and search
- Error handling

#### Component Tests
```bash
npm run test:components
```

**Files tested:**
- `src/components/__tests__/cart/CartContext.test.tsx`
- `src/components/__tests__/cart/AddToCartButton.test.tsx`

**What's tested:**
- Cart state management
- Add to cart functionality
- Component rendering
- User interactions
- Error states

### 2. API Tests

#### API Route Tests
```bash
npm run test:api
```

**Files tested:**
- `src/app/__tests__/api/orders.test.ts`
- `src/app/__tests__/api/orders/[id].test.ts`

**What's tested:**
- HTTP endpoints
- Request/response handling
- Authentication
- Error responses
- Data validation

### 3. Integration Tests

#### End-to-End Order System
```bash
npm run test:order-system
```

**What's tested:**
- Complete order workflow
- Cart to checkout process
- Order creation and management
- Status tracking
- Error handling
- Performance

## 🔄 Testing Workflows

### Phase 1: Development Testing

#### 1.1 Component Testing
```bash
# Test cart functionality
npm run test:components -- --testNamePattern="CartContext"

# Test add to cart button
npm run test:components -- --testNamePattern="AddToCartButton"
```

**Test scenarios:**
- Add items to cart
- Update quantities
- Remove items
- Clear cart
- Persist cart data
- Handle variants and colors

#### 1.2 Service Testing
```bash
# Test order service
npm run test:services -- --testNamePattern="OrderService"

# Test order repository
npm run test:repositories -- --testNamePattern="OrderRepository"
```

**Test scenarios:**
- Order creation
- Order updates
- Status transitions
- Permission validation
- Data filtering
- Error handling

### Phase 2: API Testing

#### 2.1 Endpoint Testing
```bash
# Test order endpoints
npm run test:api -- --testNamePattern="orders"
```

**Test scenarios:**
- GET /api/orders
- POST /api/orders
- GET /api/orders/[id]
- PUT /api/orders/[id]
- DELETE /api/orders/[id]
- PUT /api/orders/[id]/status
- GET /api/orders/[id]/tracking

#### 2.2 Authentication Testing
```bash
# Test authentication requirements
npm run test:api -- --testNamePattern="authentication"
```

**Test scenarios:**
- Unauthenticated access
- Role-based permissions
- Customer vs business owner access
- Admin privileges

### Phase 3: Integration Testing

#### 3.1 Complete Workflow
```bash
# Test complete order system
npm run test:order-system
```

**Test scenarios:**
1. **Cart Workflow:**
   - Add items to cart
   - Update quantities
   - Remove items
   - Clear cart

2. **Checkout Workflow:**
   - Fill shipping address
   - Select payment method
   - Create order
   - Receive confirmation

3. **Order Management:**
   - View order details
   - Track order status
   - Update order status
   - Cancel orders

4. **Status Tracking:**
   - Order status transitions
   - Tracking number updates
   - Delivery notifications

#### 3.2 Error Handling
```bash
# Test error scenarios
npm run test:order-system -- --test-error-handling
```

**Test scenarios:**
- Invalid order data
- Network failures
- Permission errors
- Status transition errors
- Payment failures

### Phase 4: Performance Testing

#### 4.1 Load Testing
```bash
# Test with multiple concurrent requests
npm run test:order-system -- --concurrent=10
```

**Metrics to monitor:**
- Response times (< 200ms)
- Throughput (requests/second)
- Memory usage
- Database query performance

#### 4.2 Stress Testing
```bash
# Test system limits
npm run test:order-system -- --stress-test
```

**Test scenarios:**
- High volume orders
- Large cart sizes
- Complex order data
- Concurrent users

## 🛠 Manual Testing Scenarios

### 1. Customer Journey

#### 1.1 Browse and Add to Cart
1. Navigate to products page
2. Browse products
3. Select product variants (size, color)
4. Add to cart
5. Verify cart count updates
6. Open cart sidebar
7. Verify items display correctly

#### 1.2 Cart Management
1. Update item quantities
2. Remove items
3. Clear cart
4. Verify cart persistence (refresh page)
5. Test with different products

#### 1.3 Checkout Process
1. Click "Proceed to Checkout"
2. Fill shipping address
3. Select payment method
4. Add order notes
5. Review order summary
6. Place order
7. Verify order confirmation

#### 1.4 Order Tracking
1. Navigate to orders page
2. View order details
3. Check order status
4. Track package (if shipped)
5. View order timeline

### 2. Business Owner Journey

#### 2.1 Order Management
1. Login as business owner
2. Navigate to orders
3. View customer orders
4. Update order status
5. Add tracking information
6. Communicate with customers

#### 2.2 Order Analytics
1. View order statistics
2. Check revenue reports
3. Monitor order trends
4. Export order data

### 3. Admin Journey

#### 3.1 System Management
1. Login as admin
2. View all orders
3. Manage order statuses
4. Handle disputes
5. Monitor system performance

## 📊 Test Data Management

### 1. Test Users
```javascript
// Test user accounts
const testUsers = {
  customer: {
    email: 'customer@test.com',
    password: 'password123',
    role: 'customer'
  },
  businessOwner: {
    email: 'business@test.com',
    password: 'password123',
    role: 'business_owner'
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  }
};
```

### 2. Test Products
```javascript
// Test product data
const testProducts = [
  {
    id: 'product-1',
    name: 'Test T-Shirt',
    price: 25.00,
    variants: [
      { name: 'size', values: ['S', 'M', 'L', 'XL'] },
      { name: 'color', values: ['red', 'blue', 'green'] }
    ]
  }
];
```

### 3. Test Orders
```javascript
// Test order data
const testOrder = {
  customerId: 'customer-1',
  businessOwnerId: 'business-1',
  items: [
    {
      productId: 'product-1',
      quantity: 2,
      price: 25.00,
      customizations: { size: 'M', color: 'red' }
    }
  ],
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'US',
    phone: '555-1234'
  },
  paymentMethod: 'card',
  shippingCost: 9.99
};
```

## 🚨 Common Issues and Solutions

### 1. Test Failures

#### Issue: Cart not persisting
**Solution:** Check localStorage mocking in test setup

#### Issue: API calls failing
**Solution:** Verify mock implementations and network requests

#### Issue: Component not rendering
**Solution:** Check React Testing Library setup and mocks

### 2. Performance Issues

#### Issue: Slow test execution
**Solution:** 
- Use `--runInBand` for sequential execution
- Mock external dependencies
- Use `--detectOpenHandles` to find hanging processes

#### Issue: Memory leaks
**Solution:**
- Clean up after tests
- Use `afterEach` and `afterAll` hooks
- Mock timers and intervals

### 3. Environment Issues

#### Issue: Firebase connection errors
**Solution:** Use Firebase emulators for testing

#### Issue: Next.js routing issues
**Solution:** Mock Next.js router in test setup

## 📈 Test Metrics and KPIs

### Coverage Targets
- **Unit Tests**: > 90% coverage
- **Integration Tests**: > 80% coverage
- **API Tests**: > 95% coverage
- **Component Tests**: > 85% coverage

### Performance Targets
- **API Response Time**: < 200ms
- **Test Execution Time**: < 30 seconds
- **Cart Operations**: < 100ms
- **Order Creation**: < 500ms

### Quality Targets
- **Test Pass Rate**: > 95%
- **Bug Escape Rate**: < 5%
- **Critical Issues**: 0
- **User Acceptance**: > 90%

## 🔧 Debugging Tests

### 1. Debug Mode
```bash
# Run tests in debug mode
npm run test -- --verbose --no-coverage

# Run specific test file
npm run test -- --testPathPattern="OrderService.test.ts"

# Run with debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### 2. Test Logs
```bash
# Enable detailed logging
DEBUG=* npm run test

# Log specific modules
DEBUG=jest* npm run test
```

### 3. Visual Debugging
```bash
# Run tests with UI
npm run test -- --watch --verbose
```

## 📚 Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)

### Tools
- **Testing Framework**: Jest + React Testing Library
- **API Testing**: Custom scripts + Jest
- **Performance Testing**: Custom load testing scripts
- **Coverage**: Jest coverage reports

### External Resources
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest Mocking Guide](https://jestjs.io/docs/mock-functions)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)
