import { toast } from 'sonner';
import { storage } from './storage';
import { getErrorMessage } from './errorHandling';
import { useEffect } from 'react';

// Cache for request deduplication
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Cache storage for requests
const requestCache = new Map<string, CacheEntry<unknown>>();

// Track in-progress requests to avoid duplicates
const requestsInProgress: Record<string, Promise<unknown>> = {};

// Check if a cache entry is expired
function isExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_EXPIRATION;
}

// Clear expired cache entries periodically
setInterval(() => {
  for (const [key, entry] of requestCache.entries()) {
    if (isExpired(entry.timestamp)) {
      requestCache.delete(key);
    }
  }
}, 60000); // Clean up once per minute

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

// Base fetcher function with caching and deduplication
export async function fetcher<T>(
  url: string, 
  options: RequestInit = {}, 
  signal?: AbortSignal
): Promise<T> {
  const cacheKey = `fetch:${url}`;
  const cachedData = requestCache.get(cacheKey);
  
  // Return cached data if available and not expired
  if (cachedData && !isExpired(cachedData.timestamp)) {
    return cachedData.data as T;
  }

  // Create an in-progress promise or use existing one
  if (!requestsInProgress[cacheKey]) {
    requestsInProgress[cacheKey] = enhancedFetch<T>(url, options, signal)
      .then(data => {
        // Cache successful responses
        requestCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        delete requestsInProgress[cacheKey];
        return data;
      })
      .catch(error => {
        delete requestsInProgress[cacheKey];
        throw error;
      });
  }
  
  return requestsInProgress[cacheKey];
}

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

/**
 * Enhanced fetch with AbortController support and timeout handling
 * @param url URL to fetch
 * @param options Fetch options
 * @param abortSignal Optional AbortSignal to cancel the request
 * @param timeoutMs Timeout in milliseconds (default: 30000ms)
 */
export async function enhancedFetch<T>(
  url: string,
  options: RequestInit = {},
  abortSignal?: AbortSignal,
  timeoutMs: number = 30000
): Promise<T> {
  // Create a new AbortController if one wasn't passed
  const controller = new AbortController();
  const { signal } = controller;
  
  // Combine with passed signal if any
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => controller.abort());
  }
  
  // Set up timeout
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request was aborted due to timeout or manual cancellation');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Create a cancellable API request function
 * @returns An object with execute function and abort method
 */
export function createCancellableRequest<T>() {
  const controller = new AbortController();
  
  return {
    execute: async (
      url: string, 
      options: RequestInit = {}, 
      timeoutMs?: number
    ): Promise<T> => {
      return enhancedFetch<T>(url, options, controller.signal, timeoutMs);
    },
    abort: () => controller.abort()
  };
}

// Export a function to create a hook for cancellable requests
export function useCancellableRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<T>
) {
  // Create and return a controller that will be aborted on component unmount
  const controller = new AbortController();
  
  useEffect(() => {
    return () => {
      controller.abort();
    };
  }, []);
  
  return async () => {
    try {
      return await requestFn(controller.signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Request was cancelled due to component unmount');
      }
      throw error;
    }
  };
} 