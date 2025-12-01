# Quick Test Guide - Backup & Recovery System

## Fastest Way to Test (Admin UI)

### Step 1: Start the Server
```bash
npm run dev
```

### Step 2: Login as Admin
1. Go to `http://localhost:3000/login`
2. Login with an admin account
3. Verify you can access `/dashboard/admin`

### Step 3: Test Backup Creation
1. Navigate to `http://localhost:3000/dashboard/admin/backups`
2. Click the **"Create Backup"** button
3. Wait for the backup to complete (watch the status change from "in_progress" to "completed")
4. You should see:
   - ✅ Green checkmark icon
   - Backup ID (e.g., `backup-1234567890`)
   - Size information
   - Timestamp

### Step 4: Test Backup Details
1. Click the **eye icon** (👁️) on any completed backup
2. Verify you can see:
   - Backup metadata
   - Collections included
   - Storage locations

### Step 5: Test Dry-Run Restore
1. Click the **database icon** (🗄️) on a completed backup
2. Check **"Dry run (preview only, no changes will be made)"**
3. Click **"Preview Restore"**
4. Verify you see a preview of what would be restored (no actual changes)

### Step 6: Test Download
1. Click the **download icon** (⬇️) on a completed backup
2. Verify a ZIP file downloads
3. Extract it and check the structure

## Quick CLI Test (After Compilation)

### Step 1: Compile TypeScript
```bash
npm run build
```

### Step 2: Create a Test Backup
```bash
# Fast test (Firestore only, no GCS upload)
node scripts/create-backup.js --firestore-only --no-gcs
```

**Expected Output:**
```
🔧 Creating system backup...
[BackupService] Backing up Firestore collections...
[BackupService] Backed up X documents from users
...
✅ Backup created successfully!
   Backup ID: backup-1234567890
   Type: full
   Size: X.XX MB
   Status: completed
   Local Path: /path/to/backups/backup-1234567890
```

### Step 3: Validate the Backup
```bash
# Replace BACKUP_ID with the ID from step 2
node scripts/validate-backup.js backup-1234567890
```

**Expected Output:**
```
🔧 Validating backup: backup-1234567890
✅ Backup is valid!
```

### Step 4: Test Dry-Run Restore
```bash
node scripts/restore-backup.js backup-1234567890 --dry-run
```

**Expected Output:**
```
🔧 Restoring backup: backup-1234567890
⚠️  DRY RUN MODE: No changes will be made
✅ Restore completed!
   Collections restored: X
   Files restored: X
   Records restored: X
```

## Verify Backup Files

Check that backup files were created:
```bash
# On Windows (PowerShell)
dir backups\backup-*

# On Mac/Linux
ls -la backups/backup-*
```

You should see a directory structure like:
```
backups/backup-1234567890/
├── firestore/
│   ├── users.json
│   ├── products.json
│   └── ... (other collections)
├── storage/ (if storage was backed up)
└── mysql/ (if MySQL was backed up)
```

## Common Issues

### "Unauthorized" Error
- **Solution:** Make sure you're logged in as admin
- Check your user role in the database is "admin"

### "BackupService not found" in CLI
- **Solution:** Run `npm run build` first to compile TypeScript
- Or use: `npx ts-node scripts/create-backup.js`

### Backup Stuck on "in_progress"
- Check server console for errors
- Verify Firebase Admin SDK credentials
- Check Supabase service role key

### "GCS bucket not configured"
- This is OK if you're using `--no-gcs` flag
- Or set `BACKUP_GCS_BUCKET` in `.env.local` (optional)

## What to Check

✅ Backup appears in admin UI  
✅ Status shows "completed" (not "failed")  
✅ Backup files exist in `backups/` directory  
✅ Firestore JSON files are created  
✅ Can view backup details  
✅ Dry-run restore works  
✅ Can download backup ZIP  

## Next Steps

Once basic testing works:
1. Test with actual data (not just empty collections)
2. Test full restore in a development environment
3. Test partial restore (specific collections)
4. Test error handling (invalid backup ID, etc.)

For detailed testing instructions, see: `docs/BACKUP_RECOVERY_TESTING.md`


