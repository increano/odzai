'use server';

import { createClient } from '@/lib/supabase/server';
import { loadUserWorkspaceData } from '@/lib/supabase/workspace';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type AuthState = { error?: string; message?: string } | null;

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirectTo') as string;

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Get user to check email confirmation
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    // Load user workspace data
    const workspaceData = await loadUserWorkspaceData(user.id);
    
    console.log('Login successful, workspace data:', {
      hasWorkspaces: workspaceData.hasWorkspaces,
      defaultWorkspace: workspaceData.defaultWorkspace?.name,
      totalWorkspaces: workspaceData.workspaces.length,
      onboardingStatus: workspaceData.preferences?.data?.onboarding
    });

    // Check if this is the user's first login by looking at onboarding status
    const isNewUser = !workspaceData.preferences?.data?.onboarding?.completed;
    
    // IMPORTANT: Revalidate the layout to ensure proper session handling
    revalidatePath('/', 'layout');
    
    // If explicit redirect is provided, honor it
    if (redirectTo) {
      redirect(redirectTo);
    }
    
    // Route based on user status and workspace availability
    if (isNewUser) {
      // New user should go to onboarding
      redirect('/onboarding/welcome');
    } else if (!workspaceData.hasWorkspaces) {
      // User completed onboarding but has no workspaces (edge case)
      console.warn('User has completed onboarding but has no workspaces');
      redirect('/onboarding/workspace');
    } else {
      // Returning user with workspaces goes to dashboard
      // The default workspace will be available in the app context
      redirect('/');
    }
  } else {
    return { error: 'Please confirm your email before logging in.' };
  }
}

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = createClient();
  
  // Get the site URL from environment or default to localhost with protocol
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const callbackUrl = `${siteUrl}/auth/callback`;
  
  console.log('Signup with redirect URL:', callbackUrl);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { message: 'Check your email for the confirmation link.' };
} 