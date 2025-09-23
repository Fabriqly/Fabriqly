'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VerificationModal } from '@/components/auth/VerificationModal';
import { User, Save, Mail, Phone, MapPin, Briefcase, Palette, Store } from 'lucide-react';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  // Role-specific fields
  businessName?: string; // For business owners
  businessType?: string; // For business owners
  specialties?: string[]; // For designers
  portfolioUrl?: string; // For designers
}

interface ProfileEditProps {
  onClose?: () => void;
  onSave?: (profileData: ProfileData) => void;
}

export function ProfileEdit({ onClose, onSave }: ProfileEditProps) {
  const { user, isCustomer, isDesigner, isBusinessOwner } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ProfileData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    businessName: '',
    businessType: '',
    specialties: [],
    portfolioUrl: ''
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const { user: userData } = await response.json();
          setProfileData({
            firstName: userData.profile?.firstName || '',
            lastName: userData.profile?.lastName || '',
            email: userData.email || '',
            phone: userData.profile?.phone || '',
            bio: userData.profile?.bio || '',
            location: userData.profile?.location || '',
            website: userData.profile?.website || '',
            businessName: userData.profile?.businessName || '',
            businessType: userData.profile?.businessType || '',
            specialties: userData.profile?.specialties || [],
            portfolioUrl: userData.profile?.portfolioUrl || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleInputChange = (field: keyof ProfileData, value: string | string[]) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecialtiesChange = (value: string) => {
    const specialties = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setProfileData(prev => ({
      ...prev,
      specialties
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Store the pending changes and open verification modal
    setPendingChanges(profileData);
    setIsVerificationOpen(true);
  };

  const handleVerification = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();
      
      if (result.verified) {
        // Password verified, proceed with saving
        await performSave();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  };

  const performSave = async () => {
    if (!user?.id || !pendingChanges) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: pendingChanges
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Profile updated successfully');
        onSave?.(pendingChanges);
        alert('Profile updated successfully!');
        onClose?.(); // Close the modal after successful save
        setPendingChanges(null);
      } else {
        const errorText = await response.text();
        console.error('Error updating profile:', errorText);
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <User className="h-6 w-6 text-gray-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <Input
                value={profileData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <Input
                value={profileData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <Input
                value={profileData.email}
                disabled
                className="bg-gray-50"
                placeholder="Email address"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone
              </label>
              <Input
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Location, Bio, and Website - Hidden for customers */}
          {!isCustomer && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <Input
                  value={profileData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter your location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <Input
                  value={profileData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://your-website.com"
                />
              </div>
            </>
          )}
        </div>

        {/* Role-specific Information */}
        {isDesigner && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Designer Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialties
              </label>
              <Input
                value={profileData.specialties?.join(', ') || ''}
                onChange={(e) => handleSpecialtiesChange(e.target.value)}
                placeholder="e.g., Logo Design, Web Design, Branding"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple specialties with commas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portfolio URL
              </label>
              <Input
                value={profileData.portfolioUrl}
                onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                placeholder="https://your-portfolio.com"
              />
            </div>
          </div>
        )}

        {isBusinessOwner && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Store className="h-5 w-5 mr-2" />
              Business Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <Input
                  value={profileData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Enter your business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Business Type
                </label>
                <Input
                  value={profileData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  placeholder="e.g., Retail, Manufacturing, Service"
                />
              </div>
            </div>
          </div>
        )}
       </div>

       {/* Save Changes Button */}
       <div className="flex justify-end pt-6 border-t">
         <Button 
           onClick={handleSave}
           disabled={isLoading}
         >
           <Save className="h-4 w-4 mr-2" />
           {isLoading ? 'Saving...' : 'Save Changes'}
         </Button>
       </div>

       {/* Verification Modal */}
       <VerificationModal
         isOpen={isVerificationOpen}
         onClose={() => setIsVerificationOpen(false)}
         onVerify={handleVerification}
         title="Verify Profile Changes"
         description="Please enter your password to confirm these profile changes for security purposes."
       />
     </div>
   );
 }
