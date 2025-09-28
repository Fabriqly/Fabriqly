'use client';

import { useState } from 'react';

export default function TestImageUrl() {
  const [url, setUrl] = useState('');
  const [imageError, setImageError] = useState(false);

  const testUrl = 'https://rnxvowvuxefzpwbihzug.supabase.co/storage/v1/object/public/products/tx8okiAvxdo4bp4CUSnZ/products/tx8okiAvxdo4bp4CUSnZ/1758975192311-0.jpg';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Image URL</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Image URL:</label>
        <input
          type="text"
          value={url || testUrl}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Enter image URL"
        />
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Image Preview:</h3>
        <div className="border border-gray-300 rounded p-4">
          {url ? (
            <div className="max-w-md">
              <img
                src={url}
                alt="Test image"
                className="w-full h-auto rounded"
                onError={() => {
                  console.error('Image failed to load:', url);
                  setImageError(true);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', url);
                  setImageError(false);
                }}
              />
              {imageError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-sm">❌ Image failed to load</p>
                  <p className="text-red-600 text-xs mt-1">URL: {url}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Enter a URL to test</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Test Supabase URL:</h3>
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-sm font-mono break-all">{testUrl}</p>
          <button
            onClick={() => setUrl(testUrl)}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Use Test URL
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Debug Info:</h3>
        <div className="bg-gray-100 p-4 rounded text-sm">
          <p><strong>Current URL:</strong> {url || 'None'}</p>
          <p><strong>Image Error:</strong> {imageError ? 'Yes' : 'No'}</p>
          <p><strong>URL Valid:</strong> {url ? (url.startsWith('http') ? 'Yes' : 'No') : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
