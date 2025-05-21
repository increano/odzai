import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a singleton Supabase client for browser use
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // Enable PKCE flow for enhanced security
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Using default Supabase v2 cookie behavior (HTTP-only)
  }
});

// Type definitions for user with role
export type UserWithRole = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  user_metadata?: {
    name?: string;
  };
};

// Helper function to get current user with role
export async function getCurrentUserWithRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user role from the database
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    role: userRole?.role || 'user',
    user_metadata: user.user_metadata
  } as UserWithRole;
}

// Create a server-side Supabase client for use in server components and API routes
export function createServerSupabaseClient(cookieStore: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
    },
    global: {
      headers: {
        cookie: cookieStore
      }
    }
  });
} 