'use client';

import React, { useState } from 'react';

export default function VerificationRequestForm() {
  const [formData, setFormData] = useState({
    portfolioUrl: '',
    portfolioDescription: '',
    specializations: [] as string[],
    yearsExperience: 0,
    certifications: [] as string[],
    businessLicense: '',
    portfolio: '',
    additionalDocs: [] as string[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const specializationOptions = [
    'Logo Design',
    'Brand Identity',
    'Print Design',
    'Web Design',
    'Motion Graphics',
    'Packaging Design',
    'Typography',
    'Illustration',
    'Animation',
    'UI/UX Design',
    'Photography',
    'Other'
  ];

  const handleSpecializationChange = (specialization: string, isChecked: boolean) => {
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, specialization]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        specializations: prev.specializations.filter(s => s !== specialization)
      }));
    }
  };

  const addCertification = (newCertification: string) => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
    }
  };

  const removeCertification = (certificationToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certificationToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.portfolioUrl.trim() || !formData.portfolioDescription.trim()) {
      setSubmitMessage({ type: 'error', text: 'Portfolio URL and description are required.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/admin/designer-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit verification request');
      }

      setSubmitMessage({ 
        type: 'success', 
        text: 'Verification request submitted successfully! We will review your request within 3-5 business days.' 
      });
      
      // Reset form
      setFormData({
        portfolioUrl: '',
        portfolioDescription: '',
        specializations: [],
        yearsExperience: 0,
        certifications: [],
        businessLicense: '',
        portfolio: '',
        additionalDocs: []
      });
    } catch (error: any) {
      setSubmitMessage({ 
        type: 'error', 
        text: error.message || 'An error occurred while submitting your request. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Designer Verification</h2>
        <p className="text-gray-600">
          Help us verify your professional designer credentials to help build trust with potential clients.
        </p>
      </div>

      {submitMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          submitMessage.type === 'success' 
            ? 'bg-green-50 border border-green -200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {submitMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Portfolio URL */}
        <div>
          <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio URL *
          </label>
          <input
            type="url"
            id="portfolioUrl"
            value={formData.portfolioUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
            placeholder="https://your-portfolio-website.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Link to your professional portfolio or design showcase
          </p>
        </div>

        {/* Portfolio Description */}
        <div>
          <label htmlFor="portfolioDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio Description *
          </label>
          <textarea
            id="portfolioDescription"
            value={formData.portfolioDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, portfolioDescription: e.target.value }))}
            placeholder="Describe your design style, specializations, and notable projects..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Specializations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Design Specializations
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {specializationOptions.map((specialization) => (
              <label key={specialization} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.specializations.includes(specialization)}
                  onChange={(e) => handleSpecializationChange(specialization, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{specialization}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Years of Experience */}
        <div>
          <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700 mb-2">
            Years of Design Experience
          </label>
          <select
            id="yearsExperience"
            value={formData.yearsExperience}
            onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Select experience level</option>
            <option value={1}>1 year</option>
            <option value={2}>2 years</option>
            <option value={3}>3 years</option>
            <option value={4}>4 years</option>
            <option value={5}>5 years</option>
            <option value={6}>6 years</option>
            <option value={7}>7 years</option>
            <option value={8}>8 years</option>
            <option value={9}>9 years</option>
            <option value={10}>10+ years</option>
          </select>
        </div>

        {/* Certifications */}
        <div>
          <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-2">
            Professional Certifications
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                id="certifications"
                placeholder="Add certification (e.g., Adobe Certified Expert)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCertification(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('certifications') as HTMLInputElement;
                  addCertification(input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Add
              </button>
            </div>
            
            {formData.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((certification, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {certification}
                    <button
                      type="button"
                      onClick={() => removeCertification(certification)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Information
          </label>
          <textarea
            placeholder="Any additional information about your design background, awards, or notable clients..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Verification Request'}
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">What Happens Next?</h3>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Our team will review your portfolio and provided information</li>
          <li>2. We may reach out for additional documentation if needed</li>
          <li>3. You'll receive an email notification once verification is complete</li>
          <li>4. Verified designers get access to special features and badges</li>
        </ol>
      </div>
    </div>
  );
}

