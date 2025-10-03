import { Timestamp } from 'firebase/firestore';

// Activity Types
export type ActivityType = 
  | 'user_registered'
  | 'user_updated'
  | 'user_deleted'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'product_published'
  | 'product_unpublished'
  | 'product_republished'
  | 'product_activated'
  | 'product_deactivated'
  | 'category_created'
  | 'category_updated'
  | 'category_deleted'
  | 'color_created'
  | 'color_updated'
  | 'color_deleted'
  | 'order_created'
  | 'order_updated'
  | 'order_cancelled'
  | 'order_completed'
  | 'design_created'
  | 'design_updated'
  | 'design_deleted'
  | 'design_published'
  | 'shop_profile_created'
  | 'shop_profile_updated'
  | 'designer_profile_created'
  | 'designer_profile_updated'
  | 'designer_verification_requested'
  | 'designer_verification_approved'
  | 'designer_verification_rejected'
  | 'designer_suspended'
  | 'designer_restored'
  | 'system_event'
  | 'admin_action';

// Activity Priority Levels
export type ActivityPriority = 'low' | 'medium' | 'high' | 'critical';

// Activity Status
export type ActivityStatus = 'active' | 'archived' | 'deleted';

// Main Activity Interface
export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  priority: ActivityPriority;
  status: ActivityStatus;
  
  // Actor information (who performed the action)
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  
  // Target information (what was affected)
  targetId?: string;
  targetType?: string;
  targetName?: string;
  
  // Additional metadata
  metadata?: {
    [key: string]: any;
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // For system events
  systemEvent?: {
    eventName: string;
    eventData: any;
  };
}

// Activity with related data
export interface ActivityWithDetails extends Activity {
  actor?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  target?: {
    id: string;
    name: string;
    type: string;
    url?: string;
  };
}

// Activity Filters
export interface ActivityFilters {
  types?: ActivityType[];
  priority?: ActivityPriority[];
  status?: ActivityStatus[];
  actorId?: string;
  targetId?: string;
  targetType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'priority' | 'type';
  sortOrder?: 'asc' | 'desc';
}

// Activity Creation Data
export interface CreateActivityData {
  type: ActivityType;
  title: string;
  description: string;
  priority?: ActivityPriority;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  targetName?: string;
  metadata?: {
    [key: string]: any;
  };
  systemEvent?: {
    eventName: string;
    eventData: any;
  };
}

// Activity Update Data
export interface UpdateActivityData {
  title?: string;
  description?: string;
  priority?: ActivityPriority;
  status?: ActivityStatus;
  metadata?: {
    [key: string]: any;
  };
}

// Activity Statistics
export interface ActivityStats {
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByPriority: Record<ActivityPriority, number>;
  recentActivityCount: number; // Last 24 hours
  topActors: Array<{
    actorId: string;
    actorName: string;
    count: number;
  }>;
}

// Activity Configuration for different types
export interface ActivityTypeConfig {
  type: ActivityType;
  title: string;
  description: string;
  icon: string;
  color: string;
  priority: ActivityPriority;
  defaultStatus: ActivityStatus;
}

// Predefined activity configurations
export const ACTIVITY_TYPE_CONFIGS: Record<ActivityType, ActivityTypeConfig> = {
  user_registered: {
    type: 'user_registered',
    title: 'User Registration',
    description: 'A new user has registered',
    icon: 'UserPlus',
    color: 'bg-blue-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  user_updated: {
    type: 'user_updated',
    title: 'User Updated',
    description: 'User profile has been updated',
    icon: 'UserEdit',
    color: 'bg-blue-500',
    priority: 'low',
    defaultStatus: 'active'
  },
  user_deleted: {
    type: 'user_deleted',
    title: 'User Deleted',
    description: 'User account has been deleted',
    icon: 'UserX',
    color: 'bg-red-500',
    priority: 'high',
    defaultStatus: 'active'
  },
  product_created: {
    type: 'product_created',
    title: 'Product Created',
    description: 'A new product has been created',
    icon: 'Package',
    color: 'bg-green-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  product_updated: {
    type: 'product_updated',
    title: 'Product Updated',
    description: 'Product information has been updated',
    icon: 'Package',
    color: 'bg-green-500',
    priority: 'low',
    defaultStatus: 'active'
  },
  product_deleted: {
    type: 'product_deleted',
    title: 'Product Deleted',
    description: 'A product has been deleted',
    icon: 'Package',
    color: 'bg-red-500',
    priority: 'high',
    defaultStatus: 'active'
  },
  product_published: {
    type: 'product_published',
    title: 'Product Published',
    description: 'A product has been published and is now live',
    icon: 'Send',
    color: 'bg-green-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  product_unpublished: {
    type: 'product_unpublished',
    title: 'Product Unpublished',
    description: 'A product has been unpublished and is no longer visible',
    icon: 'EyeOff',
    color: 'bg-orange-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  product_republished: {
    type: 'product_republished',
    title: 'Product Republished',
    description: 'A product has been republished and is now visible again',
    icon: 'Eye',
    color: 'bg-green-500',
    priority: 'low',
    defaultStatus: 'active'
  },
  product_activated: {
    type: 'product_activated',
    title: 'Product Activated',
    description: 'A product has been activated',
    icon: 'CheckCircle',
    color: 'bg-green-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  product_deactivated: {
    type: 'product_deactivated',
    title: 'Product Deactivated',
    description: 'A product has been deactivated',
    icon: 'XCircle',
    color: 'bg-yellow-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  category_created: {
    type: 'category_created',
    title: 'Category Created',
    description: 'A new category has been created',
    icon: 'FolderPlus',
    color: 'bg-purple-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  category_updated: {
    type: 'category_updated',
    title: 'Category Updated',
    description: 'Category information has been updated',
    icon: 'FolderEdit',
    color: 'bg-purple-500',
    priority: 'low',
    defaultStatus: 'active'
  },
  category_deleted: {
    type: 'category_deleted',
    title: 'Category Deleted',
    description: 'A category has been deleted',
    icon: 'FolderX',
    color: 'bg-red-500',
    priority: 'high',
    defaultStatus: 'active'
  },
  color_created: {
    type: 'color_created',
    title: 'Color Created',
    description: 'A new color has been added',
    icon: 'Palette',
    color: 'bg-pink-500',
    priority: 'low',
    defaultStatus: 'active'
  },
  color_updated: {
    type: 'color_updated',
    title: 'Color Updated',
    description: 'Color information has been updated',
    icon: 'Palette',
    color: 'bg-pink-500',
    priority: 'low',
    defaultStatus: 'active'
  },
  color_deleted: {
    type: 'color_deleted',
    title: 'Color Deleted',
    description: 'A color has been deleted',
    icon: 'Palette',
    color: 'bg-red-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  order_created: {
    type: 'order_created',
    title: 'Order Created',
    description: 'A new order has been placed',
    icon: 'ShoppingCart',
    color: 'bg-orange-500',
    priority: 'high',
    defaultStatus: 'active'
  },
  order_updated: {
    type: 'order_updated',
    title: 'Order Updated',
    description: 'Order status has been updated',
    icon: 'ShoppingCart',
    color: 'bg-orange-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  order_cancelled: {
    type: 'order_cancelled',
    title: 'Order Cancelled',
    description: 'An order has been cancelled',
    icon: 'XCircle',
    color: 'bg-red-500',
    priority: 'high',
    defaultStatus: 'active'
  },
  order_completed: {
    type: 'order_completed',
    title: 'Order Completed',
    description: 'An order has been completed',
    icon: 'CheckCircle',
    color: 'bg-green-500',
    priority: 'high',
    defaultStatus: 'active'
  },
  design_created: {
    type: 'design_created',
    title: 'Design Created',
    description: 'A new design has been uploaded',
    icon: 'Image',
    color: 'bg-indigo-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  design_updated: {
    type: 'design_updated',
    title: 'Design Updated',
    description: 'Design information has been updated',
    icon: 'Image',
    color: 'bg-indigo-500',
    priority: 'low',
    defaultStatus: 'active'
  },
  design_deleted: {
    type: 'design_deleted',
    title: 'Design Deleted',
    description: 'A design has been deleted',
    icon: 'Image',
    color: 'bg-red-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  design_published: {
    type: 'design_published',
    title: 'Design Published',
    description: 'A design has been published',
    icon: 'Eye',
    color: 'bg-green-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  shop_profile_created: {
    type: 'shop_profile_created',
    title: 'Shop Profile Created',
    description: 'A new shop profile has been created',
    icon: 'Store',
    color: 'bg-emerald-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  shop_profile_updated: {
    type: 'shop_profile_updated',
    title: 'Shop Profile Updated',
    description: 'Shop profile has been updated',
    icon: 'Store',
    color: 'bg-emerald-500',
    priority: 'low',
    defaultStatus: 'active'
  },
  designer_profile_created: {
    type: 'designer_profile_created',
    title: 'Designer Profile Created',
    description: 'A new designer profile has been created',
    icon: 'User',
    color: 'bg-violet-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  designer_profile_updated: {
    type: 'designer_profile_updated',
    title: 'Designer Profile Updated',
    description: 'Designer profile has been updated',
    icon: 'User',
    color: 'bg-violet-500',
    priority: 'low',
    defaultStatus: 'active'
  },
  designer_verification_requested: {
    type: 'designer_verification_requested',
    title: 'Designer Verification Requested',
    description: 'A designer has requested verification',
    icon: 'Clock',
    color: 'bg-yellow-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  designer_verification_approved: {
    type: 'designer_verification_approved',
    title: 'Designer Verification Approved',
    description: 'A designer verification has been approved',
    icon: 'CheckCircle',
    color: 'bg-green-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  designer_verification_rejected: {
    type: 'designer_verification_rejected',
    title: 'Designer Verification Rejected',
    description: 'A designer verification has been rejected',
    icon: 'XCircle',
    color: 'bg-red-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  designer_suspended: {
    type: 'designer_suspended',
    title: 'Designer Account Suspended',
    description: 'A designer account has been suspended',
    icon: 'XCircle',
    color: 'bg-red-500',
    priority: 'high',
    defaultStatus: 'active'
  },
  designer_restored: {
    type: 'designer_restored',
    title: 'Designer Account Restored',
    description: 'A designer account has been restored',
    icon: 'CheckCircle',
    color: 'bg-green-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  system_event: {
    type: 'system_event',
    title: 'System Event',
    description: 'A system event has occurred',
    icon: 'Settings',
    color: 'bg-gray-500',
    priority: 'medium',
    defaultStatus: 'active'
  },
  admin_action: {
    type: 'admin_action',
    title: 'Admin Action',
    description: 'An admin action has been performed',
    icon: 'Shield',
    color: 'bg-red-500',
    priority: 'high',
    defaultStatus: 'active'
  }
};
