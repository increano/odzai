import useSWR, { SWRConfiguration, mutate } from 'swr';
import { useCallback } from 'react';
import { fetcher, post, patch, del, getOptimisticData, getOptimisticRemove, apiRequest } from '../lib/api';

/**
 * Generic data fetching hook with SWR
 */
export function useData<T>(key: string | null, config: SWRConfiguration = {}) {
  // Use null key pattern to conditionally fetch
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    key,
    key ? (url: string) => fetcher<T>(url) : null,
    {
      revalidateOnFocus: false, // Prevents data refresh when user returns to tab
      ...config,
    }
  );

  const refresh = useCallback(() => {
    return mutate();
  }, [mutate]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh,
    mutate,
  };
}

/**
 * Hook for fetching a collection of items with CRUD operations
 */
export function useCollection<T extends { id: string }>(
  endpoint: string,
  config: SWRConfiguration = {}
) {
  const { data, error, isLoading, isValidating, refresh, mutate } = useData<T[]>(
    endpoint,
    config
  );

  // Create a new item with optimistic update
  const create = useCallback(
    async (newItem: Partial<T>) => {
      try {
        // Prepare optimistic data
        const optimisticData = data ? [...data, newItem as T] : [newItem as T];
        
        // Perform optimistic update
        mutate(optimisticData, false);
        
        // Make API request
        const result = await apiRequest<T>(
          () => post<T>(endpoint, newItem),
          {
            successMessage: 'Item created successfully',
            errorMessage: 'Failed to create item',
          }
        );
        
        // Trigger revalidation
        refresh();
        
        return result;
      } catch (error) {
        // Revalidate on error to restore correct data
        refresh();
        throw error;
      }
    },
    [data, endpoint, mutate, refresh]
  );

  // Update an existing item with optimistic update
  const update = useCallback(
    async (id: string, updates: Partial<T>) => {
      if (!data) return null;
      
      try {
        // Create optimistic data
        const optimisticData = getOptimisticData<T>(
          data,
          { ...updates, id } as T,
          (item) => item.id === id
        );
        
        // Perform optimistic update
        mutate(optimisticData, false);
        
        // Make API request
        const result = await apiRequest<T>(
          () => patch<T>(`${endpoint}/${id}`, updates),
          {
            successMessage: 'Item updated successfully',
            errorMessage: 'Failed to update item',
          }
        );
        
        // Trigger revalidation
        refresh();
        
        return result;
      } catch (error) {
        // Revalidate on error to restore correct data
        refresh();
        throw error;
      }
    },
    [data, endpoint, mutate, refresh]
  );

  // Delete an item with optimistic update
  const remove = useCallback(
    async (id: string) => {
      if (!data) return false;
      
      try {
        // Create optimistic data
        const optimisticData = getOptimisticRemove<T>(
          data,
          (item) => item.id === id
        );
        
        // Perform optimistic update
        mutate(optimisticData, false);
        
        // Make API request
        await apiRequest(
          () => del(`${endpoint}/${id}`),
          {
            successMessage: 'Item deleted successfully',
            errorMessage: 'Failed to delete item',
          }
        );
        
        // Trigger revalidation
        refresh();
        
        return true;
      } catch (error) {
        // Revalidate on error to restore correct data
        refresh();
        throw error;
      }
    },
    [data, endpoint, mutate, refresh]
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh,
    mutate,
    create,
    update,
    remove,
  };
}

/**
 * Hook for fetching a single item with update operations
 */
export function useItem<T extends { id: string }>(
  id: string | null,
  endpoint: string,
  config: SWRConfiguration = {}
) {
  // Only fetch if id is provided
  const key = id ? `${endpoint}/${id}` : null;
  const { data, error, isLoading, isValidating, refresh, mutate } = useData<T>(
    key,
    config
  );

  // Update the item with optimistic update
  const update = useCallback(
    async (updates: Partial<T>) => {
      if (!data || !id) return null;
      
      try {
        // Prepare optimistic data
        const optimisticData = { ...data, ...updates };
        
        // Perform optimistic update
        mutate(optimisticData, false);
        
        // Make API request
        const result = await apiRequest<T>(
          () => patch<T>(`${endpoint}/${id}`, updates),
          {
            successMessage: 'Item updated successfully',
            errorMessage: 'Failed to update item',
          }
        );
        
        // Trigger revalidation
        refresh();
        
        return result;
      } catch (error) {
        // Revalidate on error to restore correct data
        refresh();
        throw error;
      }
    },
    [data, id, endpoint, mutate, refresh]
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh,
    update,
  };
}

/**
 * Global mutation utilities for cross-component updates
 */
export const globalMutate = {
  /**
   * Invalidate multiple data keys
   */
  invalidate: (keys: string[]) => {
    keys.forEach((key) => mutate(key));
  },
  
  /**
   * Update a collection with new item(s)
   */
  updateCollection: <T extends { id: string }>(
    key: string,
    updaterFn: (currentData: T[] | undefined) => T[]
  ) => {
    mutate(key, async (currentData: T[] | undefined) => {
      return updaterFn(currentData);
    });
  },
  
  /**
   * Update a single item in a collection
   */
  updateItemInCollection: <T extends { id: string }>(
    collectionKey: string,
    itemId: string,
    updates: Partial<T>
  ) => {
    mutate(collectionKey, async (currentData: T[] | undefined) => {
      if (!currentData) return undefined;
      
      return currentData.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );
    });
  },
}; 