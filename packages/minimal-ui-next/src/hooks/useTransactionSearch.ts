import { useState, useEffect, useRef, useCallback } from 'react'
import { useWorkspace } from '@/components/WorkspaceProvider'
import { toast } from 'sonner'

interface Transaction {
  id: string
  date: string
  account: string
  accountId: string
  amount: number
  payee: string
  payee_name?: string
  notes?: string
  category?: string
  category_name?: string
  origin?: 'bank' | 'manual'
}

interface UseTransactionSearchOptions {
  accountId?: string
  debounceMs?: number
  initialSearchTerm?: string
}

interface UseTransactionSearchResult {
  searchTerm: string
  setSearchTerm: (term: string) => void
  isSearching: boolean
  results: Transaction[]
  clearSearch: () => void
}

/**
 * Hook for searching transactions with debounce to prevent UI freezes
 */
export function useTransactionSearch({
  accountId,
  debounceMs = 300,
  initialSearchTerm = ''
}: UseTransactionSearchOptions = {}): UseTransactionSearchResult {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm)
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Transaction[]>([])
  const { currentWorkspace } = useWorkspace()
  
  // AbortController ref to cancel in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Debounce search term changes
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, debounceMs)
    
    // Clean up the timer on unmount or when searchTerm changes
    return () => {
      clearTimeout(timerId)
    }
  }, [searchTerm, debounceMs])
  
  // Perform the search when debounced search term changes
  useEffect(() => {
    // Skip empty searches
    if (!debouncedSearchTerm.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }
    
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create a new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    const fetchResults = async () => {
      setIsSearching(true)
      
      try {
        // Add the workspace ID to the query if available
        const workspaceId = currentWorkspace?.id || ''
        const workspaceParam = workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : ''
        
        // Create base endpoint depending on whether we're searching within an account or globally
        const baseEndpoint = accountId 
          ? `/api/transactions/${accountId}?`
          : '/api/transactions/all?'
        
        // Construct the full endpoint with search parameters
        const endpoint = `${baseEndpoint}search=${encodeURIComponent(debouncedSearchTerm)}${workspaceParam}`
        
        const response = await fetch(endpoint, {
          signal: controller.signal
        })
        
        if (!response.ok) {
          throw new Error('Failed to search transactions')
        }
        
        const data = await response.json()
        
        // Schedule UI update after a small delay to ensure UI responsiveness
        // This follows the UI freeze prevention guidelines by separating UI updates from data operations
        setTimeout(() => {
          setResults(data)
          setIsSearching(false)
        }, 0)
      } catch (error) {
        // Only handle non-abort errors
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error searching transactions:', error)
          toast.error('Failed to search transactions')
          setIsSearching(false)
        }
      }
    }
    
    fetchResults()
    
    // Clean up the abort controller on unmount or when debouncedSearchTerm changes
    return () => {
      controller.abort()
    }
  }, [debouncedSearchTerm, accountId, currentWorkspace])
  
  // Clear search handler
  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setResults([])
  }, [])
  
  return {
    searchTerm,
    setSearchTerm,
    isSearching,
    results,
    clearSearch
  }
} 