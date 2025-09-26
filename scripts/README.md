# Scripts Directory

This directory contains testing and utility scripts for the Fabriqly application.

## Dashboard Testing

### `test-dashboard-stats.js`
Tests the dashboard-stats API endpoint to verify real percentage calculations are working correctly.

**Usage:**
```bash
node scripts/test-dashboard-stats.js
```

### `test-dashboard-browser.md`
Browser-based testing guide for the dashboard functionality. Use this for manual testing.

### `init-dashboard-snapshots.js`
Creates initial dashboard snapshots for historical data tracking. Run once to set up baseline data.

**Usage:**
```bash
node scripts/init-dashboard-snapshots.js
```

## Activity System Testing

### `test-activity-system.js`
Comprehensive testing for the activity logging system.

### `test-activity-api.js`
Tests the activity API endpoints.

### `test-activity-logger.js`
Tests the activity logger functionality.

### `create-test-activities.js`
Creates test activities for development and testing.

### `init-activities-collection.js`
Initializes the activities collection in Firebase.

## Color Management Testing

### `test-color-management.js`
Tests color management functionality.

### `test-color-management.sh`
Shell script for color management testing.

## Integration Testing

### `test-integration.js`
Complete integration testing script for the product catalog system.

### `test-api.js`
General API testing script.

### `test-performance.js`
Performance testing script.

## Usage Guidelines

1. **Dashboard Testing**: Start with `test-dashboard-browser.md` for manual testing, then use `test-dashboard-stats.js` for automated testing.

2. **Activity System**: Use `test-activity-system.js` for comprehensive testing, or individual scripts for specific components.

3. **Color Management**: Use `test-color-management.js` for JavaScript testing or `test-color-management.sh` for shell-based testing.

4. **Integration**: Use `test-integration.js` for complete system testing.

## Prerequisites

- Node.js installed
- Development server running (`npm run dev`)
- Admin user logged in (for most tests)
- Firebase credentials configured in `.env.local`

## Notes

- Most scripts require the development server to be running
- Admin authentication is required for most API tests
- Some scripts create test data - use in development environment only
- Check individual script files for specific requirements and usage instructions
