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
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(currentSession);
          console.log('Session state initialized:', !!currentSession);
          
          if (currentSession) {
            // Get user with role - but don't block UI rendering
            getCurrentUserWithRole().then(userWithRole => {
              if (mounted) {
                setUser(userWithRole);
                console.log('User role loaded:', userWithRole?.role);
              }
            });
          }
          
          // Important: Always set loading to false after initialization
          // to enable login form button
          setLoading(false);
        }
        
        // Set up auth listener for changes - clear separation between UI and data
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth state changed:', event);
            
            if (mounted) {
              // Step 1: Immediate UI update
              setSession(newSession);
              
              if (!newSession) {
                setUser(null);
              } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // Step 2: Load user details after UI update
                try {
                  const userWithRole = await getCurrentUserWithRole();
                  if (mounted) {
                    setUser(userWithRole);
                  }
                } catch (err) {
                  console.error('Error loading user details:', err);
                }
              } else if (event === 'PASSWORD_RECOVERY') {
                // Handle password recovery event
                console.log('Password recovery detected');
                // You can add specific logic for password recovery here
              } else if (event === 'USER_UPDATED') {
                // Handle user update event (such as after password reset)
                console.log('User updated (e.g., password reset)');
                try {
                  const userWithRole = await getCurrentUserWithRole();
                  if (mounted) {
                    setUser(userWithRole);
                  }
                } catch (err) {
                  console.error('Error updating user details after update:', err);
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
          // Even on error, we need to end the loading state
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