import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const createServerSupabaseClient = (cookieStore: string) => {
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
};

/**
 * GET /api/user/preferences
 * 
 * Get user preferences from Supabase
 */
export async function GET(request: Request) {
  try {
    console.log('GET /api/user/preferences called');
    
    // Get the cookie string from headers
    const cookieStore = request.headers.get('cookie') || '';
    const referer = request.headers.get('referer') || '';
    
    // Check if request is from onboarding or login pages
    const isOnboarding = referer.includes('/onboarding');
    const isLoginPage = referer.includes('/login');
    
    // Create a Supabase client with the cookie
    const supabase = createServerSupabaseClient(cookieStore);
    
    // Get the current user's session - replace with getUser for security
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // If no user and in onboarding, return default onboarding preferences with cache headers
    if (!user && isOnboarding) {
      console.log('No user in onboarding, returning default onboarding preferences');
      return NextResponse.json({
        theme: 'light',
        data: {
          onboarding: {
            completed: false,
            currentStep: 'welcome'
          }
        }
      }, {
        headers: {
          'Cache-Control': 'private, max-age=60', // Cache for 1 minute
          'Vary': 'Cookie, Authorization' // Vary on auth headers
        }
      });
    }
    
    // If no user and not on login/onboarding page, return empty preferences
    if (!user && !isLoginPage && !isOnboarding) {
      console.log('No user found, returning empty preferences');
      return NextResponse.json({}, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }
    
    // If there's a user, fetch user preferences from Supabase
    let preferences = {};
    
    if (user) {
      // Query the user_preferences table
      const { data: preferenceData, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Not found error
          // Initialize default preferences for existing user
          const { data: newPrefs, error: insertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              theme: 'light',
              data: {
                onboarding: {
                  completed: false,
                  currentStep: 'welcome'
                }
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (!insertError && newPrefs) {
            preferences = {
              theme: newPrefs.theme,
              ...newPrefs.data
            };
          }
        } else {
          console.error('Error fetching user preferences:', error);
        }
      } else if (preferenceData) {
        // Combine structured fields with JSON data field
        preferences = {
          defaultWorkspaceId: preferenceData.default_workspace_id,
          theme: preferenceData.theme,
          ...preferenceData.data
        };
        console.log('Fetched preferences from Supabase:', preferences);
      }
    }
    
    // If on login page, don't return defaultWorkspaceId to prevent redirect loops
    if (isLoginPage) {
      console.log('Request from login page detected, removing defaultWorkspaceId');
      const { defaultWorkspaceId, ...safePreferences } = preferences as any;
      preferences = safePreferences;
    }
    
    console.log('Returning preferences:', preferences);
    
    // Add cache control headers to prevent stale data
    return NextResponse.json(preferences, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/preferences
 * 
 * Update user preferences in Supabase
 */
export async function POST(request: Request) {
  try {
    console.log('POST /api/user/preferences called');
    const body = await request.json();
    console.log('Request body:', body);
    
    // Get the cookie string from headers
    const cookieStore = request.headers.get('cookie') || '';
    
    // Create a Supabase client with the cookie
    const supabase = createServerSupabaseClient(cookieStore);
    
    // Get the current user - replace with getUser for security
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Extract specific fields that have their own columns in the table
    const { defaultWorkspaceId, theme, ...otherPreferences } = body;
    
    // Upsert the preferences in Supabase
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        default_workspace_id: defaultWorkspaceId,
        theme: theme || 'light',
        data: otherPreferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user preferences in Supabase:', error);
      throw new Error('Failed to save user preferences');
    }
    
    // Format the response
    const updatedPreferences = {
      defaultWorkspaceId: data.default_workspace_id,
      theme: data.theme,
      ...data.data
    };
    
    console.log('Updated preferences in Supabase:', updatedPreferences);
    
    return NextResponse.json({
      success: true,
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
} 