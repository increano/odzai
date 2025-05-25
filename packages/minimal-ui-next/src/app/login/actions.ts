'use server';

import { createClient } from '@/lib/supabase/server';
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
    // Check if this is the user's first login by looking up preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('data, created_at')
      .eq('user_id', user.id)
      .single();

    // If there's an error that's not "no rows returned", handle it
    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('Error checking user preferences:', prefsError);
      return { error: 'Error checking user profile. Please try again.' };
    }

    // Calculate if user is new based on preferences existence or onboarding status
    const isNewUser = !preferences || !preferences.data?.onboarding?.completed;
    
    // Log for debugging
    console.log('Login successful, user status:', { 
      isNewUser, 
      hasPreferences: !!preferences,
      onboardingStatus: preferences?.data?.onboarding
    });
    
    // IMPORTANT: Revalidate the layout to ensure proper session handling
    revalidatePath('/', 'layout');
    
    // If explicit redirect is provided, honor it
    if (redirectTo) {
      redirect(redirectTo);
    }
    
    // Otherwise route based on user status
    if (isNewUser) {
      // New user should go to onboarding
      redirect('/onboarding/welcome');
    } else {
      // Returning user goes to budget dashboard
      redirect('/budget');
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