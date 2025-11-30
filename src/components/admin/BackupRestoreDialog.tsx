'use client';

import React, { useState } from 'react';
import { X, Database, AlertTriangle, RefreshCw } from 'lucide-react';

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

interface BackupRestoreDialogProps {
  backup: BackupMetadata;
  onClose: () => void;
  onRestore: () => void;
}

export function BackupRestoreDialog({ backup, onClose, onRestore }: BackupRestoreDialogProps) {
  const [restoring, setRestoring] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleRestore = async () => {
    try {
      setRestoring(true);
      setError(null);
      setResult(null);

      const response = await fetch(`/api/admin/backups/${backup.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collections: selectedCollections.length > 0 ? selectedCollections : undefined,
          dryRun,
          overwrite
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to restore backup');
      }

      const data = await response.json();
      setResult(data.data);

      if (!dryRun && data.success) {
        setTimeout(() => {
          onRestore();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRestoring(false);
    }
  };

  const toggleCollection = (collection: string) => {
    if (selectedCollections.includes(collection)) {
      setSelectedCollections(selectedCollections.filter(c => c !== collection));
    } else {
      setSelectedCollections([...selectedCollections, collection]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Database className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Restore Backup</h2>
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
          {/* Backup Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Backup ID:</span>
                <span className="ml-2 font-mono text-gray-900">{backup.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(backup.timestamp).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 text-gray-900 capitalize">{backup.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Size:</span>
                <span className="ml-2 text-gray-900">
                  {(backup.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          {!dryRun && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Warning: This will restore data from the backup. Existing data may be overwritten.
                </p>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="dryRun" className="ml-2 text-sm text-gray-700">
                Dry run (preview only, no changes will be made)
              </label>
            </div>

            {!dryRun && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="overwrite"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="overwrite" className="ml-2 text-sm text-gray-700">
                  Overwrite existing data
                </label>
              </div>
            )}

            {/* Collection Selection */}
            {backup.collections.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Collections to Restore (leave empty for all):
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {backup.collections.map((collection) => (
                    <div key={collection} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`collection-${collection}`}
                        checked={selectedCollections.includes(collection)}
                        onChange={() => toggleCollection(collection)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`collection-${collection}`}
                        className="ml-2 text-sm text-gray-700 font-mono"
                      >
                        {collection}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-4 border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className={`text-sm font-medium mb-2 ${
                result.success ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {result.success ? '✅ Restore Completed Successfully!' : '⚠️ Restore Completed with Warnings'}
              </h3>
              <div className={`text-sm space-y-1 ${
                result.success ? 'text-green-700' : 'text-yellow-700'
              }`}>
                <p><strong>Collections restored:</strong> {result.restoredCollections?.length || 0}</p>
                <p><strong>Files restored:</strong> {result.restoredFiles || 0}</p>
                <p><strong>Records restored:</strong> {result.restoredRecords || 0}</p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-800">Errors ({result.errors.length}):</p>
                    <ul className="list-disc list-inside text-red-700">
                      {result.errors.map((err: string, idx: number) => (
                        <li key={idx} className="text-xs">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!dryRun && result.success && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p className="text-xs text-green-600">
                      <strong>Next steps:</strong> Verify your data matches the backup timestamp. 
                      Check Firestore, Storage, and MySQL to confirm restore success.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {restoring ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  {dryRun ? 'Preview Restore' : 'Restore Backup'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

