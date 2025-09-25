# Activity System Testing Commands

## 🚀 Quick Start Testing

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Admin Dashboard
Navigate to: http://localhost:3000/dashboard/admin

### 3. Generate Test Data (Browser Console)
```javascript
// Copy and paste this into browser console
fetch('/api/activities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'user_registered',
    title: 'Test User Registration',
    description: 'New user registered: test@example.com',
    priority: 'medium',
    actorId: 'test-user',
    targetId: 'test-user',
    targetType: 'user',
    targetName: 'test@example.com'
  })
})
.then(res => res.json())
.then(data => console.log('Created:', data));
```

### 4. Check Activities
```javascript
// Get activities
fetch('/api/activities?limit=5')
.then(res => res.json())
.then(data => console.log('Activities:', data));
```

## 🧪 Automated Testing

### Run API Tests
```bash
node scripts/test-activity-api.js
```

### Run Integration Tests
```bash
node scripts/test-activity-logger.js
```

### Run All Tests
```bash
# Run API tests
node scripts/test-activity-api.js

# Run integration tests  
node scripts/test-activity-logger.js

# Check browser console for manual tests
```

## 📋 Manual Testing Steps

### Step 1: Dashboard Testing
1. Go to http://localhost:3000/dashboard/admin
2. Look for "Recent Activity" section
3. Should show "No recent activity" initially
4. Click refresh button to test loading

### Step 2: Generate Test Activities
1. Open browser console (F12)
2. Run the test script from `scripts/test-activity-system.js`
3. Refresh dashboard to see activities

### Step 3: Activity Management Page
1. Click "Activities" in admin sidebar
2. Should load `/dashboard/admin/activities` page
3. Test search, filters, and pagination
4. Test export functionality

### Step 4: API Testing
1. Test all endpoints manually
2. Check error handling
3. Verify authentication requirements

## 🔍 What to Look For

### ✅ Success Indicators
- Recent Activity section appears on dashboard
- Activities display with correct icons and colors
- Activity management page loads and functions
- API endpoints return proper data
- Error handling works correctly

### ❌ Common Issues
- Authentication errors (need admin login)
- CORS issues (check API configuration)
- Missing data (check Firebase setup)
- Component not rendering (check imports)

## 📊 Test Results

### Dashboard Component
- [ ] Renders correctly
- [ ] Shows loading state
- [ ] Displays activities
- [ ] Handles errors
- [ ] Refresh works

### Activity Management Page
- [ ] Loads successfully
- [ ] Shows activity list
- [ ] Search works
- [ ] Filters work
- [ ] Export works

### API Endpoints
- [ ] GET /api/activities
- [ ] POST /api/activities
- [ ] GET /api/activities/[id]
- [ ] PUT /api/activities/[id]
- [ ] DELETE /api/activities/[id]
- [ ] GET /api/activities/stats

### Activity Logging
- [ ] User activities
- [ ] Product activities
- [ ] Category activities
- [ ] Color activities
- [ ] Order activities
- [ ] Admin activities
