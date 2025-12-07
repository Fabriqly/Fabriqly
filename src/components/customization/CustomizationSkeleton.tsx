'use client';

import React from 'react';

// List Skeleton - For the sidebar request list
export function CustomizationListSkeleton() {
  return (
    <div className="divide-y divide-gray-200">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-start gap-3">
            {/* Circle Avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
            
            {/* Text Lines */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex items-center justify-between mt-2">
                <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Chat Skeleton - For the chat area
export function CustomizationChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
        {/* Incoming message (left-aligned) */}
        <div className="flex flex-col items-start">
          <div className="max-w-[70%] md:max-w-[70%] rounded-lg px-4 py-2 bg-gray-200 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
            <div className="h-3 bg-gray-300 rounded w-16 mt-2"></div>
          </div>
        </div>

        {/* Outgoing message (right-aligned) */}
        <div className="flex flex-col items-end">
          <div className="max-w-[70%] md:max-w-[70%] rounded-lg px-4 py-2 bg-blue-200 animate-pulse">
            <div className="h-4 bg-blue-300 rounded w-40 mb-2"></div>
            <div className="h-4 bg-blue-300 rounded w-36"></div>
            <div className="h-3 bg-blue-300 rounded w-20 mt-2"></div>
          </div>
        </div>

        {/* Incoming message */}
        <div className="flex flex-col items-start">
          <div className="max-w-[70%] md:max-w-[70%] rounded-lg px-4 py-2 bg-gray-200 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-52 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-24 mt-2"></div>
          </div>
        </div>

        {/* Outgoing message */}
        <div className="flex flex-col items-end">
          <div className="max-w-[70%] md:max-w-[70%] rounded-lg px-4 py-2 bg-blue-200 animate-pulse">
            <div className="h-4 bg-blue-300 rounded w-44"></div>
            <div className="h-3 bg-blue-300 rounded w-18 mt-2"></div>
          </div>
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="p-3 md:p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="w-16 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Panel Skeleton - For the right info panel (desktop only)
export function CustomizationPanelSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {/* Design Fee Skeleton */}
      <div className="border-2 border-blue-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-28"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-full mt-3 pt-3 border-t border-gray-200"></div>
        </div>
      </div>

      {/* Payment Status Skeleton */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-20 mb-3"></div>
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
}

