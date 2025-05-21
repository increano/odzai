'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/providers/SupabaseAuthProvider';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleGoBack = () => {
    // Use history to go back if possible
    window.history.length > 1 ? router.back() : router.push('/');
  };

  const handleSignOut = async () => {
    await signOut();
    // Using setTimeout to prevent UI freezes as recommended in the architecture guide
    setTimeout(() => {
      router.push('/login');
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Access Denied</h2>
          
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page. 
            {user ? ' Please contact your administrator if you believe this is an error.' : ' Please sign in with an account that has the required permissions.'}
          </p>
          
          <div className="mt-6 flex flex-col space-y-3">
            <button
              onClick={handleGoBack}
              className="inline-flex justify-center w-full py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
            
            {user && (
              <button
                onClick={handleSignOut}
                className="inline-flex justify-center w-full py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 