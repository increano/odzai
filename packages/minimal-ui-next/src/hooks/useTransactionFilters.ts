import { useState, useCallback, useMemo } from 'react'

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
  hasConflict?: boolean
  cleared?: boolean
}

// Define possible filter types
export interface TransactionFilters {
  date?: {
    from?: string
    to?: string
  }
  amount?: {
    min?: number
    max?: number
  }
  categories?: string[]
  payees?: string[]
  origin?: 'bank' | 'manual' | 'all'
  status?: 'all' | 'cleared' | 'uncleared'
  hasConflicts?: boolean
}

interface UseTransactionFiltersOptions {
  initialFilters?: TransactionFilters
}

interface UseTransactionFiltersResult {
  filters: TransactionFilters
  setFilter: <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => void
  setMultipleFilters: (newFilters: Partial<TransactionFilters>) => void
  clearFilters: () => void
  clearFilter: (key: keyof TransactionFilters) => void
  filtersApplied: boolean
  filterTransactions: (transactions: Transaction[]) => Transaction[]
  activeFilterCount: number
}

/**
 * Hook for filtering transactions
 */
export function useTransactionFilters({
  initialFilters = {}
}: UseTransactionFiltersOptions = {}): UseTransactionFiltersResult {
  // Store all filters in a single state object to batch updates
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters)
  
  // Check if any filters are applied
  const filtersApplied = useMemo(() => {
    return Object.keys(filters).length > 0 &&
      Object.values(filters).some(value => {
        if (value === undefined) return false
        if (typeof value === 'object' && !Array.isArray(value)) {
          return Object.values(value).some(v => v !== undefined)
        }
        if (Array.isArray(value)) {
          return value.length > 0
        }
        return true
      })
  }, [filters])
  
  // Count active filters for UI display
  const activeFilterCount = useMemo(() => {
    let count = 0
    
    if (filters.date?.from || filters.date?.to) count++
    if (filters.amount?.min !== undefined || filters.amount?.max !== undefined) count++
    if (filters.categories?.length) count++
    if (filters.payees?.length) count++
    if (filters.origin && filters.origin !== 'all') count++
    if (filters.status && filters.status !== 'all') count++
    if (filters.hasConflicts) count++
    
    return count
  }, [filters])
  
  // Set a single filter (with type safety)
  const setFilter = useCallback(<K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => {
    // Use functional update to ensure we're working with latest state
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value
    }))
  }, [])
  
  // Set multiple filters at once (batching updates)
  const setMultipleFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }))
  }, [])
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])
  
  // Clear a specific filter
  const clearFilter = useCallback((key: keyof TransactionFilters) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters }
      delete newFilters[key]
      return newFilters
    })
  }, [])
  
  // Apply filters to a list of transactions
  const filterTransactions = useCallback((transactions: Transaction[]) => {
    if (!filtersApplied) return transactions
    
    return transactions.filter(transaction => {
      // Date filter
      if (filters.date) {
        const txDate = new Date(transaction.date)
        if (filters.date.from && new Date(filters.date.from) > txDate) return false
        if (filters.date.to && new Date(filters.date.to) < txDate) return false
      }
      
      // Amount filter
      if (filters.amount) {
        const txAmount = transaction.amount
        if (filters.amount.min !== undefined && txAmount < filters.amount.min) return false
        if (filters.amount.max !== undefined && txAmount > filters.amount.max) return false
      }
      
      // Category filter
      if (filters.categories?.length && transaction.category) {
        if (!filters.categories.includes(transaction.category)) return false
      }
      
      // Payee filter
      if (filters.payees?.length && transaction.payee) {
        if (!filters.payees.includes(transaction.payee)) return false
      }
      
      // Origin filter (bank vs manual)
      if (filters.origin && filters.origin !== 'all') {
        if (transaction.origin !== filters.origin) return false
      }
      
      // Status filter
      if (filters.status && filters.status !== 'all') {
        const isCleared = transaction.cleared || false
        if (filters.status === 'cleared' && !isCleared) return false
        if (filters.status === 'uncleared' && isCleared) return false
      }
      
      // Conflict filter
      if (filters.hasConflicts) {
        if (!transaction.hasConflict) return false
      }
      
      return true
    })
  }, [filters, filtersApplied])
  
  return {
    filters,
    setFilter,
    setMultipleFilters,
    clearFilters,
    clearFilter,
    filtersApplied,
    filterTransactions,
    activeFilterCount
  }
} 