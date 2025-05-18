import { toast } from 'sonner';

export type ErrorWithMessage = {
  message: string;
};

export type ErrorWithCode = {
  code: string | number;
  message?: string;
};

// Function to extract a user-friendly message from different error types
export function getErrorMessage(error: unknown): string {
  // Default message
  let message = 'An unexpected error occurred';
  
  if (error === null || error === undefined) {
    return message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle error objects with message property
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  
  // Handle error objects with code property
  if (isErrorWithCode(error)) {
    if (error.message) {
      return error.message;
    }
    return `Error code: ${error.code}`;
  }
  
  // If error is an object, try JSON stringify (for development)
  if (typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      // If stringify fails, return default message
      return message;
    }
  }
  
  return message;
}

// Type guards for error types
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (typeof (error as Record<string, unknown>).code === 'string' ||
      typeof (error as Record<string, unknown>).code === 'number')
  );
}

// Standardized error toast function
export function showErrorToast(error: unknown, title: string = 'Error') {
  const message = getErrorMessage(error);
  return toast.error(title, {
    description: message,
    duration: 5000,
  });
}

// Function for handling async operations with built-in error handling
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  options: {
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    retryCount?: number;
    retryDelay?: number;
  } = {}
): Promise<T | null> {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = 'Operation failed',
    showSuccessToast = true,
    showErrorToast: showErrorToastOption = true,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  let lastError: unknown = null;
  let attempts = 0;

  while (attempts <= retryCount) {
    try {
      if (attempts > 0) {
        // Delay before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      const result = await asyncFn();
      
      // Handle success
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      attempts++;
      
      // Only show error toast on final failure
      if (attempts > retryCount) {
        if (showErrorToastOption) {
          showErrorToast(error, errorMessage);
        }
        
        if (onError) {
          onError(error);
        }
      } else {
        // Show retry toast
        toast.info(`Retrying operation (${attempts}/${retryCount})`, {
          duration: 2000,
        });
      }
    }
  }
  
  return null;
}

// Recovery function for failed API calls with fallback
export async function withFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  options: {
    onFallbackUsed?: () => void;
    showFallbackNotification?: boolean;
  } = {}
): Promise<T> {
  const { onFallbackUsed, showFallbackNotification = true } = options;
  
  try {
    return await primaryFn();
  } catch (error) {
    // Log the error
    console.error('Primary operation failed, using fallback:', error);
    
    // Notify user we're using fallback
    if (showFallbackNotification) {
      toast.info('Using alternative method', {
        description: 'The primary operation failed, trying a backup approach',
        duration: 3000,
      });
    }
    
    // Callback for fallback usage
    if (onFallbackUsed) {
      onFallbackUsed();
    }
    
    // Execute fallback
    return await fallbackFn();
  }
} 