'use client';

import React from 'react';

/**
 * Wrapper for client-side providers to avoid hydration warnings
 */
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 