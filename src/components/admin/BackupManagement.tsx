'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileArchive,
  Eye
} from 'lucide-react';
import { BackupRestoreDialog } from './BackupRestoreDialog';
import { BackupDetails } from './BackupDetails';

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

export function BackupManagement() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadBackups();
    // Poll for updates if there are in-progress backups
    const interval = setInterval(() => {
      const hasInProgress = backups.some(b => b.status === 'in_progress');
      if (hasInProgress) {
        loadBackups();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/backups');
      if (!response.ok) throw new Error('Failed to load backups');
      const data = await response.json();
      setBackups(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeFirestore: true,
          includeStorage: true,
          includeMySQL: true,
          uploadToGCS: true
        })
      });
      if (!response.ok) throw new Error('Failed to create backup');
      await loadBackups();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/backups/${backupId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete backup');
      await loadBackups();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/admin/backups/${backupId}/download`);
      if (!response.ok) throw new Error('Failed to download backup');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backupId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading && backups.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2">Loading backups...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backup Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage system backups and recovery</p>
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Backup
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Backups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Backup ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collections
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No backups found. Create your first backup to get started.
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileArchive className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm font-mono text-gray-900">{backup.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(backup.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        backup.type === 'full' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(backup.status)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{backup.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatSize(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.collections.length > 0 
                        ? `${backup.collections.length} collections`
                        : 'All collections'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {backup.status === 'completed' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreDialog(true);
                              }}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Restore"
                            >
                              <Database className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadBackup(backup.id)}
                              className="text-purple-600 hover:text-purple-900 p-1"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Dialog */}
      {showRestoreDialog && selectedBackup && (
        <BackupRestoreDialog
          backup={selectedBackup}
          onClose={() => {
            setShowRestoreDialog(false);
            setSelectedBackup(null);
          }}
          onRestore={loadBackups}
        />
      )}

      {/* Details Dialog */}
      {showDetails && selectedBackup && (
        <BackupDetails
          backup={selectedBackup}
          onClose={() => {
            setShowDetails(false);
            setSelectedBackup(null);
          }}
        />
      )}
    </div>
  );
}


