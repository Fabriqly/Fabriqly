# Backup & Recovery System - Testing Guide

## Prerequisites

1. **Environment Setup**
   - Ensure all environment variables are set in `.env.local`
   - Firebase Admin SDK credentials configured
   - Supabase service role key configured
   - MySQL connection configured (if using MySQL)

2. **Dependencies**
   - Install `adm-zip` if you want zip compression fallback:
     ```bash
     npm install adm-zip
     ```

3. **Admin Access**
   - You need an admin account to access backup features
   - Login as admin user

## Testing Methods

### Method 1: Admin UI Testing (Recommended)

#### Step 1: Access Backup Management
1. Start your development server: `npm run dev`
2. Login as admin user
3. Navigate to `/dashboard/admin/backups`
4. You should see the backup management interface

#### Step 2: Create a Test Backup
1. Click "Create Backup" button
2. Wait for backup to complete (watch for status changes)
3. Verify backup appears in the list with:
   - Status: "completed" (green checkmark)
   - Backup ID displayed
   - Size information
   - Timestamp

#### Step 3: View Backup Details
1. Click the eye icon (👁️) on any completed backup
2. Verify details show:
   - Backup ID
   - Type (full/partial)
   - Status
   - Size
   - Collections included
   - Storage locations

#### Step 4: Validate Backup
1. Note the backup ID from the list
2. Use the validate endpoint or check backup integrity
3. Verify no errors are reported

#### Step 5: Test Dry-Run Restore
1. Click the database icon (🗄️) on a completed backup
2. Check "Dry run (preview only, no changes will be made)"
3. Click "Preview Restore"
4. Verify preview shows:
   - Collections that would be restored
   - Number of files/records
   - No actual changes made to database

#### Step 6: Download Backup
1. Click the download icon (⬇️) on a completed backup
2. Verify ZIP file downloads
3. Extract and verify structure:
   - `firestore/` folder with JSON files
   - `storage/` folder with files
   - `mysql/` folder with dump.sql (if MySQL included)

#### Step 7: Delete Backup
1. Click the trash icon (🗑️) on a backup
2. Confirm deletion
3. Verify backup is removed from list

### Method 2: API Testing (Using curl or Postman)

#### Test 1: List Backups
```bash
curl -X GET http://localhost:3000/api/admin/backups \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Test 2: Create Backup
```bash
curl -X POST http://localhost:3000/api/admin/backups \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "includeFirestore": true,
    "includeStorage": true,
    "includeMySQL": true,
    "uploadToGCS": false
  }'
```

#### Test 3: Get Backup Details
```bash
curl -X GET http://localhost:3000/api/admin/backups/BACKUP_ID \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Test 4: Validate Backup
```bash
curl -X GET http://localhost:3000/api/admin/backups/BACKUP_ID/validate \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Test 5: Dry-Run Restore
```bash
curl -X POST http://localhost:3000/api/admin/backups/BACKUP_ID/restore \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "dryRun": true,
    "overwrite": false
  }'
```

### Method 3: CLI Script Testing

#### Step 1: Compile TypeScript
```bash
npm run build
```

#### Step 2: Create Backup via CLI
```bash
# Full backup
node scripts/create-backup.js

# Firestore only (faster for testing)
node scripts/create-backup.js --firestore-only --no-gcs
```

#### Step 3: Validate Backup
```bash
node scripts/validate-backup.js backup-1234567890
```

#### Step 4: Test Restore (Dry-Run)
```bash
node scripts/restore-backup.js backup-1234567890 --dry-run
```

## Verification Checklist

### After Creating Backup
- [ ] Backup appears in admin UI list
- [ ] Status shows "completed" (not "failed" or "in_progress")
- [ ] Backup ID is generated
- [ ] Size is greater than 0
- [ ] Local backup directory exists: `backups/backup-{id}/`
- [ ] Firestore folder contains JSON files
- [ ] Storage folder exists (if storage was backed up)
- [ ] MySQL dump.sql exists (if MySQL was backed up)

### After Restore (Dry-Run)
- [ ] Preview shows collections to restore
- [ ] Shows number of files/records
- [ ] No actual database changes
- [ ] No errors in preview

### Backup File Structure
```
backups/backup-{id}/
├── firestore/
│   ├── users.json
│   ├── products.json
│   └── ... (other collections)
├── storage/
│   ├── products/
│   ├── designs/
│   └── ... (other buckets)
└── mysql/
    └── dump.sql
```

## Common Issues & Solutions

### Issue: "BackupService not found" in CLI scripts
**Solution:** 
- Run `npm run build` first to compile TypeScript
- Or use: `npx ts-node scripts/create-backup.js`

### Issue: "Unauthorized" error
**Solution:**
- Ensure you're logged in as admin
- Check session token is valid
- Verify user role is "admin" in database

### Issue: Backup status stuck on "in_progress"
**Solution:**
- Check server logs for errors
- Verify Firebase Admin SDK credentials
- Check Supabase service role key
- Ensure MySQL connection works

### Issue: "GCS bucket not configured"
**Solution:**
- Set `BACKUP_GCS_BUCKET` in `.env.local`
- Or use `--no-gcs` flag to skip GCS upload
- Or don't set the variable (GCS upload is optional)

### Issue: "Supabase admin client not initialized"
**Solution:**
- Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Verify Supabase URL and keys are correct

### Issue: Backup files not found locally
**Solution:**
- Check `BACKUP_LOCAL_PATH` is set correctly
- Verify directory permissions
- Check disk space

## Quick Test Script

Create a simple test to verify everything works:

```bash
# 1. Create a test backup (Firestore only, no GCS)
node scripts/create-backup.js --firestore-only --no-gcs

# 2. Note the backup ID from output

# 3. Validate it
node scripts/validate-backup.js BACKUP_ID

# 4. Test dry-run restore
node scripts/restore-backup.js BACKUP_ID --dry-run
```

## Expected Output

### Successful Backup Creation
```
🔧 Creating system backup...
[BackupService] Backing up Firestore collections...
[BackupService] Backed up 150 documents from users
[BackupService] Backed up 50 documents from products
...
✅ Backup created successfully!
   Backup ID: backup-1234567890
   Type: full
   Size: 15.23 MB
   Status: completed
   Local Path: /path/to/backups/backup-1234567890
```

### Successful Validation
```
🔧 Validating backup: backup-1234567890
✅ Backup is valid!
```

### Successful Dry-Run Restore
```
🔧 Restoring backup: backup-1234567890
⚠️  DRY RUN MODE: No changes will be made
✅ Restore completed!
   Collections restored: 10
   Files restored: 45
   Records restored: 200
```

## Next Steps After Testing

1. **Test Full Restore** (in development environment only!)
   - Create a test backup
   - Make some changes to data
   - Restore from backup
   - Verify data is restored correctly

2. **Test Partial Restore**
   - Restore only specific collections
   - Verify other collections remain unchanged

3. **Test Point-in-Time Recovery**
   - Create multiple backups at different times
   - Restore to a specific timestamp
   - Verify correct data is restored

4. **Test Error Handling**
   - Try restoring with invalid backup ID
   - Test with corrupted backup files
   - Verify proper error messages

## Production Testing Checklist

Before using in production:
- [ ] Test full backup and restore in staging
- [ ] Verify GCS upload works correctly
- [ ] Test backup retention and cleanup
- [ ] Verify restore doesn't break existing data
- [ ] Test with production-sized data
- [ ] Document restore procedures
- [ ] Set up monitoring/alerts for backup failures

