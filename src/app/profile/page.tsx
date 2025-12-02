'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Phone, MapPin, Calendar, Save, Edit, X, Upload, Camera, Plus } from 'lucide-react';
import Link from 'next/link';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
import { ShippingAddressModal } from '@/components/customization/ShippingAddressModal';

interface ShippingAddress {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  shippingAddresses?: ShippingAddress[];
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.data);
        setProfilePicture(data.data.photoURL || null);
        setFormData({
          firstName: data.data.profile?.firstName || '',
          lastName: data.data.profile?.lastName || '',
          phone: data.data.profile?.phone || '',
          dateOfBirth: data.data.profile?.dateOfBirth || '',
          address: {
            street: data.data.profile?.address?.street || '',
            city: data.data.profile?.address?.city || '',
            state: data.data.profile?.address?.state || '',
            zipCode: data.data.profile?.address?.zipCode || '',
            country: data.data.profile?.address?.country || ''
          }
        });
        // Fetch shipping addresses if user is authenticated
        if (session?.user?.id) {
          await fetchShippingAddresses();
        }
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingAddresses = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoadingAddresses(true);
      const response = await fetch(`/api/users/${session.user.id}/addresses`);
      const data = await response.json();

      if (response.ok && data.success) {
        setShippingAddresses(data.data || []);
      } else {
        console.error('Failed to load shipping addresses:', data.error);
        setShippingAddresses([]);
      }
    } catch (err) {
      console.error('Error fetching shipping addresses:', err);
      setShippingAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddAddress = async (address: any, saveToProfile: boolean) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/users/${session.user.id}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          setAsDefault: shippingAddresses.length === 0 // Set as default if it's the first address
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Shipping address added successfully!');
        setShowAddAddressModal(false);
        await fetchShippingAddresses(); // Refresh the addresses list
      } else {
        setError(data.error || 'Failed to add shipping address');
      }
    } catch (err) {
      console.error('Error adding shipping address:', err);
      setError('Failed to add shipping address');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'address') {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/user-profile', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const photoURL = data.data.url;
        setProfilePicture(photoURL);
        
        // Use existing profile data if formData fields are empty
        const firstName = formData.firstName || profile?.profile?.firstName || '';
        const lastName = formData.lastName || profile?.profile?.lastName || '';
        const phone = formData.phone || profile?.profile?.phone || '';
        const dateOfBirth = formData.dateOfBirth || profile?.profile?.dateOfBirth || '';
        const address = formData.address || profile?.profile?.address || {};
        const displayName = firstName && lastName 
          ? `${firstName} ${lastName}`.trim() 
          : profile?.displayName || '';
        
        const updateResponse = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            dateOfBirth: dateOfBirth,
            address: address,
            displayName: displayName,
            photoURL: photoURL
          }),
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          // Update profile picture state from the response
          if (updateData.data?.photoURL) {
            setProfilePicture(updateData.data.photoURL);
          }
          // Also update profile state
          if (updateData.data) {
            setProfile(prev => prev ? { ...prev, photoURL: updateData.data.photoURL } : null);
          }
          setSuccess('Profile picture updated successfully!');
          await fetchProfile();
        } else {
          const errorData = await updateResponse.json();
          setError(errorData.error || 'Failed to update profile picture');
        }
      } else {
        setError(data.error?.message || 'Failed to upload profile picture');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
      e.target.value = '';
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          displayName: `${formData.firstName} ${formData.lastName}`.trim(),
          photoURL: null
        }),
      });

      if (response.ok) {
        setProfilePicture(null);
        setSuccess('Profile picture removed successfully!');
        await fetchProfile();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove profile picture');
      }
    } catch (err) {
      console.error('Error removing profile picture:', err);
      setError('Failed to remove profile picture');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Include photoURL if it exists (from profilePicture state or profile)
      const photoURL = profilePicture || profile?.photoURL;
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          displayName,
          ...(photoURL && { photoURL })
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Profile updated successfully!');
        setIsEditMode(false);
        await fetchProfile();
        
        await update({
          ...session,
          user: {
            ...session?.user,
            name: displayName
          }
        });
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    // Reset form data to original profile data
    if (profile) {
      setFormData({
        firstName: profile.profile?.firstName || '',
        lastName: profile.profile?.lastName || '',
        phone: profile.profile?.phone || '',
        dateOfBirth: profile.profile?.dateOfBirth || '',
        address: {
          street: profile.profile?.address?.street || '',
          city: profile.profile?.address?.city || '',
          state: profile.profile?.address?.state || '',
          zipCode: profile.profile?.address?.zipCode || '',
          country: profile.profile?.address?.country || ''
        }
      });
    }
    setError('');
    setSuccess('');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile</p>
          <Button onClick={fetchProfile} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session?.user || null} />
      
      <div className="flex gap-8 p-8">
        {/* Left Sidebar - Floating Navigation Card */}
        <CustomerNavigationSidebar />

        {/* Right Content Area */}
        <main className="flex-1">
          <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-2">View and manage your personal information</p>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {isEditMode ? (
              /* Edit Mode - Form */
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Profile Picture */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Camera className="w-5 h-5 mr-2" />
                    Profile Picture
                  </h2>
                  
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {(profilePicture || profile?.photoURL) ? (
                        <div className="relative">
                          <img
                            src={profilePicture || profile?.photoURL || ''}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveProfilePicture}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Remove profile picture"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-200">
                          {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-fit">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">
                          {uploadingPicture ? 'Uploading...' : profilePicture ? 'Change Picture' : 'Upload Picture'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureUpload}
                          disabled={uploadingPicture}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Basic Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      icon={<User size={18} />}
                      placeholder="Your first name"
                      required
                    />

                    <Input
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      icon={<User size={18} />}
                      placeholder="Your last name"
                      required
                    />

                    <div className="md:col-span-2">
                      <Input
                        label="Email Address"
                        type="email"
                        value={profile.email}
                        icon={<Mail size={18} />}
                        disabled
                        className="bg-gray-50"
                        placeholder="Email cannot be changed"
                      />
                    </div>

                    <Input
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      icon={<Phone size={18} />}
                      placeholder="+1 (555) 000-0000"
                    />

                    <Input
                      label="Date of Birth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      icon={<Calendar size={18} />}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Address Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Input
                        label="Street Address"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        placeholder="123 Main Street"
                      />
                    </div>

                    <Input
                      label="City"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                    />

                    <Input
                      label="State/Province"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                    />

                    <Input
                      label="ZIP/Postal Code"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      placeholder="10001"
                    />

                    <Input
                      label="Country"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      placeholder="United States"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={saving}
                    className="px-8 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              /* View Mode - Display Information */
              <div className="space-y-6">
                {/* Profile Card with Avatar and Edit Button */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {(profilePicture || profile?.photoURL) ? (
                        <img
                          src={profilePicture || profile?.photoURL || ''}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-200">
                          {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{profile.displayName}</p>
                        <p className="text-sm text-gray-500">{profile.email}</p>
                      </div>
                    </div>
                    {!isEditMode && (
                      <Button
                        onClick={() => setIsEditMode(true)}
                        className="flex items-center bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Basic Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                      <p className="text-gray-900">{profile.profile?.firstName || 'Not provided'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                      <p className="text-gray-900">{profile.profile?.lastName || 'Not provided'}</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                      <p className="text-gray-900">{profile.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                      <p className="text-gray-900">{profile.profile?.phone || 'Not provided'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                      <p className="text-gray-900">
                        {profile.profile?.dateOfBirth 
                          ? new Date(profile.profile.dateOfBirth).toLocaleDateString()
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                {profile.profile?.address && (
                  Object.values(profile.profile.address).some(val => val) && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Address Information
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profile.profile.address.street && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-1">Street Address</label>
                            <p className="text-gray-900">{profile.profile.address.street}</p>
                          </div>
                        )}

                        {profile.profile.address.city && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">City</label>
                            <p className="text-gray-900">{profile.profile.address.city}</p>
                          </div>
                        )}

                        {profile.profile.address.state && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">State/Province</label>
                            <p className="text-gray-900">{profile.profile.address.state}</p>
                          </div>
                        )}

                        {profile.profile.address.zipCode && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">ZIP/Postal Code</label>
                            <p className="text-gray-900">{profile.profile.address.zipCode}</p>
                          </div>
                        )}

                        {profile.profile.address.country && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
                            <p className="text-gray-900">{profile.profile.address.country}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Shipping Addresses */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Shipping Addresses
                    </h2>
                    <Button
                      onClick={() => setShowAddAddressModal(true)}
                      className="flex items-center bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </Button>
                  </div>
                  
                  {loadingAddresses ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : shippingAddresses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No shipping addresses saved yet.</p>
                      <p className="text-sm text-gray-400 mt-2">Click "Add Address" to add your first shipping address.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {shippingAddresses.map((address) => (
                        <div
                          key={address.id}
                          className={`border rounded-lg p-4 ${
                            address.isDefault
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-gray-900">
                                  {address.firstName} {address.lastName}
                                </p>
                                {address.isDefault && (
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {address.address1}
                                {address.address2 && `, ${address.address2}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.zipCode}
                              </p>
                              <p className="text-sm text-gray-600">{address.country}</p>
                              <p className="text-sm text-gray-600 mt-1">Phone: {address.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <ShippingAddressModal
          onSubmit={handleAddAddress}
          onClose={() => {
            setShowAddAddressModal(false);
            setError('');
          }}
          userName={`${profile?.profile?.firstName || ''} ${profile?.profile?.lastName || ''}`.trim() || profile?.displayName}
          userId={session?.user?.id}
        />
      )}
    </div>
  );
}
