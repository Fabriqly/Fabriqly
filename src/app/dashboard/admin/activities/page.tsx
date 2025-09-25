'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  ActivityWithDetails, 
  ActivityType, 
  ActivityPriority,
  ActivityFilters,
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
  RefreshCw,
  Search,
  Calendar,
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatRelativeTime, formatTimestampISO } from '@/utils/timestamp';

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

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<ActivityWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({
    types: [],
    priority: [],
    status: ['active'],
    limit: 20,
    offset: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false,
    currentPage: 1,
    totalPages: 0
  });

  useEffect(() => {
    loadActivities();
  }, [filters]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        limit: filters.limit?.toString() || '20',
        offset: filters.offset?.toString() || '0',
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc'
      });
      
      if (filters.types && filters.types.length > 0) {
        params.append('types', filters.types.join(','));
      }
      
      if (filters.priority && filters.priority.length > 0) {
        params.append('priority', filters.priority.join(','));
      }
      
      if (filters.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }
      
      if (filters.actorId) {
        params.append('actorId', filters.actorId);
      }
      
      if (filters.targetId) {
        params.append('targetId', filters.targetId);
      }
      
      if (filters.targetType) {
        params.append('targetType', filters.targetType);
      }
      
      const response = await fetch(`/api/activities?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setActivities(data.activities || []);
        const paginationData = data.pagination || {
          limit: 20,
          offset: 0,
          total: 0,
          hasMore: false
        };
        
        // Calculate pagination info
        const currentPage = Math.floor(paginationData.offset / paginationData.limit) + 1;
        const totalPages = Math.ceil(paginationData.total / paginationData.limit);
        
        setPagination({
          ...paginationData,
          currentPage,
          totalPages
        });
      } else {
        setError(data.error || 'Failed to load activities');
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

  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * (filters.limit || 20);
    setFilters(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  const handlePageSizeChange = (newLimit: number) => {
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      offset: 0 // Reset to first page when changing page size
    }));
  };

  const handleFilterChange = (key: keyof ActivityFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset pagination when filters change
    }));
  };

  const toggleFilter = (type: 'types' | 'priority', value: ActivityType | ActivityPriority) => {
    if (type === 'types') {
      const currentValues = filters.types || [];
      const newValues = currentValues.includes(value as ActivityType)
        ? currentValues.filter(item => item !== (value as ActivityType))
        : [...currentValues, value as ActivityType];
      handleFilterChange('types', newValues);
    } else if (type === 'priority') {
      const currentValues = filters.priority || [];
      const newValues = currentValues.includes(value as ActivityPriority)
        ? currentValues.filter(item => item !== (value as ActivityPriority))
        : [...currentValues, value as ActivityPriority];
      handleFilterChange('priority', newValues);
    }
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      priority: [],
      status: ['active'],
      limit: 20,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchTerm('');
  };

  const handleActivityClick = (activity: ActivityWithDetails) => {
    if (activity.target?.url) {
      window.open(activity.target.url, '_blank');
    }
  };

  const exportActivities = () => {
    const csvContent = [
      ['Type', 'Title', 'Description', 'Priority', 'Actor', 'Target', 'Created At'].join(','),
      ...activities.map(activity => [
        activity.type,
        `"${activity.title}"`,
        `"${activity.description}"`,
        activity.priority,
        activity.actor?.name || 'System',
        activity.target?.name || '',
        formatTimestampISO(activity.createdAt)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredActivities = activities.filter(activity => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      activity.title.toLowerCase().includes(searchLower) ||
      activity.description.toLowerCase().includes(searchLower) ||
      activity.actor?.name.toLowerCase().includes(searchLower) ||
      activity.target?.name.toLowerCase().includes(searchLower)
    );
  });

  if (loading && activities.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor all system activities and events
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={exportActivities} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleRefresh} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setShowFilters(!showFilters)} 
                  variant="outline" 
                  size="sm"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear All
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search activities..."
                  className="pl-10"
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Activity Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Types
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(ACTIVITY_TYPE_CONFIGS).map(([type, config]) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.types?.includes(type as ActivityType) || false}
                          onChange={() => toggleFilter('types', type as ActivityType)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{config.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priority Levels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Levels
                  </label>
                  <div className="space-y-2">
                    {(['low', 'medium', 'high', 'critical'] as ActivityPriority[]).map(priority => (
                      <label key={priority} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.priority?.includes(priority) || false}
                          onChange={() => toggleFilter('priority', priority)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <div className="space-y-2">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="createdAt">Created Date</option>
                      <option value="priority">Priority</option>
                      <option value="type">Type</option>
                    </select>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activities found</p>
                {searchTerm && (
                  <p className="text-gray-400 text-sm mt-2">
                    Try adjusting your search terms or filters
                  </p>
                )}
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {filteredActivities.map((activity, index) => {
                    const IconComponent = ActivityIcons[activity.type];
                    const config = ACTIVITY_TYPE_CONFIGS[activity.type];
                    const priorityColor = PriorityColors[activity.priority];
                    
                    return (
                      <li key={activity.id}>
                        <div className={`relative ${index < filteredActivities.length - 1 ? 'pb-8' : ''}`}>
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full ${priorityColor} flex items-center justify-center ring-8 ring-white`}>
                                <IconComponent className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div 
                                className={`${activity.target?.url ? 'cursor-pointer hover:text-blue-600' : ''}`}
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

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between">
              {/* Page Size Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show:</span>
                <select
                  value={filters.limit || 20}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>

              {/* Pagination Info */}
              <div className="text-sm text-gray-500">
                {(() => {
                  const startRecord = pagination.total === 0 ? 0 : ((pagination.currentPage - 1) * (filters.limit || 20)) + 1;
                  const endRecord = Math.min(pagination.currentPage * (filters.limit || 20), pagination.total);
                  return `Showing ${startRecord} to ${endRecord} of ${pagination.total} activities`;
                })()}
              </div>

              {/* Page Navigation */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1 || loading}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        variant={pagination.currentPage === pageNum ? "primary" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages || loading}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
