import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

export interface QueryFilter {
  field: string;
  operator: FirebaseFirestore.WhereFilterOp;
  value: any;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

export abstract class BaseRepository<T> {
  protected collection: string;

  constructor(collection: string) {
    this.collection = collection;
  }

  async findById(id: string): Promise<T | null> {
    return FirebaseAdminService.getDocument(this.collection, id) as T | null;
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    const results = await FirebaseAdminService.queryDocuments(
      this.collection,
      options?.filters || [],
      options?.orderBy,
      options?.limit
    );
    return results as T[];
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    return FirebaseAdminService.createDocument(this.collection, data) as T;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return FirebaseAdminService.updateDocument(this.collection, id, data) as T;
  }

  async delete(id: string): Promise<void> {
    await FirebaseAdminService.deleteDocument(this.collection, id);
  }

  async exists(id: string): Promise<boolean> {
    const doc = await this.findById(id);
    return doc !== null;
  }

  async count(filters?: QueryFilter[]): Promise<number> {
    const results = await FirebaseAdminService.queryDocuments(
      this.collection,
      filters || []
    );
    return results.length;
  }

  async batchCreate(dataArray: Omit<T, 'id'>[]): Promise<T[]> {
    const operations = dataArray.map(data => ({
      type: 'set' as const,
      collection: this.collection,
      doc: '', // Will be auto-generated
      data
    }));

    await FirebaseAdminService.batchWrite(operations);
    
    // Note: In a real implementation, you'd want to return the created documents
    // For now, we'll return the input data with generated IDs
    return dataArray.map((data, index) => ({
      ...data,
      id: `generated-${Date.now()}-${index}`
    })) as T[];
  }

  async batchUpdate(updates: Array<{ id: string; data: Partial<T> }>): Promise<void> {
    const operations = updates.map(update => ({
      type: 'update' as const,
      collection: this.collection,
      doc: update.id,
      data: update.data
    }));

    await FirebaseAdminService.batchWrite(operations);
  }

  async batchDelete(ids: string[]): Promise<void> {
    const operations = ids.map(id => ({
      type: 'delete' as const,
      collection: this.collection,
      doc: id
    }));

    await FirebaseAdminService.batchWrite(operations);
  }
}
