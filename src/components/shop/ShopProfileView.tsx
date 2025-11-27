'use client';

import { ShopProfile } from '@/types/shop-profile';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShopReviewSection } from '@/components/reviews/ShopReviewSection';
import { ProductCard } from '@/components/products/ProductCard';
import { Product } from '@/types/products';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  MessageCircle, 
  Globe, 
  Facebook, 
  Instagram, 
  Twitter,
  Clock,
  Package,
  CheckCircle2,
  Store,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ShopProfileViewProps {
  shop: ShopProfile;
  showEditButton?: boolean;
  onEdit?: () => void;
}

export default function ShopProfileView({ shop, showEditButton = false, onEdit }: ShopProfileViewProps) {
  const [actualRatings, setActualRatings] = useState({
    averageRating: shop.ratings?.averageRating || 0,
    totalReviews: shop.ratings?.totalReviews || 0
  });
  const [products, setProducts] = useState<(Product & { category?: any; images?: any[] })[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productTags, setProductTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    // Fetch actual review data
    const fetchRatings = async () => {
      try {
        const response = await fetch(`/api/reviews/average?type=shop&targetId=${shop.id}`);
        const data = await response.json();
        
        if (data.success) {
          setActualRatings({
            averageRating: data.data.average || 0,
            totalReviews: data.data.total || 0
          });
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    };

    if (shop.id) {
      fetchRatings();
      fetchProducts();
    }
  }, [shop.id]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch(`/api/products?shopId=${shop.id}&status=active&limit=50`);
      const data = await response.json();
      
      if (data.success && data.data?.products) {
        const fetchedProducts = data.data.products.map((product: any) => {
          // Ensure images array is properly formatted
          if (!product.images || product.images.length === 0) {
            // If no images array but has primaryImageUrl, create images array
            if (product.primaryImageUrl) {
              product.images = [{
                imageUrl: product.primaryImageUrl,
                isPrimary: true,
                altText: product.name
              }];
            } else if (product.imageUrl) {
              // Fallback for imageUrl field
              product.images = [{
                imageUrl: product.imageUrl,
                isPrimary: true,
                altText: product.name
              }];
            } else {
              product.images = [];
            }
          } else {
            // Ensure images have required properties
            product.images = product.images.map((img: any) => ({
              ...img,
              imageUrl: img.imageUrl || img.url,
              isPrimary: img.isPrimary !== undefined ? img.isPrimary : false,
              altText: img.altText || product.name
            }));
          }
          
          return product;
        });
        
        setProducts(fetchedProducts);
        
        // Extract unique tags from all products
        const allTags = new Set<string>();
        fetchedProducts.forEach((product: any) => {
          if (product.tags && Array.isArray(product.tags)) {
            product.tags.forEach((tag: string) => {
              if (tag && tag.trim()) {
                allTags.add(tag.trim());
              }
            });
          }
        });
        setProductTags(Array.from(allTags).sort());
      } else {
        // Generate mock products based on specialties
        generateMockProducts();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      generateMockProducts();
    } finally {
      setLoadingProducts(false);
    }
  };

  const generateMockProducts = () => {
    const mockProducts: any[] = [];
    const specialties = shop.specialties || ['Screen Printing', 'Heat Transfer', 'Vinyl Printing'];
    
    const productTemplates = [
      { name: 'Custom T-Shirt', basePrice: 599, tags: ['Screen Printing', 'Heat Transfer'] },
      { name: 'Printed Mug', basePrice: 299, tags: ['Screen Printing', 'Heat Transfer'] },
      { name: 'Vinyl Stickers', basePrice: 199, tags: ['Vinyl Printing'] },
      { name: 'Custom Hoodie', basePrice: 1299, tags: ['Screen Printing', 'Heat Transfer'] },
      { name: 'Tote Bag', basePrice: 399, tags: ['Screen Printing'] },
      { name: 'Custom Cap', basePrice: 499, tags: ['Embroidery', 'Screen Printing'] }
    ];

    specialties.forEach((specialty, index) => {
      const matchingProducts = productTemplates.filter(p => 
        p.tags.some(t => specialty.toLowerCase().includes(t.toLowerCase()) || 
        t.toLowerCase().includes(specialty.toLowerCase()))
      );
      
      if (matchingProducts.length > 0) {
        matchingProducts.slice(0, 2).forEach((template, i) => {
          mockProducts.push({
            id: `mock-${specialty}-${index}-${i}`,
            name: template.name,
            price: template.basePrice + (Math.random() * 200 - 100),
            category: { categoryName: specialty },
            tags: template.tags,
            status: 'active',
            stockQuantity: 10,
            images: [{
              imageUrl: `https://via.placeholder.com/400?text=${encodeURIComponent(template.name)}`,
              isPrimary: true,
              altText: template.name
            }]
          });
        });
      } else {
        // Default products if no match
        mockProducts.push({
          id: `mock-${specialty}-${index}`,
          name: `Custom ${specialty} Product`,
          price: 499 + (Math.random() * 500),
          category: { categoryName: specialty },
          tags: [specialty],
          status: 'active',
          stockQuantity: 10,
          images: [{
            imageUrl: `https://via.placeholder.com/400?text=${encodeURIComponent(`Custom ${specialty} Product`)}`,
            isPrimary: true,
            altText: `Custom ${specialty} Product`
          }]
        });
      }
    });

    // Ensure at least 4 products
    while (mockProducts.length < 4) {
      mockProducts.push({
        id: `mock-default-${mockProducts.length}`,
        name: `Custom Product ${mockProducts.length + 1}`,
        price: 399 + (Math.random() * 400),
        category: { categoryName: specialties[0] || 'Custom' },
        tags: [specialties[0] || 'Custom'],
        status: 'active',
        stockQuantity: 10,
        images: [{
          imageUrl: `https://via.placeholder.com/400?text=${encodeURIComponent(`Custom Product ${mockProducts.length + 1}`)}`,
          isPrimary: true,
          altText: `Custom Product ${mockProducts.length + 1}`
        }]
      });
    }

    const finalProducts = mockProducts.slice(0, 6);
    setProducts(finalProducts);
    
    // Extract unique tags from mock products
    const allTags = new Set<string>();
    finalProducts.forEach((product: any) => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag: string) => {
          if (tag && tag.trim()) {
            allTags.add(tag.trim());
          }
        });
      }
    });
    setProductTags(Array.from(allTags).sort());
  };

  // Use product tags for categories, fallback to shop specialties if no products
  const categories = productTags.length > 0 
    ? ['all', ...productTags]
    : ['all', ...(shop.specialties || [])];
  
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter((p: any) => 
        p.tags && Array.isArray(p.tags) && p.tags.includes(selectedCategory)
      );

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner Section */}
      <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-xl">
        {shop.branding?.bannerUrl ? (
          <img
            src={shop.branding.bannerUrl}
            alt={`${shop.shopName} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        )}
      </div>

      {/* Shop Info Card - White Background */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Shop Avatar */}
            <div className="flex-shrink-0">
              <div className="relative inline-block">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
                  {shop.branding?.logoUrl ? (
                    <img
                      src={shop.branding.logoUrl}
                      alt={`${shop.shopName} logo`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl md:text-2xl font-bold">
                  {shop.shopName?.charAt(0) || 'S'}
                </div>
                  )}
                </div>
                {shop.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 border-4 border-white shadow-md">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Shop Information */}
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                    {shop.shopName}
                  </h1>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-1.5">
                  @{shop.username}
                </p>
                {shop.branding?.tagline && (
                  <p className="text-xs md:text-sm text-gray-700 italic mb-3">
                    &ldquo;{shop.branding.tagline}&rdquo;
                  </p>
                )}
              </div>
              
              {/* Stats and Message Button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-gray-900">{actualRatings.averageRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-600">({actualRatings.totalReviews})</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <Package className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">{shop.shopStats?.totalProducts || 0}</span>
                    <span className="text-sm text-gray-600">Products</span>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-200 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Left Sidebar - Shop Info (4 columns on desktop) */}
          <aside className="lg:col-span-4 space-y-4">
            {/* About Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                About the Shop
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3 whitespace-pre-line">
                {shop.description || 'No description available.'}
              </p>
              
              {shop.specialties && shop.specialties.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1.5">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {shop.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Business Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Business Details</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Business Type</span>
                  <p className="font-medium text-gray-900 capitalize">
                    {shop.businessDetails.businessType.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Owner</span>
                  <p className="font-medium text-gray-900">{shop.businessOwnerName}</p>
                </div>
                {shop.businessDetails.registeredBusinessId && (
                  <div>
                    <span className="text-sm text-gray-600">Business ID</span>
                    <p className="font-medium text-gray-900">{shop.businessDetails.registeredBusinessId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Contact Information</h2>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-600 block">Email</span>
                    <a href={`mailto:${shop.contactInfo.email}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {shop.contactInfo.email}
                    </a>
                  </div>
                </div>
                {shop.contactInfo.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-sm text-gray-600 block">Phone</span>
                      <a href={`tel:${shop.contactInfo.phone}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {shop.contactInfo.phone}
                      </a>
                    </div>
                  </div>
                )}
                {shop.location && (shop.location.city || shop.location.province) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-sm text-gray-600 block">Location</span>
                      <p className="font-medium text-gray-900">
                        {[shop.location.city, shop.location.province].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customization Policy Card */}
            {shop.customizationPolicy && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Customization Policy</h2>
                <div className="space-y-2">
                  {shop.customizationPolicy.turnaroundTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-600">Turnaround Time</span>
                        <p className="font-medium text-gray-900">{shop.customizationPolicy.turnaroundTime}</p>
                      </div>
                    </div>
                  )}
                  {shop.customizationPolicy.revisionsAllowed !== undefined && (
                    <div>
                      <span className="text-sm text-gray-600">Revisions Allowed</span>
                      <p className="font-medium text-gray-900">{shop.customizationPolicy.revisionsAllowed}</p>
                    </div>
                  )}
                  {shop.customizationPolicy.rushOrderAvailable && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Rush orders available</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Media Card */}
            {(shop.socialMedia || shop.website) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Connect With Us</h2>
                <div className="flex flex-wrap gap-2">
                  {shop.website && (
                    <a
                      href={shop.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {shop.socialMedia?.facebook && (
                    <a
                      href={shop.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </a>
                  )}
                  {shop.socialMedia?.instagram && (
                    <a
                      href={shop.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </a>
                  )}
                  {shop.socialMedia?.twitter && (
                    <a
                      href={shop.socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Right Main Content - Product Catalog (8 columns on desktop) */}
          <main className="lg:col-span-8">
            {/* Product Catalog Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-gray-900">Products</h2>
                <span className="text-sm text-gray-600">
                  {filteredProducts.length > 0 
                    ? totalPages > 1
                      ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} of ${filteredProducts.length} products`
                      : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'}`
                    : '0 products'}
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Products' : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">No Products Found</h3>
                <p className="text-gray-600">
                  {selectedCategory === 'all' 
                    ? 'This shop doesn\'t have any products yet.' 
                    : `No products found in the "${selectedCategory}" category.`}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="customer"
                      showActions={false}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[40px] ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* Reviews Section */}
        <div className="mt-4">
          <ShopReviewSection shop={shop} />
        </div>
      </div>
    </div>
  );
}
