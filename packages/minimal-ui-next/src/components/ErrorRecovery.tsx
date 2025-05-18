'use client';

import { ReactNode } from 'react';
import { Button } from './ui/button';
import { RefreshCw, AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { navigate, NavigationType } from '../lib/navigation';

interface ErrorRecoveryProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  children?: ReactNode;
}

/**
 * Component for displaying errors with recovery options
 * Provides standard UI and behaviors for error states
 */
export default function ErrorRecovery({
  title = 'Something went wrong',
  message = 'An error occurred while processing your request',
  error,
  onRetry,
  showHomeButton = true,
  showBackButton = true,
  children,
}: ErrorRecoveryProps) {
  const router = useRouter();
  
  // Format error message if error object is provided
  const errorMessage = error instanceof Error ? error.message : 
    typeof error === 'string' ? error : message;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-md mx-auto my-8">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{errorMessage}</p>
        
        {/* Custom error content if provided */}
        {children}
      </div>
      
      <div className="flex flex-wrap justify-center gap-4 pt-2">
        {/* Retry button */}
        {onRetry && (
          <Button 
            variant="default"
            onClick={() => {
              // Add a small delay to allow UI to respond
              setTimeout(onRetry, 10);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
        
        {/* Back button */}
        {showBackButton && (
          <Button 
            variant="outline"
            onClick={() => {
              navigate(router, NavigationType.BACK, undefined, {
                fallbackUrl: '/',
                suppressToast: true,
              }).catch(() => {
                // If back navigation fails, go home
                navigate(router, NavigationType.PUSH, '/', {
                  suppressToast: true,
                });
              });
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        )}
        
        {/* Home button */}
        {showHomeButton && (
          <Button 
            variant="outline"
            onClick={() => {
              navigate(router, NavigationType.PUSH, '/', {
                suppressToast: true,
              });
            }}
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  );
} 