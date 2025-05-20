import { useState, useCallback } from 'react'
import { toast } from 'sonner'

/**
 * A hook for handling optimistic updates to prevent UI freezes
 * Immediately updates the UI and then performs the actual API call
 * 
 * @template T - The type of data being updated
 * @template U - The type of update being applied
 */
export function useOptimisticUpdate<T, U>() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastError, setLastError] = useState<Error | null>(null)
  
  /**
   * Performs an optimistic update
   * @param currentData - The current data array
   * @param updateFn - Function that applies the update to the data
   * @param apiCall - The actual API call to make
   * @param findItemFn - Function to find the item in the array (for reverting)
   * @param successMessage - Optional message to show on success
   * @param errorMessage - Optional message to show on error
   */
  const updateOptimistically = useCallback(async (
    currentData: T[],
    updateFn: (data: T[], update: U) => T[],
    apiCall: (update: U) => Promise<any>,
    findItemFn: (data: T[], update: U) => T | undefined,
    update: U,
    successMessage?: string,
    errorMessage = 'Update failed'
  ): Promise<{ data: T[], success: boolean }> => {
    // Keep a copy of the original data for rollback
    const originalData = [...currentData]
    
    // Apply the update optimistically
    const updatedData = updateFn(currentData, update)
    
    setIsUpdating(true)
    setLastError(null)
    
    try {
      // Make the actual API call
      await apiCall(update)
      
      // If there's a success message, show it
      if (successMessage) {
        toast.success(successMessage)
      }
      
      return { data: updatedData, success: true }
    } catch (error) {
      // Revert the optimistic update on failure
      setLastError(error instanceof Error ? error : new Error(errorMessage))
      
      // Show error message
      toast.error(errorMessage)
      
      // Return the original data for rollback
      return { data: originalData, success: false }
    } finally {
      // Always reset the updating state with a small delay to ensure transitions complete
      setTimeout(() => {
        setIsUpdating(false)
      }, 300)
    }
  }, [])
  
  /**
   * Performs an optimistic update on a single item
   * @param currentData - The current data array
   * @param itemId - The ID of the item to update
   * @param updateFn - Function that returns updated item
   * @param apiCall - The actual API call to make
   * @param idField - The field name used for item ID (default: 'id')
   * @param successMessage - Optional message to show on success
   * @param errorMessage - Optional message to show on error
   */
  const updateItemOptimistically = useCallback(async <V extends { [key: string]: any }>(
    currentData: V[],
    itemId: string,
    updateFn: (item: V) => V,
    apiCall: (id: string, updatedItem: V) => Promise<any>,
    idField = 'id',
    successMessage?: string,
    errorMessage = 'Update failed'
  ): Promise<{ data: V[], success: boolean }> => {
    // Find the item to update
    const itemIndex = currentData.findIndex(item => item[idField] === itemId)
    
    if (itemIndex === -1) {
      toast.error(`Item with ID ${itemId} not found`)
      return { data: currentData, success: false }
    }
    
    // Keep a copy of the original data for rollback
    const originalData = [...currentData]
    const item = currentData[itemIndex]
    
    // Create updated item
    const updatedItem = updateFn(item)
    
    // Apply the update optimistically
    const updatedData = [
      ...currentData.slice(0, itemIndex),
      updatedItem,
      ...currentData.slice(itemIndex + 1)
    ]
    
    setIsUpdating(true)
    setLastError(null)
    
    try {
      // Make the actual API call
      await apiCall(itemId, updatedItem)
      
      // If there's a success message, show it
      if (successMessage) {
        toast.success(successMessage)
      }
      
      return { data: updatedData, success: true }
    } catch (error) {
      // Revert the optimistic update on failure
      setLastError(error instanceof Error ? error : new Error(errorMessage))
      
      // Show error message
      toast.error(errorMessage)
      
      // Return the original data for rollback
      return { data: originalData, success: false }
    } finally {
      // Always reset the updating state with a small delay to ensure transitions complete
      setTimeout(() => {
        setIsUpdating(false)
      }, 300)
    }
  }, [])
  
  return {
    isUpdating,
    lastError,
    updateOptimistically,
    updateItemOptimistically
  }
} 