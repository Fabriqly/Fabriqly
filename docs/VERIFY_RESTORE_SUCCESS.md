# How to Verify Restore Success

## Testing Restore in a Safe Way

### Step 1: Create a Test Backup
1. Go to `/dashboard/admin/backups`
2. Click "Create Backup"
3. Note the backup ID (e.g., `backup-1234567890`)
4. Wait for status to show "completed"

### Step 2: Make Test Changes (Before Restore)
Before restoring, make some test changes to your data so you can verify the restore worked:

**Option A: Add Test Data**
- Create a test product, user, or order
- Note the IDs or names of what you created
- This data should disappear after restore

**Option B: Modify Existing Data**
- Change a product name or price
- Update a user's email or name
- Note what you changed
- These changes should be reverted after restore

**Option C: Delete Test Data**
- Delete a test product or user
- Note what you deleted
- This data should reappear after restore

### Step 3: Use Dry-Run First (Recommended)
1. Click the database icon (🗄️) on your backup
2. Check "Dry run (preview only, no changes will be made)"
3. Click "Preview Restore"
4. Review the preview results:
   - Collections that will be restored
   - Number of files/records
   - Any errors

### Step 4: Perform Actual Restore
1. Click the database icon (🗄️) on your backup
2. **Uncheck** "Dry run"
3. Check "Overwrite existing data" (if you want to replace current data)
4. Click "Restore Backup"
5. Wait for completion

### Step 5: Verify Restore Success

#### Check the Restore Result Dialog
After restore completes, you should see:
- ✅ Success message
- Collections restored count
- Files restored count
- Records restored count
- Any errors (should be empty for success)

#### Verify Data Changes

**If you added test data:**
- Check that the test data you added is **gone**
- Original data from backup time should be present

**If you modified data:**
- Check that your changes are **reverted**
- Data should match the backup timestamp

**If you deleted data:**
- Check that deleted data is **restored**
- Data should be back as it was at backup time

#### Specific Verification Steps

**For Firestore Collections:**
1. Go to Firebase Console → Firestore
2. Check the collections that were restored
3. Count documents and compare with backup metadata
4. Verify document content matches backup time

**For Supabase Storage:**
1. Go to Supabase Dashboard → Storage
2. Check the buckets that were backed up
3. Verify files exist and match backup time

**For MySQL:**
1. Connect to your MySQL database
2. Check the tables that were restored
3. Verify record counts match backup
4. Check specific records match backup time

## Using CLI to Verify

### Check Backup Contents
```bash
# List what's in the backup
dir backups\backup-{id}\firestore
dir backups\backup-{id}\storage
dir backups\backup-{id}\mysql
```

### Compare Before/After
1. **Before restore:** Note current data state
   - Document counts in Firestore
   - File counts in Storage
   - Record counts in MySQL

2. **After restore:** Compare with backup
   - Should match backup metadata
   - Should differ from pre-restore state

## Verification Checklist

- [ ] Restore completed without errors
- [ ] Restore result shows success
- [ ] Collections count matches backup
- [ ] Files count matches backup
- [ ] Records count matches backup
- [ ] Test data changes are reverted
- [ ] Data matches backup timestamp
- [ ] No unexpected data loss
- [ ] No duplicate data created

## What Success Looks Like

### Successful Restore Output:
```
✅ Restore completed!
   Collections restored: 10
   Files restored: 45
   Records restored: 200
   Errors: 0
```

### In the UI:
- Green success message
- Restore result dialog shows all counts
- No error messages
- Data matches backup state

## What Failure Looks Like

### Failed Restore Output:
```
❌ Restore completed with errors
   Collections restored: 8
   Files restored: 40
   Records restored: 180
   Errors: 2
     - Error restoring collection products: ...
     - Error uploading file: ...
```

### In the UI:
- Red error message
- Error details in restore result
- Some data may be restored, some may not

## Best Practices

1. **Always use dry-run first** - Preview what will happen
2. **Test in development** - Never test restore in production first
3. **Document test changes** - Write down what you changed
4. **Verify immediately** - Check data right after restore
5. **Keep backup before restore** - Create a new backup before restoring (in case you need to undo)

## Troubleshooting

### Restore says success but data doesn't match
- Check if you selected specific collections (partial restore)
- Verify backup timestamp matches when you expect
- Check if overwrite mode was enabled

### Some collections not restored
- Check restore result for errors
- Verify those collections were in the backup
- Check Firestore permissions

### Files not restored
- Check Supabase Storage permissions
- Verify bucket names match
- Check file paths in backup

## Example Test Scenario

1. **Create backup** at 10:00 AM
2. **Add test product** "Test Product 123" at 10:30 AM
3. **Modify user email** from "old@email.com" to "new@email.com" at 10:45 AM
4. **Restore from 10:00 AM backup** at 11:00 AM
5. **Verify:**
   - "Test Product 123" should be gone
   - User email should be back to "old@email.com"
   - All other data should match 10:00 AM state


