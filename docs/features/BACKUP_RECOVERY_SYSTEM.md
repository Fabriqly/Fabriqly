# Backup & Recovery System

## Overview

The Fabriqly backup and recovery system provides comprehensive backup and restore capabilities for:
- **Firestore Collections** - All database collections
- **Supabase Storage** - All uploaded files (products, designs, customizations, etc.)
- **MySQL Database** - Shop applications data

## Features

### Backup Features
- Full system backup (Firestore + Storage + MySQL)
- Partial backup by collection selection
- Automatic compression
- Upload to Google Cloud Storage (optional)
- Backup metadata tracking
- Backup validation

### Recovery Features
- Full database restore
- Partial restore by collection
- Point-in-time recovery
- Dry-run mode (preview without changes)
- Overwrite mode for existing data

## Configuration

Add these environment variables to your `.env.local`:

```env
# Backup & Recovery Configuration
BACKUP_LOCAL_PATH=./backups
BACKUP_GCS_BUCKET=your-project-id-backups
BACKUP_RETENTION_DAYS=30
```

## Usage

### Admin UI

1. Navigate to `/dashboard/admin/backups`
2. Click "Create Backup" to start a new backup
3. View backup details, restore, download, or delete backups

### CLI Scripts

#### Create Backup

```bash
# Full backup
node scripts/create-backup.js

# Firestore only
node scripts/create-backup.js --firestore-only

# Storage only
node scripts/create-backup.js --storage-only

# MySQL only
node scripts/create-backup.js --mysql-only

# Specific collections
node scripts/create-backup.js --collections users,products,orders

# Skip GCS upload
node scripts/create-backup.js --no-gcs
```

**Note:** The scripts require TypeScript compilation. Run `npm run build` first, or use `ts-node`:
```bash
npx ts-node scripts/create-backup.js
```

#### Restore Backup

```bash
# Full restore
node scripts/restore-backup.js <backup-id>

# Dry run (preview)
node scripts/restore-backup.js <backup-id> --dry-run

# Overwrite existing data
node scripts/restore-backup.js <backup-id> --overwrite

# Restore specific collections
node scripts/restore-backup.js <backup-id> --collections users,products
```

#### Validate Backup

```bash
node scripts/validate-backup.js <backup-id>
```

## API Endpoints

All endpoints require admin authentication.

### List Backups
```
GET /api/admin/backups
```

### Create Backup
```
POST /api/admin/backups
Body: {
  includeFirestore?: boolean,
  includeStorage?: boolean,
  includeMySQL?: boolean,
  uploadToGCS?: boolean,
  collections?: string[]
}
```

### Get Backup Details
```
GET /api/admin/backups/[id]
```

### Delete Backup
```
DELETE /api/admin/backups/[id]
```

### Restore Backup
```
POST /api/admin/backups/[id]/restore
Body: {
  collections?: string[],
  dryRun?: boolean,
  overwrite?: boolean
}
```

### Validate Backup
```
GET /api/admin/backups/[id]/validate
```

### Download Backup
```
GET /api/admin/backups/[id]/download
```

## Backup Structure

Backups are stored in the following structure:

```
backups/
└── backup-{timestamp}/
    ├── metadata.json          # Backup metadata
    ├── firestore/
    │   └── {collection}.json  # Firestore collections
    ├── storage/
    │   └── {bucket}/
    │       └── {files}        # Supabase Storage files
    └── mysql/
        └── dump.sql          # MySQL database dump
```

## Best Practices

1. **Regular Backups**: Create backups regularly (daily/weekly)
2. **Test Restores**: Periodically test restore operations
3. **Multiple Locations**: Store backups in both local and cloud storage
4. **Retention Policy**: Clean up old backups based on retention policy
5. **Validation**: Validate backups before relying on them
6. **Dry Runs**: Always use dry-run mode first when restoring

## Troubleshooting

### Backup Fails
- Check Firebase Admin SDK credentials
- Verify Supabase service role key
- Ensure MySQL connection is working
- Check disk space for local backups

### Restore Fails
- Validate backup integrity first
- Check if backup files exist locally or in GCS
- Verify permissions for restore operations
- Use dry-run mode to preview changes

### Scripts Don't Work
- Ensure TypeScript is compiled: `npm run build`
- Or use ts-node: `npx ts-node scripts/create-backup.js`
- Check environment variables are set correctly

## Security Notes

- All backup operations require admin authentication
- Backup files contain sensitive data - ensure proper access controls
- GCS bucket should have proper IAM permissions
- Local backups are excluded from git (see `.gitignore`)
- Never commit backup files to version control


