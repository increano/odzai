import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth callback handler
 * 
 * This route handles various authentication callbacks:
 * 1. Email verification callbacks (both PKCE flow and token hash method)
 * 2. OAuth provider callbacks
 * 3. Password reset confirmations
 * 
 * It ensures users are properly authenticated and redirected based on their status.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  
  // Get all potential auth parameters
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const token = requestUrl.searchParams.get('token_hash');
  const next = requestUrl.searchParams.get('next') || '/budget';
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const redirectTo = requestUrl.searchParams.get('redirect') || '/login?verified=true';
  
  // Handle error parameters that might be returned from Supabase
  if (error) {
    console.error('Auth error returned from Supabase:', error, error_description);
    return NextResponse.redirect(
      new URL(`/login?error=${error}&error_description=${error_description || ''}`, requestUrl)
    );
  }

  console.log('Auth callback triggered', { 
    url: request.url,
    hasCode: !!code,
    type,
    hasToken: !!token,
    next,
    params: Object.fromEntries(requestUrl.searchParams.entries())
  });

  // Support different auth flows
  try {
    const supabase = createRouteHandlerClient({ cookies });
    let user = null;
    
    // 1. PKCE flow (authorization code)
    if (code) {
      console.log('Processing PKCE authorization code flow');
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('Error exchanging code for session:', sessionError);
        return NextResponse.redirect(
          new URL(`/login?error=auth_code_error&message=${sessionError.message}`, requestUrl)
        );
      }
      
      user = data.user;
    }
    // 2. Token hash method (email confirmations, password resets)
    else if (token) {
      console.log(`Processing token verification for type: ${type || 'unknown'}`);
      
      // Handle token verification
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: (type as any) || 'signup',
      });
      
      if (verifyError) {
        console.error('Error verifying token:', verifyError);
        return NextResponse.redirect(
          new URL(`/login?error=token_error&message=${verifyError.message}`, requestUrl)
        );
      }
      
      // Get the user after verification
      const { data: { user: verifiedUser } } = await supabase.auth.getUser();
      user = verifiedUser;
      
      // For email verification, redirect to login with verified status
      if (type === 'signup' || type === 'email') {
        console.log('Email verified, redirecting to login page');
        return NextResponse.redirect(new URL('/login?verified=true', requestUrl));
      }
    }
    // 3. No code or token present
    else {
      console.error('No authentication parameters found in URL');
      return NextResponse.redirect(
        new URL('/login?error=missing_auth_params', requestUrl)
      );
    }

    // If we don't have a user at this point, authentication failed
    if (!user) {
      console.error('No user after authentication process');
      return NextResponse.redirect(
        new URL('/login?error=no_user', requestUrl)
      );
    }

    console.log('Authentication successful for user:', user.id);

    // If we have an explicit redirect URL parameter, prioritize it
    if (requestUrl.searchParams.get('redirect')) {
      const redirectUrl = requestUrl.searchParams.get('redirect') || '/login?verified=true';
      return NextResponse.redirect(new URL(redirectUrl, requestUrl));
    }

    // If this is an email verification or signup flow, redirect to login
    // This ensures users go through the login flow first, which will then direct them to onboarding
    if (type === 'signup' || type === 'email' || token) {
      return NextResponse.redirect(new URL('/login?verified=true', requestUrl));
    }

    // Check if user has completed onboarding
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('data')
      .eq('user_id', user.id)
      .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', preferencesError);
    }

    // Create initial preferences if needed
    if (!preferences) {
      console.log('Creating initial preferences for new user');
      
      const { error: createError } = await supabase
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

      if (createError) {
        console.error('Error creating preferences:', createError);
      }
      
      return NextResponse.redirect(new URL('/onboarding/welcome', requestUrl));
    }

    // Determine where to redirect based on onboarding status
    const onboardingCompleted = preferences?.data?.onboarding?.completed;
    
    // Use provided 'next' param if onboarding is completed, otherwise go to onboarding
    const redirectPath = onboardingCompleted ? next : '/onboarding/welcome';
    console.log(`Redirecting authenticated user to: ${redirectPath}`);
    
    return NextResponse.redirect(new URL(redirectPath, requestUrl));
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(
      new URL('/login?error=internal_error', requestUrl)
    );
  }
} 