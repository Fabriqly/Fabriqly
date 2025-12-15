import { adminDb } from '@/lib/firebase-admin';
import { Collections } from './firebase';
import { supabaseAdmin } from '@/lib/supabase-storage';
import { StorageBuckets } from '@/lib/supabase-storage';
import { Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupOptions {
  includeFirestore?: boolean;
  includeStorage?: boolean;
  includeMySQL?: boolean;
  uploadToGCS?: boolean;
  collections?: string[]; // Specific collections to backup (if not provided, all collections)
}

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'partial';
  status: 'in_progress' | 'completed' | 'failed';
  size: number;
  collections: string[];
  storageLocations: {
    local: string;
    gcs?: string;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class BackupService {
  private static readonly BACKUP_COLLECTION = 'backups';
  private static readonly LOCAL_BACKUP_PATH = process.env.BACKUP_LOCAL_PATH || path.join(process.cwd(), 'backups');
  private static readonly GCS_BUCKET = process.env.BACKUP_GCS_BUCKET;

  /**
   * Create a full system backup
   */
  static async createBackup(options: BackupOptions = {}): Promise<BackupMetadata> {
    const {
      includeFirestore = true,
      includeStorage = true,
      includeMySQL = true,
      uploadToGCS = true,
      collections
    } = options;

    const backupId = `backup-${Date.now()}`;
    const backupPath = path.join(this.LOCAL_BACKUP_PATH, backupId);

    // Create backup directory
    await fs.mkdir(backupPath, { recursive: true });
    await fs.mkdir(path.join(backupPath, 'firestore'), { recursive: true });
    await fs.mkdir(path.join(backupPath, 'storage'), { recursive: true });
    await fs.mkdir(path.join(backupPath, 'mysql'), { recursive: true });

    // Create initial metadata
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      type: collections ? 'partial' : 'full',
      status: 'in_progress',
      size: 0,
      collections: collections || [],
      storageLocations: {
        local: backupPath
      },
      createdAt: new Date()
    };

    // Save metadata to Firestore
    await adminDb.collection(this.BACKUP_COLLECTION).doc(backupId).set({
      ...metadata,
      timestamp: Timestamp.fromDate(metadata.timestamp),
      createdAt: Timestamp.fromDate(metadata.createdAt)
    });

    try {
      // Backup Firestore
      if (includeFirestore) {
        console.log(`[BackupService] Backing up Firestore collections...`);
        await this.backupFirestore(backupId, collections);
      }

      // Backup Supabase Storage
      if (includeStorage) {
        console.log(`[BackupService] Backing up Supabase Storage...`);
        await this.backupSupabaseStorage(backupId);
      }

      // Backup MySQL
      if (includeMySQL) {
        console.log(`[BackupService] Backing up MySQL database...`);
        await this.backupMySQL(backupId);
      }

      // Calculate total size
      const totalSize = await this.calculateBackupSize(backupPath);
      metadata.size = totalSize;

      // Upload to GCS if requested
      if (uploadToGCS && this.GCS_BUCKET) {
        console.log(`[BackupService] Uploading to Google Cloud Storage...`);
        const gcsPath = await this.uploadToGCS(backupId, backupPath);
        metadata.storageLocations.gcs = gcsPath;
      }

      // Update metadata
      metadata.status = 'completed';
      metadata.completedAt = new Date();

      await adminDb.collection(this.BACKUP_COLLECTION).doc(backupId).update({
        ...metadata,
        timestamp: Timestamp.fromDate(metadata.timestamp),
        createdAt: Timestamp.fromDate(metadata.createdAt),
        completedAt: Timestamp.fromDate(metadata.completedAt)
      });

      console.log(`[BackupService] Backup completed: ${backupId}`);
      return metadata;
    } catch (error: unknown) {
      console.error(`[BackupService] Backup failed:`, error);
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : String(error);

      await adminDb.collection(this.BACKUP_COLLECTION).doc(backupId).update({
        ...metadata,
        timestamp: Timestamp.fromDate(metadata.timestamp),
        createdAt: Timestamp.fromDate(metadata.createdAt),
        error: metadata.error
      });

      throw error;
    }
  }

  /**
   * Backup all Firestore collections
   */
  static async backupFirestore(backupId: string, specificCollections?: string[]): Promise<void> {
    const backupPath = path.join(this.LOCAL_BACKUP_PATH, backupId, 'firestore');
    const collectionsToBackup = specificCollections || Object.values(Collections);

    for (const collectionName of collectionsToBackup) {
      try {
        console.log(`[BackupService] Backing up collection: ${collectionName}`);
        const snapshot = await adminDb.collection(collectionName).get();

        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const filePath = path.join(backupPath, `${collectionName}.json`);
        await fs.writeFile(filePath, JSON.stringify(documents, null, 2), 'utf-8');

        console.log(`[BackupService] Backed up ${documents.length} documents from ${collectionName}`);
      } catch (error: unknown) {
        console.error(`[BackupService] Error backing up collection ${collectionName}:`, error);
        // Continue with other collections even if one fails
      }
    }
  }

  /**
   * Recursively list all files in a Supabase Storage folder
   */
  private static async listAllFilesRecursive(
    bucket: string,
    folderPath: string = '',
    allFiles: Array<{ name: string; path: string }> = []
  ): Promise<Array<{ name: string; path: string }>> {
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: items, error } = await supabaseAdmin!.storage
        .from(bucket)
        .list(folderPath, {
          limit,
          offset,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error(`[BackupService] Error listing folder ${folderPath}:`, error);
        break;
      }

      if (!items || items.length === 0) {
        hasMore = false;
        break;
      }

      for (const item of items) {
        const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        
        // In Supabase Storage, folders don't have an id field
        // Files have an id field and metadata
        if (!item.id) {
          // It's a folder (or directory), recurse into it
          await this.listAllFilesRecursive(bucket, itemPath, allFiles);
        } else {
          // It's a file, add it to the list
          allFiles.push({
            name: item.name,
            path: itemPath
          });
        }
      }

      // Check if there are more items to fetch
      if (items.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    return allFiles;
  }

  /**
   * Backup Supabase Storage files
   */
  static async backupSupabaseStorage(backupId: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const backupPath = path.join(this.LOCAL_BACKUP_PATH, backupId, 'storage');
    const buckets = Object.values(StorageBuckets);

    for (const bucket of buckets) {
      try {
        console.log(`[BackupService] Backing up bucket: ${bucket}`);
        const bucketPath = path.join(backupPath, bucket);
        await fs.mkdir(bucketPath, { recursive: true });

        // Recursively list all files in the bucket (including subdirectories)
        console.log(`[BackupService] Listing all files in bucket ${bucket}...`);
        const allFiles = await this.listAllFilesRecursive(bucket);

        if (allFiles.length === 0) {
          console.log(`[BackupService] No files found in bucket ${bucket}`);
          continue;
        }

        console.log(`[BackupService] Found ${allFiles.length} files in bucket ${bucket}`);

        // Download each file
        let downloadedCount = 0;
        let errorCount = 0;

        for (const file of allFiles) {
          try {
            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
              .from(bucket)
              .download(file.path);

            if (downloadError) {
              console.error(`[BackupService] Error downloading ${file.path}:`, downloadError);
              errorCount++;
              continue;
            }

            // Create directory structure if needed
            const localFilePath = path.join(bucketPath, file.path);
            const fileDir = path.dirname(localFilePath);
            await fs.mkdir(fileDir, { recursive: true });

            // Save file
            const buffer = Buffer.from(await fileData.arrayBuffer());
            await fs.writeFile(localFilePath, buffer);

            downloadedCount++;
            if (downloadedCount % 10 === 0) {
              console.log(`[BackupService] Downloaded ${downloadedCount}/${allFiles.length} files...`);
            }
          } catch (error: unknown) {
            console.error(`[BackupService] Error processing file ${file.path}:`, error);
            errorCount++;
          }
        }

        console.log(`[BackupService] Backed up ${downloadedCount} files from bucket ${bucket} (${errorCount} errors)`);
      } catch (error: unknown) {
        console.error(`[BackupService] Error backing up bucket ${bucket}:`, error);
        // Continue with other buckets even if one fails
      }
    }
  }

  /**
   * Backup MySQL database
   */
  static async backupMySQL(backupId: string): Promise<void> {
    const backupPath = path.join(this.LOCAL_BACKUP_PATH, backupId, 'mysql');
    const dumpPath = path.join(backupPath, 'dump.sql');

    const host = process.env.MYSQL_HOST || 'localhost';
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || 'fabriqly';

    // Use mysqldump if available, otherwise use Node.js mysql2
    try {
      const mysqldumpCommand = `mysqldump -h ${host} -u ${user} ${password ? `-p${password}` : ''} ${database} > "${dumpPath}"`;
      await execAsync(mysqldumpCommand);
      console.log(`[BackupService] MySQL dump created: ${dumpPath}`);
    } catch {
      // Fallback: Use Node.js to export data
      console.log(`[BackupService] mysqldump not available, using Node.js export...`);
      await this.backupMySQLWithNode(backupPath, database);
    }
  }

  /**
   * Backup MySQL using Node.js (fallback method)
   */
  private static async backupMySQLWithNode(backupPath: string, database: string): Promise<void> {
    const { MySQLService } = await import('./mysql-service');
    
    // Get all tables
    const tables = await MySQLService.getMany('SHOW TABLES');
    const tableNames = tables.map((row: Record<string, unknown>) => Object.values(row)[0] as string);

    const dump: string[] = [];
    dump.push(`-- MySQL dump for database: ${database}`);
    dump.push(`-- Generated at: ${new Date().toISOString()}\n`);

    for (const tableName of tableNames) {
      dump.push(`\n-- Table: ${tableName}`);
      dump.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);

      // Get table structure
      const createTable = await MySQLService.getOne(`SHOW CREATE TABLE \`${tableName}\``);
      if (createTable) {
        const createStatement = Object.values(createTable)[1] as string;
        dump.push(createStatement + ';');
      }

      // Get table data
      const rows = await MySQLService.getMany(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        dump.push(`\n-- Data for table: ${tableName}`);
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            return val;
          });
          dump.push(`INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${values.join(', ')});`);
        }
      }
    }

    const dumpPath = path.join(backupPath, 'dump.sql');
    await fs.writeFile(dumpPath, dump.join('\n'), 'utf-8');
    console.log(`[BackupService] MySQL dump created: ${dumpPath}`);
  }

  /**
   * Upload backup to Google Cloud Storage
   */
  static async uploadToGCS(backupId: string, localPath: string): Promise<string> {
    if (!this.GCS_BUCKET) {
      throw new Error('GCS bucket not configured');
    }

    const { adminStorage } = await import('@/lib/firebase-admin');
    const bucket = adminStorage.bucket(this.GCS_BUCKET);
    const gcsPath = `backups/${backupId}`;

    try {
      // Compress the backup directory
      const tarPath = `${localPath}.tar.gz`;
      const compressedPath = await this.compressDirectory(localPath, tarPath);
      const finalPath = compressedPath || tarPath;
      const isZip = finalPath.endsWith('.zip');

      // Upload compressed file
      const gcsFile = bucket.file(`${gcsPath}${isZip ? '.zip' : '.tar.gz'}`);
      await gcsFile.save(await fs.readFile(finalPath));

      // Clean up local compressed file
      await fs.unlink(finalPath);

      console.log(`[BackupService] Uploaded to GCS: ${gcsPath}${isZip ? '.zip' : '.tar.gz'}`);
      return `${gcsPath}${isZip ? '.zip' : '.tar.gz'}`;
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('Compression not available')) {
        // Upload uncompressed directory as a workaround
        console.warn('[BackupService] Uploading uncompressed backup (compression failed)');
        // For now, skip GCS upload if compression fails
        throw new Error('GCS upload requires compression. Please install adm-zip: npm install adm-zip');
      }
      throw error;
    }
  }

  /**
   * Compress directory to tar.gz using tar command
   */
  private static async compressDirectory(sourceDir: string, outputPath: string): Promise<string | void> {
    try {
      // Use tar command if available
      const command = `tar -czf "${outputPath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`;
      await execAsync(command);
    } catch {
      // Fallback: create zip using Node.js
      console.log('[BackupService] tar not available, trying zip compression...');
      try {
        // Use dynamic import for server-side only packages
        const AdmZip = (await import('adm-zip')).default;
        const zip = new AdmZip();
        zip.addLocalFolder(sourceDir);
        const zipPath = outputPath.replace('.tar.gz', '.zip');
        zip.writeZip(zipPath);
        // Update output path for zip
        return zipPath;
      } catch {
        // If adm-zip is not available, skip compression
        console.warn('[BackupService] Compression libraries not available. Install adm-zip: npm install adm-zip');
        throw new Error('Compression not available. Please install adm-zip (npm install adm-zip) or ensure tar command is available.');
      }
    }
  }

  /**
   * Calculate total backup size
   */
  private static async calculateBackupSize(backupPath: string): Promise<number> {
    let totalSize = 0;

    async function getSize(filePath: string): Promise<number> {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        const files = await fs.readdir(filePath);
        let dirSize = 0;
        for (const file of files) {
          dirSize += await getSize(path.join(filePath, file));
        }
        return dirSize;
      }
      return stats.size;
    }

    totalSize = await getSize(backupPath);
    return totalSize;
  }

  /**
   * List all backups
   */
  static async listBackups(): Promise<BackupMetadata[]> {
    const snapshot = await adminDb.collection(this.BACKUP_COLLECTION)
      .orderBy('timestamp', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp?.toDate() || new Date(),
        type: data.type || 'full',
        status: data.status || 'completed',
        size: data.size || 0,
        collections: data.collections || [],
        storageLocations: data.storageLocations || { local: '' },
        error: data.error,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate()
      };
    });
  }

  /**
   * Get backup metadata
   */
  static async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    const doc = await adminDb.collection(this.BACKUP_COLLECTION).doc(backupId).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      timestamp: data.timestamp?.toDate() || new Date(),
      type: data.type || 'full',
      status: data.status || 'completed',
      size: data.size || 0,
      collections: data.collections || [],
      storageLocations: data.storageLocations || { local: '' },
      error: data.error,
      createdAt: data.createdAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate()
    };
  }

  /**
   * Delete backup
   */
  static async deleteBackup(backupId: string): Promise<void> {
    const metadata = await this.getBackupMetadata(backupId);
    if (!metadata) {
      throw new Error('Backup not found');
    }

    // Delete local files
    try {
      await fs.rm(metadata.storageLocations.local, { recursive: true, force: true });
    } catch (error) {
      console.error(`[BackupService] Error deleting local backup:`, error);
    }

    // Delete from GCS if exists
    if (metadata.storageLocations.gcs && this.GCS_BUCKET) {
      try {
        const { adminStorage } = await import('@/lib/firebase-admin');
        const bucket = adminStorage.bucket(this.GCS_BUCKET);
        await bucket.file(metadata.storageLocations.gcs).delete();
      } catch (error) {
        console.error(`[BackupService] Error deleting GCS backup:`, error);
      }
    }

    // Delete metadata from Firestore
    await adminDb.collection(this.BACKUP_COLLECTION).doc(backupId).delete();
  }
}

