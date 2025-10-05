'use client';

import { ShopProfile } from '@/types/shop-profile';
import Link from 'next/link';
import { useState } from 'react';

interface ShopProfileViewProps {
  shop: ShopProfile;
  showEditButton?: boolean;
  onEdit?: () => void;
}

export default function ShopProfileView({ shop, showEditButton = false, onEdit }: ShopProfileViewProps) {
  const [imageError, setImageError] = useState(false);

  const getBusinessTypeLabel = (type: string) => {
    switch (type) {
      case 'individual':
        return 'Individual';
      case 'msme':
        return 'MSME';
      case 'printing_partner':
        return 'Printing Partner';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
      suspended: { label: 'Suspended', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Banner */}
      {shop.branding?.bannerUrl && (
        <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden mb-6">
          <img
            src={shop.branding.bannerUrl}
            alt={`${shop.shopName} banner`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Logo */}
          {shop.branding?.logoUrl && !imageError && (
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
              <img
                src={shop.branding.logoUrl}
                alt={`${shop.shopName} logo`}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1">{shop.shopName}</h1>
                <p className="text-gray-600 mb-2">@{shop.username}</p>
                {shop.branding?.tagline && (
                  <p className="text-lg text-gray-700 italic mb-3">&ldquo;{shop.branding.tagline}&rdquo;</p>
                )}
              </div>
              
              <div className="flex gap-2 items-center">
                {getStatusBadge(shop.approvalStatus)}
                {shop.isVerified && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
                {showEditButton && onEdit && (
                  <button
                    onClick={onEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{shop.shopStats.totalProducts}</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{shop.shopStats.totalOrders}</div>
                <div className="text-sm text-gray-600">Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{shop.ratings.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{shop.ratings.totalReviews}</div>
                <div className="text-sm text-gray-600">Reviews</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">About the Shop</h2>
        <p className="text-gray-700 whitespace-pre-line">{shop.description}</p>
        
        {shop.specialties && shop.specialties.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {shop.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Business Details & Contact */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Business Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Business Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Business Type:</span>
              <p className="font-medium">{getBusinessTypeLabel(shop.businessDetails.businessType)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Owner:</span>
              <p className="font-medium">{shop.businessOwnerName}</p>
            </div>
            {shop.businessDetails.registeredBusinessId && (
              <div>
                <span className="text-sm text-gray-600">Business ID:</span>
                <p className="font-medium">{shop.businessDetails.registeredBusinessId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Email:</span>
              <p className="font-medium">{shop.contactInfo.email}</p>
            </div>
            {shop.contactInfo.phone && (
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <p className="font-medium">{shop.contactInfo.phone}</p>
              </div>
            )}
            {shop.location && (shop.location.city || shop.location.province) && (
              <div>
                <span className="text-sm text-gray-600">Location:</span>
                <p className="font-medium">
                  {[shop.location.city, shop.location.province].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customization Policy */}
      {shop.customizationPolicy && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Customization Policy</h2>
          <div className="space-y-3">
            {shop.customizationPolicy.turnaroundTime && (
              <div>
                <span className="text-sm text-gray-600">Turnaround Time:</span>
                <p className="font-medium">{shop.customizationPolicy.turnaroundTime}</p>
              </div>
            )}
            {shop.customizationPolicy.revisionsAllowed !== undefined && (
              <div>
                <span className="text-sm text-gray-600">Revisions Allowed:</span>
                <p className="font-medium">{shop.customizationPolicy.revisionsAllowed}</p>
              </div>
            )}
            {shop.customizationPolicy.rushOrderAvailable && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Rush orders available</span>
              </div>
            )}
            {shop.customizationPolicy.customInstructions && (
              <div>
                <span className="text-sm text-gray-600">Custom Instructions:</span>
                <p className="mt-1 text-gray-700">{shop.customizationPolicy.customInstructions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Products</h2>
          {shop.approvalStatus === 'approved' && (
            <Link
              href={`/shops/${shop.username}/products`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Products →
            </Link>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">{shop.shopStats.totalProducts}</p>
            <p className="text-sm text-gray-600">Products Available</p>
          </div>
          {shop.approvalStatus === 'approved' && shop.shopStats.totalProducts > 0 && (
            <Link href={`/shops/${shop.username}/products`}>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Browse Products
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Social Media & Links */}
      {(shop.socialMedia || shop.website) && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Connect With Us</h2>
          <div className="flex flex-wrap gap-3">
            {shop.website && (
              <Link
                href={shop.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Website
              </Link>
            )}
            {shop.socialMedia?.facebook && (
              <Link
                href={shop.socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Facebook
              </Link>
            )}
            {shop.socialMedia?.instagram && (
              <Link
                href={shop.socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md"
              >
                Instagram
              </Link>
            )}
            {shop.socialMedia?.tiktok && (
              <Link
                href={shop.socialMedia.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md"
              >
                TikTok
              </Link>
            )}
            {shop.socialMedia?.twitter && (
              <Link
                href={shop.socialMedia.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-md"
              >
                Twitter
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


