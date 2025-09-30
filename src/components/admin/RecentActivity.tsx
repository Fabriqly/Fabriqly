'use client';

import React, { useState, useEffect } from 'react';
import { 
  ActivityWithDetails, 
  ActivityType, 
  ActivityPriority,
  ACTIVITY_TYPE_CONFIGS 
} from '@/types/activity';
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
  Filter,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/utils/timestamp';

interface RecentActivityProps {
  limit?: number;
  showFilters?: boolean;
  showRefresh?: boolean;
  onActivityClick?: (activity: ActivityWithDetails) => void;
}

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

export function RecentActivity({ 
  limit = 10, 
  showFilters = false, 
  showRefresh = true,
  onActivityClick 
}: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    types: [] as ActivityType[],
    priority: [] as ActivityPriority[],
    showAll: false
  });

  useEffect(() => {
    loadActivities();
  }, [limit, filters]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: '0',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: 'active'
      });
      
      if (filters.types.length > 0) {
        params.append('types', filters.types.join(','));
      }
      
      if (filters.priority.length > 0) {
        params.append('priority', filters.priority.join(','));
      }
      
      const response = await fetch(`/api/activities?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        // Handle the new standardized response structure
        if (data.success && data.data) {
          // New ResponseBuilder format: { success: true, data: { data: [...], pagination: {...} } }
          setActivities(data.data.data || []);
        } else if (data.data) {
          // Direct paginated result: { data: [...], pagination: {...} }
          setActivities(data.data || []);
        } else if (data.activities) {
          // Legacy format: { activities: [...] }
          setActivities(data.activities || []);
        } else if (Array.isArray(data)) {
          // Direct array response
          setActivities(data);
        } else {
          setActivities([]);
        }
      } else {
        setError(data.error?.message || data.error || 'Failed to load activities');
      }
    } catch (err) {
      setError('Failed to load activities');
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadActivities();
  };

  const handleActivityClick = (activity: ActivityWithDetails) => {
    if (onActivityClick) {
      onActivityClick(activity);
    } else if (activity.target?.url) {
      window.open(activity.target.url, '_blank');
    }
  };

  const toggleFilter = (type: 'types' | 'priority', value: ActivityType | ActivityPriority) => {
    setFilters(prev => {
      if (type === 'types') {
        const currentTypes = prev.types;
        return {
          ...prev,
          types: currentTypes.includes(value as ActivityType)
            ? currentTypes.filter(item => item !== value)
            : [...currentTypes, value as ActivityType]
        };
      } else {
        const currentPriority = prev.priority;
        return {
          ...prev,
          priority: currentPriority.includes(value as ActivityPriority)
            ? currentPriority.filter(item => item !== value)
            : [...currentPriority, value as ActivityPriority]
        };
      }
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading activities...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Activity
          </h3>
          <div className="flex items-center space-x-2">
            {showRefresh && (
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {showFilters && (
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {!Array.isArray(activities) || activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, index) => {
                const IconComponent = ActivityIcons[activity.type] || Settings;
                const config = ACTIVITY_TYPE_CONFIGS[activity.type];
                const priorityColor = PriorityColors[activity.priority] || 'bg-gray-500';
                
                return (
                  <li key={activity.id}>
                    <div className={`relative ${index < activities.length - 1 ? 'pb-8' : ''}`}>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full ${priorityColor} flex items-center justify-center ring-8 ring-white`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div 
                            className={`${onActivityClick || activity.target?.url ? 'cursor-pointer hover:text-blue-600' : ''}`}
                            onClick={() => handleActivityClick(activity)}
                          >
                            <p className="text-sm text-gray-500">
                              {activity.title}
                              {activity.target?.name && (
                                <span className="font-medium text-gray-900 ml-1">
                                  {activity.target.name}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {activity.description}
                            </p>
                            {activity.actor && (
                              <p className="text-xs text-gray-400 mt-1">
                                by {activity.actor.name} ({activity.actor.role})
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>{formatRelativeTime(activity.createdAt)}</time>
                            <div className="text-xs text-gray-400 mt-1">
                              {activity.priority}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {Array.isArray(activities) && activities.length > 0 && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/dashboard/admin/activities', '_blank')}
            >
              View All Activities
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
