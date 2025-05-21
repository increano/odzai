'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../providers/SupabaseAuthProvider';

export function LoginForm() {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('password');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const router = useRouter();
  const { signIn, loading, error: authError, session } = useAuth();

  // Debug auth state on mount and changes
  useEffect(() => {
    console.log('LoginForm states:', { 
      email,
      isSubmitting, 
      loading, 
      loginSuccess, 
      hasSession: !!session,
      hasAuthError: !!authError
    });
  }, [email, isSubmitting, loading, loginSuccess, session, authError]);

  // Show visual feedback on successful login and handle redirect with improved timing
  useEffect(() => {
    if (loginSuccess) {
      // After success feedback, redirect with proper timing
      const redirectTimer = setTimeout(() => {
        console.log('Login successful, redirecting to budget page');
        // Use Next.js router instead of window.location
        router.push('/budget');
      }, 1000); // Increased delay to ensure cookies are properly set

      return () => clearTimeout(redirectTimer);
    }
  }, [loginSuccess, router]);

  // Redirect if already logged in
  useEffect(() => {
    if (session && !isSubmitting) {
      console.log('Session already exists, redirecting to /budget');
      setTimeout(() => {
        // Use Next.js router instead of window.location
        router.push('/budget');
      }, 1000); // Increased delay to ensure cookies are properly set
    }
  }, [session, isSubmitting, router]);
  
  // Update local error state when auth error changes
  useEffect(() => {
    if (authError) {
      setFormError(authError);
      setIsSubmitting(false);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Step 1: Immediate visual feedback
    setIsSubmitting(true);
    
    // Validate form
    if (!email) {
      setFormError('Email is required');
      setIsSubmitting(false);
      return;
    }
    
    if (!password) {
      setFormError('Password is required');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Attempt to sign in
      console.log('Attempting to sign in with:', email);
      
      const success = await signIn(email, password);
      console.log('Sign in result:', success);
      
      if (success) {
        // Set success state for visual feedback
        setLoginSuccess(true);
        console.log('Login successful, showing success state before redirect');
        
        // Give extra time for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        setFormError('Invalid login credentials');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setFormError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  // Determine button state
  const buttonText = isSubmitting 
    ? 'Signing in...' 
    : loginSuccess 
      ? 'Success! Redirecting...' 
      : 'Sign In';

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>
      
      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {formError}
        </div>
      )}
      
      {loginSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          Login successful! Redirecting...
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="test@test.com"
            disabled={isSubmitting || loginSuccess}
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isSubmitting || loginSuccess}
            required
          />
          <div className="mt-1 text-right">
            <Link 
              href="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || loginSuccess}
          className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            loginSuccess 
              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
          } disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
        >
          {buttonText}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up
            </Link>
          </p>
        </div>
        
        {/* Debug info - expanded for better troubleshooting */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 border border-gray-200 rounded text-xs text-gray-500">
            <p><strong>Debug:</strong> Using test account: test@test.com / password</p>
            <p className="mt-1"><strong>Form State:</strong> {isSubmitting ? 'Submitting' : loginSuccess ? 'Success' : 'Ready'}</p>
            <p className="mt-1"><strong>Auth State:</strong> {loading ? 'Loading' : 'Ready'}</p>
            <p className="mt-1"><strong>Session:</strong> {session ? 'Exists' : 'None'}</p>
            <p className="mt-1"><strong>Button:</strong> {isSubmitting || loginSuccess ? 'Disabled' : 'Enabled'}</p>
          </div>
        )}
      </form>
    </div>
  );
} 