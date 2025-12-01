'use client';

import React from 'react';
import { X, FileArchive, Calendar, Database, HardDrive, CheckCircle, XCircle, Clock } from 'lucide-react';

interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'partial';
  status: 'in_progress' | 'completed' | 'failed';
  size: number;
  collections: string[];
  storageLocations: {
    local: string;
    gcs?: string;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface BackupDetailsProps {
  backup: BackupMetadata;
  onClose: () => void;
}

export function BackupDetails({ backup, onClose }: BackupDetailsProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <FileArchive className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Backup Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Backup ID:</span>
                  <p className="mt-1 font-mono text-sm text-gray-900">{backup.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Type:</span>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{backup.type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="mt-1 flex items-center">
                    {getStatusIcon(backup.status)}
                    <span className="ml-2 text-sm text-gray-900 capitalize">{backup.status}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Size:</span>
                  <p className="mt-1 text-sm text-gray-900">{formatSize(backup.size)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Timestamps
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(backup.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Backup Timestamp:</span>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(backup.timestamp).toLocaleString()}
                </p>
              </div>
              {backup.completedAt && (
                <div>
                  <span className="text-sm text-gray-600">Completed:</span>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(backup.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Storage Locations */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <HardDrive className="w-4 h-4 mr-2" />
              Storage Locations
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm text-gray-600">Local Path:</span>
                <p className="mt-1 font-mono text-xs text-gray-900 break-all">
                  {backup.storageLocations.local}
                </p>
              </div>
              {backup.storageLocations.gcs && (
                <div>
                  <span className="text-sm text-gray-600">Google Cloud Storage:</span>
                  <p className="mt-1 font-mono text-xs text-gray-900 break-all">
                    {backup.storageLocations.gcs}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Collections */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Collections
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {backup.collections.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {backup.collections.map((collection) => (
                    <div key={collection} className="font-mono text-xs text-gray-900">
                      {collection}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">All collections included</p>
              )}
            </div>
          </div>

          {/* Error */}
          {backup.error && (
            <div>
              <h3 className="text-sm font-medium text-red-700 mb-3">Error</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{backup.error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

