'use client';

import { ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { toast } from 'sonner';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

/**
 * This component applies error boundaries at different levels of the application.
 * It ensures that errors in one part of the app don't crash the entire UI.
 * 
 * It also centralizes error logging to make debugging easier.
 */
export default function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  // Central error logging function
  const logError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to console in development
    console.error('Application error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Here you would typically send the error to a monitoring service
    // like Sentry, LogRocket, etc.
    
    // Example of sending to a monitoring endpoint:
    if (process.env.NODE_ENV === 'production') {
      try {
        fetch('/api/log-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
            },
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
          }),
        }).catch(e => console.error('Error logging failed:', e));
      } catch (e) {
        console.error('Error during error logging:', e);
      }
    }
  };

  return (
    <ErrorBoundary
      logError={logError}
      onReset={() => {
        // Clear any error state that might be persisted
        toast.dismiss();
        toast.info('Application has been recovered');
      }}
    >
      {children}
    </ErrorBoundary>
  );
} 