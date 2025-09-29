'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DesignWithDetails } from '@/types/enhanced-products';
import { DesignForm } from '@/components/designer/DesignForm';
import { DesignCard } from '@/components/designer/DesignCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye, 
  Download, 
  Heart,
  TrendingUp,
  Star,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Upload
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DesignsDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth(true, 'designer');
  const [designs, setDesigns] = useState<DesignWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDesign, setEditingDesign] = useState<DesignWithDetails | null>(null);
  const [stats, setStats] = useState({
    totalDesigns: 0,
    totalViews: 0,
    totalDownloads: 0,
    totalLikes: 0
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/unauthorized');
      return;
    }
    
    if (user && user.role !== 'designer' && user.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }

    if (user) {
      loadDesigns();
      loadStats();
    }
  }, [user, isLoading, router]);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append('designerId', user?.id || '');
      
      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      const response = await fetch(`/api/designs?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load designs');
      }

      setDesigns(data.designs || []);
    } catch (error: any) {
      console.error('Error loading designs:', error);
      setError(error.message || 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/designs/stats?designerId=${user?.id}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateDesign = async (designData: any) => {
    try {
      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(designData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create design');
      }

      setShowCreateForm(false);
      loadDesigns();
      loadStats();
    } catch (error: any) {
      console.error('Error creating design:', error);
      alert(error.message || 'Failed to create design');
    }
  };

  const handleUpdateDesign = async (designData: any) => {
    if (!editingDesign) return;

    try {
      const response = await fetch(`/api/designs/${editingDesign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(designData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update design');
      }

      setEditingDesign(null);
      loadDesigns();
    } catch (error: any) {
      console.error('Error updating design:', error);
      alert(error.message || 'Failed to update design');
    }
  };

  const handleDeleteDesign = async (design: DesignWithDetails) => {
    if (!confirm(`Are you sure you want to delete "${design.designName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/designs/${design.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete design');
      }

      loadDesigns();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting design:', error);
      alert(error.message || 'Failed to delete design');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDesigns();
  };

  const filteredDesigns = designs.filter(design =>
    design.designName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    design.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    design.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Designs</h1>
            <p className="text-gray-600 mt-1">Manage your design portfolio</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Design</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Designs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDesigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLikes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search your designs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {filteredDesigns.length} design{filteredDesigns.length !== 1 ? 's' : ''} found
          </p>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDesigns} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Designs */}
      {!loading && !error && (
        <>
          {filteredDesigns.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No designs found matching your search.' : 'You haven\'t uploaded any designs yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  Upload Your First Design
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredDesigns.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  variant={viewMode === 'grid' ? 'catalog' : 'portfolio'}
                  showActions={true}
                  onEdit={setEditingDesign}
                  onDelete={handleDeleteDesign}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingDesign) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DesignForm
              design={editingDesign || undefined}
              onSave={editingDesign ? handleUpdateDesign : handleCreateDesign}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingDesign(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
