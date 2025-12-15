import { MySQLService } from '@/services/mysql-service';
import { Policy, PolicyType, PolicyStatus, CreatePolicyData, UpdatePolicyData, PolicyFilters } from '@/types/policy';
import { AppError } from '@/errors/AppError';

export class PolicyRepository {
  /**
   * Find policies by type and optional status
   */
  async findByType(type: PolicyType, status?: PolicyStatus): Promise<Policy[]> {
    let query = `
      SELECT 
        id,
        type,
        title,
        content,
        version,
        status,
        last_updated_by as lastUpdatedBy,
        created_at as createdAt,
        updated_at as updatedAt
      FROM policies
      WHERE type = ?
    `;
    const params: any[] = [type];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY version DESC';

    const rows = await MySQLService.getMany(query, params);
    return rows.map(this.mapRowToPolicy);
  }

  /**
   * Get published policy for a specific type
   */
  async findPublishedByType(type: PolicyType): Promise<Policy | null> {
    const query = `
      SELECT 
        id,
        type,
        title,
        content,
        version,
        status,
        last_updated_by as lastUpdatedBy,
        created_at as createdAt,
        updated_at as updatedAt
      FROM policies
      WHERE type = ? AND status = 'published'
      ORDER BY version DESC
      LIMIT 1
    `;

    const row = await MySQLService.getOne(query, [type]);
    return row ? this.mapRowToPolicy(row) : null;
  }

  /**
   * Find policy by ID
   */
  async findById(id: string): Promise<Policy | null> {
    const query = `
      SELECT 
        id,
        type,
        title,
        content,
        version,
        status,
        last_updated_by as lastUpdatedBy,
        created_at as createdAt,
        updated_at as updatedAt
      FROM policies
      WHERE id = ?
    `;

    const row = await MySQLService.getOne(query, [id]);
    return row ? this.mapRowToPolicy(row) : null;
  }

  /**
   * Get all policies (for admin)
   */
  async getAll(filters?: PolicyFilters): Promise<Policy[]> {
    let query = `
      SELECT 
        id,
        type,
        title,
        content,
        version,
        status,
        last_updated_by as lastUpdatedBy,
        created_at as createdAt,
        updated_at as updatedAt
      FROM policies
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.version) {
      query += ' AND version = ?';
      params.push(filters.version);
    }

    query += ' ORDER BY type, version DESC';

    const rows = await MySQLService.getMany(query, params);
    return rows.map(this.mapRowToPolicy);
  }

  /**
   * Get latest version number for a type
   */
  async getLatestVersion(type: PolicyType): Promise<number> {
    const query = `
      SELECT COALESCE(MAX(version), 0) as maxVersion
      FROM policies
      WHERE type = ?
    `;

    const result = await MySQLService.getOne(query, [type]);
    return result?.maxVersion || 0;
  }

  /**
   * Create new policy version
   */
  async create(data: CreatePolicyData): Promise<Policy> {
    // Get next version number
    const latestVersion = await this.getLatestVersion(data.type);
    const nextVersion = latestVersion + 1;

    const id = `policy-${data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const query = `
      INSERT INTO policies (
        id, type, title, content, version, status, last_updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await MySQLService.insert(query, [
      id,
      data.type,
      data.title,
      data.content,
      nextVersion,
      data.status || PolicyStatus.DRAFT,
      data.lastUpdatedBy
    ]);

    const created = await this.findById(id);
    if (!created) {
      throw AppError.internal('Failed to retrieve created policy');
    }

    return created;
  }

  /**
   * Update policy (only works for drafts)
   */
  async update(id: string, data: UpdatePolicyData): Promise<Policy> {
    // First, check if policy exists and is a draft
    const existing = await this.findById(id);
    if (!existing) {
      throw AppError.notFound('Policy not found');
    }

    if (existing.status !== PolicyStatus.DRAFT) {
      throw AppError.badRequest('Only draft policies can be updated. Published policies are immutable.');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }

    if (data.content !== undefined) {
      updates.push('content = ?');
      params.push(data.content);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (data.lastUpdatedBy) {
      updates.push('last_updated_by = ?');
      params.push(data.lastUpdatedBy);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const query = `UPDATE policies SET ${updates.join(', ')} WHERE id = ?`;
    await MySQLService.update(query, params);

    const updated = await this.findById(id);
    if (!updated) {
      throw AppError.internal('Failed to retrieve updated policy');
    }

    return updated;
  }

  /**
   * Archive a policy
   */
  async archive(id: string, adminId: string): Promise<Policy> {
    return this.update(id, {
      status: PolicyStatus.ARCHIVED,
      lastUpdatedBy: adminId
    });
  }

  /**
   * Publish a draft policy (archives previous published version)
   */
  async publish(id: string, adminId: string): Promise<Policy> {
    const draft = await this.findById(id);
    if (!draft) {
      throw AppError.notFound('Policy not found');
    }

    if (draft.status !== PolicyStatus.DRAFT) {
      throw AppError.badRequest('Only draft policies can be published');
    }

    return MySQLService.transaction(async (connection) => {
      // Archive any existing published policy of the same type
      await connection.execute(
        `UPDATE policies 
         SET status = 'archived', 
             last_updated_by = ?,
             updated_at = NOW()
         WHERE type = ? AND status = 'published'`,
        [adminId, draft.type]
      );

      // Publish the draft
      await connection.execute(
        `UPDATE policies 
         SET status = 'published',
             last_updated_by = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [adminId, id]
      );

      const published = await this.findById(id);
      if (!published) {
        throw AppError.internal('Failed to retrieve published policy');
      }

      return published;
    });
  }

  /**
   * Map database row to Policy object
   */
  private mapRowToPolicy(row: any): Policy {
    return {
      id: row.id,
      type: row.type as PolicyType,
      title: row.title,
      content: row.content,
      version: row.version,
      status: row.status as PolicyStatus,
      lastUpdatedBy: row.lastUpdatedBy,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}

