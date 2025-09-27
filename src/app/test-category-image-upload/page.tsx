'use client';

import React, { useState } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';

export default function TestCategoryImageUpload() {
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('test-category-' + Date.now());

  const handleTestUpload = () => {
    console.log('Testing category image upload...');
    console.log('Category ID:', categoryId);
    console.log('Current image URL:', imageUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Category Image Upload
        </h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category ID (for testing)
            </label>
            <input
              type="text"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Enter category ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image Upload
            </label>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              placeholder="Upload category image"
              maxSize={5}
              uploadType="category"
              entityId={categoryId}
            />
          </div>

          <div className="flex space-x-4">
            <Button onClick={handleTestUpload}>
              Test Upload
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setImageUrl('');
                setCategoryId('test-category-' + Date.now());
              }}
            >
              Reset
            </Button>
          </div>

          {imageUrl && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Uploaded Image:</h3>
              <div className="border border-gray-300 rounded-md p-4">
                <img
                  src={imageUrl}
                  alt="Uploaded category image"
                  className="max-w-full h-auto rounded-md"
                  onError={(e) => {
                    console.error('Image failed to load:', imageUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <p className="text-sm text-gray-600 mt-2 break-all">
                  URL: {imageUrl}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test:</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-1">
            <li>Make sure you're logged in as an admin</li>
            <li>Enter a category ID (or use the generated one)</li>
            <li>Click "Upload category image" and select an image file</li>
            <li>The image should upload to Supabase Storage</li>
            <li>Check the console for any errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
