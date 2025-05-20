import { useState, useCallback } from 'react'
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
}

/**
 * Hook for handling transaction deletion with UI freeze prevention strategies
 */
export function useTransactionDelete() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null)
  
  /**
   * Delete a single transaction with optimistic UI update
   * @param transactions Current transactions array
   * @param id Transaction ID to delete
   * @returns Updated transactions and success status
   */
  const deleteTransaction = useCallback(async (
    transactions: Transaction[],
    id: string
  ): Promise<{ data: Transaction[], success: boolean }> => {
    // Begin deletion state
    setIsDeleting(true)
    setDeletingTransactionId(id)
    
    // Make a copy of the original data for potential rollback
    const originalTransactions = [...transactions]
    
    // Optimistically update the UI by removing the transaction
    const updatedTransactions = transactions.filter(t => t.id !== id)
    
    try {
      // Use a small timeout to ensure UI updates before API call
      // This prevents UI freezes during transitions
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Make the API call to delete the transaction
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete transaction')
      }
      
      // Show success message
      toast.success('Transaction deleted successfully')
      
      return { data: updatedTransactions, success: true }
    } catch (error) {
      // Show error toast
      toast.error('Failed to delete transaction')
      console.error('Delete error:', error)
      
      // Return original data for rollback
      return { data: originalTransactions, success: false }
    } finally {
      // Reset deletion state after a brief delay to ensure transitions complete
      setTimeout(() => {
        setIsDeleting(false)
        setDeletingTransactionId(null)
      }, 300)
    }
  }, [])
  
  /**
   * Batch delete multiple transactions with optimistic UI update and batch API
   * @param transactions Current transactions array
   * @param ids Array of transaction IDs to delete
   * @returns Updated transactions and success status
   */
  const batchDeleteTransactions = useCallback(async (
    transactions: Transaction[],
    ids: string[]
  ): Promise<{ data: Transaction[], success: boolean }> => {
    if (ids.length === 0) {
      return { data: transactions, success: true }
    }
    
    // Begin deletion state
    setIsDeleting(true)
    
    // Make a copy of the original data for potential rollback
    const originalTransactions = [...transactions]
    
    // Optimistically update the UI by removing all transactions
    const updatedTransactions = transactions.filter(t => !ids.includes(t.id))
    
    try {
      // Start batch operation to reduce server-side processing
      const batchStartResponse = await fetch('/api/batch-budget-start', {
        method: 'POST'
      })
      
      if (!batchStartResponse.ok) {
        throw new Error('Failed to start batch operation')
      }
      
      try {
        // Use batch delete endpoint if available
        const batchResponse = await fetch('/api/transactions/batch-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ids })
        })
        
        if (!batchResponse.ok) {
          throw new Error('Failed to delete transactions')
        }
        
        // End batch operation
        const batchEndResponse = await fetch('/api/batch-budget-end', {
          method: 'POST'
        })
        
        if (!batchEndResponse.ok) {
          throw new Error('Failed to end batch operation')
        }
        
        // Show success message
        toast.success(`${ids.length} transactions deleted`)
        
        return { data: updatedTransactions, success: true }
      } catch (error) {
        // Attempt to end the batch even if there was an error
        try {
          await fetch('/api/batch-budget-end', { method: 'POST' })
        } catch (endError) {
          console.error('Failed to end batch after error:', endError)
        }
        
        throw error
      }
    } catch (error) {
      // Show error toast
      toast.error('Failed to delete transactions')
      console.error('Batch delete error:', error)
      
      // Return original data for rollback
      return { data: originalTransactions, success: false }
    } finally {
      // Reset deletion state after a brief delay to ensure transitions complete
      setTimeout(() => {
        setIsDeleting(false)
      }, 300)
    }
  }, [])
  
  return {
    isDeleting,
    deletingTransactionId,
    deleteTransaction,
    batchDeleteTransactions
  }
} 