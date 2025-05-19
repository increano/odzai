'use client';

import React, { Suspense, lazy, ComponentType, LazyExoticComponent } from 'react';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  ssr?: boolean;
  loadingDelay?: number;
}

/**
 * Creates a lazy-loaded component with standardized loading state
 * 
 * @param importFn - Function that imports the component
 * @param options - Configuration options
 * @returns Lazy loaded component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const {
    fallback = <DefaultSuspenseFallback />,
    ssr = false,
    loadingDelay = 200
  } = options;

  // Create the lazy component
  const LazyComponent = lazy(async () => {
    // Add small delay to prevent loading flash for already cached components
    if (loadingDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, loadingDelay));
    }
    return importFn();
  });

  // Return a wrapper component that adds Suspense
  return ((props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  )) as unknown as LazyExoticComponent<T>;
}

/**
 * Default loading state for lazy-loaded components
 */
function DefaultSuspenseFallback() {
  const [showSpinner, setShowSpinner] = React.useState(false);
  
  // Only show spinner after 500ms to prevent flash
  React.useEffect(() => {
    const timer = setTimeout(() => setShowSpinner(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  if (!showSpinner) return null;
  
  return (
    <div className="flex items-center justify-center w-full h-24 p-5 bg-muted/20 border border-dashed rounded-md">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
} 