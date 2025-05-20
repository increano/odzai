import { useState, useCallback, useRef } from 'react'

type BatchUpdater<T> = (prevState: T) => T
type QueuedUpdate<T> = {
  key: string
  updater: BatchUpdater<T>
}

/**
 * Hook for batching multiple state updates to reduce render cycles
 * @template T - The type of the state
 * @param initialState - The initial state value
 * @param debounceMs - Debounce time in milliseconds
 * @returns An object with the state, a function to queue updates, and a function to apply all queued updates
 */
export function useBatchUpdate<T>(initialState: T, debounceMs = 50) {
  const [state, setState] = useState<T>(initialState)
  const [isBatching, setIsBatching] = useState(false)
  const updateQueueRef = useRef<QueuedUpdate<T>[]>([])
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  
  /**
   * Queue an update to be applied in batch
   * @param key - A unique key for this update (updates with the same key replace each other)
   * @param updater - Function that receives the previous state and returns the new state
   */
  const queueUpdate = useCallback((key: string, updater: BatchUpdater<T>) => {
    // Remove any existing update with the same key to prevent duplicates
    updateQueueRef.current = updateQueueRef.current.filter(update => update.key !== key)
    
    // Add the new update to the queue
    updateQueueRef.current.push({ key, updater })
    
    // Set batching flag
    setIsBatching(true)
    
    // Clear existing timeout if any
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    
    // Set a new timeout to apply the batch updates
    timeoutIdRef.current = setTimeout(() => {
      applyQueuedUpdates()
    }, debounceMs)
  }, [debounceMs])
  
  /**
   * Apply all queued updates at once
   */
  const applyQueuedUpdates = useCallback(() => {
    if (updateQueueRef.current.length === 0) {
      setIsBatching(false)
      return
    }
    
    // Apply all queued updates in a single setState call
    setState(prevState => {
      let newState = prevState
      
      // Apply each updater function in sequence
      updateQueueRef.current.forEach(({ updater }) => {
        newState = updater(newState)
      })
      
      return newState
    })
    
    // Clear the queue
    updateQueueRef.current = []
    
    // Reset batching flag
    setIsBatching(false)
  }, [])
  
  /**
   * Force immediate application of all queued updates
   * Useful for applying updates before unmounting
   */
  const flushUpdates = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
    
    applyQueuedUpdates()
  }, [applyQueuedUpdates])
  
  /**
   * Set state directly without batching
   * Use this for immediate updates that can't wait for batching
   */
  const setStateImmediate = useCallback((updater: BatchUpdater<T>) => {
    setState(updater)
  }, [])
  
  // Clean up the timeout on unmount
  const cleanup = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
  }, [])
  
  return {
    state,
    queueUpdate,
    flushUpdates,
    setStateImmediate,
    isBatching,
    cleanup,
    queueLength: updateQueueRef.current.length
  }
} 