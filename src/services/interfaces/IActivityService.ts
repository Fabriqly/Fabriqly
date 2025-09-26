import { Activity } from '@/types/activity';

export interface CreateActivityData {
  type: string;
  title: string;
  description: string;
  priority?: string;
  status?: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  targetId?: string;
  targetType?: string;
  targetName?: string;
  metadata?: any;
  systemEvent?: {
    eventName: string;
    eventData: any;
  };
}

export interface UpdateActivityData {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  metadata?: any;
}

export interface ActivityFilters {
  actorId?: string;
  targetId?: string;
  targetType?: string;
  type?: string;
  priority?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ActivityStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recentCount: number;
}

export interface IActivityService {
  createActivity(activityData: CreateActivityData): Promise<Activity>;
  updateActivity(activityId: string, data: UpdateActivityData): Promise<Activity>;
  deleteActivity(activityId: string): Promise<void>;
  getActivity(activityId: string): Promise<Activity | null>;
  getActivities(filters?: ActivityFilters, limit?: number): Promise<Activity[]>;
  getActivityStats(): Promise<ActivityStats>;
  logActivity(type: string, targetId: string, actorId: string, metadata?: any): Promise<Activity>;
}
