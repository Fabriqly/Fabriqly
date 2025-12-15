import { MySQLService } from './mysql-service';
import { CreateDesignerApplicationData, CreateShopApplicationData } from '@/types/applications';
import type { DatabaseRow } from '@/types/common';

export class ApplicationService {
  // ========================================
  // DESIGNER APPLICATIONS
  // ========================================

  static async createDesignerApplication(
    data: CreateDesignerApplicationData,
    userId: string,
    userEmail: string,
    userName: string
  ) {
    const appId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return MySQLService.transaction(async (connection) => {
      // Insert application
      await connection.execute(
        `INSERT INTO designer_applications 
         (id, user_id, user_email, user_name, business_name, bio, portfolio_url, specialties, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          appId,
          userId,
          userEmail,
          userName,
          data.businessName,
          data.bio,
          data.portfolioUrl || null,
          JSON.stringify(data.specialties || [])
        ]
      );

      // Insert contact info if provided
      if (data.contactInfo && (data.contactInfo.phone || data.contactInfo.website)) {
        await connection.execute(
          `INSERT INTO designer_application_contact (id, application_id, phone, website)
           VALUES (?, ?, ?, ?)`,
          [
            `contact-${Date.now()}`,
            appId,
            data.contactInfo.phone || null,
            data.contactInfo.website || null
          ]
        );
      }

      // Insert social media if provided
      if (data.socialMedia) {
        await connection.execute(
          `INSERT INTO designer_application_social_media 
           (id, application_id, facebook, instagram, twitter, linkedin)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            `social-${Date.now()}`,
            appId,
            data.socialMedia.facebook || null,
            data.socialMedia.instagram || null,
            data.socialMedia.twitter || null,
            data.socialMedia.linkedin || null
          ]
        );
      }

      // Insert sample designs if provided
      if (data.sampleDesigns && data.sampleDesigns.length > 0) {
        for (let i = 0; i < data.sampleDesigns.length; i++) {
          await connection.execute(
            `INSERT INTO designer_application_sample_designs (id, application_id, design_url, display_order)
             VALUES (?, ?, ?, ?)`,
            [`sample-${Date.now()}-${i}`, appId, data.sampleDesigns[i], i]
          );
        }
      }

      // Update user role to pending_designer
      await connection.execute(
        'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
        ['pending_designer', userId]
      );

      // Log activity
      await connection.execute(
        `INSERT INTO application_activity_log (id, application_type, application_id, user_id, action, details, created_at)
         VALUES (?, 'designer', ?, ?, 'submitted', ?, NOW())`,
        [`log-${Date.now()}`, appId, userId, JSON.stringify({ businessName: data.businessName })]
      );

      return { id: appId };
    });
  }

  static async getDesignerApplications(userId?: string, status?: string, isAdmin = false) {
    let query = `
      SELECT 
        da.*,
        dac.phone, dac.website,
        dsm.facebook, dsm.instagram, dsm.twitter, dsm.linkedin
      FROM designer_applications da
      LEFT JOIN designer_application_contact dac ON da.id = dac.application_id
      LEFT JOIN designer_application_social_media dsm ON da.id = dsm.application_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isAdmin && userId) {
      query += ' AND da.user_id = ?';
      params.push(userId);
    } else if (userId) {
      query += ' AND da.user_id = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND da.status = ?';
      params.push(status);
    }

    query += ' ORDER BY da.applied_at DESC';

    const applications = await MySQLService.getMany(query, params);

    // Parse JSON fields
    return applications.map((app: DatabaseRow) => ({
      ...app,
      specialties: app.specialties ? JSON.parse(String(app.specialties)) : []
    }));
  }

  static async getDesignerApplicationById(id: string) {
    const app = await MySQLService.getOne(
      `SELECT 
        da.*,
        dac.phone, dac.website,
        dsm.facebook, dsm.instagram, dsm.twitter, dsm.linkedin
      FROM designer_applications da
      LEFT JOIN designer_application_contact dac ON da.id = dac.application_id
      LEFT JOIN designer_application_social_media dsm ON da.id = dsm.application_id
      WHERE da.id = ?`,
      [id]
    );

    if (!app) return null;

    // Get sample designs
    const samples = await MySQLService.getMany(
      'SELECT design_url FROM designer_application_sample_designs WHERE application_id = ? ORDER BY display_order',
      [id]
    );

    return {
      ...app,
      specialties: app.specialties ? JSON.parse(String(app.specialties)) : [],
      sampleDesigns: samples.map((s: DatabaseRow) => s.design_url as string)
    };
  }

  static async approveDesignerApplication(id: string, adminId: string, adminNotes?: string) {
    return MySQLService.transaction(async (connection) => {
      // Get application details
      const [apps] = await connection.execute(
        'SELECT user_id FROM designer_applications WHERE id = ?',
        [id]
      ) as [DatabaseRow[]];
      const app = apps[0];
      if (!app) throw new Error('Application not found');

      // Update application
      await connection.execute(
        `UPDATE designer_applications 
         SET status = 'approved', reviewed_at = NOW(), reviewed_by = ?, admin_notes = ?
         WHERE id = ?`,
        [adminId, adminNotes || null, id]
      );

      // Update user role (trigger will handle this, but we'll do it explicitly too)
      await connection.execute(
        'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
        ['designer', app.user_id]
      );

      // Log activity
      await connection.execute(
        `INSERT INTO application_activity_log (id, application_type, application_id, user_id, action, details, created_at)
         VALUES (?, 'designer', ?, ?, 'approved', ?, NOW())`,
        [`log-${Date.now()}`, id, adminId, JSON.stringify({ adminNotes })]
      );
    });
  }

  static async rejectDesignerApplication(id: string, adminId: string, rejectionReason: string, adminNotes?: string) {
    return MySQLService.transaction(async (connection) => {
      // Get application details
      const [apps] = await connection.execute(
        'SELECT user_id FROM designer_applications WHERE id = ?',
        [id]
      ) as [DatabaseRow[]];
      const app = apps[0];
      if (!app) throw new Error('Application not found');

      // Update application
      await connection.execute(
        `UPDATE designer_applications 
         SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ?, 
             rejection_reason = ?, admin_notes = ?
         WHERE id = ?`,
        [adminId, rejectionReason, adminNotes || null, id]
      );

      // Update user role (trigger will handle this, but we'll do it explicitly too)
      await connection.execute(
        'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
        ['customer', app.user_id]
      );

      // Log activity
      await connection.execute(
        `INSERT INTO application_activity_log (id, application_type, application_id, user_id, action, details, created_at)
         VALUES (?, 'designer', ?, ?, 'rejected', ?, NOW())`,
        [`log-${Date.now()}`, id, adminId, JSON.stringify({ rejectionReason, adminNotes })]
      );
    });
  }

  // ========================================
  // SHOP APPLICATIONS
  // ========================================

  static async createShopApplication(
    data: CreateShopApplicationData,
    userId: string,
    userEmail: string,
    userName: string
  ) {
    const appId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return MySQLService.transaction(async (connection) => {
      // Insert application
      await connection.execute(
        `INSERT INTO shop_applications 
         (id, user_id, user_email, user_name, shop_name, description, business_registration_number,
          tax_id, shop_category, tagline, website_url, profile_banner, shop_logo, return_policy,
          processing_time, payment_account_info, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          appId, userId, userEmail, userName, data.shopName, data.description,
          data.businessRegistrationNumber || null, data.taxId || null,
          data.shopCategory || null, data.tagline || null, data.websiteUrl || null,
          data.profileBanner || null, data.shopLogo || null, data.returnPolicy || null,
          data.processingTime || null, data.paymentAccountInfo || null
        ]
      );

      // Insert address
      await connection.execute(
        `INSERT INTO shop_application_address (id, application_id, street, city, state, zip_code, country)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `addr-${Date.now()}`, appId,
          data.address.street, data.address.city,
          data.address.state || null, data.address.zipCode || null, data.address.country
        ]
      );

      // Insert contact info
      await connection.execute(
        `INSERT INTO shop_application_contact (id, application_id, phone, email)
         VALUES (?, ?, ?, ?)`,
        [`contact-${Date.now()}`, appId, data.contactInfo.phone, data.contactInfo.email]
      );

      // Insert social media if provided
      if (data.socialMedia) {
        await connection.execute(
          `INSERT INTO shop_application_social_media 
           (id, application_id, facebook, instagram, tiktok, twitter, linkedin)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `social-${Date.now()}`, appId,
            data.socialMedia.facebook || null,
            data.socialMedia.instagram || null,
            data.socialMedia.tiktok || null,
            data.socialMedia.twitter || null,
            data.socialMedia.linkedin || null
          ]
        );
      }

      // Insert specialties
      if (data.specialties && data.specialties.length > 0) {
        for (const specialty of data.specialties) {
          await connection.execute(
            'INSERT INTO shop_application_specialties (id, application_id, specialty) VALUES (?, ?, ?)',
            [`spec-${Date.now()}-${Math.random()}`, appId, specialty]
          );
        }
      }

      // Insert service tags
      if (data.serviceTags && data.serviceTags.length > 0) {
        for (const tag of data.serviceTags) {
          await connection.execute(
            'INSERT INTO shop_application_service_tags (id, application_id, tag) VALUES (?, ?, ?)',
            [`tag-${Date.now()}-${Math.random()}`, appId, tag]
          );
        }
      }

      // Insert material specialties
      if (data.materialSpecialties && data.materialSpecialties.length > 0) {
        for (const material of data.materialSpecialties) {
          await connection.execute(
            'INSERT INTO shop_application_material_specialties (id, application_id, material) VALUES (?, ?, ?)',
            [`mat-${Date.now()}-${Math.random()}`, appId, material]
          );
        }
      }

      // Insert payment methods
      if (data.paymentMethods && data.paymentMethods.length > 0) {
        for (const method of data.paymentMethods) {
          await connection.execute(
            'INSERT INTO shop_application_payment_methods (id, application_id, payment_method) VALUES (?, ?, ?)',
            [`pay-${Date.now()}-${Math.random()}`, appId, method]
          );
        }
      }

      // Insert shipping options
      if (data.shippingOptions && data.shippingOptions.length > 0) {
        for (const option of data.shippingOptions) {
          await connection.execute(
            'INSERT INTO shop_application_shipping_options (id, application_id, shipping_option) VALUES (?, ?, ?)',
            [`ship-${Date.now()}-${Math.random()}`, appId, option]
          );
        }
      }

      // Insert business documents
      if (data.businessDocuments && data.businessDocuments.length > 0) {
        for (let i = 0; i < data.businessDocuments.length; i++) {
          const doc = data.businessDocuments[i];
          await connection.execute(
            'INSERT INTO shop_application_business_documents (id, application_id, label, url, file_name, display_order) VALUES (?, ?, ?, ?, ?, ?)',
            [`doc-${Date.now()}-${i}`, appId, doc.label, doc.url, doc.fileName, i]
          );
        }
      }

      // Update user role to pending_shop
      await connection.execute(
        'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
        ['pending_shop', userId]
      );

      // Log activity
      await connection.execute(
        `INSERT INTO application_activity_log (id, application_type, application_id, user_id, action, details, created_at)
         VALUES (?, 'shop', ?, ?, 'submitted', ?, NOW())`,
        [`log-${Date.now()}`, appId, userId, JSON.stringify({ shopName: data.shopName })]
      );

      return { id: appId };
    });
  }

  static async getShopApplications(userId?: string, status?: string, isAdmin = false) {
    let query = `
      SELECT 
        sa.*,
        sac.phone, sac.email as contact_email,
        saa.street, saa.city, saa.state, saa.zip_code, saa.country,
        ssm.facebook, ssm.instagram, ssm.tiktok, ssm.twitter, ssm.linkedin
      FROM shop_applications sa
      LEFT JOIN shop_application_contact sac ON sa.id = sac.application_id
      LEFT JOIN shop_application_address saa ON sa.id = saa.application_id
      LEFT JOIN shop_application_social_media ssm ON sa.id = ssm.application_id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (!isAdmin && userId) {
      query += ' AND sa.user_id = ?';
      params.push(userId);
    } else if (userId) {
      query += ' AND sa.user_id = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND sa.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sa.applied_at DESC';

    return MySQLService.getMany(query, params);
  }

  static async getShopApplicationById(id: string) {
    const app = await MySQLService.getOne(
      `SELECT 
        sa.*,
        sac.phone, sac.email as contact_email,
        saa.street, saa.city, saa.state, saa.zip_code, saa.country,
        ssm.facebook, ssm.instagram, ssm.tiktok, ssm.twitter, ssm.linkedin
      FROM shop_applications sa
      LEFT JOIN shop_application_contact sac ON sa.id = sac.application_id
      LEFT JOIN shop_application_address saa ON sa.id = saa.application_id
      LEFT JOIN shop_application_social_media ssm ON sa.id = ssm.application_id
      WHERE sa.id = ?`,
      [id]
    );

    if (!app) return null;

    // Get related data
    const [specialties, serviceTags, materialSpecialties, paymentMethods, shippingOptions, businessDocuments] = await Promise.all([
      MySQLService.getMany('SELECT specialty FROM shop_application_specialties WHERE application_id = ?', [id]),
      MySQLService.getMany('SELECT tag FROM shop_application_service_tags WHERE application_id = ?', [id]),
      MySQLService.getMany('SELECT material FROM shop_application_material_specialties WHERE application_id = ?', [id]),
      MySQLService.getMany('SELECT payment_method FROM shop_application_payment_methods WHERE application_id = ?', [id]),
      MySQLService.getMany('SELECT shipping_option FROM shop_application_shipping_options WHERE application_id = ?', [id]),
      MySQLService.getMany('SELECT label, url, file_name FROM shop_application_business_documents WHERE application_id = ? ORDER BY display_order', [id])
    ]);

    return {
      ...app,
      specialties: specialties.map((s: DatabaseRow) => s.specialty as string),
      serviceTags: serviceTags.map((t: DatabaseRow) => t.tag as string),
      materialSpecialties: materialSpecialties.map((m: DatabaseRow) => m.material as string),
      paymentMethods: paymentMethods.map((p: DatabaseRow) => p.payment_method as string),
      shippingOptions: shippingOptions.map((s: DatabaseRow) => s.shipping_option as string),
      businessDocuments: businessDocuments.map((d: DatabaseRow) => ({
        label: d.label as string,
        url: d.url as string,
        fileName: d.file_name as string
      }))
    };
  }

  static async approveShopApplication(id: string, adminId: string, adminNotes?: string) {
    return MySQLService.transaction(async (connection) => {
      // Get application details
      const [apps] = await connection.execute(
        'SELECT user_id FROM shop_applications WHERE id = ?',
        [id]
      ) as [DatabaseRow[]];
      const app = apps[0];
      if (!app) throw new Error('Application not found');

      // Update application
      await connection.execute(
        `UPDATE shop_applications 
         SET status = 'approved', reviewed_at = NOW(), reviewed_by = ?, admin_notes = ?
         WHERE id = ?`,
        [adminId, adminNotes || null, id]
      );

      // Update user role (trigger will handle this, but we'll do it explicitly too)
      await connection.execute(
        'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
        ['business_owner', app.user_id]
      );

      // Log activity
      await connection.execute(
        `INSERT INTO application_activity_log (id, application_type, application_id, user_id, action, details, created_at)
         VALUES (?, 'shop', ?, ?, 'approved', ?, NOW())`,
        [`log-${Date.now()}`, id, adminId, JSON.stringify({ adminNotes })]
      );
    });
  }

  static async rejectShopApplication(id: string, adminId: string, rejectionReason: string, adminNotes?: string) {
    return MySQLService.transaction(async (connection) => {
      // Get application details
      const [apps] = await connection.execute(
        'SELECT user_id FROM shop_applications WHERE id = ?',
        [id]
      ) as [DatabaseRow[]];
      const app = apps[0];
      if (!app) throw new Error('Application not found');

      // Update application
      await connection.execute(
        `UPDATE shop_applications 
         SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ?, 
             rejection_reason = ?, admin_notes = ?
         WHERE id = ?`,
        [adminId, rejectionReason, adminNotes || null, id]
      );

      // Update user role (trigger will handle this, but we'll do it explicitly too)
      await connection.execute(
        'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
        ['customer', app.user_id]
      );

      // Log activity
      await connection.execute(
        `INSERT INTO application_activity_log (id, application_type, application_id, user_id, action, details, created_at)
         VALUES (?, 'shop', ?, ?, 'rejected', ?, NOW())`,
        [`log-${Date.now()}`, id, adminId, JSON.stringify({ rejectionReason, adminNotes })]
      );
    });
  }
}

