-- Supabase Storage Policies - Clean Version
-- Run this in the Supabase SQL Editor

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Public update access" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access" ON storage.objects;

-- Create public access policies for all buckets
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (true);

CREATE POLICY "Public upload access" ON storage.objects
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access" ON storage.objects
FOR UPDATE USING (true);

CREATE POLICY "Public delete access" ON storage.objects
FOR DELETE USING (true);
