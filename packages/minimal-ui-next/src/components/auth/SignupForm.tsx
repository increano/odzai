'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase/client';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    
    if (!email || !password) {
      setFormError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Attempt to sign up
      console.log('Attempting to sign up with:', email);
      const callbackUrl = `${window.location.origin}/auth/callback`;
      console.log('Using callback URL:', callbackUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl,
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // No need to manually initialize user preferences
        // The database trigger will handle this
        
        // Set success state for visual feedback
        setSignupSuccess(true);
        console.log('Signup successful, verification email sent');
      } else {
        setFormError('Failed to create account');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setFormError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  // Determine button state
  const buttonText = isSubmitting 
    ? 'Creating Account...' 
    : signupSuccess 
      ? 'Account Created!' 
      : 'Create Account';

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">Create Account</h2>
      
      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {formError}
        </div>
      )}
      
      {signupSuccess ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            <h3 className="font-semibold text-lg mb-2">Account Created Successfully!</h3>
            <p className="mb-2">We've sent a confirmation email to <span className="font-medium">{email}</span></p>
            <p className="text-sm">Please check your email and click the confirmation link to complete your registration and start the onboarding process.</p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded">
            <h4 className="font-semibold mb-1">What's Next?</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the confirmation link in the email</li>
              <li>You'll be automatically redirected to the onboarding process</li>
            </ol>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>Didn't receive the email? Check your spam folder or</p>
            <button 
              onClick={() => {
                setSignupSuccess(false);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setIsSubmitting(false);
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              try signing up again
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="your.email@example.com"
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Create a password (min. 6 characters)"
              disabled={isSubmitting}
              required
              minLength={6}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="signup-confirm-password" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Confirm your password"
              disabled={isSubmitting}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 
              bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {buttonText}
          </button>
          
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
} 