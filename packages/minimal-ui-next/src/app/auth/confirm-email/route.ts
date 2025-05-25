import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';

/**
 * Auth confirmation handler
 * 
 * This handler processes email verification links that use the token_hash format.
 * It follows the recommended pattern from Supabase for handling email confirmations.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';
  
  console.log('Auth confirmation handler called with:', { token_hash, type, next });

  if (!token_hash || !type) {
    console.error('Missing token_hash or type parameters');
    return NextResponse.redirect(new URL('/login?error=missing_confirmation_params', request.url));
  }

  try {
    const supabase = createClient();
    
    // Verify the OTP token
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (error) {
      console.error('Error verifying confirmation token:', error);
      return NextResponse.redirect(
        new URL('/login?error=verification_failed&message=' + encodeURIComponent(error.message), request.url)
      );
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user found after successful token verification');
      return NextResponse.redirect(
        new URL('/login?error=no_user_after_verification', request.url)
      );
    }
    
    console.log('User successfully verified:', user.id);

    // Check if user preferences exist and create them if not
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('data')
      .eq('user_id', user.id)
      .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      console.error('Error checking user preferences:', preferencesError);
    }

    // Create initial preferences if they don't exist
    if (!preferences) {
      console.log('Creating initial preferences for new user');
      
      await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          data: {
            onboarding: {
              completed: false,
              currentStep: 'welcome'
            }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      // New users should always go to onboarding
      return NextResponse.redirect(new URL('/onboarding/welcome', request.url));
    }

    // Check if onboarding is completed
    const onboardingCompleted = preferences?.data?.onboarding?.completed;
    
    // Direct to appropriate page based on onboarding status
    const redirectPath = onboardingCompleted ? next : '/onboarding/welcome';
    console.log(`Redirecting to ${redirectPath}`);
    
    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch (error) {
    console.error('Unexpected error in auth confirmation:', error);
    return NextResponse.redirect(
      new URL('/login?error=internal_error', request.url)
    );
  }
} 