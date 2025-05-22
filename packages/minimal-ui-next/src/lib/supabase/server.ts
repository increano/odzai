import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { User } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for server components
 * This is cached to avoid creating too many clients during the request lifecycle
 */
export const createServerSupabaseClient = cache(() => {
  return createServerComponentClient({ cookies });
});

/**
 * Gets the authenticated user
 * Always use this instead of getSession() for security reasons
 * 
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Checks if a user is authenticated and gets their data
 * Use this in server components that require authentication
 * 
 * @returns Object containing isAuthenticated and user
 */
export async function checkAuthentication() {
  const user = await getAuthenticatedUser();
  return {
    isAuthenticated: !!user,
    user
  };
}

/**
 * Gets user preferences from the database
 * 
 * @param userId The ID of the user to get preferences for
 * @returns The user preferences or null if not found
 */
export async function getUserPreferences(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return {
    ...data,
    data: data.data || {}
  };
} 