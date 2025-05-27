'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm } from '../../components/auth/SignupForm';
import { useAuth } from '../../components/providers/SupabaseAuthProvider';

export default function SignupPage() {
  const { session } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  
  // For debugging - log authentication state
  useEffect(() => {
    console.log('Signup page mounted, session state:', !!session);
  }, []);
  
  // Only redirect if we have a valid session
  useEffect(() => {
    if (session && !redirecting) {
      // Step 1: Update UI state immediately for visual feedback
      setRedirecting(true);
      console.log('Session exists in signup page, preparing redirect');
      
      // Step 2: Show visual feedback briefly before redirect
      const redirectTimer = setTimeout(() => {
        console.log('Redirecting from signup page to /');
        
        // Step 3: Perform actual navigation after visual transition
        router.push('/');
      }, 1000); // Delay to ensure cookies are properly set
      
      return () => clearTimeout(redirectTimer);
    }
  }, [session, redirecting, router]);
  
  // Block all default workspace preferences on signup page
  // to prevent redirect loops
  useEffect(() => {
    // Create a flag in localStorage to indicate we're on the signup page
    localStorage.setItem('is_login_page', 'true');
    
    return () => {
      // Clean up when leaving signup page
      localStorage.removeItem('is_login_page');
    };
  }, []);
  
  // Special signup page layout without sidebar or other elements that might trigger API calls
  return (
    <div className={`h-screen w-full flex items-center justify-center bg-gray-50 transition-opacity duration-300 ${redirecting ? 'opacity-50' : 'opacity-100'}`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Odzai Budget</h1>
          <p className="text-gray-600 mt-2">
            {redirecting ? 'Redirecting to your dashboard...' : 'Create a new account'}
          </p>
        </div>
        
        {!redirecting && <SignupForm />}
      </div>
    </div>
  );
} 