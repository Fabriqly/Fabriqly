'use client';

import React, { useState, useEffect } from 'react';
import { DesignWithDetails } from '@/types/enhanced-products';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Star, 
  Search, 
  Eye, 
  Download, 
  Heart, 
  Calendar,
  User,
  Tag,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/timestamp';

interface FeaturedDesignsManagementProps {
  onDesignUpdate?: () => void;
}

export function FeaturedDesignsManagement({ onDesignUpdate }: FeaturedDesignsManagementProps) {
  const [designs, setDesigns] = useState<DesignWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'featured' | 'not-featured'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadDesigns();
  }, [statusFilter]);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: '100',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/designs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDesigns(data.designs || []);
      } else {
        setError(data.error || 'Failed to load designs');
      }
    } catch (error) {
      console.error('Error loading designs:', error);
      setError('Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (designId: string, currentStatus: boolean) => {
    try {
      setUpdating(designId);
      
      const response = await fetch(`/api/designs/${designId}/feature`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFeatured: !currentStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setDesigns(prev => prev.map(design => 
          design.id === designId 
            ? { ...design, isFeatured: !currentStatus }
            : design
        ));
        
        if (onDesignUpdate) {
          onDesignUpdate();
        }
      } else {
        throw new Error(data.error || 'Failed to update featured status');
      }
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      alert(error.message || 'Failed to update featured status');
    } finally {
      setUpdating(null);
    }
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.designName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         design.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         design.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'featured' && design.isFeatured) ||
                         (statusFilter === 'not-featured' && !design.isFeatured);
    
    return matchesSearch && matchesStatus;
  });

  const featuredCount = designs.filter(d => d.isFeatured).length;
  const totalCount = designs.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
        <Button 
          onClick={loadDesigns} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Featured Designs Management</h2>
          <p className="text-gray-600 mt-1">
            Manage which designs appear in the featured section
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {featuredCount} of {totalCount} designs are currently featured
          </p>
        </div>
        <Button onClick={loadDesigns} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search designs by name, description, or tags..."
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Designs</option>
            <option value="featured">Featured Only</option>
            <option value="not-featured">Not Featured</option>
          </select>
        </div>
      </div>

      {/* Designs List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Design
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDesigns.map((design) => (
                <tr key={design.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {design.thumbnailUrl ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={design.thumbnailUrl}
                            alt={design.designName}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Tag className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {design.designName}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {design.description}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {design.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {design.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{design.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center">
                       <User className="w-4 h-4 text-gray-400 mr-2" />
                       <div className="text-sm text-gray-900">
                         {design.designer?.businessName || 'Unknown Designer'}
                       </div>
                     </div>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {design.viewCount}
                      </div>
                      <div className="flex items-center">
                        <Download className="w-4 h-4 mr-1" />
                        {design.downloadCount}
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {design.likesCount}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatRelativeTime(design.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {design.isFeatured ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Featured
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => toggleFeatured(design.id, design.isFeatured)}
                      disabled={updating === design.id}
                      variant={design.isFeatured ? "outline" : "primary"}
                      size="sm"
                      className={design.isFeatured ? "text-gray-600" : "text-white"}
                    >
                      {updating === design.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : design.isFeatured ? (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Unfeature
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Feature
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDesigns.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No designs found matching your criteria.' 
                : 'No designs found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
