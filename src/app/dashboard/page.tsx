'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { Product } from '@/types/products';
import { User, Settings, Palette, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { FinanceSummary } from '@/services/FinanceService';
import Link from 'next/link';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';

function DashboardContent() {
  const { user, isCustomer, isDesigner, isBusinessOwner, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  
  // Designer stats
  const [designerStats, setDesignerStats] = useState({
    totalDesigns: 0,
    totalDownloads: 0,
    totalReviews: 0,
    averageRating: 0
  });
  const [designerStatsLoading, setDesignerStatsLoading] = useState(false);

  // Redirect customers to explore page
  useEffect(() => {
    if (!isLoading && isCustomer) {
      router.push('/explore');
    }
  }, [isCustomer, isLoading, router]);

  // Fetch products for business owners
  useEffect(() => {
    if (isBusinessOwner && user?.id) {
      fetchProducts();
    }
  }, [isBusinessOwner, user?.id]);

  // Fetch finance summary for designers and business owners
  useEffect(() => {
    if ((isDesigner || isBusinessOwner) && user?.id) {
      fetchFinanceSummary();
    }
  }, [isDesigner, isBusinessOwner, user?.id]);

  // Fetch designer stats
  useEffect(() => {
    if (isDesigner && user?.id) {
      fetchDesignerStats();
    }
  }, [isDesigner, user?.id]);

  const fetchFinanceSummary = async () => {
    try {
      setFinanceLoading(true);
      const response = await fetch('/api/finance?timeRange=30d');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFinanceSummary(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching finance summary:', error);
    } finally {
      setFinanceLoading(false);
    }
  };

  const fetchDesignerStats = async () => {
    if (!user?.id) return;
    
    try {
      setDesignerStatsLoading(true);
      
      // Get designer profile
      const profileResponse = await fetch(`/api/designer-profiles?userId=${user.id}`);
      const profileData = await profileResponse.json();
      
      if (!profileResponse.ok || !profileData.profiles || profileData.profiles.length === 0) {
        console.log('No designer profile found');
        setDesignerStatsLoading(false);
        return;
      }

      const designerProfile = profileData.profiles[0];
      
      // Get design stats
      const designStatsResponse = await fetch(`/api/designs/stats?designerId=${designerProfile.id}`);
      const designStatsData = await designStatsResponse.json();
      
      let totalDesigns = 0;
      let totalDownloads = 0;
      
      if (designStatsResponse.ok && designStatsData.stats) {
        totalDesigns = designStatsData.stats.totalDesigns || 0;
        totalDownloads = designStatsData.stats.totalDownloads || 0;
      }
      
      // Get reviews
      const reviewsResponse = await fetch(`/api/reviews?designerId=${designerProfile.id}&reviewType=designer`);
      const reviewsData = await reviewsResponse.json();
      
      let totalReviews = 0;
      let averageRating = 0;
      
      if (reviewsResponse.ok && reviewsData.success && reviewsData.data) {
        const reviews = Array.isArray(reviewsData.data) ? reviewsData.data : [];
        totalReviews = reviews.length || 0;
        if (totalReviews > 0) {
          const sum = reviews.reduce((acc: number, review: any) => acc + (review.rating || 0), 0);
          averageRating = sum / totalReviews;
        }
      }
      
      // Try to get average rating from the average API endpoint as well
      try {
        const avgResponse = await fetch(`/api/reviews/average?type=designer&targetId=${designerProfile.id}`);
        const avgData = await avgResponse.json();
        if (avgResponse.ok && avgData.success && avgData.data) {
          if (avgData.data.total > 0) {
            totalReviews = avgData.data.total;
            averageRating = avgData.data.average || 0;
          }
        }
      } catch (avgError) {
        console.log('Could not fetch average rating, using calculated value');
      }
      
      setDesignerStats({
        totalDesigns,
        totalDownloads,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
      });
    } catch (error) {
      console.error('Error fetching designer stats:', error);
    } finally {
      setDesignerStatsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch(`/api/products?businessOwnerId=${user?.id}&limit=100`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setProducts(data.data.products || []);
      } else {
        console.error('Error fetching products:', data.error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Calculate product stats
  const getProductStats = () => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const draftProducts = products.filter(p => p.status === 'draft').length;
    const outOfStockProducts = products.filter(p => p.status === 'out_of_stock').length;
    
    return {
      total: totalProducts,
      active: activeProducts,
      draft: draftProducts,
      outOfStock: outOfStockProducts
    };
  };

  const productStats = getProductStats();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader user={user} />

      <div className="flex flex-1">
        {/* Dashboard Sidebar */}
        <DashboardSidebar user={user} />

        {/* Main Content - Add left margin for fixed sidebar on desktop */}
        <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome back, {user?.name || user?.email}!
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-gray-600">
                  Role: <span className="capitalize font-medium">{user?.role}</span>
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/role-selection'}
                  className="ml-2"
                >
                  Change Role
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Finance Summary Cards for Designers and Business Owners */}
        {(isDesigner || isBusinessOwner) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Finance Overview</h3>
              <Link href="/dashboard/finance">
                <Button variant="outline" size="sm">View Full Finance</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {financeLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                  ))}
                </>
              ) : financeSummary ? (
                <>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {isDesigner ? 'Total Earnings' : 'Total Revenue'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                            minimumFractionDigits: 2
                          }).format(isDesigner ? financeSummary.totalEarnings : financeSummary.totalRevenue)}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">This Month</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                            minimumFractionDigits: 2
                          }).format(isDesigner ? financeSummary.thisMonthEarnings : financeSummary.thisMonthRevenue)}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                            minimumFractionDigits: 2
                          }).format(financeSummary.pendingAmount)}
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Paid</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                            minimumFractionDigits: 2
                          }).format(financeSummary.paidAmount)}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-4 bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">No finance data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Role-based Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isCustomer && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Browse Products</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Discover unique designs and custom products from talented designers.
                </p>
                <Button size="sm">Explore Products</Button>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">My Orders</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Track your orders and view order history.
                </p>
                <Button variant="outline" size="sm">View Orders</Button>
              </div>
            </>
          )}

          {isDesigner && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">My Designs</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage your design portfolio and uploads.
                </p>
                <Button size="sm">Manage Designs</Button>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Earnings</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View your earnings and commission details.
                </p>
                <Link href="/dashboard/finance">
                  <Button variant="outline" size="sm">View Earnings</Button>
                </Link>
              </div>
            </>
          )}

          {isBusinessOwner && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900">Orders</h3>
                  <Link href="/dashboard/orders">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200 text-indigo-700"
                    >
                      View Orders
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-600 text-sm">
                  View and process customer orders.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900">Manage Products</h3>
                  <Link href="/dashboard/products">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200 text-indigo-700"
                    >
                      Manage Products
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-600 text-sm">
                  Manage your shop settings and products.
                </p>
              </div>
            </>
          )}

          {isAdmin && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage users, roles, and permissions.
                </p>
                <Button size="sm">Manage Users</Button>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">System Analytics</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View platform statistics and analytics.
                </p>
                <Button variant="outline" size="sm">View Analytics</Button>
              </div>
            </>
          )}

          {/* Common sections for all roles */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-gray-900">Profile Settings</h3>
              <Link href="/profile">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200 text-indigo-700"
                >
                  Edit Profile
                </Button>
              </Link>
            </div>
            <p className="text-gray-600 text-sm">
              Update your profile information and preferences.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* First Stat */}
            <div className="text-center bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {isBusinessOwner ? (
                  productsLoading ? '...' : productStats.total
                ) : isDesigner ? (
                  designerStatsLoading ? '...' : designerStats.totalDesigns
                ) : (
                  isCustomer ? '0' : '0'
                )}
              </div>
              <div className="text-sm text-gray-600">
                {isCustomer ? 'Orders' : isDesigner ? 'Designs' : isBusinessOwner ? 'Total Products' : 'Total Users'}
              </div>
            </div>
            
            {/* Second Stat */}
            <div className="text-center bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {isBusinessOwner ? (
                  productsLoading ? '...' : productStats.active
                ) : isDesigner ? (
                  designerStatsLoading ? '...' : designerStats.totalDownloads
                ) : (
                  isCustomer ? '$0' : '0'
                )}
              </div>
              <div className="text-sm text-gray-600">
                {isCustomer ? 'Spent' : isDesigner ? 'Downloads' : isBusinessOwner ? 'Active Products' : 'Reviews'}
              </div>
            </div>
            
            {/* Third Stat */}
            <div className="text-center bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {isBusinessOwner ? (
                  productsLoading ? '...' : productStats.draft
                ) : isDesigner ? (
                  designerStatsLoading ? '...' : designerStats.totalReviews
                ) : (
                  '0'
                )}
              </div>
              <div className="text-sm text-gray-600">
                {isBusinessOwner ? 'Draft Products' : isDesigner ? 'Reviews' : 'Reviews'}
              </div>
            </div>
            
            {/* Fourth Stat */}
            <div className="text-center bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">
                {isBusinessOwner ? (
                  productsLoading ? '...' : productStats.outOfStock
                ) : isDesigner ? (
                  designerStatsLoading ? '...' : designerStats.averageRating.toFixed(1)
                ) : (
                  '0'
                )}
              </div>
              <div className="text-sm text-gray-600">
                {isBusinessOwner ? 'Out of Stock' : isDesigner ? 'Rating' : 'Messages'}
              </div>
            </div>
           </div>
         </div>
           </div>
         </div>
       </div>
     </div>
   );
 }

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
