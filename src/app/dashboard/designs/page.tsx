'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DesignWithDetails } from '@/types/enhanced-products';
import { DesignForm } from '@/components/designer/DesignForm';
import { DesignCard } from '@/components/designer/DesignCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
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
  Upload,
  Package,
  DollarSign
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
  const [deletingDesign, setDeletingDesign] = useState<DesignWithDetails | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDesigns: 0,
    totalViews: 0,
    totalDownloads: 0,
    totalLikes: 0
  });
  const [shopProfile, setShopProfile] = useState<any>(null);
  const [designerProfile, setDesignerProfile] = useState<any>(null);

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
  }, [user?.id, isLoading]); // Only depend on user.id, not the entire user object

  const loadDesigns = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading designs for user:', user.id);

      // First, get the designer profile to get the profile ID
      const profileResponse = await fetch(`/api/designer-profiles?userId=${user.id}`);
      const profileData = await profileResponse.json();
      
      if (!profileResponse.ok || !profileData.profiles || profileData.profiles.length === 0) {
        console.log('❌ No designer profile found for user');
        setDesigns([]);
        return;
      }

      const designerProfile = profileData.profiles[0];
      console.log('✅ Found designer profile:', designerProfile.id);

      const queryParams = new URLSearchParams();
      queryParams.append('designerId', designerProfile.id); // Use profile ID, not user ID
      
      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      const url = `/api/designs?${queryParams.toString()}`;
      console.log('📡 Fetching designs from:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('📊 Designs API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load designs');
      }

      setDesigns(data.designs || []);
      console.log('✅ Designs loaded:', data.designs?.length || 0);
    } catch (error: any) {
      console.error('❌ Error loading designs:', error);
      setError(error.message || 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;
    
    try {
      // First, get the designer profile to get the profile ID
      const profileResponse = await fetch(`/api/designer-profiles?userId=${user.id}`);
      const profileData = await profileResponse.json();
      
      if (!profileResponse.ok || !profileData.profiles || profileData.profiles.length === 0) {
        console.log('❌ No designer profile found for stats');
        return;
      }

      const designerProfileData = profileData.profiles[0];
      setDesignerProfile(designerProfileData);
      console.log('📊 Loading stats for designer profile:', designerProfileData.id);

      // Load design stats
      const designStatsResponse = await fetch(`/api/designs/stats?designerId=${designerProfileData.id}`);
      const designStatsData = await designStatsResponse.json();

      if (designStatsResponse.ok) {
        setStats(designStatsData.stats || stats);
        console.log('✅ Design stats loaded:', designStatsData.stats);
      }

      // Load shop profile if it exists (designers can also be business owners)
      try {
        const shopProfileResponse = await fetch(`/api/shop-profiles?userId=${user.id}`);
        const shopProfileData = await shopProfileResponse.json();
        
        if (shopProfileResponse.ok && shopProfileData.data && shopProfileData.data.length > 0) {
          setShopProfile(shopProfileData.data[0]);
          console.log('✅ Shop profile loaded:', shopProfileData.data[0]);
        } else if (shopProfileResponse.ok && shopProfileData.profiles && shopProfileData.profiles.length > 0) {
          // Fallback for different API response format
          setShopProfile(shopProfileData.profiles[0]);
          console.log('✅ Shop profile loaded:', shopProfileData.profiles[0]);
        }
      } catch (shopError) {
        console.log('ℹ️ No shop profile found for this designer');
        // Not an error - designers might not have a shop profile
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const handleCreateDesign = async (createdDesign: any) => {
    // This function is called after the form has already created the design
    // We just need to update the UI, not make another API call
    console.log('✅ Design created by form, updating UI:', createdDesign);
    
    setShowCreateForm(false);
    
    // Add a small delay to prevent rapid successive calls
    setTimeout(() => {
      loadDesigns();
      loadStats();
    }, 100);
  };

  const handleUpdateDesign = async (designData: any) => {
    if (!editingDesign) return;

    try {
      setUpdateLoading(true);
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
      await loadDesigns();
      await loadStats();
    } catch (error: any) {
      console.error('Error updating design:', error);
      alert(error.message || 'Failed to update design');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteDesign = (design: DesignWithDetails) => {
    setDeletingDesign(design);
  };

  const confirmDeleteDesign = async () => {
    if (!deletingDesign) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/designs/${deletingDesign.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete design');
      }

      setDeletingDesign(null);
      await loadDesigns();
      await loadStats();
    } catch (error: any) {
      console.error('Error deleting design:', error);
      alert(error.message || 'Failed to delete design');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteDesign = () => {
    setDeletingDesign(null);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader user={user} />

      <div className="flex flex-1">
        {/* Dashboard Sidebar */}
        <DashboardSidebar user={user} />

        {/* Main Content */}
        <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            {/* Page Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Designs</h1>
                  <p className="text-gray-600">Manage your design portfolio</p>
                </div>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Upload Design</span>
                </Button>
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

              {/* View Mode Toggle - Matching Products Page Style */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {filteredDesigns.length} design{filteredDesigns.length !== 1 ? 's' : ''} found
                </p>
                
                {/* View Mode Toggle - Right side, matching products page */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none border-r-0"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
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
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
                      : 'space-y-4'
                  }>
                    {filteredDesigns.map((design) => (
                      <DesignCard
                        key={design.id}
                        design={design}
                        variant={viewMode === 'grid' ? 'dashboard-grid' : 'dashboard-list'}
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
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingDesign}
        onClose={cancelDeleteDesign}
        onConfirm={confirmDeleteDesign}
        title="Delete Design"
        message={`Are you sure you want to delete "${deletingDesign?.designName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
      />

    </div>
  );
}
