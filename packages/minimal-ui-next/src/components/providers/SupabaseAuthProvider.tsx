'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase, UserWithRole, getCurrentUserWithRole } from '../../lib/supabase/client';

// Auth context type definition
type AuthContextType = {
  session: Session | null;
  user: UserWithRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  error: string | null;
};

// Create the Auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component as specified in the migration roadmap
export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        console.log('Initializing auth state...');
        
        // Check for email confirmation success
        const hasEmailConfirmed = window.location.hash.includes('access_token');
        if (hasEmailConfirmed) {
          console.log('Email confirmation detected, setting up session...');
          // Using getUser instead of getSession for security
          const { data: { user: confirmedUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error getting user after email confirmation:', userError);
            throw userError;
          }
          
          if (confirmedUser) {
            console.log('User authenticated after email confirmation');
            
            // Also get the session for the UI
            const { data: { session: confirmedSession } } = await supabase.auth.getSession();
            
            if (mounted) {
              setSession(confirmedSession);
              const userWithRole = await getCurrentUserWithRole();
              setUser(userWithRole);
              setLoading(false);
            }
            return;
          }
        }

        // Normal session initialization
        // Using getUser for primary auth check
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user during initialization:', userError);
          throw userError;
        }
        
        // Get session for UI purposes after verifying the user
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(currentSession);
          console.log('Auth state initialized:', !!currentUser);
          
          if (currentUser) {
            // Get user with role - but don't block UI rendering
            getCurrentUserWithRole().then(userWithRole => {
              if (mounted) {
                setUser(userWithRole);
                console.log('User role loaded:', userWithRole?.role);
              }
            });
          }
          
          setLoading(false);
        }
        
        // Set up auth listener for changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth state changed:', event);
            
            if (mounted) {
              setSession(newSession);
              
              if (!newSession) {
                setUser(null);
              } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                try {
                  const userWithRole = await getCurrentUserWithRole();
                  if (mounted) {
                    setUser(userWithRole);
                  }
                } catch (err) {
                  console.error('Error loading user details:', err);
                }
              }
            }
          }
        );
        
        return () => {
          authListener?.subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    }
    
    initializeAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      // Step 1: Update UI immediately (loading state is handled by caller)
      setError(null);
      
      console.log('Signing in with Supabase...');
      // Step 2: Perform actual auth operation
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // HTTP-only cookies are automatically handled by Supabase with the updated config
      if (data.session) {
        console.log('Successfully signed in, session established');
        // Add a small delay to ensure session is properly set in cookies
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
      return false;
    }
  };

  // Sign out function - follows same pattern of immediate UI update then data operation
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Immediate UI update
      setUser(null);
      setSession(null);
      
      // Then perform actual signout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Ensure cookies and session are fully cleared before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to login page after successful sign out
      router.push('/login');
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  // Provide auth context
  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  
  return context;
} 