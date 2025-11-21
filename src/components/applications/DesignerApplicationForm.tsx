'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Briefcase, User, Globe, Phone, Link as LinkIcon } from 'lucide-react';

interface DesignerApplicationFormData {
  businessName: string;
  bio: string;
  portfolioUrl: string;
  sampleDesigns: string[];
  specialties: string[];
  contactInfo: {
    phone: string;
    website: string;
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
}

interface DesignerApplicationFormProps {
  onCancel?: () => void;
}

export function DesignerApplicationForm({ onCancel }: DesignerApplicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<DesignerApplicationFormData>({
    businessName: '',
    bio: '',
    portfolioUrl: '',
    sampleDesigns: ['', '', ''],
    specialties: [],
    contactInfo: {
      phone: '',
      website: ''
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    }
  });

  const specialtyOptions = [
    'Logo Design',
    'Brand Identity',
    'Print Design',
    'T-Shirt Design',
    'Illustration',
    'Typography',
    'Packaging Design',
    'Social Media Graphics',
    'UI/UX Design'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof DesignerApplicationFormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSampleDesignChange = (index: number, value: string) => {
    const newSampleDesigns = [...formData.sampleDesigns];
    newSampleDesigns[index] = value;
    setFormData(prev => ({ ...prev, sampleDesigns: newSampleDesigns }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => {
      const specialties = prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty];
      return { ...prev, specialties };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.businessName || !formData.bio) {
      setError('Business name and bio are required');
      setLoading(false);
      return;
    }

    if (formData.bio.length < 20) {
      setError('Bio must be at least 20 characters');
      setLoading(false);
      return;
    }

    try {
      // Filter out empty sample designs
      const cleanedData = {
        ...formData,
        sampleDesigns: formData.sampleDesigns.filter(url => url.trim() !== '')
      };

      const response = await fetch('/api/applications/designer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData)
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to my applications page with success message
        router.push('/my-applications?status=success&type=designer');
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Apply to Become a Designer</h2>
          <p className="text-gray-600 mt-2">
            Fill out this application to offer your design services on Fabriqly. Your application will be reviewed by our admin team.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <Input
              label="Business/Designer Name *"
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              icon={<Briefcase size={18} />}
              placeholder="Your business or professional name"
              required
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Bio / About You * (min. 20 characters)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about your design experience, style, and what makes you unique..."
                required
              />
              <p className="text-xs text-gray-500">{formData.bio.length} characters</p>
            </div>
          </div>

          {/* Portfolio & Samples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio & Sample Work</h3>
            
            <Input
              label="Portfolio URL"
              type="url"
              name="portfolioUrl"
              value={formData.portfolioUrl}
              onChange={handleInputChange}
              icon={<Globe size={18} />}
              placeholder="https://your-portfolio.com"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Sample Design URLs (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Provide links to your design samples (images hosted online)
              </p>
              {formData.sampleDesigns.map((url, index) => (
                <Input
                  key={index}
                  type="url"
                  value={url}
                  onChange={(e) => handleSampleDesignChange(index, e.target.value)}
                  icon={<LinkIcon size={18} />}
                  placeholder={`Sample design ${index + 1} URL`}
                />
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Specialties</h3>
            <p className="text-sm text-gray-600">Select all that apply</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specialtyOptions.map(specialty => (
                <label
                  key={specialty}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={() => handleSpecialtyToggle(specialty)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{specialty}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            
            <Input
              label="Phone Number"
              type="tel"
              name="contactInfo.phone"
              value={formData.contactInfo.phone}
              onChange={handleInputChange}
              icon={<Phone size={18} />}
              placeholder="+1 (555) 123-4567"
            />

            <Input
              label="Website"
              type="url"
              name="contactInfo.website"
              value={formData.contactInfo.website}
              onChange={handleInputChange}
              icon={<Globe size={18} />}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Social Media (optional)</h3>
            
            <Input
              label="Facebook"
              type="url"
              name="socialMedia.facebook"
              value={formData.socialMedia.facebook}
              onChange={handleInputChange}
              placeholder="https://facebook.com/yourpage"
            />

            <Input
              label="Instagram"
              type="url"
              name="socialMedia.instagram"
              value={formData.socialMedia.instagram}
              onChange={handleInputChange}
              placeholder="https://instagram.com/yourhandle"
            />

            <Input
              label="Twitter"
              type="url"
              name="socialMedia.twitter"
              value={formData.socialMedia.twitter}
              onChange={handleInputChange}
              placeholder="https://twitter.com/yourhandle"
            />

            <Input
              label="LinkedIn"
              type="url"
              name="socialMedia.linkedin"
              value={formData.socialMedia.linkedin}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}













