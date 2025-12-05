'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Calendar,
  Percent,
  DollarSign
} from 'lucide-react';
import { DiscountForm } from '@/components/promotions/DiscountForm';
import { CouponGenerator } from '@/components/promotions/CouponGenerator';
import { Discount, CouponCode } from '@/types/promotion';

export default function PromotionsPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'discounts' | 'coupons'>('discounts');
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [discountMap, setDiscountMap] = useState<Record<string, Discount>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isLoading) {
      if (activeTab === 'discounts') {
        loadDiscounts();
      } else {
        loadAllCoupons();
      }
    }
  }, [user, isLoading, activeTab]);


  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/discounts');
      const data = await response.json();

      if (response.ok && data.success) {
        setDiscounts(data.data || []);
      } else {
        setError(data.error || 'Failed to load discounts');
      }
    } catch (error) {
      console.error('Error loading discounts:', error);
      setError('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async (discountId: string) => {
    try {
      const response = await fetch(`/api/coupons?discountId=${discountId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setCoupons(data.data || []);
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
    }
  };

  const loadAllCoupons = async () => {
    try {
      setLoading(true);
      // Load both coupons and discounts to map discount info
      const [couponsResponse, discountsResponse] = await Promise.all([
        fetch('/api/coupons'),
        fetch('/api/discounts')
      ]);

      const couponsData = await couponsResponse.json();
      const discountsData = await discountsResponse.json();

      if (couponsResponse.ok && couponsData.success) {
        setCoupons(couponsData.data || []);
      } else {
        setError(couponsData.error || 'Failed to load coupons');
      }

      if (discountsResponse.ok && discountsData.success) {
        const discounts = discountsData.data || [];
        setDiscounts(discounts);
        // Create a map of discount ID to discount for quick lookup
        const map: Record<string, Discount> = {};
        discounts.forEach((discount: Discount) => {
          map[discount.id] = discount;
        });
        setDiscountMap(map);
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) {
      return;
    }

    try {
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loadDiscounts();
      } else {
        setError(data.error || 'Failed to delete discount');
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      setError('Failed to delete discount');
    }
  };

  const formatDate = (date: Date | string | any) => {
    // Handle null, undefined, or empty values
    if (!date || date === null || date === undefined || date === '') {
      return 'N/A';
    }
    
    try {
      let d: Date;
      
      // If it's already a Date object
      if (date instanceof Date) {
        d = date;
      }
      // If it's an ISO string (from API) - this is the most common case
      else if (typeof date === 'string') {
        // Handle empty string
        if (date.trim() === '') {
          return 'N/A';
        }
        d = new Date(date);
      }
      // If it's a Firestore Timestamp (has toDate method) - for client-side direct access
      else if (date && typeof date === 'object' && typeof date.toDate === 'function') {
        d = date.toDate();
      }
      // If it's an object with seconds (Firestore Timestamp format) - for client-side direct access
      else if (date && typeof date === 'object' && typeof date.seconds === 'number') {
        d = new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
      }
      // If it's a number (timestamp)
      else if (typeof date === 'number') {
        d = new Date(date);
      }
      // Try default Date constructor as last resort
      else {
        d = new Date(date);
      }
      
      // Check if date is valid
      if (isNaN(d.getTime())) {
        console.warn('Invalid date value:', date, typeof date);
        return 'N/A';
      }
      
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Not Authenticated</h2>
          <p className="text-gray-600">Please log in to view this page.</p>
        </div>
      </div>
    );
  }

  // Check role - allow both 'business_owner' role
  const isBusinessOwner = user.role === 'business_owner';
  
  if (!isBusinessOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
          <p className="text-sm text-gray-500 mt-2">Your role: {user.role || 'unknown'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader user={user} />
      <div className="flex flex-1">
        <DashboardSidebar user={user} />
        <main className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
                <p className="text-gray-600 mt-1">Manage discounts and coupon codes for your shop</p>
              </div>
              {activeTab === 'discounts' && (
                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setEditingDiscount(null);
                      setShowDiscountForm(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Discount
                  </Button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('discounts')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'discounts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Discounts
                </button>
                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'coupons'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Coupons
                </button>
              </nav>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {showDiscountForm && (
              <DiscountForm
                discount={editingDiscount}
                onClose={() => {
                  setShowDiscountForm(false);
                  setEditingDiscount(null);
                }}
                onSuccess={() => {
                  setShowDiscountForm(false);
                  setEditingDiscount(null);
                  loadDiscounts();
                }}
              />
            )}

            {showCouponForm && selectedDiscountId && (
              <CouponGenerator
                discountId={selectedDiscountId}
                onClose={() => {
                  setShowCouponForm(false);
                  setSelectedDiscountId(null);
                }}
                onSuccess={() => {
                  setShowCouponForm(false);
                  setSelectedDiscountId(null);
                  if (selectedDiscountId) {
                    loadCoupons(selectedDiscountId);
                  }
                }}
              />
            )}

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading {activeTab}...</p>
              </div>
            ) : activeTab === 'discounts' ? (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scope
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valid Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {discounts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                            No discounts found. Create your first discount to get started.
                          </td>
                        </tr>
                      ) : (
                        discounts.map((discount) => (
                          <tr key={discount.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                              {discount.description && (
                                <div className="text-sm text-gray-500">{discount.description}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                {discount.type === 'percentage' ? (
                                  <Percent className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <DollarSign className="w-4 h-4 text-gray-400" />
                                )}
                                <span className="text-sm text-gray-900">
                                  {discount.type === 'percentage' 
                                    ? `${discount.value}%`
                                    : `$${discount.value}`}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 capitalize">{discount.scope}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(discount.status)}`}>
                                {discount.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">
                                {discount.usedCount || 0}
                                {discount.usageLimit && ` / ${discount.usageLimit}`}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDiscountId(discount.id);
                                    setShowCouponForm(true);
                                  }}
                                >
                                  <Tag className="w-4 h-4 mr-1" />
                                  Coupons
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingDiscount(discount);
                                    setShowDiscountForm(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDiscount(discount.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valid Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {coupons.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No coupons found. Create coupons from the Discounts tab.
                          </td>
                        </tr>
                      ) : (
                        coupons.map((coupon) => {
                          const discount = discountMap[coupon.discountId];
                          return (
                            <tr key={coupon.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 font-mono">{coupon.code}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{coupon.name || 'N/A'}</div>
                                {coupon.description && (
                                  <div className="text-sm text-gray-500">{coupon.description}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {discount ? discount.name : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {coupon.startDate ? formatDate(coupon.startDate) : 'N/A'} - {coupon.endDate ? formatDate(coupon.endDate) : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(coupon.status)}`}>
                                  {coupon.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900">
                                  {coupon.usedCount || 0}
                                  {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

