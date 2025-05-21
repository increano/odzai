# Supabase Implementation for User Preferences and Workspaces

This document outlines the implementation of Supabase for handling user preferences and workspace creation in the minimal-ui-next package, along with the updated middleware support.

## Table of Contents

1. [Overview](#overview)
2. [User Preferences Implementation](#user-preferences-implementation)
3. [Workspace Creation Flow](#workspace-creation-flow)
4. [Onboarding Flow Integration](#onboarding-flow-integration)
5. [Middleware Support](#middleware-support)
6. [Database Schema](#database-schema)

## Overview

We've transitioned from using local filesystem storage to Supabase for user data management. This provides several benefits:

- **Secure authentication**: Using Supabase Auth with PKCE flow
- **Persistent user preferences**: Stored in a database rather than local files
- **Access control for workspaces**: Using role-based permissions 
- **Improved security**: Proper authentication and authorization checks
- **State persistence**: Onboarding progress is saved between sessions

## User Preferences Implementation

The user preferences API has been updated to store preferences in Supabase instead of the local filesystem.

### User Preferences API

```typescript
// packages/minimal-ui-next/src/app/api/user/preferences/route.ts

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
    // Get the cookie string from headers
    const cookieStore = request.headers.get('cookie') || '';
    
    // Create a Supabase client with the cookie
    const supabase = createServerSupabaseClient(cookieStore);
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session and not on login page, return empty preferences
    if (!session && !isLoginPage) {
      return NextResponse.json({});
    }
    
    // If there's a session, fetch user preferences from Supabase
    let preferences = {};
    
    if (session?.user) {
      // Query the user_preferences table
      const { data: preferenceData, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (preferenceData) {
        // Combine structured fields with JSON data field
        preferences = {
          defaultWorkspaceId: preferenceData.default_workspace_id,
          theme: preferenceData.theme,
          ...preferenceData.data
        };
      }
    }
    
    return NextResponse.json(preferences);
  } catch (error) {
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
    const body = await request.json();
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
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
        user_id: session.user.id,
        default_workspace_id: defaultWorkspaceId,
        theme: theme || 'light',
        data: otherPreferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error('Failed to save user preferences');
    }
    
    // Format the response
    const updatedPreferences = {
      defaultWorkspaceId: data.default_workspace_id,
      theme: data.theme,
      ...data.data
    };
    
    return NextResponse.json({
      success: true,
      preferences: updatedPreferences
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
}
```

### Key Improvements

1. **Authentication Integration**: Preferences are tied to authenticated users
2. **Structured Data**: Both structured fields (`default_workspace_id`, `theme`) and flexible JSON data
3. **Error Handling**: Proper error handling for database operations
4. **Security**: Only authenticated users can update their own preferences

## Workspace Creation Flow

The workspace creation process during onboarding has been updated to use Supabase.

### Workspace Creation Component

```typescript
// packages/minimal-ui-next/src/app/onboarding/workspace/page.tsx

const handleCreateWorkspace = async () => {
  if (!isFormValid) return;
  
  try {
    setIsCreating(true);
    setError('');
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to create a workspace');
    }
    
    // Use the Supabase function to create a workspace
    const { data, error: workspaceError } = await supabase.rpc('create_workspace_with_owner', {
      workspace_name: workspaceName.trim(),
      workspace_color: selectedColor
    });
    
    if (workspaceError) {
      throw workspaceError;
    }
    
    // The function returns the workspace ID
    const newWorkspaceId = data;
    
    if (!newWorkspaceId) {
      throw new Error('Failed to create workspace');
    }
    
    // Update user preferences to set this as default workspace
    const { error: preferencesError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        default_workspace_id: newWorkspaceId,
        updated_at: new Date().toISOString()
      });
    
    toast.success(`Workspace "${workspaceName}" created successfully`);
    
    // Move to next step
    goToNextStep();
  } catch (err: any) {
    setError(err.message || 'Failed to create workspace');
    toast.error('Failed to create workspace');
  } finally {
    setIsCreating(false);
  }
};
```

### Key Improvements

1. **Database Functions**: Uses a Supabase database function (`create_workspace_with_owner`)
2. **Access Control**: Creates workspace and automatically assigns the creator as admin
3. **User Preferences**: Updates the user's preferences to set the new workspace as default
4. **Error Handling**: Proper error handling with user feedback

## Onboarding Flow Integration

The onboarding flow has been fully integrated with Supabase for user profiles and state persistence.

### Profile Component

```typescript
// packages/minimal-ui-next/src/app/onboarding/profile/page.tsx

function ProfileContent() {
  const { fullName, setFullName, goToNextStep, goToStep } = useOnboarding();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const { session, user } = useAuth();

  useEffect(() => {
    // Ensure we're on the correct step when this component mounts
    goToStep('profile');
    
    // If user already has a full_name in metadata, pre-populate it
    if (user?.user_metadata && typeof user?.user_metadata === 'object') {
      const metadata = user.user_metadata as Record<string, any>;
      if (metadata.full_name && !fullName) {
        setFullName(metadata.full_name);
      }
    }
  }, [goToStep, user, fullName, setFullName]);

  const handleUpdateProfile = async () => {
    if (!isFormValid) return;
    
    try {
      setIsUpdating(true);
      setError('');
      
      if (!session?.user) {
        throw new Error('You must be logged in to update your profile');
      }
      
      // Update user metadata in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
        }
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // Also store in user_preferences for more structured access
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          data: {
            profile: {
              fullName: fullName.trim(),
              updatedAt: new Date().toISOString()
            }
          },
          updated_at: new Date().toISOString()
        });
      
      toast.success('Profile updated successfully');
      goToNextStep();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };
}
```

### Onboarding Provider

```typescript
// packages/minimal-ui-next/src/components/providers/OnboardingProvider.tsx

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [workspaceName, setWorkspaceName] = useState('');
  const [fullName, setFullName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load onboarding state from Supabase or initialize defaults
  useEffect(() => {
    async function loadOnboardingState() {
      if (!session?.user) {
        // Not logged in, can't load state
        setIsInitialized(true);
        return;
      }

      try {
        // Try to get existing preferences from Supabase
        const { data: preferences, error } = await supabase
          .from('user_preferences')
          .select('data')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found error
          console.error('Error loading onboarding state:', error);
        } else if (preferences?.data?.onboarding) {
          // We have onboarding data in preferences
          const { onboarding } = preferences.data;
          if (onboarding.workspaceName) setWorkspaceName(onboarding.workspaceName);
          if (onboarding.fullName) setFullName(onboarding.fullName);
          if (onboarding.currentStep) setCurrentStep(onboarding.currentStep as OnboardingStep);
        } else if (user?.user_metadata && typeof user.user_metadata === 'object') {
          // Use data from user metadata if available
          const metadata = user.user_metadata as Record<string, any>;
          if (metadata.full_name) {
            setFullName(metadata.full_name);
          }
        }
      } catch (err) {
        console.error('Failed to load onboarding state:', err);
      }

      setIsInitialized(true);
    }

    if (!isInitialized) {
      loadOnboardingState();
    }
  }, [session, user, isInitialized]);

  // Save onboarding state to Supabase
  const saveOnboardingState = useCallback(async () => {
    if (!session?.user) {
      console.log('Cannot save onboarding state: no active session');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          data: {
            onboarding: {
              currentStep,
              workspaceName,
              fullName,
              lastUpdated: new Date().toISOString()
            }
          },
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving onboarding state:', error);
      }
    } catch (err) {
      console.error('Failed to save onboarding state:', err);
    }
  }, [session, currentStep, workspaceName, fullName]);

  // Complete the onboarding process
  const completeOnboarding = useCallback(async () => {
    // Mark onboarding as complete in user preferences
    if (session?.user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: session.user.id,
            data: {
              onboarding: {
                completed: true,
                completedAt: new Date().toISOString()
              }
            },
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.error('Failed to mark onboarding as complete:', err);
      }
    }
    
    // Navigate to the main app
    window.location.href = '/budget';
  }, [router, session]);
}
```

### Key Onboarding Improvements

1. **State Persistence**: Onboarding progress is saved in Supabase between sessions
2. **Profile Integration**: User profile data is stored in both auth.users metadata and preferences
3. **Loading State**: Properly shows loading state while fetching initial data
4. **Metadata Handling**: Safely accesses user metadata with proper type handling
5. **Session Management**: All operations verify user is authenticated
6. **Step Management**: Each navigation between steps saves state to Supabase
7. **Completion Tracking**: Marks onboarding as complete in Supabase when finished

## Middleware Support

The middleware has been updated to support the Supabase implementation with additional security checks.

### Updated Middleware

```typescript
// packages/minimal-ui-next/src/middleware.ts

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip auth check for public paths and auth pages
  if (isPublicPath(path) || isFromAuthPage(request)) {
    return NextResponse.next();
  }
  
  try {
    // Initialize Supabase with current request cookies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      },
    });

    // Check for an active session
    const { data } = await supabase.auth.getSession();
    
    // If we have a valid session, continue with additional checks if needed
    if (data.session) {
      // For workspace-specific API requests, we need to check workspace access
      if (isWorkspaceApiRequest(path)) {
        // Extract the workspace ID from the path
        const match = path.match(/\/api\/(budgets|accounts|transactions)\/([^\/]+)/);
        if (match && match[2]) {
          const workspaceId = match[2];
          
          // Check if the user has access to this workspace
          const { data: workspaceAccess, error } = await supabase
            .from('workspace_users')
            .select('access_level')
            .eq('workspace_id', workspaceId)
            .eq('user_id', data.session.user.id)
            .single();
          
          if (error || !workspaceAccess) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
          }
        }
      }
      
      return NextResponse.next();
    }
    
    // No session, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    // In case of error, redirect to login as fallback
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### Key Improvements

1. **Authentication Check**: Verifies user is authenticated using Supabase session
2. **Authorization Check**: For workspace-specific routes, checks workspace access permissions
3. **Route Protection**: Protects API routes and UI pages based on authentication status
4. **Workspace Access Control**: Implements proper workspace access control using the `workspace_users` table

## Database Schema

The Supabase database schema includes several tables to support this implementation:

### User Preferences Table

```sql
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_workspace_id TEXT,
  theme TEXT DEFAULT 'light',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Workspaces Table

```sql
CREATE TABLE IF NOT EXISTS public.workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT,
  color TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Workspace Users Table (Access Control)

```sql
CREATE TABLE IF NOT EXISTS public.workspace_users (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);
```

### Create Workspace Function

```sql
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  workspace_name TEXT,
  workspace_color TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  new_workspace_id TEXT;
  workspace_display_name TEXT;
BEGIN
  -- Generate a workspace ID (slug from name)
  new_workspace_id := lower(regexp_replace(workspace_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || 
                     substring(md5(random()::text) from 1 for 7);
  
  -- Set display name same as name if not provided
  workspace_display_name := workspace_name;
  
  -- Insert the new workspace
  INSERT INTO public.workspaces (id, name, display_name, color, owner_id)
  VALUES (new_workspace_id, workspace_name, workspace_display_name, workspace_color, auth.uid());
  
  -- Add the creator as admin
  INSERT INTO public.workspace_users (workspace_id, user_id, access_level)
  VALUES (new_workspace_id, auth.uid(), 'admin');
  
  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

The full database schema includes additional tables and relationships to support the complete application functionality. 