'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName?: string;
  name?: string; // Keep for backward compatibility
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: {
    preferences?: {
      notifications?: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
      theme: string;
    };
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    isVerified: false
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (response.ok) {
        // Handle the new standardized response structure
        if (data.success && data.data) {
          // New ResponseBuilder format: { success: true, data: { users: [...] } }
          setUsers(data.data.users || []);
        } else if (data.users) {
          // Legacy format: { users: [...] }
          setUsers(data.users || []);
        } else if (Array.isArray(data)) {
          // Direct array response
          setUsers(data);
        } else {
          setUsers([]);
        }
      } else {
        console.error('Error loading users:', data.error?.message || data.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setEditingUser(null);
        setFormData({
          name: '',
          email: '',
          role: '',
          isVerified: false
        });
        loadUsers();
      } else {
        console.error('Error updating user:', data.error);
        alert(data.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadUsers();
      } else {
        const data = await response.json();
        console.error('Error deleting user:', data.error);
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.displayName || user.name || '',
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'business_owner':
        return 'bg-blue-100 text-blue-800';
      case 'designer':
        return 'bg-purple-100 text-purple-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const userName = user.displayName || user.name || '';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesVerification = verificationFilter === 'all' || 
                               (verificationFilter === 'verified' && user.isVerified) ||
                               (verificationFilter === 'unverified' && !user.isVerified);
    return matchesSearch && matchesRole && matchesVerification;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkVerify = async (verify: boolean) => {
    if (selectedUsers.size === 0) {
      alert('Please select users to update');
      return;
    }

    if (!confirm(`Are you sure you want to ${verify ? 'verify' : 'unverify'} ${selectedUsers.size} user(s)?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const updates = Array.from(selectedUsers).map(userId =>
        fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVerified: verify })
        })
      );

      await Promise.all(updates);
      setSelectedUsers(new Set());
      await loadUsers();
      alert(`Successfully ${verify ? 'verified' : 'unverified'} ${selectedUsers.size} user(s)`);
    } catch (error) {
      console.error('Error updating users:', error);
      alert('Failed to update users');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select users to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const deletes = Array.from(selectedUsers).map(userId =>
        fetch(`/api/users/${userId}`, { method: 'DELETE' })
      );

      await Promise.all(deletes);
      setSelectedUsers(new Set());
      await loadUsers();
      alert(`Successfully deleted ${selectedUsers.size} user(s)`);
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('Failed to delete users');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Role', 'Verified', 'Joined Date'].join(','),
      ...filteredUsers.map(user => [
        `"${(user.displayName || user.name || '').replace(/"/g, '""')}"`,
        `"${user.email.replace(/"/g, '""')}"`,
        user.role,
        user.isVerified ? 'Yes' : 'No',
        new Date(user.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and permissions
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-1 items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="business_owner">Business Owner</option>
                <option value="designer">Designer</option>
                <option value="customer">Customer</option>
              </select>
              <select
                value={verificationFilter}
                onChange={(e) => {
                  setVerificationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedUsers.size} user(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleBulkVerify(true)}
                  variant="outline"
                  size="sm"
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Verify Selected
                </Button>
                <Button
                  onClick={() => handleBulkVerify(false)}
                  variant="outline"
                  size="sm"
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  Unverify Selected
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  variant="outline"
                  size="sm"
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {editingUser && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Edit User: {editingUser.email}
            </h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="customer">Customer</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="designer">Designer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isVerified}
                      onChange={(e) => setFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Verified</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingUser(null);
                    setFormData({
                      name: '',
                      email: '',
                      role: '',
                      isVerified: false
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update User
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Users ({filteredUsers.length})
              </h3>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {(user.displayName || user.name)?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.displayName || user.name || 'No name'}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.isVerified ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm ${user.isVerified ? 'text-green-600' : 'text-red-600'}`}>
                              {user.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              onClick={() => startEdit(user)}
                              size="sm"
                              variant="outline"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteUser(user.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          variant={currentPage === pageNum ? 'primary' : 'outline'}
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
