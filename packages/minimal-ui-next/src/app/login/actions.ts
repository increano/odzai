'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type AuthState = { error?: string; message?: string } | null;

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = createServerActionClient({ cookies });

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
    redirect('/budget');
  } else {
    return { error: 'Please confirm your email before logging in.' };
  }
}

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = createServerActionClient({ cookies });
  
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