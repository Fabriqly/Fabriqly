# Scripts Directory

This directory contains testing and utility scripts for the Fabriqly application.

## Dashboard Testing

### `test-dashboard-browser.md`
Browser-based testing guide for the dashboard functionality. Use this for manual testing.

### `init-dashboard-snapshots.js`
Creates initial dashboard snapshots for historical data tracking. Run once to set up baseline data.

**Usage:**
```bash
node scripts/init-dashboard-snapshots.js
```

## Analytics Testing

### `test-analytics-browser.js`
Browser-based testing guide for the analytics page. Use this for manual testing.

**Usage:**
```bash
node scripts/test-analytics-browser.js
```

## Activity System

### `create-test-activities.js`
Creates test activities for development and testing.

### `init-activities-collection.js`
Initializes the activities collection in Firebase.

## Color Management Testing

### `test-color-management.js`
Tests color management functionality.

**Usage:**
```bash
node scripts/test-color-management.js
```

## Usage Guidelines

1. **Dashboard Testing**: Use `test-dashboard-browser.md` for manual testing.

2. **Analytics Testing**: Use `test-analytics-browser.js` for manual testing.

3. **Activity System**: Use `create-test-activities.js` to create test data and `init-activities-collection.js` to initialize the collection.

4. **Color Management**: Use `test-color-management.js` for comprehensive testing.

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
