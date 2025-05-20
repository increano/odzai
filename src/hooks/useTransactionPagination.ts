import { useState, useCallback } from 'react'

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

interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

interface UseTransactionPaginationOptions {
  initialPage?: number
  initialPageSize?: number
  itemsPerPageOptions?: number[]
}

interface UseTransactionPaginationResult {
  pagination: PaginationState
  paginatedItems: <T>(items: T[]) => T[]
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  itemsPerPageOptions: number[]
  startIndex: number
  endIndex: number
}

/**
 * Hook for handling transaction pagination to prevent UI freezes with large datasets
 */
export function useTransactionPagination({
  initialPage = 1,
  initialPageSize = 20,
  itemsPerPageOptions = [10, 20, 50, 100]
}: UseTransactionPaginationOptions = {}): UseTransactionPaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [totalItems, setTotalItems] = useState(0)
  
  // Calculate the total number of pages
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  
  // Calculate the start and end indices for the current page
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1)
  
  // Go to the next page if possible
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, totalPages])
  
  // Go to the previous page if possible
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])
  
  // Handle page size change with page reset to avoid empty pages
  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page
  }, [])
  
  // Handle page change with validation
  const handleSetCurrentPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }, [totalPages])
  
  // Paginate any array of items
  const paginatedItems = useCallback(<T>(items: T[]): T[] => {
    // Update total items based on the array length
    if (items.length !== totalItems) {
      setTotalItems(items.length)
    }
    
    // If the items array is smaller than the current page's start index,
    // reset to page 1
    if (items.length > 0 && startIndex >= items.length) {
      setCurrentPage(1)
      return items.slice(0, pageSize)
    }
    
    return items.slice(startIndex, startIndex + pageSize)
  }, [startIndex, pageSize, totalItems])
  
  return {
    pagination: {
      currentPage,
      pageSize,
      totalItems,
      totalPages
    },
    paginatedItems,
    setCurrentPage: handleSetCurrentPage,
    setPageSize: handleSetPageSize,
    goToNextPage,
    goToPreviousPage,
    itemsPerPageOptions,
    startIndex,
    endIndex
  }
} 