import { PolicyRepository } from '@/repositories/PolicyRepository';
import { Policy, PolicyType, PolicyStatus, CreatePolicyData, UpdatePolicyData } from '@/types/policy';
import { AppError } from '@/errors/AppError';
import { CacheService } from './CacheService';
import { sanitizeHtml } from '@/lib/dompurify';

export class PolicyService {
  private repository: PolicyRepository;
  private cacheTTL = 60 * 60 * 1000; // 1 hour

  constructor(repository?: PolicyRepository) {
    this.repository = repository || new PolicyRepository();
  }

  /**
   * Get active (published) policy by type
   * Uses caching to reduce database queries
   * This method is designed for Server Components (direct service calls)
   */
  async getActivePolicy(type: PolicyType): Promise<Policy | null> {
    const cacheKey = `policy:active:${type}`;

    // Check cache first
    const cached = await CacheService.get<Policy>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const policy = await this.repository.findPublishedByType(type);

    // Cache the result (even if null, to avoid repeated DB queries)
    if (policy) {
      CacheService.set(cacheKey, policy, this.cacheTTL);
    }

    return policy;
  }

  /**
   * Get policy by ID
   */
  async getPolicyById(id: string): Promise<Policy | null> {
    return this.repository.findById(id);
  }

  /**
   * Get all policies (admin only)
   */
  async getAllPolicies(type?: PolicyType, status?: PolicyStatus): Promise<Policy[]> {
    return this.repository.getAll({ type, status });
  }

  /**
   * Create new policy version/draft
   */
  async createPolicy(data: CreatePolicyData): Promise<Policy> {
    // Validate input
    if (!data.title || !data.title.trim()) {
      throw AppError.badRequest('Policy title is required');
    }

    if (!data.content || !data.content.trim()) {
      throw AppError.badRequest('Policy content is required');
    }

    // Sanitize HTML content
    const sanitizedContent = sanitizeHtml(data.content);

    // Create policy
    const policy = await this.repository.create({
      ...data,
      content: sanitizedContent,
      status: data.status || PolicyStatus.DRAFT
    });

    // Invalidate cache for this policy type
    this.invalidateCache(data.type);

    return policy;
  }

  /**
   * Update policy (only works for drafts)
   */
  async updatePolicy(id: string, data: UpdatePolicyData): Promise<Policy> {
    // Validate input if provided
    if (data.title !== undefined && !data.title.trim()) {
      throw AppError.badRequest('Policy title cannot be empty');
    }

    if (data.content !== undefined && !data.content.trim()) {
      throw AppError.badRequest('Policy content cannot be empty');
    }

    // Get existing policy to check type
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw AppError.notFound('Policy not found');
    }

    // Sanitize HTML content if provided
    const updateData: UpdatePolicyData = { ...data };
    if (data.content !== undefined) {
      updateData.content = sanitizeHtml(data.content);
    }

    // Update policy
    const updated = await this.repository.update(id, updateData);

    // Invalidate cache for this policy type
    this.invalidateCache(existing.type);

    return updated;
  }

  /**
   * Publish a draft policy
   * Archives previous published version automatically
   */
  async publishPolicy(id: string, adminId: string): Promise<Policy> {
    const policy = await this.repository.publish(id, adminId);

    // Invalidate cache for this policy type
    this.invalidateCache(policy.type);

    return policy;
  }

  /**
   * Archive a policy
   */
  async archivePolicy(id: string, adminId: string): Promise<Policy> {
    const policy = await this.repository.archive(id, adminId);

    // Invalidate cache for this policy type
    this.invalidateCache(policy.type);

    return policy;
  }

  /**
   * Create a new draft version from a published policy
   * This is used when editing a published policy (which is immutable)
   */
  async createDraftFromPublished(publishedPolicyId: string, adminId: string): Promise<Policy> {
    const published = await this.repository.findById(publishedPolicyId);
    if (!published) {
      throw AppError.notFound('Policy not found');
    }

    if (published.status !== PolicyStatus.PUBLISHED) {
      throw AppError.badRequest('Can only create draft from published policy');
    }

    // Create new draft with same content
    return this.createPolicy({
      type: published.type,
      title: published.title,
      content: published.content, // Content is already sanitized
      lastUpdatedBy: adminId,
      status: PolicyStatus.DRAFT
    });
  }

  /**
   * Invalidate cache for a policy type
   */
  private invalidateCache(type: PolicyType): void {
    const cacheKey = `policy:active:${type}`;
    CacheService.delete(cacheKey);
  }

  /**
   * Trigger on-demand revalidation for Next.js ISR
   * This should be called after publishing a new policy version
   */
  async triggerRevalidation(type: PolicyType): Promise<void> {
    // Invalidate cache
    this.invalidateCache(type);

    // Note: Actual ISR revalidation is handled by Next.js API route
    // This method just ensures cache is cleared
    // The API route will call revalidatePath() or revalidateTag()
  }
}

// Export singleton instance
export const policyService = new PolicyService();

