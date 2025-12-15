import { CreateActivityData } from '@/types/activity';

// Activity logging utility
export class ActivityLogger {
  // Log a new activity
  static async logActivity(activityData: CreateActivityData): Promise<void> {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        console.error('Failed to log activity:', await response.text());
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Helper methods for common activity types
  static async logUserRegistration(userId: string, userEmail: string, userName?: string): Promise<void> {
    await this.logActivity({
      type: 'user_registered',
      title: 'User Registration',
      description: `New user registered: ${userEmail}`,
      priority: 'medium',
      actorId: userId,
      targetId: userId,
      targetType: 'user',
      targetName: userName || userEmail,
      metadata: {
        email: userEmail,
        registrationMethod: 'email'
      }
    });
  }

  static async logUserUpdate(userId: string, userEmail: string, updatedFields: string[]): Promise<void> {
    await this.logActivity({
      type: 'user_updated',
      title: 'User Profile Updated',
      description: `User profile updated: ${updatedFields.join(', ')}`,
      priority: 'low',
      actorId: userId,
      targetId: userId,
      targetType: 'user',
      targetName: userEmail,
      metadata: {
        updatedFields,
        email: userEmail
      }
    });
  }

  static async logProductCreation(productId: string, productName: string, creatorId: string): Promise<void> {
    await this.logActivity({
      type: 'product_created',
      title: 'Product Created',
      description: `New product created: ${productName}`,
      priority: 'medium',
      actorId: creatorId,
      targetId: productId,
      targetType: 'product',
      targetName: productName,
      metadata: {
        productName,
        creatorId
      }
    });
  }

  static async logProductUpdate(productId: string, productName: string, updaterId: string, updatedFields: string[]): Promise<void> {
    await this.logActivity({
      type: 'product_updated',
      title: 'Product Updated',
      description: `Product updated: ${updatedFields.join(', ')}`,
      priority: 'low',
      actorId: updaterId,
      targetId: productId,
      targetType: 'product',
      targetName: productName,
      metadata: {
        updatedFields,
        productName
      }
    });
  }

  static async logProductDeletion(productId: string, productName: string, deleterId: string): Promise<void> {
    await this.logActivity({
      type: 'product_deleted',
      title: 'Product Deleted',
      description: `Product deleted: ${productName}`,
      priority: 'high',
      actorId: deleterId,
      targetId: productId,
      targetType: 'product',
      targetName: productName,
      metadata: {
        productName,
        deleterId
      }
    });
  }

  static async logCategoryCreation(categoryId: string, categoryName: string, creatorId: string): Promise<void> {
    await this.logActivity({
      type: 'category_created',
      title: 'Category Created',
      description: `New category created: ${categoryName}`,
      priority: 'medium',
      actorId: creatorId,
      targetId: categoryId,
      targetType: 'category',
      targetName: categoryName,
      metadata: {
        categoryName,
        creatorId
      }
    });
  }

  static async logCategoryUpdate(categoryId: string, categoryName: string, updaterId: string, updatedFields: string[]): Promise<void> {
    await this.logActivity({
      type: 'category_updated',
      title: 'Category Updated',
      description: `Category updated: ${updatedFields.join(', ')}`,
      priority: 'low',
      actorId: updaterId,
      targetId: categoryId,
      targetType: 'category',
      targetName: categoryName,
      metadata: {
        updatedFields,
        categoryName
      }
    });
  }

  static async logCategoryDeletion(categoryId: string, categoryName: string, deleterId: string): Promise<void> {
    await this.logActivity({
      type: 'category_deleted',
      title: 'Category Deleted',
      description: `Category deleted: ${categoryName}`,
      priority: 'high',
      actorId: deleterId,
      targetId: categoryId,
      targetType: 'category',
      targetName: categoryName,
      metadata: {
        categoryName,
        deleterId
      }
    });
  }

  static async logColorCreation(colorId: string, colorName: string, creatorId: string): Promise<void> {
    await this.logActivity({
      type: 'color_created',
      title: 'Color Created',
      description: `New color added: ${colorName}`,
      priority: 'low',
      actorId: creatorId,
      targetId: colorId,
      targetType: 'color',
      targetName: colorName,
      metadata: {
        colorName,
        creatorId
      }
    });
  }

  static async logColorUpdate(colorId: string, colorName: string, updaterId: string, updatedFields: string[]): Promise<void> {
    await this.logActivity({
      type: 'color_updated',
      title: 'Color Updated',
      description: `Color updated: ${updatedFields.join(', ')}`,
      priority: 'low',
      actorId: updaterId,
      targetId: colorId,
      targetType: 'color',
      targetName: colorName,
      metadata: {
        updatedFields,
        colorName
      }
    });
  }

  static async logColorDeletion(colorId: string, colorName: string, deleterId: string): Promise<void> {
    await this.logActivity({
      type: 'color_deleted',
      title: 'Color Deleted',
      description: `Color deleted: ${colorName}`,
      priority: 'medium',
      actorId: deleterId,
      targetId: colorId,
      targetType: 'color',
      targetName: colorName,
      metadata: {
        colorName,
        deleterId
      }
    });
  }

  static async logOrderCreation(orderId: string, orderNumber: string, customerId: string, totalAmount: number): Promise<void> {
    await this.logActivity({
      type: 'order_created',
      title: 'Order Created',
      description: `New order placed: ${orderNumber}`,
      priority: 'high',
      actorId: customerId,
      targetId: orderId,
      targetType: 'order',
      targetName: orderNumber,
      metadata: {
        orderNumber,
        customerId,
        totalAmount
      }
    });
  }

  static async logOrderUpdate(orderId: string, orderNumber: string, updaterId: string, newStatus: string): Promise<void> {
    await this.logActivity({
      type: 'order_updated',
      title: 'Order Updated',
      description: `Order status changed to: ${newStatus}`,
      priority: 'medium',
      actorId: updaterId,
      targetId: orderId,
      targetType: 'order',
      targetName: orderNumber,
      metadata: {
        orderNumber,
        newStatus,
        updaterId
      }
    });
  }

  static async logOrderCompletion(orderId: string, orderNumber: string, completerId: string): Promise<void> {
    await this.logActivity({
      type: 'order_completed',
      title: 'Order Completed',
      description: `Order completed: ${orderNumber}`,
      priority: 'high',
      actorId: completerId,
      targetId: orderId,
      targetType: 'order',
      targetName: orderNumber,
      metadata: {
        orderNumber,
        completerId
      }
    });
  }

  static async logOrderCancellation(orderId: string, orderNumber: string, cancellerId: string, reason?: string): Promise<void> {
    await this.logActivity({
      type: 'order_cancelled',
      title: 'Order Cancelled',
      description: `Order cancelled: ${orderNumber}`,
      priority: 'high',
      actorId: cancellerId,
      targetId: orderId,
      targetType: 'order',
      targetName: orderNumber,
      metadata: {
        orderNumber,
        cancellerId,
        reason
      }
    });
  }

  static async logDesignCreation(designId: string, designName: string, designerId: string): Promise<void> {
    await this.logActivity({
      type: 'design_created',
      title: 'Design Created',
      description: `New design uploaded: ${designName}`,
      priority: 'medium',
      actorId: designerId,
      targetId: designId,
      targetType: 'design',
      targetName: designName,
      metadata: {
        designName,
        designerId
      }
    });
  }

  static async logDesignPublishing(designId: string, designName: string, publisherId: string): Promise<void> {
    await this.logActivity({
      type: 'design_published',
      title: 'Design Published',
      description: `Design published: ${designName}`,
      priority: 'medium',
      actorId: publisherId,
      targetId: designId,
      targetType: 'design',
      targetName: designName,
      metadata: {
        designName,
        publisherId
      }
    });
  }

  static async logShopProfileCreation(shopId: string, shopName: string, ownerId: string): Promise<void> {
    await this.logActivity({
      type: 'shop_profile_created',
      title: 'Shop Profile Created',
      description: `New shop profile created: ${shopName}`,
      priority: 'medium',
      actorId: ownerId,
      targetId: shopId,
      targetType: 'shop',
      targetName: shopName,
      metadata: {
        shopName,
        ownerId
      }
    });
  }

  static async logDesignerProfileCreation(designerId: string, designerName: string, userId: string): Promise<void> {
    await this.logActivity({
      type: 'designer_profile_created',
      title: 'Designer Profile Created',
      description: `New designer profile created: ${designerName}`,
      priority: 'medium',
      actorId: userId,
      targetId: designerId,
      targetType: 'designer',
      targetName: designerName,
      metadata: {
        designerName,
        userId
      }
    });
  }

  static async logAdminAction(action: string, adminId: string, targetId?: string, targetType?: string, targetName?: string): Promise<void> {
    await this.logActivity({
      type: 'admin_action',
      title: 'Admin Action',
      description: `Admin action: ${action}`,
      priority: 'high',
      actorId: adminId,
      targetId,
      targetType,
      targetName,
      metadata: {
        action,
        adminId
      }
    });
  }

  static async logSystemEvent(eventName: string, eventData: unknown): Promise<void> {
    await this.logActivity({
      type: 'system_event',
      title: 'System Event',
      description: `System event: ${eventName}`,
      priority: 'medium',
      metadata: {
        eventName,
        eventData
      },
      systemEvent: {
        eventName,
        eventData
      }
    });
  }
}

