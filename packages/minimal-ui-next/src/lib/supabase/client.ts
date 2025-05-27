'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Type definitions for user with role
export type UserWithRole = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  user_metadata?: {
    name?: string;
  };
};

// Create a singleton Supabase client for browser use
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Export a singleton instance for client-side use
export const supabase = createBrowserClient()

// Helper function to get current user with role
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    // Get user role from the database
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email || '',
      role: userRole?.role || 'user',
      user_metadata: user.user_metadata
    }
  } catch (error) {
    console.error('Error getting user with role:', error)
    return null
  }
} 