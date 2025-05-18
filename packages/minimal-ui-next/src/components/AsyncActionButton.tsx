'use client';

import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { safeAsync } from '../lib/errorHandling';
import type { ButtonProps } from './ui/button';

interface AsyncActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => Promise<any>;
  loadingText?: string;
  successMessage?: string;
  errorMessage?: string;
  showToasts?: boolean;
  retryCount?: number;
  onSuccess?: (result: any) => void;
  onError?: (error: unknown) => void;
}

/**
 * Button component that handles async operations with built-in loading state and error handling
 * Ensures UI remains responsive during long-running operations
 */
export default function AsyncActionButton({
  children,
  onClick,
  loadingText = 'Loading...',
  successMessage,
  errorMessage = 'Operation failed',
  showToasts = true,
  retryCount = 0,
  onSuccess,
  onError,
  disabled,
  ...props
}: AsyncActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await safeAsync(
        onClick,
        {
          successMessage,
          errorMessage,
          showSuccessToast: showToasts,
          showErrorToast: showToasts,
          retryCount,
          onSuccess,
          onError,
        }
      );
    } finally {
      setIsLoading(false);
    }
  }, [onClick, successMessage, errorMessage, showToasts, retryCount, onSuccess, onError]);

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
} 