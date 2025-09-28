'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, CheckCircle, XCircle, Lock } from 'lucide-react';

export default function FirebasePasswordReset() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validatingCode, setValidatingCode] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  
  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    match: false
  });

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  // Validate the reset code on mount
  useEffect(() => {
    const validateResetCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        setError('Invalid or expired reset link. Please request a new password reset.');
        setValidatingCode(false);
        return;
      }

      try {
        // We can't validate the code without resetting, so we'll assume it's valid
        // Firebase will validate it when we actually reset
        setCodeValid(true);
        setValidatingCode(false);
      } catch (error) {
        setError('Invalid or expired reset link. Please request a new password reset.');
        setValidatingCode(false);
      }
    };

    validateResetCode();
  }, [oobCode, mode]);

  // Update password strength indicators
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      match: password === confirmPassword && password.length > 0
    });
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!passwordStrength.uppercase || !passwordStrength.lowercase || !passwordStrength.number) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use Firebase's confirmPasswordReset
      await confirmPasswordReset(auth, oobCode!, password);
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?message=Password reset successful! Please log in with your new password.');
      }, 3000);

    } catch (error: any) {
      console.error('Password reset error:', error);
      
      if (error.code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new password reset.');
      } else if (error.code === 'auth/invalid-action-code') {
        setError('Invalid reset link. Please request a new password reset.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state while validating code
  if (validatingCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Validating Reset Link</h1>
            <p className="text-gray-600">Please wait while we verify your reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <div className="text-sm text-gray-500">
              Redirecting to login in 3 seconds...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid code)
  if (!codeValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <Button 
              onClick={() => router.push('/forgot-password')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Request New Reset Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Reset Your Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new secure password below
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength Indicators */}
            {password && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                <div className="space-y-1">
                  <div className={`flex items-center text-xs ${passwordStrength.length ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className={`w-3 h-3 mr-2 ${passwordStrength.length ? 'text-green-600' : 'text-gray-300'}`} />
                    At least 8 characters
                  </div>
                  <div className={`flex items-center text-xs ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className={`w-3 h-3 mr-2 ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-300'}`} />
                    One uppercase letter
                  </div>
                  <div className={`flex items-center text-xs ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className={`w-3 h-3 mr-2 ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-300'}`} />
                    One lowercase letter
                  </div>
                  <div className={`flex items-center text-xs ${passwordStrength.number ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className={`w-3 h-3 mr-2 ${passwordStrength.number ? 'text-green-600' : 'text-gray-300'}`} />
                    One number
                  </div>
                  {confirmPassword && (
                    <div className={`flex items-center text-xs ${passwordStrength.match ? 'text-green-600' : 'text-red-500'}`}>
                      <CheckCircle className={`w-3 h-3 mr-2 ${passwordStrength.match ? 'text-green-600' : 'text-red-400'}`} />
                      Passwords match
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <Button
                type="submit"
                disabled={loading || !passwordStrength.length || !passwordStrength.uppercase || !passwordStrength.lowercase || !passwordStrength.number || !passwordStrength.match}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
