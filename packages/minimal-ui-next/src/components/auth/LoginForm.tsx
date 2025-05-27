'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../providers/SupabaseAuthProvider';
import { supabase } from '../../lib/supabase/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function LoginForm() {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('password');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { signIn, loading, error: authError, session } = useAuth();

  // Debug auth state on mount and changes
  useEffect(() => {
    console.log('LoginForm states:', { 
      email,
      isSubmitting, 
      loading, 
      hasSession: !!session,
      hasAuthError: !!authError
    });
  }, [email, isSubmitting, loading, session, authError]);

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      if (session && !isSubmitting) {
        console.log('Session exists, checking onboarding status...');
        try {
          const { data: preferences, error: prefsError } = await supabase
            .from('user_preferences')
            .select('data')
            .single();

          if (prefsError) {
            console.error('Error checking preferences:', prefsError);
            return;
          }

          const onboardingCompleted = preferences?.data?.onboarding?.completed;
          const redirectUrl = onboardingCompleted ? '/' : '/onboarding/welcome';
          
          console.log('Redirecting to:', redirectUrl);
          router.push(redirectUrl);
        } catch (err) {
          console.error('Error checking session:', err);
        }
      }
    };

    checkSession();
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
    setIsSubmitting(true);
    setFormError(null);
    
    if (!email || !password) {
      setFormError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }
    
    try {
      console.log('Attempting to sign in with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        console.log('Login successful, checking onboarding status...');
        
        // Add a small delay to ensure session is properly established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check onboarding status
        const { data: preferences, error: prefsError } = await supabase
          .from('user_preferences')
          .select('data')
          .single();

        if (prefsError) {
          console.error('Error checking preferences:', prefsError);
        }

        const onboardingCompleted = preferences?.data?.onboarding?.completed;
        const redirectUrl = onboardingCompleted ? '/' : '/onboarding/welcome';
        
        console.log('Redirecting to:', redirectUrl);
        router.push(redirectUrl);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setFormError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>
      
      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {formError}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
          disabled={isSubmitting}
          className="w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 
            bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up
            </Link>
          </p>
        </div>
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 border border-gray-200 rounded text-xs text-gray-500">
            <p><strong>Debug:</strong> Using test account: test@test.com / password</p>
            <p className="mt-1"><strong>Form State:</strong> {isSubmitting ? 'Submitting' : 'Ready'}</p>
            <p className="mt-1"><strong>Auth State:</strong> {loading ? 'Loading' : 'Ready'}</p>
            <p className="mt-1"><strong>Session:</strong> {session ? 'Exists' : 'None'}</p>
          </div>
        )}
      </form>
    </div>
  );
} 