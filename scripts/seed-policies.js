/**
 * Seed initial policy content for Fabriqly
 * Run this script to create initial policy templates in the database
 * 
 * Usage: node scripts/seed-policies.js
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'fabriqly',
  waitForConnections: true,
  connectionLimit: 10,
});

// Initial policy content templates
const policyTemplates = {
  terms: {
    title: 'Terms & Conditions',
    content: `
      <h1>Terms & Conditions</h1>
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using Fabriqly, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
      
      <h2>2. Governing Law</h2>
      <p>These Terms & Conditions are governed by the laws of the Republic of the Philippines. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of the Philippines.</p>
      <p>This agreement is subject to the Consumer Act of the Philippines (Republic Act No. 7394) and other applicable Philippine laws.</p>
      
      <h2>3. Platform Description</h2>
      <p>Fabriqly is an e-commerce platform that connects customers with local apparel and merchandise providers, designers, and shop owners. We facilitate the discovery, customization, and purchase of products through our platform.</p>
      
      <h2>4. User Accounts</h2>
      <p>Users are responsible for maintaining the confidentiality of their account credentials. You agree to notify Fabriqly immediately of any unauthorized use of your account.</p>
      
      <h2>5. Shop Owners and Designers</h2>
      <p>Shop owners and designers are responsible for:</p>
      <ul>
        <li>Accurately representing their products and services</li>
        <li>Fulfilling orders in a timely manner</li>
        <li>Maintaining quality standards</li>
        <li>Complying with all applicable laws and regulations</li>
      </ul>
      
      <h2>6. Escrow System</h2>
      <p>Fabriqly uses an escrow system to protect both customers and service providers. Payments are held in escrow until order completion and customer approval. This ensures secure transactions for all parties.</p>
      
      <h2>7. Intellectual Property</h2>
      <p>All content on Fabriqly, including designs, logos, and text, is the property of Fabriqly or its content creators. Users may not reproduce, distribute, or create derivative works without permission.</p>
      
      <h2>8. Dispute Resolution</h2>
      <p>In case of disputes, Fabriqly provides a dispute resolution system. Both parties can negotiate, and if needed, admin intervention is available. Disputes are resolved in accordance with Philippine law.</p>
      
      <h2>9. Limitation of Liability</h2>
      <p>Fabriqly acts as a platform connecting buyers and sellers. We are not liable for the quality, safety, or legality of products sold by third-party sellers. Users transact at their own risk.</p>
      
      <h2>10. Termination</h2>
      <p>Fabriqly reserves the right to terminate or suspend accounts that violate these terms or engage in fraudulent activities.</p>
      
      <h2>11. Changes to Terms</h2>
      <p>Fabriqly reserves the right to modify these terms at any time. Users will be notified of significant changes. Continued use of the platform constitutes acceptance of modified terms.</p>
      
      <h2>12. Contact Information</h2>
      <p>For questions about these Terms & Conditions, please contact us through our support channels.</p>
    `
  },
  
  privacy: {
    title: 'Privacy Policy',
    content: `
      <h1>Privacy Policy</h1>
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <h2>1. Introduction</h2>
      <p>Fabriqly ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
      <p>This policy complies with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the Philippines.</p>
      
      <h2>2. Information We Collect</h2>
      <h3>2.1 Personal Information</h3>
      <ul>
        <li>Name, email address, phone number</li>
        <li>Shipping and billing addresses</li>
        <li>Payment information (processed securely through Xendit)</li>
        <li>Profile information and preferences</li>
      </ul>
      
      <h3>2.2 Transaction Information</h3>
      <ul>
        <li>Order history and purchase records</li>
        <li>Customization requests and design preferences</li>
        <li>Communication records with designers and shop owners</li>
      </ul>
      
      <h3>2.3 Technical Information</h3>
      <ul>
        <li>IP address, browser type, device information</li>
        <li>Usage data and analytics</li>
        <li>Cookies and similar tracking technologies</li>
      </ul>
      
      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>Process and fulfill your orders</li>
        <li>Facilitate communication between users, designers, and shop owners</li>
        <li>Send order updates and notifications</li>
        <li>Improve our platform and services</li>
        <li>Comply with legal obligations</li>
        <li>Prevent fraud and ensure platform security</li>
      </ul>
      
      <h2>4. Third-Party Services</h2>
      <h3>4.1 Payment Processing</h3>
      <p>We use <strong>Xendit</strong> for payment processing. Xendit handles payment information securely and in accordance with their privacy policy.</p>
      
      <h3>4.2 Hosting and Infrastructure</h3>
      <p>We use <strong>Firebase</strong> for hosting and data storage. Firebase processes data in accordance with Google's privacy policies.</p>
      
      <h3>4.3 Analytics</h3>
      <p>We may use analytics services to understand how users interact with our platform.</p>
      
      <h2>5. Data Security</h2>
      <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
      
      <h2>6. Your Rights Under the Data Privacy Act</h2>
      <p>As a data subject, you have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request access to your personal data</li>
        <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
        <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
        <li><strong>Object:</strong> Object to processing of your personal data</li>
        <li><strong>Data Portability:</strong> Request transfer of your data to another service</li>
      </ul>
      
      <h2>7. Cookies and Tracking</h2>
      <p>We use cookies and similar technologies to enhance your experience, analyze usage, and assist in marketing efforts. You can control cookie preferences through your browser settings.</p>
      
      <h2>8. Data Retention</h2>
      <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.</p>
      
      <h2>9. Children's Privacy</h2>
      <p>Fabriqly is not intended for users under the age of 18. We do not knowingly collect personal information from children.</p>
      
      <h2>10. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page.</p>
      
      <h2>11. Contact Us</h2>
      <p>For questions about this Privacy Policy or to exercise your rights, please contact us through our support channels.</p>
    `
  },
  
  shipping: {
    title: 'Shipping Policy',
    content: `
      <h1>Shipping Policy</h1>
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <h2>1. Shipping Methods</h2>
      <p>Fabriqly partners with various shipping carriers in the Philippines, including:</p>
      <ul>
        <li>J&T Express</li>
        <li>Flash Express</li>
        <li>LBC</li>
        <li>2GO</li>
        <li>Other local courier services</li>
      </ul>
      <p>Shipping methods may vary depending on the shop owner's preferences and location.</p>
      
      <h2>2. Processing Times</h2>
      <p>Processing times vary by shop and product type:</p>
      <ul>
        <li><strong>Standard Products:</strong> 3-7 business days</li>
        <li><strong>Customized Products:</strong> 5-10 business days (includes customization time)</li>
        <li><strong>Bulk Orders:</strong> 7-14 business days</li>
      </ul>
      <p>Processing time begins after payment confirmation and order approval.</p>
      
      <h2>3. Shipping Costs</h2>
      <p>Shipping costs are determined by individual shop owners and may vary based on:</p>
      <ul>
        <li>Product weight and dimensions</li>
        <li>Delivery location</li>
        <li>Shipping method selected</li>
      </ul>
      <p>Typical shipping costs for local delivery range from <strong>₱80 to ₱150</strong> PHP, depending on the carrier and destination.</p>
      <p>Shipping costs are displayed during checkout before payment.</p>
      
      <h2>4. Delivery Timeframes</h2>
      <p>Once shipped, delivery typically takes:</p>
      <ul>
        <li><strong>Metro Manila:</strong> 1-3 business days</li>
        <li><strong>Luzon:</strong> 3-5 business days</li>
        <li><strong>Visayas:</strong> 5-7 business days</li>
        <li><strong>Mindanao:</strong> 5-10 business days</li>
      </ul>
      <p>Delivery times are estimates and may vary due to weather conditions, holidays, or other factors beyond our control.</p>
      
      <h2>5. International Shipping</h2>
      <p>International shipping may be available for select products and shops. Additional fees, customs duties, and longer delivery times apply. Please contact the shop owner for international shipping options.</p>
      
      <h2>6. Digital Products</h2>
      <p>Digital products (such as design files) are delivered instantly via download link. No physical shipping is required for digital products.</p>
      
      <h2>7. Address Accuracy</h2>
      <p>Customers are responsible for providing accurate shipping addresses. Fabriqly and shop owners are not liable for delays or failed deliveries due to incorrect addresses.</p>
      <p>If you need to change your shipping address, contact the shop owner immediately after placing your order.</p>
      
      <h2>8. Lost or Damaged Packages</h2>
      <p>If your package is lost or damaged during shipping:</p>
      <ol>
        <li>Contact the shop owner immediately</li>
        <li>File a claim with the shipping carrier</li>
        <li>Contact Fabriqly support if the issue is not resolved</li>
      </ol>
      <p>Shop owners are responsible for ensuring proper packaging. Refunds or replacements may be provided at the shop owner's discretion or through our dispute resolution system.</p>
      
      <h2>9. Tracking Information</h2>
      <p>Once your order is shipped, you will receive tracking information via email or through your order page on Fabriqly. You can track your package using the provided tracking number.</p>
      
      <h2>10. Delivery Attempts</h2>
      <p>Carriers typically make 2-3 delivery attempts. If delivery fails, packages may be held at the local courier office for pickup. Unclaimed packages may be returned to the sender after a specified period.</p>
      
      <h2>11. Contact Information</h2>
      <p>For shipping-related questions, please contact the shop owner directly or reach out to Fabriqly support.</p>
    `
  },
  
  refund: {
    title: 'Refund Policy',
    content: `
      <h1>Refund Policy</h1>
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <h2>1. Refund Eligibility</h2>
      <p>Refunds may be available under the following circumstances:</p>
      <ul>
        <li>Order cancellation before production begins</li>
        <li>Defective or damaged products</li>
        <li>Products not matching the description</li>
        <li>Non-delivery of products</li>
        <li>Dispute resolution outcomes</li>
      </ul>
      
      <h2>2. Escrow Refund Process</h2>
      <p>Fabriqly uses an escrow system to protect both customers and shop owners:</p>
      <ul>
        <li>Payments are held in escrow until order completion</li>
        <li>Refunds can be processed directly from escrow when eligible</li>
        <li>Refunds are processed through the original payment method</li>
      </ul>
      
      <h2>3. Cancellation Policy</h2>
      <h3>3.1 Product Orders</h3>
      <p>Product orders can be cancelled if:</p>
      <ul>
        <li>The order status is "pending" (not yet in production)</li>
        <li>You request cancellation within 24 hours of order placement</li>
      </ul>
      <p><strong>Note:</strong> Once production has started, cancellations may not be eligible for full refunds.</p>
      
      <h3>3.2 Design Orders</h3>
      <p>Digital design orders can be cancelled even after delivery, as they are automatically delivered upon payment. Contact support for assistance.</p>
      
      <h2>4. Dispute Resolution and Refunds</h2>
      <p>If you are not satisfied with your order:</p>
      <ol>
        <li>Contact the shop owner to resolve the issue</li>
        <li>If unresolved, file a dispute through Fabriqly's dispute system</li>
        <li>Admin will review the dispute and make a decision</li>
        <li>Refunds may be issued based on the dispute resolution outcome</li>
      </ol>
      
      <h2>5. Refund Processing Time</h2>
      <p>Refunds are typically processed within <strong>5-10 business days</strong> after approval:</p>
      <ul>
        <li>Escrow refunds: 1-3 business days</li>
        <li>Payment gateway refunds: 5-10 business days</li>
        <li>Bank transfers: 7-14 business days</li>
      </ul>
      <p>Processing times may vary depending on your payment method and financial institution.</p>
      
      <h2>6. Partial Refunds</h2>
      <p>Partial refunds may be available in certain situations:</p>
      <ul>
        <li>Partial order fulfillment</li>
        <li>Minor defects that don't affect usability</li>
        <li>Agreed-upon compensation through dispute resolution</li>
      </ul>
      <p>Partial refunds can be negotiated through the dispute system.</p>
      
      <h2>7. Non-Refundable Items</h2>
      <p>The following items are generally non-refundable:</p>
      <ul>
        <li>Customized products after production has started</li>
        <li>Digital products that have been downloaded</li>
        <li>Products damaged due to customer misuse</li>
        <li>Shipping costs (unless the product itself is refunded)</li>
      </ul>
      
      <h2>8. Refund Method</h2>
      <p>Refunds are processed through the original payment method:</p>
      <ul>
        <li>Credit/Debit Cards: Refunded to the original card</li>
        <li>E-Wallets: Refunded to the original e-wallet account</li>
        <li>Bank Transfers: Refunded to the original bank account</li>
        <li>Virtual Accounts: Refunded through the payment gateway</li>
      </ul>
      
      <h2>9. Return Shipping</h2>
      <p>For eligible refunds requiring product returns:</p>
      <ul>
        <li>Return shipping costs may be the responsibility of the customer</li>
        <li>Shop owners may provide return shipping labels in some cases</li>
        <li>Return shipping arrangements should be discussed with the shop owner</li>
      </ul>
      
      <h2>10. Chargebacks</h2>
      <p>If you initiate a chargeback with your bank or payment provider, Fabriqly will work with you to resolve the issue. However, chargebacks may result in account suspension if found to be fraudulent.</p>
      
      <h2>11. Contact Information</h2>
      <p>For refund requests or questions about this policy, please contact the shop owner first. If you need further assistance, contact Fabriqly support through our dispute system.</p>
    `
  }
};

async function seedPolicies() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    console.log('Connected to database');
    
    // Check if policies already exist
    const [existing] = await connection.execute(
      'SELECT COUNT(*) as count FROM policies WHERE status = "published"'
    );
    
    if (existing[0].count > 0) {
      console.log('Policies already exist. Skipping seed.');
      console.log('To re-seed, delete existing policies first.');
      return;
    }
    
    // Get admin user ID (use first admin or system user)
    const [admins] = await connection.execute(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    );
    
    const adminId = admins.length > 0 ? admins[0].id : 'system';
    console.log(`Using admin ID: ${adminId}`);
    
    // Insert policies
    for (const [type, template] of Object.entries(policyTemplates)) {
      const policyId = `policy-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await connection.execute(
        `INSERT INTO policies (
          id, type, title, content, version, status, last_updated_by
        ) VALUES (?, ?, ?, ?, 1, 'published', ?)`,
        [policyId, type, template.title, template.content.trim(), adminId]
      );
      
      console.log(`✓ Created ${template.title} (${type})`);
    }
    
    console.log('\n✅ Successfully seeded all policies!');
    console.log('All policies have been created as published versions.');
    
  } catch (error) {
    console.error('Error seeding policies:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

// Run the seed function
seedPolicies()
  .then(() => {
    console.log('Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });

