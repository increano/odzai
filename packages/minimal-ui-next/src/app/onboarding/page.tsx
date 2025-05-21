'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Index page for the onboarding route that redirects to the welcome step
export default function OnboardingIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/onboarding/welcome');
  }, [router]);
  
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-4 text-gray-600">Redirecting to onboarding...</p>
      </div>
    </div>
  );
} 