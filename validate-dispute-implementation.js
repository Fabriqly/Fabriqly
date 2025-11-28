// Validation script to check if dispute system is properly implemented
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Dispute System Implementation...\n');

const checks = [];
let passed = 0;
let failed = 0;

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`✅ ${description}`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    failed++;
    return false;
  }
}

function checkFileContains(filePath, searchText, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${description} - File not found`);
    failed++;
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchText)) {
    console.log(`✅ ${description}`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${description} - Missing: ${searchText}`);
    failed++;
    return false;
  }
}

// Type Definitions
console.log('\n📝 Type Definitions:');
checkFile('src/types/dispute.ts', 'Dispute type definitions');

// Repository
console.log('\n🗄️  Repository:');
checkFile('src/repositories/DisputeRepository.ts', 'DisputeRepository');

// Services
console.log('\n⚙️  Services:');
checkFile('src/services/DisputeService.ts', 'DisputeService');
checkFile('src/services/StrikeService.ts', 'StrikeService');
checkFileContains('src/services/EscrowService.ts', 'freezeEscrow', 'EscrowService freeze method');
checkFileContains('src/services/EscrowService.ts', 'unfreezeEscrow', 'EscrowService unfreeze method');
checkFileContains('src/services/EscrowService.ts', 'refundEscrow', 'EscrowService refund method');
checkFileContains('src/services/XenditService.ts', 'refundInvoice', 'XenditService refund method');
checkFileContains('src/services/MessagingService.ts', 'createDisputeConversation', 'MessagingService dispute conversation');

// API Routes
console.log('\n🌐 API Routes:');
checkFile('src/app/api/disputes/route.ts', 'Main disputes route');
checkFile('src/app/api/disputes/[id]/route.ts', 'Dispute detail route');
checkFile('src/app/api/disputes/[id]/accept/route.ts', 'Accept dispute route');
checkFile('src/app/api/disputes/[id]/cancel/route.ts', 'Cancel dispute route');
checkFile('src/app/api/disputes/[id]/partial-refund/route.ts', 'Partial refund route');
checkFile('src/app/api/disputes/[id]/resolve/route.ts', 'Admin resolve route');
checkFile('src/app/api/disputes/check-eligibility/route.ts', 'Check eligibility route');
checkFile('src/app/api/disputes/pending-admin/route.ts', 'Pending admin route');

// Collections
console.log('\n📦 Collections:');
checkFileContains('src/services/firebase.ts', "DISPUTES: 'disputes'", 'DISPUTES collection');

// Type Updates
console.log('\n🔧 Type Updates:');
checkFileContains('src/types/customization.ts', "'disputed'", 'PaymentDetails disputed status');
checkFileContains('src/types/shop-profile.ts', 'strikes', 'ShopProfile strike fields');
checkFileContains('src/types/enhanced-products.ts', 'strikes', 'DesignerProfile strike fields');

// Configuration
console.log('\n⚙️  Configuration:');
checkFileContains('env.example', 'DISPUTE_FILING_DEADLINE_DAYS', 'Dispute environment variables');
checkFileContains('firestore.indexes.json', '"collectionGroup": "disputes"', 'Firestore indexes for disputes');

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📝 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All checks passed! Dispute system is properly implemented.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review the errors above.');
  process.exit(1);
}






