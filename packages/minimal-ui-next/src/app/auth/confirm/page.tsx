import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { token_hash?: string; type?: string; redirect?: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const { token_hash, type, redirect: redirectPath = '/login?verified=true' } = searchParams;

  if (!token_hash || !type) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Missing Parameters</h1>
          <p className="text-gray-600 mb-6">
            The verification link appears to be invalid or incomplete. Please check your email and try again.
          </p>
          <a 
            href="/login" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type === 'signup' ? 'signup' : 'email',
    });

    if (error) {
      console.error('Error verifying email:', error);
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
          <div className="w-full max-w-md rounded-lg bg-white shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
            <p className="text-gray-600 mb-6">
              {error.message || 'There was a problem verifying your email. Please try again.'}
            </p>
            <a 
              href="/login" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              Return to Login
            </a>
          </div>
        </div>
      );
    }

    // For server rendering, show a loading state with redirect message
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white shadow-md p-8 text-center">
          <div className="mb-6">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Email Verified Successfully!</h1>
          <p className="text-gray-600 mb-6">
            You're being redirected to the login page...
          </p>
          <a 
            href={redirectPath} 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
          >
            Click here if you're not redirected automatically
          </a>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Exception during verification:', error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
          <p className="text-gray-600 mb-6">
            An unexpected error occurred during verification. Please try again.
          </p>
          <a 
            href="/login" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }
} 