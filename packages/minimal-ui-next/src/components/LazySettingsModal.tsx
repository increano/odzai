'use client';

import { lazyLoad } from '../lib/lazyLoad';

/**
 * Lazy-loaded SettingsModal component to reduce initial bundle size
 * Only imports the component when it's needed
 */
const LazySettingsModal = lazyLoad(
  () => import('./SettingsModal'),
  {
    loadingDelay: 100, // Small delay to avoid loading flash
    fallback: (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="min-w-[90vw] sm:min-w-[600px] rounded-lg border bg-card shadow-lg flex flex-col max-h-[90vh] animate-in fade-in-0 zoom-in-95">
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    ),
  }
);

export default LazySettingsModal; 