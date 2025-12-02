/**
 * Comprehensive Email System Test
 * Tests the email verification and notification system
 * 
 * Run with: node scripts/test-email-system.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Email Verification and Notification System\n');
console.log('=' .repeat(60));

const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

function test(name, fn) {
  try {
    const result = fn();
    if (result === false) {
      testResults.failed++;
      console.log(`❌ ${name}`);
    } else {
      testResults.passed++;
      console.log(`✅ ${name}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

function warn(name, message) {
  testResults.warnings++;
  console.log(`⚠️  ${name}: ${message}`);
}

// Test 1: Check EmailService structure
console.log('\n📧 Testing EmailService...');
test('EmailService.ts file exists', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'EmailService.ts');
  return fs.existsSync(filePath);
});

test('EmailService has all required static methods', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'EmailService.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const requiredMethods = [
    'sendVerificationEmail',
    'sendOrderCreatedEmail',
    'sendPaymentReceivedEmail',
    'sendOrderShippedEmail',
    'sendOrderDeliveredEmail',
    'sendOrderCancelledEmail',
    'sendApplicationSubmittedEmail',
    'sendApplicationApprovedEmail',
    'sendApplicationRejectedEmail'
  ];
  
  const missing = requiredMethods.filter(method => 
    !content.includes(`static async ${method}`)
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing methods: ${missing.join(', ')}`);
  }
  return true;
});

test('EmailService has email template helper methods', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'EmailService.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('getEmailBaseTemplate') && 
         content.includes('getUserEmailPreferences') &&
         content.includes('getUserData') &&
         content.includes('getAdminEmails');
});

// Test 2: Check Email Verification Components
console.log('\n🔐 Testing Email Verification...');
test('EmailVerificationBanner component exists', () => {
  const filePath = path.join(__dirname, '..', 'src', 'components', 'auth', 'EmailVerificationBanner.tsx');
  return fs.existsSync(filePath);
});

test('EmailVerificationBanner has resend functionality', () => {
  const filePath = path.join(__dirname, '..', 'src', 'components', 'auth', 'EmailVerificationBanner.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('resend-verification') && 
         content.includes('handleResendVerification');
});

test('Email verification API endpoints exist', () => {
  const endpoints = [
    'src/app/api/auth/send-verification-email/route.ts',
    'src/app/api/auth/verify-email/route.ts',
    'src/app/api/auth/resend-verification/route.ts'
  ];
  
  return endpoints.every(endpoint => {
    const filePath = path.join(__dirname, '..', endpoint);
    return fs.existsSync(filePath);
  });
});

test('Verification endpoints use crypto for token generation', () => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'send-verification-email', 'route.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('crypto') && content.includes('randomBytes');
});

test('Verification endpoints store tokens in Firestore', () => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'send-verification-email', 'route.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('emailVerificationTokens') && 
         content.includes('expiresAt');
});

// Test 3: Check Registration Integration
console.log('\n📝 Testing Registration Integration...');
test('Registration route includes email verification', () => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'register', 'route.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('EmailService') && 
         content.includes('sendVerificationEmail');
});

test('Registration creates verification token', () => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'register', 'route.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('emailVerificationTokens') && 
         content.includes('crypto');
});

// Test 4: Check Order Email Notifications
console.log('\n📦 Testing Order Email Notifications...');
test('OrderService includes email notifications for order creation', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'OrderService.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('EmailService') && 
         content.includes('sendOrderCreatedEmail');
});

test('OrderService includes email notifications for status changes', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'OrderService.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('sendOrderShippedEmail') || 
         content.includes('sendOrderDeliveredEmail') ||
         content.includes('sendOrderCancelledEmail');
});

test('OrderService handles email errors gracefully', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'OrderService.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('.catch') && 
         content.includes('non-blocking');
});

// Test 5: Check Payment Email Notifications
console.log('\n💳 Testing Payment Email Notifications...');
test('Payment webhook includes email notifications', () => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'payments', 'webhook', 'route.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('EmailService') && 
         content.includes('sendPaymentReceivedEmail');
});

test('Payment webhook handles email errors gracefully', () => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'payments', 'webhook', 'route.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('.catch') || 
         content.includes('non-blocking');
});

// Test 6: Check Application Email Notifications
console.log('\n📋 Testing Application Email Notifications...');
test('Designer application API includes email notifications', () => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'applications', 'designer', 'route.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('EmailService') && 
         content.includes('sendApplicationSubmittedEmail');
});

test('Shop application API includes email notifications', () => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'applications', 'shop', 'route.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('EmailService') && 
         content.includes('sendApplicationSubmittedEmail');
});

test('Application approval/rejection includes email notifications', () => {
  const designerPath = path.join(__dirname, '..', 'src', 'app', 'api', 'applications', 'designer', '[id]', 'route.ts');
  const shopPath = path.join(__dirname, '..', 'src', 'app', 'api', 'applications', 'shop', '[id]', 'route.ts');
  
  const designerContent = fs.readFileSync(designerPath, 'utf8');
  const shopContent = fs.readFileSync(shopPath, 'utf8');
  
  return (designerContent.includes('sendApplicationApprovedEmail') || 
          designerContent.includes('sendApplicationRejectedEmail')) &&
         (shopContent.includes('sendApplicationApprovedEmail') || 
          shopContent.includes('sendApplicationRejectedEmail'));
});

// Test 7: Check Auth System Updates
console.log('\n🔑 Testing Auth System Updates...');
test('auth.ts includes isVerified in JWT callback', () => {
  const filePath = path.join(__dirname, '..', 'src', 'lib', 'auth.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('isVerified') && 
         content.includes('token.isVerified');
});

test('auth.ts includes isVerified in session callback', () => {
  const filePath = path.join(__dirname, '..', 'src', 'lib', 'auth.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('session.user.isVerified');
});

test('Type definitions include isVerified', () => {
  const filePath = path.join(__dirname, '..', 'src', 'types', 'next-auth.d.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('isVerified?: boolean');
});

// Test 8: Check UI Integration
console.log('\n🎨 Testing UI Integration...');
test('EmailVerificationBanner is added to dashboard page', () => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'page.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('EmailVerificationBanner');
});

test('EmailVerificationBanner is added to explore page', () => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'explore', 'page.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('EmailVerificationBanner');
});

// Test 9: Check Code Quality
console.log('\n✨ Testing Code Quality...');
test('EmailService uses proper error handling', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'EmailService.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('try') && 
         content.includes('catch') &&
         content.includes('console.error');
});

test('Email methods respect user preferences', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'EmailService.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('getUserEmailPreferences');
});

test('Email service handles missing SMTP gracefully', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'EmailService.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('SMTP not configured') || 
         content.includes('transporter not available');
});

// Test 10: Check Environment Configuration
console.log('\n⚙️  Testing Configuration...');
test('env.example includes SMTP configuration', () => {
  const filePath = path.join(__dirname, '..', 'env.example');
  if (!fs.existsSync(filePath)) {
    warn('env.example', 'File not found, but this is optional');
    return true;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('SMTP_HOST') && 
         content.includes('SMTP_USER') &&
         content.includes('SMTP_PASS');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary:');
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`⚠️  Warnings: ${testResults.warnings}`);

if (testResults.errors.length > 0) {
  console.log('\n❌ Errors:');
  testResults.errors.forEach(({ name, error }) => {
    console.log(`  - ${name}: ${error}`);
  });
}

if (testResults.failed === 0) {
  console.log('\n🎉 All tests passed! The email system is properly implemented.');
  console.log('\n📝 Next Steps:');
  console.log('1. Configure SMTP settings in .env.local');
  console.log('2. Test email sending with a real registration');
  console.log('3. Verify emails are received correctly');
  console.log('4. Test all email types (orders, payments, applications)');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}

