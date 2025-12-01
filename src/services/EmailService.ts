import { FirebaseAdminService } from './firebase-admin';
import { Collections } from './firebase';
import { Order } from '@/types/firebase';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

interface UserEmailData {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

interface OrderEmailData {
  order: Order;
  customer: UserEmailData;
  businessOwner?: UserEmailData;
}

interface ApplicationEmailData {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  applicationType: 'designer' | 'shop';
  businessName?: string;
  rejectionReason?: string;
}

export class EmailService {
  private static transporter: any = null;
  private static isInitialized = false;

  private static async initializeTransporter() {
    if (this.isInitialized && this.transporter) {
      return this.transporter;
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP not configured, email service will not send emails');
      return null;
    }

    try {
      const nodemailer = await import('nodemailer');
      // Handle both CommonJS and ES module imports
      const nodemailerModule = nodemailer.default || nodemailer;
      this.transporter = nodemailerModule.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      this.isInitialized = true;
      return this.transporter;
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
      return null;
    }
  }

  private static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = await this.initializeTransporter();
      if (!transporter) {
        console.warn('⚠️ Email transporter not available, skipping email send');
        return false;
      }

      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      
      await transporter.sendMail({
        from: options.from || process.env.SMTP_FROM || 'noreply@fabriqly.com',
        to: recipients.join(', '),
        subject: options.subject,
        html: options.html,
      });

      console.log('✅ Email sent successfully to:', recipients);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  private static getEmailBaseTemplate(content: string, title: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; min-height: 100vh;">
          <tr>
            <td align="center" valign="top" style="padding: 40px 20px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px; text-align: center;">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center">
                          <span style="font-size: 32px; margin-right: 12px; vertical-align: middle; display: inline-block;">🛍️</span>
                          <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.01em; display: inline-block; vertical-align: middle;">
                            Fabriqly
                          </h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
                      The Fabriqly Team
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.4;">
                      © ${new Date().getFullYear()} Fabriqly • Fashion & Design Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private static async getUserEmailPreferences(userId: string): Promise<boolean> {
    try {
      const user = await FirebaseAdminService.getDocument(Collections.USERS, userId);
      if (!user) return true; // Default to true if user not found
      
      const emailEnabled = user.profile?.preferences?.notifications?.email;
      return emailEnabled !== false; // Default to true if not set
    } catch (error) {
      console.error('Error checking user email preferences:', error);
      return true; // Default to true on error
    }
  }

  private static async getUserData(userId: string): Promise<UserEmailData | null> {
    try {
      const user = await FirebaseAdminService.getDocument(Collections.USERS, userId);
      if (!user) return null;

      return {
        email: user.email,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        displayName: user.displayName || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email,
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  private static async getAdminEmails(): Promise<string[]> {
    try {
      const admins = await FirebaseAdminService.queryDocuments(
        Collections.USERS,
        [{ field: 'role', operator: '==', value: 'admin' }]
      );

      return admins
        .map(admin => admin.email)
        .filter((email): email is string => !!email);
    } catch (error) {
      console.error('Error getting admin emails:', error);
      return [];
    }
  }

  // Email Verification
  static async sendVerificationEmail(userId: string, token: string): Promise<boolean> {
    const user = await this.getUserData(userId);
    if (!user) {
      console.error('User not found for verification email');
      return false;
    }

    const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;
    const firstName = user.firstName || 'there';

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
          Hello <strong style="color: #1f2937;">${firstName}</strong> 👋
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
          Please verify your email address to complete your registration.
        </p>
      </div>
      
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius: 10px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.25);">
                  <a href="${verifyUrl}" style="display: inline-block; padding: 18px 36px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 10px; letter-spacing: 0.025em;">
                    Verify Email Address
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 32px 0;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0; font-weight: 500;">
          Having trouble with the button? Copy and paste this link into your browser:
        </p>
        <p style="word-break: break-all; color: #3b82f6; font-size: 14px; margin: 0; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
          ${verifyUrl}
        </p>
      </div>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 6px 6px 0;">
        <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
          ⏰ <strong>Security Notice:</strong> This link will expire in 24 hours for your protection.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Fabriqly Email Address',
      html: this.getEmailBaseTemplate(content, 'Verify Your Email'),
    });
  }

  // Order Created - Receipt to Customer
  static async sendOrderCreatedEmail(data: OrderEmailData): Promise<boolean> {
    const emailEnabled = await this.getUserEmailPreferences(data.order.customerId);
    if (!emailEnabled) {
      console.log('Email notifications disabled for user:', data.order.customerId);
      return false;
    }

    const customerName = data.customer.firstName || data.customer.displayName || 'there';
    
    // Format order date - handle various timestamp formats
    let orderDate: string;
    try {
      let date: Date;
      const createdAt = data.order.createdAt;
      
      if (createdAt instanceof Date) {
        date = createdAt;
      } else if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt && typeof createdAt.toDate === 'function') {
        date = createdAt.toDate();
      } else if (createdAt && typeof createdAt === 'object' && 'seconds' in createdAt) {
        const seconds = (createdAt as any).seconds || 0;
        const nanoseconds = (createdAt as any).nanoseconds || 0;
        date = new Date(seconds * 1000 + nanoseconds / 1000000);
      } else if (createdAt && typeof createdAt === 'object' && '_seconds' in createdAt) {
        const seconds = (createdAt as any)._seconds || 0;
        const nanoseconds = (createdAt as any)._nanoseconds || 0;
        date = new Date(seconds * 1000 + nanoseconds / 1000000);
      } else {
        date = new Date(createdAt as any);
      }
      
      // Validate date
      if (isNaN(date.getTime())) {
        orderDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } else {
        orderDate = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      // Fallback to current date if parsing fails
      orderDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    const orderItems = data.order.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #1f2937; font-weight: 500;">Product ID: ${item.productId}</p>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Quantity: ${item.quantity} × ₱${item.price.toFixed(2)}</p>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937; font-weight: 600;">
          ₱${(item.quantity * item.price).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
          Hello <strong style="color: #1f2937;">${customerName}</strong> 👋
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
          Thank you for your order! We've received your order and will begin processing it shortly.
        </p>
      </div>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Order Details</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;"><strong>Order ID:</strong> ${data.order.id}</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;"><strong>Order Date:</strong> ${orderDate}</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: 600;">${data.order.status.toUpperCase()}</span></p>
        
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0;">
          <thead>
            <tr>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #1f2937; font-weight: 600;">Item</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #1f2937; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems}
          </tbody>
        </table>
        
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 16px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
            <td style="padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600;">₱${data.order.subtotal.toFixed(2)}</td>
          </tr>
          ${data.order.discountAmount ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Discount</td>
            <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: 600;">-₱${data.order.discountAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tax</td>
            <td style="padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600;">₱${data.order.tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Shipping</td>
            <td style="padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600;">₱${data.order.shippingCost.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #1f2937; font-size: 18px; font-weight: 700;">Total</td>
            <td style="padding: 12px 0; text-align: right; color: #1f2937; font-size: 18px; font-weight: 700;">₱${data.order.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    `;

    return this.sendEmail({
      to: data.customer.email,
      subject: `Order Confirmation - Order #${data.order.id}`,
      html: this.getEmailBaseTemplate(content, 'Order Confirmation'),
    });
  }

  // Payment Received - Confirmations to Customer, Admin, Business Owner
  static async sendPaymentReceivedEmail(orderId: string, customerId: string, businessOwnerId: string, amount: number): Promise<boolean> {
    const [customer, businessOwner] = await Promise.all([
      this.getUserData(customerId),
      this.getUserData(businessOwnerId),
    ]);

    if (!customer) {
      console.error('Customer not found for payment email');
      return false;
    }

    const results: boolean[] = [];

    // Send to customer
    const customerEmailEnabled = await this.getUserEmailPreferences(customerId);
    if (customerEmailEnabled) {
      const customerName = customer.firstName || customer.displayName || 'there';
      const content = `
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
            Hello <strong style="color: #1f2937;">${customerName}</strong> 👋
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
            Great news! We've received your payment for Order #${orderId}.
          </p>
        </div>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
          <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: 600;">
            ✅ Payment Received: ₱${amount.toFixed(2)}
          </p>
          <p style="color: #047857; font-size: 14px; margin: 8px 0 0 0;">
            Your order is now being processed and will be shipped soon.
          </p>
        </div>
      `;

      results.push(await this.sendEmail({
        to: customer.email,
        subject: `Payment Received - Order #${orderId}`,
        html: this.getEmailBaseTemplate(content, 'Payment Received'),
      }));
    }

    // Send to business owner
    if (businessOwner) {
      const businessOwnerEmailEnabled = await this.getUserEmailPreferences(businessOwnerId);
      if (businessOwnerEmailEnabled) {
        const businessOwnerName = businessOwner.firstName || businessOwner.displayName || 'there';
        const content = `
          <div style="text-align: center; margin-bottom: 32px;">
            <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
              Hello <strong style="color: #1f2937;">${businessOwnerName}</strong> 👋
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
              Payment has been received for Order #${orderId}.
            </p>
          </div>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
            <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: 600;">
              ✅ Payment Received: ₱${amount.toFixed(2)}
            </p>
            <p style="color: #047857; font-size: 14px; margin: 8px 0 0 0;">
              You can now proceed with processing and shipping the order.
            </p>
          </div>
        `;

        results.push(await this.sendEmail({
          to: businessOwner.email,
          subject: `Payment Received for Order #${orderId}`,
          html: this.getEmailBaseTemplate(content, 'Payment Received'),
        }));
      }
    }

    // Send to admins
    const adminEmails = await this.getAdminEmails();
    if (adminEmails.length > 0) {
      const content = `
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
            Payment Notification
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
            Payment has been received for Order #${orderId}.
          </p>
        </div>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
          <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: 600;">
            ✅ Payment Received: ₱${amount.toFixed(2)}
          </p>
          <p style="color: #047857; font-size: 14px; margin: 8px 0 0 0;">
            Order ID: ${orderId}<br>
            Customer ID: ${customerId}<br>
            Business Owner ID: ${businessOwnerId}
          </p>
        </div>
      `;

      results.push(await this.sendEmail({
        to: adminEmails,
        subject: `Payment Received - Order #${orderId}`,
        html: this.getEmailBaseTemplate(content, 'Payment Notification'),
      }));
    }

    return results.some(r => r);
  }

  // Order Shipped - Tracking info to Customer
  static async sendOrderShippedEmail(orderId: string, customerId: string, trackingNumber?: string, carrier?: string): Promise<boolean> {
    const emailEnabled = await this.getUserEmailPreferences(customerId);
    if (!emailEnabled) return false;

    const customer = await this.getUserData(customerId);
    if (!customer) {
      console.error('Customer not found for shipped email');
      return false;
    }

    const customerName = customer.firstName || customer.displayName || 'there';
    const trackingInfo = trackingNumber ? `
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
        <p style="color: #1e40af; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">
          📦 Tracking Information
        </p>
        <p style="color: #1e3a8a; font-size: 14px; margin: 4px 0;">
          <strong>Tracking Number:</strong> ${trackingNumber}
        </p>
        ${carrier ? `<p style="color: #1e3a8a; font-size: 14px; margin: 4px 0;"><strong>Carrier:</strong> ${carrier}</p>` : ''}
      </div>
    ` : '';

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
          Hello <strong style="color: #1f2937;">${customerName}</strong> 👋
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
          Great news! Your order #${orderId} has been shipped.
        </p>
      </div>
      
      ${trackingInfo}
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
        You can track your order using the information above. We'll notify you once it's delivered.
      </p>
    `;

    return this.sendEmail({
      to: customer.email,
      subject: `Your Order #${orderId} Has Been Shipped`,
      html: this.getEmailBaseTemplate(content, 'Order Shipped'),
    });
  }

  // Order Delivered - Confirmations to Customer and Business Owner
  static async sendOrderDeliveredEmail(orderId: string, customerId: string, businessOwnerId: string): Promise<boolean> {
    const [customer, businessOwner] = await Promise.all([
      this.getUserData(customerId),
      this.getUserData(businessOwnerId),
    ]);

    if (!customer) {
      console.error('Customer not found for delivered email');
      return false;
    }

    const results: boolean[] = [];

    // Send to customer
    const customerEmailEnabled = await this.getUserEmailPreferences(customerId);
    if (customerEmailEnabled) {
      const customerName = customer.firstName || customer.displayName || 'there';
      const content = `
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
            Hello <strong style="color: #1f2937;">${customerName}</strong> 👋
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
            Your order #${orderId} has been delivered!
          </p>
        </div>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
          <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: 600;">
            ✅ Order Delivered
          </p>
          <p style="color: #047857; font-size: 14px; margin: 8px 0 0 0;">
            We hope you're happy with your purchase! Please consider leaving a review.
          </p>
        </div>
      `;

      results.push(await this.sendEmail({
        to: customer.email,
        subject: `Order #${orderId} Delivered`,
        html: this.getEmailBaseTemplate(content, 'Order Delivered'),
      }));
    }

    // Send to business owner
    if (businessOwner) {
      const businessOwnerEmailEnabled = await this.getUserEmailPreferences(businessOwnerId);
      if (businessOwnerEmailEnabled) {
        const businessOwnerName = businessOwner.firstName || businessOwner.displayName || 'there';
        const content = `
          <div style="text-align: center; margin-bottom: 32px;">
            <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
              Hello <strong style="color: #1f2937;">${businessOwnerName}</strong> 👋
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
              Order #${orderId} has been successfully delivered to the customer.
            </p>
          </div>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
            <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: 600;">
              ✅ Order Delivered
            </p>
            <p style="color: #047857; font-size: 14px; margin: 8px 0 0 0;">
              Payment will be processed according to your payment schedule.
            </p>
          </div>
        `;

        results.push(await this.sendEmail({
          to: businessOwner.email,
          subject: `Order #${orderId} Delivered`,
          html: this.getEmailBaseTemplate(content, 'Order Delivered'),
        }));
      }
    }

    return results.some(r => r);
  }

  // Order Cancelled - Notifications to all parties
  static async sendOrderCancelledEmail(orderId: string, customerId: string, businessOwnerId: string, reason?: string): Promise<boolean> {
    const [customer, businessOwner] = await Promise.all([
      this.getUserData(customerId),
      this.getUserData(businessOwnerId),
    ]);

    if (!customer) {
      console.error('Customer not found for cancelled email');
      return false;
    }

    const results: boolean[] = [];

    // Send to customer
    const customerEmailEnabled = await this.getUserEmailPreferences(customerId);
    if (customerEmailEnabled) {
      const customerName = customer.firstName || customer.displayName || 'there';
      const content = `
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
            Hello <strong style="color: #1f2937;">${customerName}</strong> 👋
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
            Your order #${orderId} has been cancelled.
          </p>
        </div>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
          <p style="color: #991b1b; font-size: 16px; margin: 0; font-weight: 600;">
            ❌ Order Cancelled
          </p>
          ${reason ? `<p style="color: #dc2626; font-size: 14px; margin: 8px 0 0 0;">Reason: ${reason}</p>` : ''}
          <p style="color: #b91c1c; font-size: 14px; margin: 8px 0 0 0;">
            If you made a payment, it will be refunded according to our refund policy.
          </p>
        </div>
      `;

      results.push(await this.sendEmail({
        to: customer.email,
        subject: `Order #${orderId} Cancelled`,
        html: this.getEmailBaseTemplate(content, 'Order Cancelled'),
      }));
    }

    // Send to business owner
    if (businessOwner) {
      const businessOwnerEmailEnabled = await this.getUserEmailPreferences(businessOwnerId);
      if (businessOwnerEmailEnabled) {
        const businessOwnerName = businessOwner.firstName || businessOwner.displayName || 'there';
        const content = `
          <div style="text-align: center; margin-bottom: 32px;">
            <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
              Hello <strong style="color: #1f2937;">${businessOwnerName}</strong> 👋
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
              Order #${orderId} has been cancelled.
            </p>
          </div>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
            <p style="color: #991b1b; font-size: 16px; margin: 0; font-weight: 600;">
              ❌ Order Cancelled
            </p>
            ${reason ? `<p style="color: #dc2626; font-size: 14px; margin: 8px 0 0 0;">Reason: ${reason}</p>` : ''}
          </div>
        `;

        results.push(await this.sendEmail({
          to: businessOwner.email,
          subject: `Order #${orderId} Cancelled`,
          html: this.getEmailBaseTemplate(content, 'Order Cancelled'),
        }));
      }
    }

    // Send to admins
    const adminEmails = await this.getAdminEmails();
    if (adminEmails.length > 0) {
      const content = `
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
            Order Cancellation Notification
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
            Order #${orderId} has been cancelled.
          </p>
        </div>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
          <p style="color: #991b1b; font-size: 16px; margin: 0; font-weight: 600;">
            ❌ Order Cancelled
          </p>
          <p style="color: #dc2626; font-size: 14px; margin: 8px 0 0 0;">
            Order ID: ${orderId}<br>
            Customer ID: ${customerId}<br>
            Business Owner ID: ${businessOwnerId}
            ${reason ? `<br>Reason: ${reason}` : ''}
          </p>
        </div>
      `;

      results.push(await this.sendEmail({
        to: adminEmails,
        subject: `Order #${orderId} Cancelled`,
        html: this.getEmailBaseTemplate(content, 'Order Cancellation'),
      }));
    }

    return results.some(r => r);
  }

  // Application Submitted - Confirmation to applicant, notification to admin
  static async sendApplicationSubmittedEmail(data: ApplicationEmailData): Promise<boolean> {
    const results: boolean[] = [];

    // Send to applicant
    const applicantName = data.applicantName || 'there';
    const applicationTypeLabel = data.applicationType === 'designer' ? 'Designer' : 'Shop Owner';
    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
          Hello <strong style="color: #1f2937;">${applicantName}</strong> 👋
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
          Thank you for submitting your ${applicationTypeLabel} application!
        </p>
      </div>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
        <p style="color: #1e40af; font-size: 16px; margin: 0; font-weight: 600;">
          📋 Application Submitted
        </p>
        <p style="color: #1e3a8a; font-size: 14px; margin: 8px 0 0 0;">
          Application ID: ${data.applicationId}<br>
          ${data.businessName ? `Business Name: ${data.businessName}<br>` : ''}
          Status: <strong>Pending Review</strong>
        </p>
        <p style="color: #1e3a8a; font-size: 14px; margin: 8px 0 0 0;">
          Our team will review your application and get back to you soon. You can check the status of your application in your dashboard.
        </p>
      </div>
    `;

    results.push(await this.sendEmail({
      to: data.applicantEmail,
      subject: `${applicationTypeLabel} Application Submitted`,
      html: this.getEmailBaseTemplate(content, 'Application Submitted'),
    }));

    // Send to admins
    const adminEmails = await this.getAdminEmails();
    if (adminEmails.length > 0) {
      const adminContent = `
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
            New Application Submitted
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
            A new ${applicationTypeLabel} application has been submitted and requires review.
          </p>
        </div>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
          <p style="color: #1e40af; font-size: 16px; margin: 0; font-weight: 600;">
            📋 Application Details
          </p>
          <p style="color: #1e3a8a; font-size: 14px; margin: 8px 0 0 0;">
            Application ID: ${data.applicationId}<br>
            Type: ${applicationTypeLabel}<br>
            Applicant: ${data.applicantName} (${data.applicantEmail})<br>
            ${data.businessName ? `Business Name: ${data.businessName}<br>` : ''}
          </p>
        </div>
      `;

      results.push(await this.sendEmail({
        to: adminEmails,
        subject: `New ${applicationTypeLabel} Application - ${data.applicationId}`,
        html: this.getEmailBaseTemplate(adminContent, 'New Application'),
      }));
    }

    return results.some(r => r);
  }

  // Application Approved - Notification to applicant
  static async sendApplicationApprovedEmail(data: ApplicationEmailData): Promise<boolean> {
    const applicantName = data.applicantName || 'there';
    const applicationTypeLabel = data.applicationType === 'designer' ? 'Designer' : 'Shop Owner';
    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
          Hello <strong style="color: #1f2937;">${applicantName}</strong> 👋
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
          Congratulations! Your ${applicationTypeLabel} application has been approved!
        </p>
      </div>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
        <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: 600;">
          ✅ Application Approved
        </p>
        <p style="color: #047857; font-size: 14px; margin: 8px 0 0 0;">
          Application ID: ${data.applicationId}<br>
          ${data.businessName ? `Business Name: ${data.businessName}<br>` : ''}
        </p>
        <p style="color: #047857; font-size: 14px; margin: 8px 0 0 0;">
          You can now access your ${applicationTypeLabel.toLowerCase()} dashboard and start using all the features available to you.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: data.applicantEmail,
      subject: `${applicationTypeLabel} Application Approved`,
      html: this.getEmailBaseTemplate(content, 'Application Approved'),
    });
  }

  // Application Rejected - Notification to applicant
  static async sendApplicationRejectedEmail(data: ApplicationEmailData): Promise<boolean> {
    const applicantName = data.applicantName || 'there';
    const applicationTypeLabel = data.applicationType === 'designer' ? 'Designer' : 'Shop Owner';
    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
          Hello <strong style="color: #1f2937;">${applicantName}</strong> 👋
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
          We've reviewed your ${applicationTypeLabel} application.
        </p>
      </div>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 0 6px 6px 0;">
        <p style="color: #991b1b; font-size: 16px; margin: 0; font-weight: 600;">
          ❌ Application Not Approved
        </p>
        <p style="color: #dc2626; font-size: 14px; margin: 8px 0 0 0;">
          Application ID: ${data.applicationId}<br>
          ${data.businessName ? `Business Name: ${data.businessName}<br>` : ''}
        </p>
        ${data.rejectionReason ? `
        <div style="background-color: #ffffff; padding: 16px; margin: 12px 0; border-radius: 6px; border: 1px solid #e5e7eb;">
          <p style="color: #1f2937; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Reason:</p>
          <p style="color: #4b5563; font-size: 14px; margin: 0; line-height: 1.5;">${data.rejectionReason}</p>
        </div>
        ` : ''}
        <p style="color: #b91c1c; font-size: 14px; margin: 8px 0 0 0;">
          You can review the feedback and resubmit your application if you'd like to try again.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: data.applicantEmail,
      subject: `${applicationTypeLabel} Application Update`,
      html: this.getEmailBaseTemplate(content, 'Application Update'),
    });
  }
}

