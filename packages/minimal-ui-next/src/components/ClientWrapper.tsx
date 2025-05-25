'use client';

import { Suspense, ReactNode } from 'react';

interface ClientWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientWrapper component
 * 
 * Wraps client components that use useSearchParams() or other client-side hooks
 * in a Suspense boundary to prevent build errors.
 */
export function ClientWrapper({ children, fallback }: ClientWrapperProps) {
  return (
    <Suspense fallback={fallback || <div className="p-4 text-center">Loading...</div>}>
      {children}
    </Suspense>
  );
} 