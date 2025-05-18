import { toast } from 'sonner';
import { storage } from './storage';
import { getErrorMessage } from './errorHandling';

// Cache for request deduplication
const inFlightRequests = new Map<string, Promise<any>>();

// Base fetch function with error handling and request deduplication
export async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Create a cache key based on url and request method
  const cacheKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`;
  
  // Check if request is already in flight
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  // Create fetch promise
  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      // Remove from in-flight requests map
      setTimeout(() => {
        inFlightRequests.delete(cacheKey);
      }, 0);

      // Handle non-2xx responses
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If response can't be parsed as JSON, use status text
          errorData = { message: response.statusText };
        }

        const error: any = new Error(errorData.message || 'An error occurred');
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // For empty responses, return an empty object
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      // Remove from in-flight requests map
      setTimeout(() => {
        inFlightRequests.delete(cacheKey);
      }, 0);

      // Re-throw error for caller to handle
      throw error;
    }
  })();

  // Store promise in map to deduplicate in-flight requests
  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

// Default fetcher function for SWR - typed correctly for SWR
export const fetcher = <T>(url: string): Promise<T> => fetchWithErrorHandling<T>(url);

// Global fetch configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

// Helper to build full API URL
export function buildApiUrl(path: string): string {
  const baseUrl = API_CONFIG.baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

// POST request helper
export function post<T = any, B = any>(
  url: string,
  body?: B,
  options: RequestInit = {}
): Promise<T> {
  return fetchWithErrorHandling<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

// PUT request helper
export function put<T = any, B = any>(
  url: string,
  body?: B,
  options: RequestInit = {}
): Promise<T> {
  return fetchWithErrorHandling<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

// PATCH request helper
export function patch<T = any, B = any>(
  url: string,
  body?: B,
  options: RequestInit = {}
): Promise<T> {
  return fetchWithErrorHandling<T>(url, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

// DELETE request helper
export function del<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  return fetchWithErrorHandling<T>(url, {
    method: 'DELETE',
    ...options,
  });
}

// Optimistic update helpers for SWR
export function getOptimisticData<T>(
  currentData: T[],
  newData: Partial<T>,
  identifyFn: (item: T) => boolean
): T[] {
  if (!currentData) return [] as T[];

  const index = currentData.findIndex(identifyFn);
  if (index === -1) return [...currentData, newData as T];

  return [
    ...currentData.slice(0, index),
    { ...currentData[index], ...newData } as T,
    ...currentData.slice(index + 1),
  ];
}

// Remove an item optimistically
export function getOptimisticRemove<T>(
  currentData: T[],
  identifyFn: (item: T) => boolean
): T[] {
  if (!currentData) return [] as T[];
  return currentData.filter((item) => !identifyFn(item));
}

// Custom fetch with cache busting for critical operations
export async function fetchWithCacheBusting<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  // Add cache busting parameter to URL
  const separator = url.includes('?') ? '&' : '?';
  const bustUrl = `${url}${separator}_=${Date.now()}`;
  
  return fetchWithErrorHandling<T>(bustUrl, options);
}

// Cache invalidation helper
export function invalidateCache(keys: string[]): void {
  // If sessionStorage is available, we'll clear our SWR cache markers
  if (typeof window !== 'undefined') {
    // Clear related cache keys
    keys.forEach(key => {
      // Format the key as SWR would store it
      const cacheKey = `swr:${key}`;
      storage.remove(cacheKey, 'session');
    });
  }
}

// API request that shows toast notifications
export async function apiRequest<T>(
  requestFn: () => Promise<T>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
  } = {}
): Promise<T | null> {
  const {
    successMessage,
    errorMessage = 'Operation failed',
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  try {
    const result = await requestFn();
    
    if (showSuccessToast && successMessage) {
      toast.success(successMessage);
    }
    
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    
    if (showErrorToast) {
      toast.error(errorMessage, {
        description: message,
      });
    }
    
    console.error(`API Error (${errorMessage}):`, error);
    return null;
  }
} 