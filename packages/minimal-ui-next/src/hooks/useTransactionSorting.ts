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

// Define possible sort fields
export type SortField = 'date' | 'amount' | 'payee' | 'category' | 'account'

// Define sort direction
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  direction: SortDirection
}

interface UseTransactionSortingOptions {
  initialConfig?: SortConfig
  defaultConfig?: SortConfig
}

interface UseTransactionSortingResult {
  sortConfig: SortConfig
  setSortField: (field: SortField) => void
  setSortDirection: (direction: SortDirection) => void
  toggleSortDirection: () => void
  resetSort: () => void
  sortTransactions: (transactions: Transaction[]) => Transaction[]
}

/**
 * Hook for sorting transactions
 */
export function useTransactionSorting({
  initialConfig,
  defaultConfig = { field: 'date', direction: 'desc' }
}: UseTransactionSortingOptions = {}): UseTransactionSortingResult {
  // Use provided initial config or fall back to default
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    initialConfig || defaultConfig
  )
  
  // Set sort field (toggles direction if same field)
  const setSortField = useCallback((field: SortField) => {
    setSortConfig(prevConfig => {
      // If selecting the same field, toggle direction
      if (prevConfig.field === field) {
        return {
          field,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      
      // Otherwise use the new field with default direction (desc for date and amount, asc for others)
      return {
        field,
        direction: field === 'date' || field === 'amount' ? 'desc' : 'asc'
      }
    })
  }, [])
  
  // Set sort direction explicitly
  const setSortDirection = useCallback((direction: SortDirection) => {
    setSortConfig(prevConfig => ({
      ...prevConfig,
      direction
    }))
  }, [])
  
  // Toggle sort direction
  const toggleSortDirection = useCallback(() => {
    setSortConfig(prevConfig => ({
      ...prevConfig,
      direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])
  
  // Reset sort to default
  const resetSort = useCallback(() => {
    setSortConfig(defaultConfig)
  }, [defaultConfig])
  
  // Sort transactions based on current config
  const sortTransactions = useCallback((transactions: Transaction[]) => {
    // Create a new array to avoid mutating the original
    const sortedTransactions = [...transactions]
    
    // Use a proper comparison function based on field and direction
    sortedTransactions.sort((a, b) => {
      let result = 0
      
      // Sort based on field
      switch (sortConfig.field) {
        case 'date':
          result = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
          
        case 'amount':
          result = a.amount - b.amount
          break
          
        case 'payee':
          // Use payee_name if available, otherwise use payee id
          result = (a.payee_name || a.payee).localeCompare(b.payee_name || b.payee)
          break
          
        case 'category':
          // Use category_name if available, otherwise use category id
          // Handle undefined categories
          const aCategory = a.category_name || a.category || ''
          const bCategory = b.category_name || b.category || ''
          result = aCategory.localeCompare(bCategory)
          break
          
        case 'account':
          result = a.account.localeCompare(b.account)
          break
          
        default:
          // Default to date sorting if field is unknown
          result = new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      
      // Apply direction
      return sortConfig.direction === 'asc' ? result : -result
    })
    
    return sortedTransactions
  }, [sortConfig])
  
  return {
    sortConfig,
    setSortField,
    setSortDirection,
    toggleSortDirection,
    resetSort,
    sortTransactions
  }
} 