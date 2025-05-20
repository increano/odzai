import { useState, useCallback, useRef } from 'react';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onMaxRetriesExceeded?: (error: any) => void;
}

interface UseErrorRecoveryReturn<T> {
  execute: (asyncFn: () => Promise<T>) => Promise<T>;
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  reset: () => void;
}

/**
 * A hook that provides error recovery functionality with automatic retries
 * Especially useful for handling network errors in API calls
 */
export function useErrorRecovery<T>({
  maxRetries = 3,
  retryDelay = 1000,
  exponentialBackoff = true,
  onMaxRetriesExceeded,
}: ErrorRecoveryOptions = {}): UseErrorRecoveryReturn<T> {
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use refs to avoid stale closures in async retry logic
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const reset = useCallback(() => {
    setError(null);
    setIsRetrying(false);
    setRetryCount(0);
    retryCountRef.current = 0;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  const execute = useCallback(
    async (asyncFn: () => Promise<T>): Promise<T> => {
      try {
        // Reset state on new execution
        reset();
        
        return await asyncFn();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        // Check if the error is recoverable (network errors most likely are)
        const isRecoverable = 
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('connection') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('429'); // Too Many Requests
        
        if (isRecoverable && retryCountRef.current < maxRetries) {
          // Increment retry count
          retryCountRef.current += 1;
          setRetryCount(retryCountRef.current);
          setIsRetrying(true);
          
          // Calculate delay with exponential backoff if enabled
          const delay = exponentialBackoff
            ? retryDelay * Math.pow(2, retryCountRef.current - 1)
            : retryDelay;
          
          // Return a new promise that will resolve after retry
          return new Promise((resolve, reject) => {
            timeoutRef.current = setTimeout(async () => {
              try {
                // Try again
                const result = await asyncFn();
                setIsRetrying(false);
                resolve(result);
              } catch (retryError) {
                // If we still have retries left, recursive call
                try {
                  const result = await execute(asyncFn);
                  resolve(result);
                } catch (finalError) {
                  reject(finalError);
                }
              }
            }, delay);
          });
        } else {
          // Either not recoverable or max retries exceeded
          setError(error);
          setIsRetrying(false);
          
          if (retryCountRef.current >= maxRetries && onMaxRetriesExceeded) {
            onMaxRetriesExceeded(error);
          }
          
          throw error;
        }
      }
    },
    [reset, maxRetries, retryDelay, exponentialBackoff, onMaxRetriesExceeded]
  );
  
  return {
    execute,
    error,
    isRetrying,
    retryCount,
    reset,
  };
}

export default useErrorRecovery; 