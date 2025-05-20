import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// Define error types for different scenarios
export type ErrorType = 
  | 'network' 
  | 'sync_failure' 
  | 'validation' 
  | 'permission' 
  | 'timeout'
  | 'conflict'
  | 'unknown';

interface ErrorDetails {
  type: ErrorType;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  retryCount: number;
  recoveryAttempted: boolean;
}

interface ErrorRecoveryOptions {
  maxRetries?: number;
  autoRetryNetworkIssues?: boolean;
  retryDelayMs?: number;
  onRecoverySuccess?: (error: ErrorDetails) => void;
  onRecoveryFailure?: (error: ErrorDetails) => void;
  logErrors?: boolean;
}

// Recovery strategy for the error
type RecoveryStrategy = 
  | 'retry'     // Simple retry the operation
  | 'reconnect' // Reestablish connection before retry
  | 'refresh'   // Refresh data before retry
  | 'reauth'    // Reauthenticate user before retry
  | 'manual'    // Requires manual intervention, no auto recovery
  | 'ignore';   // Error can be safely ignored

// Determines the best recovery strategy for a given error
function determineRecoveryStrategy(error: ErrorDetails): RecoveryStrategy {
  switch (error.type) {
    case 'network':
      return error.retryCount < 3 ? 'retry' : 'reconnect';
    case 'sync_failure':
      return error.retryCount < 2 ? 'retry' : 'manual';
    case 'validation':
      return 'manual'; // Validation errors typically need user intervention
    case 'permission':
      return 'reauth';
    case 'timeout':
      return error.retryCount < 3 ? 'retry' : 'manual';
    case 'conflict':
      return 'manual'; // Conflicts typically need user decision
    default:
      return 'manual';
  }
}

// Get user-friendly message for different error types
function getUserFriendlyMessage(error: ErrorDetails): string {
  switch (error.type) {
    case 'network':
      return `Network connection issue. ${error.retryCount < 3 ? 'Retrying...' : 'Please check your internet connection.'}`;
    case 'sync_failure':
      return `Failed to sync with your bank. ${error.retryCount < 2 ? 'Retrying...' : 'Please try again later.'}`;
    case 'validation':
      return 'Please check your information and try again.';
    case 'permission':
      return 'You don\'t have permission to perform this action. Please log in again.';
    case 'timeout':
      return `The operation timed out. ${error.retryCount < 3 ? 'Retrying...' : 'Please try again later.'}`;
    case 'conflict':
      return 'There are conflicts that need resolution. Please review and try again.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}

export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    autoRetryNetworkIssues = true,
    retryDelayMs = 1000,
    onRecoverySuccess,
    onRecoveryFailure,
    logErrors = true
  } = options;

  const [errors, setErrors] = useState<ErrorDetails[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const [currentRecoveryError, setCurrentRecoveryError] = useState<ErrorDetails | null>(null);

  // Report a new error
  const reportError = useCallback((
    type: ErrorType, 
    message: string, 
    context?: Record<string, any>
  ) => {
    const newError: ErrorDetails = {
      type,
      message,
      timestamp: new Date(),
      context,
      retryCount: 0,
      recoveryAttempted: false
    };

    if (logErrors) {
      console.error(`[Error Recovery] ${type}:`, message, context);
    }

    // Add to errors state
    setErrors(prev => [...prev, newError]);

    // Show user-friendly toast
    toast.error(getUserFriendlyMessage(newError));

    // Auto-retry network issues if enabled
    if (autoRetryNetworkIssues && type === 'network') {
      attemptRecovery(newError);
    }

    return newError;
  }, [autoRetryNetworkIssues, logErrors]);

  // Attempt to recover from an error
  const attemptRecovery = useCallback(async (error: ErrorDetails) => {
    // Don't retry if already at max retries
    if (error.retryCount >= maxRetries) {
      if (onRecoveryFailure) {
        onRecoveryFailure(error);
      }
      
      toast.error(
        `Recovery failed after ${maxRetries} attempts. Please try again later.`
      );
      
      return false;
    }

    // Mark as recovering
    setIsRecovering(true);
    setCurrentRecoveryError(error);

    // Update error state
    const updatedError = {
      ...error,
      retryCount: error.retryCount + 1,
      recoveryAttempted: true
    };

    setErrors(prev => 
      prev.map(e => 
        (e.type === error.type && 
         e.timestamp === error.timestamp) ? updatedError : e
      )
    );

    // Determine recovery strategy
    const strategy = determineRecoveryStrategy(updatedError);
    
    // Show recovery attempt toast
    toast.info(`Attempting to recover (${updatedError.retryCount}/${maxRetries})...`);

    try {
      // Implement recovery based on strategy
      // In a real application, each of these would have specific implementation
      switch (strategy) {
        case 'retry':
          // Simple delay and retry
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          break;
          
        case 'reconnect':
          // Attempt to reconnect
          await new Promise(resolve => setTimeout(resolve, retryDelayMs * 2));
          // Here you would implement actual reconnection logic
          break;
          
        case 'refresh':
          // Refresh data
          // This would call a specific refresh function provided by the application
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          break;
          
        case 'reauth':
          // Would redirect to login or refresh auth token
          toast.info('Please log in again to continue.');
          return false;
          
        case 'manual':
          // Requires manual intervention
          toast.info('This issue requires your attention. Please check the error details.');
          setIsRecovering(false);
          return false;
          
        case 'ignore':
          // Mark as recovered and continue
          setIsRecovering(false);
          return true;
      }

      // If we get here, recovery attempt was successful
      if (onRecoverySuccess) {
        onRecoverySuccess(updatedError);
      }
      
      // Remove from active errors
      setErrors(prev => prev.filter(e => 
        !(e.type === error.type && e.timestamp === error.timestamp)
      ));
      
      toast.success('Recovery successful!');
      return true;
    } catch (recoveryError) {
      // Recovery failed, try again or give up
      if (updatedError.retryCount < maxRetries) {
        // Schedule another attempt with increasing delay
        setTimeout(() => {
          attemptRecovery(updatedError);
        }, retryDelayMs * Math.pow(2, updatedError.retryCount));
      } else {
        if (onRecoveryFailure) {
          onRecoveryFailure(updatedError);
        }
        toast.error(`Recovery failed after ${maxRetries} attempts. Please try again later.`);
      }
      return false;
    } finally {
      setIsRecovering(false);
      setCurrentRecoveryError(null);
    }
  }, [maxRetries, retryDelayMs, onRecoverySuccess, onRecoveryFailure]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Clear a specific error
  const clearError = useCallback((errorToRemove: ErrorDetails) => {
    setErrors(prev => 
      prev.filter(e => 
        !(e.type === errorToRemove.type && e.timestamp === errorToRemove.timestamp)
      )
    );
  }, []);

  // Check for recoverable errors and attempt recovery on mount
  useEffect(() => {
    const recoverableErrors = errors.filter(e => {
      const strategy = determineRecoveryStrategy(e);
      return (
        !e.recoveryAttempted && 
        ['retry', 'reconnect', 'refresh'].includes(strategy)
      );
    });

    if (recoverableErrors.length > 0 && !isRecovering) {
      attemptRecovery(recoverableErrors[0]);
    }
  }, [errors, isRecovering, attemptRecovery]);

  return {
    errors,
    isRecovering,
    currentRecoveryError,
    reportError,
    attemptRecovery,
    clearErrors,
    clearError,
    // Helper method to wrap an async function with error recovery
    withRecovery: useCallback(async <T>(
      fn: () => Promise<T>,
      errorType: ErrorType = 'unknown',
      context?: Record<string, any>
    ): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'An unknown error occurred';
          
        reportError(errorType, errorMessage, {
          ...context,
          originalError: error
        });
        throw error;
      }
    }, [reportError])
  };
} 