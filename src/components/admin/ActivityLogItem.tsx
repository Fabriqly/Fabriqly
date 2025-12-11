'use client';

import React, { useState } from 'react';
import { ActivityWithDetails, ActivityType, ActivityPriority, ACTIVITY_TYPE_CONFIGS } from '@/types/activity';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Package, 
  FolderPlus, 
  FolderOpen, 
  FolderX,
  Palette,
  ShoppingCart,
  Image,
  Store,
  User,
  Settings,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Send,
  Clock,
  ChevronDown
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/timestamp';
import { cn } from '@/utils/cn';

// Icon mapping for activity types
const ActivityIcons: Record<ActivityType, React.ComponentType<any>> = {
  user_registered: UserPlus,
  user_updated: UserCheck,
  user_deleted: UserX,
  product_created: Package,
  product_updated: Package,
  product_deleted: Package,
  product_published: Send,
  product_unpublished: EyeOff,
  product_republished: Eye,
  product_activated: CheckCircle,
  product_deactivated: XCircle,
  category_created: FolderPlus,
  category_updated: FolderOpen,
  category_deleted: FolderX,
  color_created: Palette,
  color_updated: Palette,
  color_deleted: Palette,
  order_created: ShoppingCart,
  order_updated: ShoppingCart,
  order_cancelled: XCircle,
  order_completed: CheckCircle,
  design_created: Image,
  design_updated: Image,
  design_deleted: Image,
  design_published: Eye,
  shop_profile_created: Store,
  shop_profile_updated: Store,
  designer_profile_created: User,
  designer_profile_updated: User,
  designer_verification_requested: Clock,
  designer_verification_approved: CheckCircle,
  designer_verification_rejected: XCircle,
  designer_suspended: XCircle,
  designer_restored: CheckCircle,
  system_event: Settings,
  admin_action: Shield
};

// Priority color mapping
const PriorityColors: Record<ActivityPriority, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

interface ActivityLogItemProps {
  activity: ActivityWithDetails;
  isLast?: boolean;
  onActivityClick?: (activity: ActivityWithDetails) => void;
}

export function ActivityLogItem({ activity, isLast = false, onActivityClick }: ActivityLogItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const IconComponent = ActivityIcons[activity.type] || Settings;
  const priorityColor = PriorityColors[activity.priority] || 'bg-gray-500';
  
  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleActivityLinkClick = (e: React.MouseEvent) => {
    if (activity.target?.url && onActivityClick) {
      e.stopPropagation();
      onActivityClick(activity);
    }
  };

  return (
    <li>
      <div className={cn("relative", !isLast && "pb-8")}>
        <div 
          onClick={handleClick}
          className={cn(
            "relative flex items-start gap-3 p-4 rounded-lg transition-colors cursor-pointer",
            isExpanded ? "bg-gray-50" : "hover:bg-gray-50"
          )}
        >
          {/* Column 1: Icon - Fixed width */}
          <div className="w-10 shrink-0">
            <span className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white",
              priorityColor
            )}>
              <IconComponent className="h-5 w-5 text-white" />
            </span>
          </div>

          {/* Column 2: Content - Takes available space with truncation */}
          <div className="flex-1 min-w-0">
            <div onClick={handleActivityLinkClick}>
              <p className="text-sm text-gray-500">
                {activity.title}
                {activity.target?.name && (
                  <span className={cn(
                    "font-medium ml-1",
                    activity.target?.url ? "text-blue-600 hover:underline" : "text-gray-900"
                  )}>
                    {activity.target.name}
                  </span>
                )}
              </p>
              <p className={cn(
                "text-xs text-gray-400 mt-1",
                isExpanded ? "whitespace-normal break-words" : "truncate"
              )}>
                {activity.description}
              </p>
              {activity.actor && (
                <p className="text-xs text-gray-400 mt-1 break-words">
                  by {activity.actor.name} ({activity.actor.role})
                </p>
              )}
            </div>
          </div>

          {/* Column 3: Metadata - Fixed on the right */}
          <div className="w-auto shrink-0 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <time className="text-xs md:text-sm text-gray-500 whitespace-nowrap">
                {formatRelativeTime(activity.createdAt)}
              </time>
              <ChevronDown 
                className={cn(
                  "w-4 h-4 text-gray-400 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
            <div className="text-xs text-gray-400 capitalize">
              {activity.priority}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}




