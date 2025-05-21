'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';

type PasswordResetFormProps = {
  mode: 'request' | 'reset';
};

/**
 * Handles both requesting a password reset and setting a new password
 * when the reset link is clicked
 */
export function PasswordResetForm({ mode }: PasswordResetFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract token from URL if in reset mode
  const resetToken = mode === 'reset' ? searchParams?.get('token') : null;

  // Request password reset (send email)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Request password reset email from Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Show success message
      setFormSuccess('Password reset link has been sent to your email');
      
      // Log for development
      console.log(`Password reset requested for ${email}`);
    } catch (error: any) {
      console.error('Reset request error:', error);
      setFormError(error.message || 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set new password with reset token
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      // Validate form
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (!resetToken) {
        throw new Error('Reset token is missing');
      }

      // Update password using the token from URL
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Show success toast and redirect
      setFormSuccess('Your password has been successfully reset');
      toast.success('Password reset successful');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setFormError(error.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which form handler to use based on mode
  const handleSubmit = mode === 'request' ? handleRequestReset : handlePasswordReset;

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        {mode === 'request' ? 'Reset Your Password' : 'Set New Password'}
      </h2>

      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {formError}
        </div>
      )}

      {formSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          {formSuccess}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {mode === 'request' ? (
          // Request reset form
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="your@email.com"
              disabled={isSubmitting}
              required
            />
          </div>
        ) : (
          // Set new password form
          <>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting
            ? 'Processing...'
            : mode === 'request'
            ? 'Send Reset Link'
            : 'Reset Password'}
        </button>

        <div className="mt-4 text-center">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            Back to Login
          </a>
        </div>
      </form>
    </div>
  );
} 