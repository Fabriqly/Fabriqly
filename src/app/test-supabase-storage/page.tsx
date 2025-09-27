'use client';

import { useState } from 'react';
import { SupabaseStorageService, StorageBuckets, supabase } from '@/lib/supabase-storage';

export default function TestSupabaseStorage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [bucket, setBucket] = useState<string>(StorageBuckets.TEMP);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const uploadResult = await SupabaseStorageService.uploadFile(file, {
        bucket: bucket,
        folder: 'test',
        upsert: false
      });
      
      setResult(uploadResult);
      console.log('Upload successful:', uploadResult);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setResult({ error: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!result?.path) return;

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([result.path]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      setResult(null);
      console.log('Delete successful');
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Supabase Storage</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Storage Test</h3>
        <p className="text-blue-700">
          Test Supabase Storage integration. Make sure you've set up public upload policies in Supabase.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Test</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Bucket:</label>
          <select 
            value={bucket} 
            onChange={(e) => setBucket(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 mb-4"
          >
            <option value={StorageBuckets.PRODUCTS}>Products</option>
            <option value={StorageBuckets.DESIGNS}>Designs</option>
            <option value={StorageBuckets.PROFILES}>Profiles</option>
            <option value={StorageBuckets.TEMP}>Temp</option>
          </select>
        </div>

        <div className="mb-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2"
            accept="image/*"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-blue-600"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>

          {result && !result.error && (
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
            >
              Delete File
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="bg-gray-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Result:</h3>
          <div className="space-y-2">
            {result.error ? (
              <div className="text-red-600">
                <strong>Error:</strong> {result.error}
              </div>
            ) : (
              <>
                <div><strong>URL:</strong> <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{result.url}</a></div>
                <div><strong>Path:</strong> {result.path}</div>
                <div><strong>Size:</strong> {result.size} bytes</div>
                <div><strong>Content Type:</strong> {result.contentType}</div>
                {result.url && (
                  <div className="mt-4">
                    <strong>Preview:</strong>
                    <img src={result.url} alt="Uploaded file" className="mt-2 max-w-xs rounded border" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Setup Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Go to your Supabase dashboard → Storage → Policies</li>
          <li>Create public upload policies for testing (see below)</li>
          <li>Test the upload functionality</li>
        </ol>
        
        <div className="mt-4 bg-gray-100 p-4 rounded">
          <h4 className="font-semibold mb-2">SQL for Public Policies:</h4>
          <pre className="text-xs overflow-x-auto">
{`-- Create public upload policies for testing
CREATE POLICY "Allow public uploads to temp" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'temp');

CREATE POLICY "Allow public read access to temp" ON storage.objects
FOR SELECT USING (bucket_id = 'temp');`}
          </pre>
        </div>
      </div>
    </div>
  );
}
