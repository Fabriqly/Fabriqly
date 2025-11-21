/**
 * Xendit Payment Testing Script
 * This script simulates a payment to test your Xendit integration
 * 
 * Usage:
 * 1. Create an invoice via your checkout page
 * 2. Copy the invoice ID or external ID from the URL or terminal logs
 * 3. Run: node scripts/test-xendit-payment.js <invoice_id_or_external_id>
 */

require('dotenv').config({ path: '.env.local' });
const Xendit = require('xendit-node');

const SECRET_KEY = process.env.XENDIT_SECRET_KEY;

if (!SECRET_KEY) {
  console.error('❌ XENDIT_SECRET_KEY not found in .env.local');
  process.exit(1);
}

// Get invoice ID from command line
const invoiceIdOrExternalId = process.argv[2];

if (!invoiceIdOrExternalId) {
  console.error('❌ Please provide an invoice ID or external ID');
  console.log('\nUsage: node scripts/test-xendit-payment.js <invoice_id_or_external_id>');
  console.log('Example: node scripts/test-xendit-payment.js order_abc123_1234567890');
  process.exit(1);
}

console.log('🔧 Initializing Xendit...');
const xenditClient = new Xendit({ secretKey: SECRET_KEY });
const { Invoice } = xenditClient;

async function simulatePayment() {
  try {
    console.log('\n📋 Testing Xendit Payment Integration\n');
    console.log('Invoice/External ID:', invoiceIdOrExternalId);
    console.log('─'.repeat(60));

    // Try to get invoice by ID first, then by external ID
    console.log('\n1️⃣ Fetching invoice...');
    let invoice;
    
    try {
      // Try as invoice ID
      invoice = await Invoice.getInvoiceById({
        invoiceId: invoiceIdOrExternalId
      });
    } catch (error) {
      // If not found, it might be an external ID
      console.log('   Not found by ID, trying as external ID...');
      const invoices = await Invoice.getAllInvoices();
      invoice = invoices.find(inv => inv.externalId === invoiceIdOrExternalId);
      
      if (!invoice) {
        throw new Error('Invoice not found with ID or External ID: ' + invoiceIdOrExternalId);
      }
    }

    console.log('✅ Invoice found!');
    console.log('   ID:', invoice.id);
    console.log('   External ID:', invoice.externalId);
    console.log('   Status:', invoice.status);
    console.log('   Amount:', invoice.amount, invoice.currency);
    console.log('   Invoice URL:', invoice.invoiceUrl);

    if (invoice.status === 'PAID' || invoice.status === 'SETTLED') {
      console.log('\n✅ This invoice is already PAID!');
      console.log('─'.repeat(60));
      return;
    }

    if (invoice.status === 'EXPIRED') {
      console.log('\n⚠️ This invoice has EXPIRED. Create a new one.');
      console.log('─'.repeat(60));
      return;
    }

    console.log('\n2️⃣ Payment Options Available:');
    console.log('─'.repeat(60));
    
    console.log('\n🏦 Virtual Account Banks:');
    if (invoice.availableBanks && invoice.availableBanks.length > 0) {
      invoice.availableBanks.forEach((bank, idx) => {
        console.log(`   ${idx + 1}. ${bank.bankCode || bank}`);
      });
    } else {
      console.log('   None available');
    }

    console.log('\n📱 E-Wallets:');
    if (invoice.availableEwallets && invoice.availableEwallets.length > 0) {
      invoice.availableEwallets.forEach((ewallet, idx) => {
        console.log(`   ${idx + 1}. ${ewallet.ewalletType || ewallet}`);
      });
    } else {
      console.log('   None available');
    }

    console.log('\n🏪 Retail Outlets:');
    if (invoice.availableRetailOutlets && invoice.availableRetailOutlets.length > 0) {
      invoice.availableRetailOutlets.forEach((outlet, idx) => {
        console.log(`   ${idx + 1}. ${outlet.retailOutletName || outlet}`);
      });
    } else {
      console.log('   None available');
    }

    console.log('\n─'.repeat(60));
    console.log('\n📝 HOW TO TEST PAYMENT (TEST MODE):');
    console.log('─'.repeat(60));
    
    console.log('\n✨ Method 1: Use the Invoice URL (RECOMMENDED)');
    console.log('   1. Open this URL in your browser:');
    console.log(`      ${invoice.invoiceUrl}`);
    console.log('   2. Select a payment method');
    console.log('   3. For TEST MODE, Xendit will show a "Simulate Payment" button');
    console.log('   4. Click it to instantly mark the payment as successful!');

    console.log('\n✨ Method 2: Use Xendit Dashboard');
    console.log('   1. Go to: https://dashboard.xendit.co/');
    console.log('   2. Navigate to Payments → Invoices');
    console.log('   3. Find your invoice (External ID: ' + invoice.externalId + ')');
    console.log('   4. Click on it and use "Simulate Payment" button');

    console.log('\n✨ Method 3: Use Xendit API (for automated testing)');
    console.log('   Unfortunately, Xendit doesn\'t provide a direct API to simulate');
    console.log('   payments in test mode. You must use the dashboard or invoice URL.');

    console.log('\n💡 After Payment is Simulated:');
    console.log('   ✅ Invoice status will change to PAID');
    console.log('   ✅ Your webhook will receive a notification (if configured)');
    console.log('   ✅ Order status will be updated in your database');
    console.log('   ✅ You can see the transaction in Xendit dashboard');

    console.log('\n─'.repeat(60));
    console.log('\n🔍 To check payment status later, run:');
    console.log(`   node scripts/test-xendit-payment.js ${invoice.id}`);
    console.log('\n─'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

simulatePayment();

