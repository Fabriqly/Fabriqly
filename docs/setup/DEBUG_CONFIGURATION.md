# Debug Configuration Guide

This guide explains how to properly configure and use debug code in the Fabriqly application.

## Overview

The application includes a comprehensive debug system that automatically disables debug code in production builds while keeping it available for development. This ensures:

- **Development**: Full debug capabilities for troubleshooting
- **Production**: Clean, optimized code with no debug overhead
- **Maintainability**: Debug code remains in the codebase for future use

## Debug Utilities

### Core Debug Functions

Located in `src/utils/debug.ts`, the debug utilities provide:

```typescript
import { debug, debugLog, debugOnly, DebugPage } from '@/utils/debug';

// Conditional logging
debug.log.log('This only logs in development');
debug.log.error('Error details');
debug.log.warn('Warning message');
debug.log.info('Info message');

// Conditional execution
debugOnly(() => {
  // This code only runs in development
  console.log('Development-only code');
});

// Conditional components
<DebugPage title="Debug Page">
  {/* This page only renders in development */}
</DebugPage>
```

### Environment Detection

```typescript
import { isDevelopment, isProduction } from '@/utils/debug';

if (isDevelopment) {
  // Development-only code
}

if (isProduction) {
  // Production-only code
}
```

## Debug Pages

Debug pages are automatically wrapped with the `DebugPage` component:

- **Development**: Full debug interface with yellow warning banner
- **Production**: "Page Not Available" message

### Available Debug Pages

- `/debug-firebase` - Firebase configuration and testing
- `/debug-session` - Session state debugging
- `/debug-auth-callback` - Authentication callback debugging
- `/debug-google-oauth` - Google OAuth configuration

## Console Logging

### Before (Problematic)
```typescript
console.log('Debug info:', data);
console.error('Error occurred:', error);
```

### After (Production-Safe)
```typescript
// Option 1: Direct environment check
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// Option 2: Using debug utilities
debug.log.log('Debug info:', data);
debug.log.error('Error occurred:', error);
```

## Debug Components

### DebugWrapper
```typescript
import { DebugWrapper } from '@/utils/debug';

<DebugWrapper fallback={<div>Feature not available</div>}>
  <DebugFeature />
</DebugWrapper>
```

### DebugPage
```typescript
import { DebugPage } from '@/utils/debug';

export default function MyDebugPage() {
  return (
    <DebugPage title="My Debug Page">
      {/* Debug content */}
    </DebugPage>
  );
}
```

## Performance Debugging

### DebugTimer
```typescript
import { debugTimer } from '@/utils/debug';

// Measure function execution time
const result = debugTimer.measure('myFunction', () => {
  return expensiveOperation();
});

// Measure async operations
const result = await debugTimer.measureAsync('asyncOperation', async () => {
  return await fetch('/api/data');
});
```

### Memory Usage
```typescript
import { debug } from '@/utils/debug';

debug.memory('After data load');
```

## API Debugging

### Network Requests
```typescript
import { debug } from '@/utils/debug';

// Log API responses
debug.api('/api/users', 'GET', requestData, responseData);

// Log API errors
debug.api('/api/users', 'POST', requestData, undefined, error);
```

## Form Debugging

### Form State
```typescript
import { debug } from '@/utils/debug';

const [formState, setFormState] = useState({});

useEffect(() => {
  debug.form('UserForm', formState);
}, [formState]);
```

## Authentication Debugging

### Auth State
```typescript
import { debug } from '@/utils/debug';

useEffect(() => {
  debug.auth(user, session, status);
}, [user, session, status]);
```

## Database Debugging

### Database Operations
```typescript
import { debug } from '@/utils/debug';

try {
  const result = await db.collection('users').add(userData);
  debug.database('create', 'users', userData);
} catch (error) {
  debug.database('create', 'users', userData, error);
}
```

## Component Lifecycle Debugging

### Component Lifecycle
```typescript
import { debug } from '@/utils/debug';

useEffect(() => {
  debug.component('UserProfile', 'mount', props);
  
  return () => {
    debug.component('UserProfile', 'unmount');
  };
}, []);
```

## Hook Debugging

### Custom Hooks
```typescript
import { debug } from '@/utils/debug';

function useCustomHook(dependency) {
  const [state, setState] = useState();
  
  useEffect(() => {
    debug.hook('useCustomHook', state, [dependency]);
  }, [state, dependency]);
  
  return state;
}
```

## Error Boundary Debugging

### Error Boundaries
```typescript
import { debug } from '@/utils/debug';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    debug.errorBoundary(error, errorInfo, this.props.componentStack);
  }
}
```

## Storage Debugging

### LocalStorage/SessionStorage
```typescript
import { debug } from '@/utils/debug';

// Log storage operations
debug.storage('set', 'userPreferences', data);
debug.storage('get', 'userPreferences', data);
debug.storage('remove', 'userPreferences');
```

## Navigation Debugging

### Route Changes
```typescript
import { debug } from '@/utils/debug';

const handleNavigation = (to) => {
  debug.navigation('current-page', to, { userId: user.id });
  router.push(to);
};
```

## User Action Debugging

### User Interactions
```typescript
import { debug } from '@/utils/debug';

const handleButtonClick = () => {
  debug.userAction('button-click', { buttonId: 'submit-form' });
  // Handle click
};
```

## Best Practices

### 1. Use Debug Utilities
Always use the debug utilities instead of direct console.log statements:

```typescript
// ❌ Don't do this
console.log('Debug info:', data);

// ✅ Do this
debug.log.log('Debug info:', data);
```

### 2. Wrap Debug Code
Wrap debug-only code with `debugOnly()`:

```typescript
// ❌ Don't do this
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
  // Complex debug logic
}

// ✅ Do this
debugOnly(() => {
  console.log('Debug info');
  // Complex debug logic
});
```

### 3. Use Debug Pages
Wrap debug pages with `DebugPage`:

```typescript
// ❌ Don't do this
export default function DebugPage() {
  return <div>Debug content</div>;
}

// ✅ Do this
export default function DebugPage() {
  return (
    <DebugPage title="Debug Page">
      <div>Debug content</div>
    </DebugPage>
  );
}
```

### 4. Conditional Rendering
Use `DebugWrapper` for conditional debug components:

```typescript
// ❌ Don't do this
{process.env.NODE_ENV === 'development' && <DebugComponent />}

// ✅ Do this
<DebugWrapper fallback={null}>
  <DebugComponent />
</DebugWrapper>
```

### 5. Performance Monitoring
Use debug timers for performance monitoring:

```typescript
// ❌ Don't do this
const start = Date.now();
await expensiveOperation();
console.log(`Took ${Date.now() - start}ms`);

// ✅ Do this
await debugTimer.measureAsync('expensiveOperation', async () => {
  return await expensiveOperation();
});
```

## Environment Variables

### Development
```bash
NODE_ENV=development
```

### Production
```bash
NODE_ENV=production
```

## Build Process

### Development Build
```bash
npm run dev
# or
npm run build && npm run start
```

### Production Build
```bash
npm run build
# Debug code is automatically stripped
```

## Debug Code Removal

In production builds, Next.js automatically removes debug code through:

1. **Tree Shaking**: Unused debug functions are removed
2. **Dead Code Elimination**: Conditional blocks are optimized
3. **Minification**: Debug code is stripped during minification

## External Logging Services

For production logging, consider integrating with:

- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and logging
- **DataDog**: Application performance monitoring
- **New Relic**: Full-stack observability

### Example Integration
```typescript
// In auth-logging.ts
private sendToExternalService(entry: AuthLogEntry): void {
  if (process.env.NODE_ENV === 'production') {
    // Send to external service
    Sentry.captureMessage(entry.message, entry.level);
  }
}
```

## Troubleshooting

### Debug Code Still Appears in Production
1. Check `NODE_ENV` is set to `production`
2. Verify build process is using production mode
3. Ensure debug utilities are properly imported

### Debug Pages Not Working
1. Verify `DebugPage` component is imported
2. Check that the page is wrapped with `DebugPage`
3. Ensure the route is accessible in development

### Performance Issues
1. Use `debugTimer` to measure performance
2. Check for memory leaks with `debug.memory()`
3. Monitor network requests with `debug.api()`

## Migration Guide

### From Direct Console Logging
```typescript
// Before
console.log('User data:', user);
console.error('API error:', error);

// After
debug.log.log('User data:', user);
debug.log.error('API error:', error);
```

### From Conditional Debugging
```typescript
// Before
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
  // Debug logic
}

// After
debugOnly(() => {
  console.log('Debug info');
  // Debug logic
});
```

### From Debug Pages
```typescript
// Before
export default function DebugPage() {
  if (process.env.NODE_ENV !== 'development') {
    return <div>Not available</div>;
  }
  
  return <div>Debug content</div>;
}

// After
export default function DebugPage() {
  return (
    <DebugPage title="Debug Page">
      <div>Debug content</div>
    </DebugPage>
  );
}
```

## Conclusion

The debug system provides a robust, production-safe way to include debugging capabilities in your application. By following these guidelines, you can:

- Maintain debug code in your codebase
- Ensure production builds are clean and optimized
- Provide rich debugging capabilities for development
- Easily monitor and troubleshoot issues

Remember: Debug code should enhance development without impacting production performance or security.
