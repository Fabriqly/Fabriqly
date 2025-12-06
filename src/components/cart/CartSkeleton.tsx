'use client';

import React from 'react';

export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {/* Shop Header Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        
        {/* Item Skeletons */}
        {[1, 2].map((i) => (
          <div key={i} className="flex space-x-3 p-3 border rounded-lg">
            <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-3 w-1/2 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="flex items-center justify-between">
                <div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          
          {/* Shop Groups Skeleton */}
          {[1, 2].map((shopIndex) => (
            <div key={shopIndex} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200">
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              
              {/* Items Skeleton */}
              {[1, 2, 3].map((itemIndex) => (
                <div key={itemIndex} className="flex space-x-4 p-4 border-b border-gray-100 last:border-b-0">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Right Column - Order Summary Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mb-6"></div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
              <div className="h-12 w-full bg-gray-200 rounded-md animate-pulse mt-6"></div>
            </div>
          </div>
        </div>
    </div>
  );
}

