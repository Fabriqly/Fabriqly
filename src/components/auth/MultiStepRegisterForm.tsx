'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, User, Eye, EyeOff, Briefcase, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'designer' | 'business_owner';
  agreeToTerms: boolean;
}

const steps = [
  { id: 1, title: 'Personal Details', description: 'Tell us about yourself' },
  { id: 2, title: 'Password', description: 'Create a secure password' },
  { id: 3, title: 'Role Selection', description: 'Choose your account type' },
  { id: 4, title: 'Summary', description: 'Review and confirm' }
];

const roleOptions = [
  {
    id: 'customer' as const,
    title: 'Customer',
    description: 'Browse and purchase products from designers',
    icon: <User className="w-6 h-6" />,
    features: ['Browse designer portfolios', 'Purchase custom products', 'Track your orders']
  },
  {
    id: 'designer' as const,
    title: 'Designer',
    description: 'Create and sell your designs',
    icon: <Briefcase className="w-6 h-6" />,
    features: ['Upload your designs', 'Set your own prices', 'Manage your portfolio']
  },
  {
    id: 'business_owner' as const,
    title: 'Business Owner',
    description: 'Manage your shop and team',
    icon: <Briefcase className="w-6 h-6" />,
    features: ['Manage multiple designers', 'View business analytics', 'Handle customer orders']
  }
];

export function MultiStepRegisterForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors when user starts typing
    if (errors[name as keyof RegistrationData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof RegistrationData, string>> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    if (step === 2) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and number';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 3) {
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the terms and conditions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      // Store registration data in sessionStorage for the summary page
      sessionStorage.setItem('registrationData', JSON.stringify(formData));
      router.push('/register/summary');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                error={errors.firstName}
                icon={<User size={18} />}
                placeholder="John"
                autoComplete="given-name"
              />
              <Input
                label="Last Name"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                error={errors.lastName}
                icon={<User size={18} />}
                placeholder="Doe"
                autoComplete="family-name"
              />
            </div>
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              icon={<Mail size={18} />}
              placeholder="john@example.com"
              autoComplete="email"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                icon={<Lock size={18} />}
                placeholder="Create a strong password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={errors.confirmPassword}
                icon={<Lock size={18} />}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Account Type</label>
              <div className="grid gap-3">
                {roleOptions.map((role) => (
                  <div
                    key={role.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.role === role.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {role.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{role.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                        <ul className="mt-2 space-y-1">
                          {role.features.map((feature, index) => (
                            <li key={index} className="text-xs text-gray-500 flex items-center">
                              <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-500">{errors.agreeToTerms}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: currentStep >= step.id ? '#2563eb' : '#e5e7eb',
                    color: currentStep >= step.id ? '#ffffff' : '#6b7280'
                  }}
                >
                  {step.id}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    style={{
                      width: '48px',
                      height: '4px',
                      marginLeft: '8px',
                      marginRight: '8px',
                      backgroundColor: currentStep > step.id ? '#2563eb' : '#e5e7eb'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={(e) => e.preventDefault()}>
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="flex items-center"
              >
                <ArrowLeft size={16} className="mr-2" />
                Previous
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center"
              >
                Next
                <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                loading={loading}
                className="flex items-center"
              >
                Continue to Summary
                <ArrowRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </form>

        {/* Google Sign In */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push('/register/google')}
            className="w-full mt-4"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
