export enum PolicyType {
  TERMS = 'terms',
  PRIVACY = 'privacy',
  SHIPPING = 'shipping',
  REFUND = 'refund'
}

export enum PolicyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export interface Policy {
  id: string;
  type: PolicyType;
  title: string;
  content: string; // HTML content
  version: number;
  status: PolicyStatus;
  lastUpdatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePolicyData {
  type: PolicyType;
  title: string;
  content: string;
  lastUpdatedBy: string;
  status?: PolicyStatus; // Defaults to 'draft'
}

export interface UpdatePolicyData {
  title?: string;
  content?: string;
  lastUpdatedBy: string;
  status?: PolicyStatus;
}

export interface PolicyFilters {
  type?: PolicyType;
  status?: PolicyStatus;
  version?: number;
}

