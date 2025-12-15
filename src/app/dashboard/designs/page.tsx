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
  const [designerProfileId, setDesignerProfileId] = useState<string | null>(null);

  // Cache designer profile ID to avoid repeated API calls
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
      // Load designer profile ID first, then designs
      loadDesignerProfileId().then((profileId) => {
        if (profileId) {
          loadDesigns(true); // Skip profile check since we just loaded it
        } else {
          // If no profile found, still try to load (will show empty state)
          loadDesigns(false);
        }
      });
      loadStats();
    }
  }, [user?.id, isLoading]); // Only depend on user.id, not the entire user object

  // Load designer profile ID (cached to reduce DB calls)
  const loadDesignerProfileId = async () => {
    if (!user?.id) {
      console.warn('⚠️ No user ID available for loading designer profile');
      return null;
    }
    
    // Use cached value if available
    if (designerProfileId) {
      console.log('✅ Using cached designer profile ID:', designerProfileId);
      return designerProfileId;
    }
    
    try {
      console.log('🔍 Fetching designer profile for user:', user.id);
      const profileResponse = await fetch(`/api/designer-profiles?userId=${user.id}`);
      const profileData = await profileResponse.json();
      
      console.log('📊 Designer profile response:', profileData);
      
      if (profileResponse.ok && profileData.profiles && profileData.profiles.length > 0) {
        const profileId = profileData.profiles[0].id;
        setDesignerProfileId(profileId);
        setDesignerProfile(profileData.profiles[0]);
        console.log('✅ Designer profile loaded:', profileId);
        return profileId;
      } else {
        console.warn('⚠️ No designer profile found in response:', profileData);
      }
    } catch (error) {
      console.error('❌ Error loading designer profile:', error);
    }
    return null;
  };

  const loadDesigns = async (skipProfileCheck = false) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading designs for user:', user.id);

      // Get designer profile ID (use cached value if available, or load it)
      let profileId = designerProfileId;
      if (!profileId) {
        profileId = await loadDesignerProfileId();
      }
      
      if (!profileId) {
        console.log('❌ No designer profile found for user');
        setDesigns([]);
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('designerId', profileId);
      
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

      const fetchedDesigns = data.designs || [];
      setDesigns(fetchedDesigns);
      console.log('✅ Designs loaded:', fetchedDesigns.length, 'designs');
      if (fetchedDesigns.length === 0) {
        console.warn('⚠️ No designs found. Profile ID:', profileId, 'User ID:', user.id);
      }
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
      // Use cached designer profile ID if available, otherwise fetch it
      let profileId = designerProfileId;
      if (!profileId) {
        profileId = await loadDesignerProfileId();
      }
      
      if (!profileId) {
        console.log('❌ No designer profile found for stats');
        return;
      }

      console.log('📊 Loading stats for designer profile:', profileId);

      // Load design stats
      const designStatsResponse = await fetch(`/api/designs/stats?designerId=${profileId}`);
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
    console.log('✅ Design created by form, updating UI:', createdDesign);
    
    setShowCreateForm(false);
    
    // Optimistic update: Add the new design to the list immediately
    if (createdDesign) {
      setDesigns(prev => {
        // Check if design already exists (avoid duplicates)
        const exists = prev.some(d => d.id === createdDesign.id);
        if (exists) return prev;
        // Add new design at the beginning (most recent first)
        return [createdDesign, ...prev];
      });
      
      // Update stats optimistically
      setStats(prev => ({
        ...prev,
        totalDesigns: prev.totalDesigns + 1
      }));
    }
    
    // Refetch in background to ensure data is in sync (but don't block UI)
    // Use a small delay to let cache revalidation complete
    setTimeout(() => {
      loadDesigns(true); // Skip profile check, use cached ID
      loadStats();
    }, 500);
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
      // Optimistic update: Update the design in the list immediately
      const updatedDesign = await response.json();
      if (updatedDesign.design) {
        setDesigns(prev => prev.map(d => d.id === updatedDesign.design.id ? updatedDesign.design : d));
      }
      // Refetch in background to ensure sync
      await loadDesigns(true);
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

      // Optimistic update: Remove the design from the list immediately
      setDesigns(prev => prev.filter(d => d.id !== deletingDesign.id));
      setStats(prev => ({
        ...prev,
        totalDesigns: Math.max(0, prev.totalDesigns - 1)
      }));
      setDeletingDesign(null);
      // Refetch in background to ensure sync
      await loadDesigns(true);
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
    loadDesigns(true); // Skip profile check, use cached ID
  };

  const filteredDesigns = designs.filter(design => {
    // Show all designs if no search term
    if (!searchTerm.trim()) return true;
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    const matchesName = design.designName?.toLowerCase().includes(searchLower) || false;
    const matchesDescription = design.description?.toLowerCase().includes(searchLower) || false;
    const matchesTags = Array.isArray(design.tags) && design.tags.some(tag => 
      tag && typeof tag === 'string' && tag.toLowerCase().includes(searchLower)
    ) || false;
    
    return matchesName || matchesDescription || matchesTags;
  });

  // Debug logging
  useEffect(() => {
    if (designs.length > 0) {
      console.log('📋 Current designs state:', {
        total: designs.length,
        filtered: filteredDesigns.length,
        searchTerm: searchTerm,
        sampleDesign: designs[0]
      });
    }
  }, [designs, filteredDesigns, searchTerm]);

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
                <Button onClick={() => loadDesigns(false)} variant="outline">
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
                    <p className="text-gray-600 mb-2">
                      {searchTerm 
                        ? `No designs found matching "${searchTerm}".` 
                        : designs.length === 0
                          ? 'You haven\'t uploaded any designs yet.'
                          : 'No designs match your search criteria.'}
                    </p>
                    {designs.length > 0 && searchTerm && (
                      <p className="text-sm text-gray-500 mb-4">
                        Showing {designs.length} total design{designs.length !== 1 ? 's' : ''} in your portfolio.
                      </p>
                    )}
                    {!searchTerm && (
                      <Button onClick={() => setShowCreateForm(true)}>
                        Upload Your First Design
                      </Button>
                    )}
                    {searchTerm && (
                      <Button onClick={() => setSearchTerm('')} variant="outline" className="mt-2">
                        Clear Search
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
