import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { toast } from 'sonner';

// Standard animation timing constants in milliseconds
export const TIMING = {
  MODAL_CLOSE: 300,
  NAVIGATION_DELAY: 200,
  TOAST_DISPLAY: 1500,
  FALLBACK_DELAY: 100,
};

// Types of navigation operations
export enum NavigationType {
  PUSH = 'push',
  REPLACE = 'replace',
  REFRESH = 'refresh',
  BACK = 'back',
}

// Options for navigation
export interface NavigationOptions {
  showLoading?: boolean;
  suppressToast?: boolean;
  callback?: () => void;
  delay?: number;
  fallbackUrl?: string;
}

// Default options
const defaultOptions: NavigationOptions = {
  showLoading: true,
  suppressToast: false,
  delay: TIMING.NAVIGATION_DELAY,
};

/**
 * Standardized navigation function to ensure consistent behavior across the application
 * 
 * @param router Next.js router instance
 * @param type Type of navigation operation
 * @param url Destination URL (not needed for refresh or back)
 * @param options Navigation options
 */
export async function navigate(
  router: AppRouterInstance,
  type: NavigationType,
  url?: string,
  options: NavigationOptions = {}
): Promise<boolean> {
  // Merge with default options
  const opts = { ...defaultOptions, ...options };

  // Display loading toast if requested
  let loadingToastId;
  if (opts.showLoading) {
    const message = getNavigationMessage(type, url);
    loadingToastId = toast.loading(message);
  }

  try {
    // Add a small delay to ensure any animations have started
    if (opts.delay && opts.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, opts.delay));
    }

    // Execute the appropriate navigation
    switch (type) {
      case NavigationType.PUSH:
        if (!url) throw new Error('URL is required for push navigation');
        await router.push(url);
        break;
      
      case NavigationType.REPLACE:
        if (!url) throw new Error('URL is required for replace navigation');
        await router.replace(url);
        break;
      
      case NavigationType.REFRESH:
        await router.refresh();
        break;
      
      case NavigationType.BACK:
        await router.back();
        break;
    }

    // Dismiss loading toast if it was shown
    if (loadingToastId) {
      toast.dismiss(loadingToastId);
    }

    // Show success toast unless suppressed
    if (!opts.suppressToast) {
      const successMessage = getSuccessMessage(type, url);
      toast.success(successMessage);
    }

    // Execute callback if provided
    if (opts.callback) {
      opts.callback();
    }

    return true;
  } catch (error) {
    console.error('Navigation error:', error);
    
    // Dismiss loading toast if it was shown
    if (loadingToastId) {
      toast.dismiss(loadingToastId);
    }

    // Show error toast
    toast.error('Navigation failed');

    // Try fallback navigation if URL is provided
    if (opts.fallbackUrl) {
      try {
        setTimeout(() => {
          window.location.href = opts.fallbackUrl || url || '/';
        }, TIMING.FALLBACK_DELAY);
        return true;
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError);
        toast.error('Fallback navigation also failed');
      }
    }

    return false;
  }
}

/**
 * Navigate after a modal closes
 * This ensures the navigation happens after modal closing animation completes
 */
export function navigateAfterModalClose(
  router: AppRouterInstance,
  type: NavigationType,
  url?: string,
  options: NavigationOptions = {}
): Promise<boolean> {
  // First let the modal close animation start
  return new Promise(resolve => {
    setTimeout(() => {
      // Then navigate with standard options
      navigate(router, type, url, options)
        .then(resolve)
        .catch(() => resolve(false));
    }, TIMING.MODAL_CLOSE);
  });
}

/**
 * Helper for refreshing the current page
 */
export function refreshPage(
  router: AppRouterInstance,
  options: NavigationOptions = {}
): Promise<boolean> {
  return navigate(router, NavigationType.REFRESH, undefined, options);
}

/**
 * Generate appropriate loading message based on navigation type
 */
function getNavigationMessage(type: NavigationType, url?: string): string {
  switch (type) {
    case NavigationType.PUSH:
    case NavigationType.REPLACE:
      return 'Navigating...';
    case NavigationType.REFRESH:
      return 'Refreshing page...';
    case NavigationType.BACK:
      return 'Going back...';
    default:
      return 'Loading...';
  }
}

/**
 * Generate appropriate success message based on navigation type
 */
function getSuccessMessage(type: NavigationType, url?: string): string {
  switch (type) {
    case NavigationType.PUSH:
    case NavigationType.REPLACE:
      return 'Navigation successful';
    case NavigationType.REFRESH:
      return 'Page refreshed';
    case NavigationType.BACK:
      return 'Navigation successful';
    default:
      return 'Operation completed';
  }
} 