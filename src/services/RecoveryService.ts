import { adminDb } from '@/lib/firebase-admin';
import { Collections } from './firebase';
import { supabaseAdmin } from '@/lib/supabase-storage';
import { StorageBuckets } from '@/lib/supabase-storage';
import { Timestamp } from 'firebase-admin/firestore';
import { BackupService, BackupMetadata } from './BackupService';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RestoreOptions {
  collections?: string[]; // Specific collections to restore (if not provided, all collections)
  dryRun?: boolean; // Preview what will be restored without actually restoring
  overwrite?: boolean; // Overwrite existing data
}

export interface RestoreResult {
  success: boolean;
  restoredCollections: string[];
  restoredFiles: number;
  restoredRecords: number;
  errors: string[];
}

export class RecoveryService {
  private static readonly BACKUP_COLLECTION = 'backups';
  private static readonly LOCAL_BACKUP_PATH = process.env.BACKUP_LOCAL_PATH || path.join(process.cwd(), 'backups');

  /**
   * Restore from backup
   */
  static async restoreBackup(backupId: string, options: RestoreOptions = {}): Promise<RestoreResult> {
    const { collections, dryRun = false, overwrite = false } = options;

    // Get backup metadata
    const metadata = await BackupService.getBackupMetadata(backupId);
    if (!metadata) {
      throw new Error('Backup not found');
    }

    if (metadata.status !== 'completed') {
      throw new Error(`Backup is not completed. Status: ${metadata.status}`);
    }

    const result: RestoreResult = {
      success: false,
      restoredCollections: [],
      restoredFiles: 0,
      restoredRecords: 0,
      errors: []
    };

    try {
      // Download from GCS if needed
      const backupPath = await this.ensureBackupLocal(backupId, metadata);

      // Restore Firestore
      if (metadata.collections.length > 0 || !collections) {
        console.log(`[RecoveryService] Restoring Firestore collections...`);
        const firestoreResult = await this.restoreFirestore(backupId, backupPath, collections, dryRun, overwrite);
        result.restoredCollections.push(...firestoreResult.collections);
        result.restoredRecords += firestoreResult.records;
        result.errors.push(...firestoreResult.errors);
      }

      // Restore Supabase Storage
      console.log(`[RecoveryService] Restoring Supabase Storage...`);
      const storageResult = await this.restoreSupabaseStorage(backupId, backupPath, dryRun);
      result.restoredFiles += storageResult.files;
      result.errors.push(...storageResult.errors);

      // Restore MySQL
      console.log(`[RecoveryService] Restoring MySQL database...`);
      const mysqlResult = await this.restoreMySQL(backupId, backupPath, dryRun, overwrite);
      result.restoredRecords += mysqlResult.records;
      result.errors.push(...mysqlResult.errors);

      result.success = result.errors.length === 0;
      return result;
    } catch (error: any) {
      result.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Restore specific collection
   */
  static async restoreCollection(backupId: string, collectionName: string, options: RestoreOptions = {}): Promise<RestoreResult> {
    return this.restoreBackup(backupId, {
      ...options,
      collections: [collectionName]
    });
  }

  /**
   * Point-in-time recovery (restore to a specific timestamp)
   */
  static async restorePointInTime(targetTimestamp: Date, options: RestoreOptions = {}): Promise<RestoreResult> {
    // Find the backup closest to the target timestamp
    const backups = await BackupService.listBackups();
    const targetBackup = backups
      .filter(b => b.status === 'completed' && b.timestamp <= targetTimestamp)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (!targetBackup) {
      throw new Error(`No backup found before ${targetTimestamp.toISOString()}`);
    }

    console.log(`[RecoveryService] Restoring to point in time: ${targetTimestamp.toISOString()}`);
    console.log(`[RecoveryService] Using backup: ${targetBackup.id} (${targetBackup.timestamp.toISOString()})`);

    return this.restoreBackup(targetBackup.id, options);
  }

  /**
   * Validate backup integrity
   */
  static async validateBackup(backupId: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const metadata = await BackupService.getBackupMetadata(backupId);
      if (!metadata) {
        return { valid: false, errors: ['Backup not found'] };
      }

      // Check if local backup exists
      if (!metadata.storageLocations.local) {
        errors.push('Local backup path not found in metadata');
      } else {
        try {
          await fs.access(metadata.storageLocations.local);
        } catch {
          errors.push('Local backup directory does not exist');
        }
      }

      // Check if Firestore backup files exist
      const firestorePath = path.join(metadata.storageLocations.local, 'firestore');
      try {
        const files = await fs.readdir(firestorePath);
        if (files.length === 0) {
          errors.push('No Firestore backup files found');
        }
      } catch {
        errors.push('Firestore backup directory does not exist');
      }

      // Check if storage backup exists
      const storagePath = path.join(metadata.storageLocations.local, 'storage');
      try {
        await fs.access(storagePath);
      } catch {
        errors.push('Storage backup directory does not exist');
      }

      // Check if MySQL backup exists
      const mysqlPath = path.join(metadata.storageLocations.local, 'mysql', 'dump.sql');
      try {
        await fs.access(mysqlPath);
      } catch {
        errors.push('MySQL backup file does not exist');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Download backup from GCS if needed
   */
  static async downloadFromGCS(backupId: string, metadata: BackupMetadata): Promise<string> {
    if (!metadata.storageLocations.gcs) {
      throw new Error('Backup not available in GCS');
    }

    const { adminStorage } = await import('@/lib/firebase-admin');
    const bucket = adminStorage.bucket(process.env.BACKUP_GCS_BUCKET);
    const gcsFile = bucket.file(metadata.storageLocations.gcs);

    const localPath = path.join(this.LOCAL_BACKUP_PATH, backupId);
    await fs.mkdir(localPath, { recursive: true });

    const downloadPath = path.join(localPath, path.basename(metadata.storageLocations.gcs));
    await gcsFile.download({ destination: downloadPath });

    // Extract if compressed
    if (downloadPath.endsWith('.tar.gz')) {
      try {
        await execAsync(`tar -xzf "${downloadPath}" -C "${localPath}"`);
        await fs.unlink(downloadPath);
      } catch (error) {
        throw new Error('Failed to extract tar.gz. Please ensure tar command is available.');
      }
    } else if (downloadPath.endsWith('.zip')) {
      try {
        // Use require for server-side only packages
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(downloadPath);
        zip.extractAllTo(localPath, true);
        await fs.unlink(downloadPath);
      } catch (error: any) {
        if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('adm-zip')) {
          throw new Error('adm-zip package is required. Please run: npm install adm-zip');
        }
        throw error;
      }
    }

    return localPath;
  }

  /**
   * Ensure backup is available locally
   */
  private static async ensureBackupLocal(backupId: string, metadata: BackupMetadata): Promise<string> {
    const localPath = metadata.storageLocations.local;

    // Check if local backup exists
    try {
      await fs.access(localPath);
      return localPath;
    } catch {
      // Local backup doesn't exist, try to download from GCS
      if (metadata.storageLocations.gcs) {
        console.log(`[RecoveryService] Local backup not found, downloading from GCS...`);
        return await this.downloadFromGCS(backupId, metadata);
      } else {
        throw new Error('Backup not available locally or in GCS');
      }
    }
  }

  /**
   * Restore Firestore collections
   */
  private static async restoreFirestore(
    backupId: string,
    backupPath: string,
    collections?: string[],
    dryRun = false,
    overwrite = false
  ): Promise<{ collections: string[]; records: number; errors: string[] }> {
    const firestorePath = path.join(backupPath, 'firestore');
    const result = { collections: [] as string[], records: 0, errors: [] as string[] };

    try {
      const files = await fs.readdir(firestorePath);
      const collectionsToRestore = collections || files.map(f => f.replace('.json', ''));

      for (const file of files) {
        const collectionName = file.replace('.json', '');
        if (collections && !collections.includes(collectionName)) {
          continue;
        }

        try {
          const filePath = path.join(firestorePath, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const documents = JSON.parse(fileContent);

          if (dryRun) {
            console.log(`[RecoveryService] Would restore ${documents.length} documents to ${collectionName}`);
            result.collections.push(collectionName);
            result.records += documents.length;
            continue;
          }

          // Delete existing documents if overwrite is enabled
          if (overwrite) {
            const existingDocs = await adminDb.collection(collectionName).get();
            const batch = adminDb.batch();
            existingDocs.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
          }

          // Restore documents in batches
          const batchSize = 500;
          for (let i = 0; i < documents.length; i += batchSize) {
            const batch = adminDb.batch();
            const batchDocs = documents.slice(i, i + batchSize);

            for (const docData of batchDocs) {
              const { id, ...data } = docData;
              const docRef = adminDb.collection(collectionName).doc(id);
              batch.set(docRef, data);
            }

            await batch.commit();
          }

          console.log(`[RecoveryService] Restored ${documents.length} documents to ${collectionName}`);
          result.collections.push(collectionName);
          result.records += documents.length;
        } catch (error: any) {
          const errorMsg = `Error restoring collection ${collectionName}: ${error.message}`;
          console.error(`[RecoveryService] ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }
    } catch (error: any) {
      result.errors.push(`Error reading Firestore backup: ${error.message}`);
    }

    return result;
  }

  /**
   * Restore Supabase Storage files
   */
  private static async restoreSupabaseStorage(
    backupId: string,
    backupPath: string,
    dryRun = false
  ): Promise<{ files: number; errors: string[] }> {
    if (!supabaseAdmin) {
      return { files: 0, errors: ['Supabase admin client not initialized'] };
    }

    const storagePath = path.join(backupPath, 'storage');
    const result = { files: 0, errors: [] as string[] };

    try {
      const buckets = await fs.readdir(storagePath);

      for (const bucket of buckets) {
        const bucketPath = path.join(storagePath, bucket);

        try {
          const stats = await fs.stat(bucketPath);
          if (!stats.isDirectory()) continue;

          // Recursively get all files
          const files = await this.getAllFiles(bucketPath);

          for (const filePath of files) {
            const relativePath = path.relative(bucketPath, filePath);
            const fileContent = await fs.readFile(filePath);

            if (dryRun) {
              console.log(`[RecoveryService] Would restore file: ${bucket}/${relativePath}`);
              result.files++;
              continue;
            }

            try {
              // Create directory structure if needed
              const dirPath = path.dirname(relativePath);
              if (dirPath !== '.') {
                // Supabase doesn't support creating directories, so we'll upload with full path
              }

              const { error } = await supabaseAdmin.storage
                .from(bucket)
                .upload(relativePath, fileContent, {
                  upsert: true
                });

              if (error) {
                result.errors.push(`Error uploading ${relativePath}: ${error.message}`);
              } else {
                result.files++;
              }
            } catch (error: any) {
              result.errors.push(`Error processing ${relativePath}: ${error.message}`);
            }
          }
        } catch (error: any) {
          result.errors.push(`Error processing bucket ${bucket}: ${error.message}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`Error reading storage backup: ${error.message}`);
    }

    return result;
  }

  /**
   * Get all files recursively from a directory
   */
  private static async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Restore MySQL database
   */
  private static async restoreMySQL(
    backupId: string,
    backupPath: string,
    dryRun = false,
    overwrite = false
  ): Promise<{ records: number; errors: string[] }> {
    const dumpPath = path.join(backupPath, 'mysql', 'dump.sql');
    const result = { records: 0, errors: [] as string[] };

    try {
      await fs.access(dumpPath);
    } catch {
      result.errors.push('MySQL dump file not found');
      return result;
    }

    if (dryRun) {
      const content = await fs.readFile(dumpPath, 'utf-8');
      const insertCount = (content.match(/INSERT INTO/g) || []).length;
      console.log(`[RecoveryService] Would restore ${insertCount} MySQL records`);
      result.records = insertCount;
      return result;
    }

    const host = process.env.MYSQL_HOST || 'localhost';
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || 'fabriqly';

    try {
      // Use mysql command if available
      const mysqlCommand = `mysql -h ${host} -u ${user} ${password ? `-p${password}` : ''} ${database} < "${dumpPath}"`;
      await execAsync(mysqlCommand);
      console.log(`[RecoveryService] MySQL database restored`);
      
      // Count restored records
      const content = await fs.readFile(dumpPath, 'utf-8');
      result.records = (content.match(/INSERT INTO/g) || []).length;
    } catch (error: any) {
      // Fallback: Use Node.js to restore
      console.log(`[RecoveryService] mysql command not available, using Node.js restore...`);
      await this.restoreMySQLWithNode(dumpPath, database);
      
      const content = await fs.readFile(dumpPath, 'utf-8');
      result.records = (content.match(/INSERT INTO/g) || []).length;
    }

    return result;
  }

  /**
   * Restore MySQL using Node.js (fallback method)
   */
  private static async restoreMySQLWithNode(dumpPath: string, database: string): Promise<void> {
    const { MySQLService } = await import('./mysql-service');
    const content = await fs.readFile(dumpPath, 'utf-8');
    
    // Split by semicolons and execute statements
    const statements = content
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        if (statement.startsWith('DROP TABLE')) {
          await MySQLService.getMany(statement);
        } else if (statement.startsWith('CREATE TABLE')) {
          await MySQLService.getMany(statement);
        } else if (statement.startsWith('INSERT INTO')) {
          await MySQLService.insert(statement, []);
        }
      } catch (error: any) {
        console.error(`[RecoveryService] Error executing statement: ${error.message}`);
        // Continue with other statements
      }
    }
  }
}

