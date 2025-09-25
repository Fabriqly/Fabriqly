// Example of how to integrate ActivityLogger into existing APIs
// This shows how to add activity logging to your color creation API

// In your color creation API (src/app/api/colors/route.ts), add this:

import { ActivityLogger } from '@/utils/activity-logger';

// After successfully creating a color, add this:
if (response.ok) {
  // Log the activity
  await ActivityLogger.logColorCreation(
    color.id, 
    color.colorName, 
    session.user.id
  );
}

// Similar integration for other APIs:

// User Registration API:
await ActivityLogger.logUserRegistration(
  userRecord.uid, 
  userData.email, 
  userData.displayName
);

// Product Creation API:
await ActivityLogger.logProductCreation(
  product.id, 
  product.productName, 
  session.user.id
);

// Category Creation API:
await ActivityLogger.logCategoryCreation(
  category.id, 
  category.categoryName, 
  session.user.id
);
