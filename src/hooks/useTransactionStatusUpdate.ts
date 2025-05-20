import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useOptimisticUpdate } from './useOptimisticUpdate'

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
  cleared?: boolean
}

interface StatusUpdate {
  id: string
  cleared: boolean
}

/**
 * Hook for handling transaction status updates with UI freeze prevention
 * Uses optimistic UI updates and properly timed API calls
 */
export function useTransactionStatusUpdate() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updatingTransactionId, setUpdatingTransactionId] = useState<string | null>(null)
  const { updateItemOptimistically } = useOptimisticUpdate<Transaction, StatusUpdate>()
  
  /**
   * Update a transaction's cleared status with optimistic UI update
   * @param transactions - Current transactions array
   * @param id - Transaction ID to update
   * @param cleared - New cleared status
   * @returns Promise with updated transactions and success status
   */
  const updateTransactionStatus = useCallback(async (
    transactions: Transaction[],
    id: string,
    cleared: boolean
  ): Promise<{ data: Transaction[], success: boolean }> => {
    setIsUpdating(true)
    setUpdatingTransactionId(id)
    
    try {
      // Define how to update an item optimistically
      const updateFn = (transaction: Transaction): Transaction => ({
        ...transaction,
        cleared
      })
      
      // Define the API call to make
      const apiCall = async (id: string, updatedTransaction: Transaction) => {
        // Use setTimeout to ensure the UI updates before making the API call
        // This follows the UI freeze prevention guidelines
        await new Promise(resolve => setTimeout(resolve, 10))
        
        const response = await fetch(`/api/transactions/${id}/cleared`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cleared: updatedTransaction.cleared })
        })
        
        if (!response.ok) {
          throw new Error('Failed to update transaction status')
        }
        
        return response.json()
      }
      
      // Use the optimistic update helper
      const result = await updateItemOptimistically(
        transactions,
        id,
        updateFn,
        apiCall,
        'id',
        cleared ? 'Transaction marked as cleared' : 'Transaction marked as uncleared',
        'Failed to update transaction status'
      )
      
      return result
    } finally {
      // Clear the updating state after a small delay to ensure animations complete
      setTimeout(() => {
        setIsUpdating(false)
        setUpdatingTransactionId(null)
      }, 300)
    }
  }, [updateItemOptimistically])
  
  /**
   * Batch update multiple transactions' cleared status
   * @param transactions - Current transactions array
   * @param ids - Array of transaction IDs to update
   * @param cleared - New cleared status for all transactions
   */
  const batchUpdateTransactionStatus = useCallback(async (
    transactions: Transaction[],
    ids: string[],
    cleared: boolean
  ): Promise<{ data: Transaction[], success: boolean }> => {
    setIsUpdating(true)
    
    try {
      // Start batch operation to reduce server-side processing
      const batchStartResponse = await fetch('/api/batch-budget-start', {
        method: 'POST'
      })
      
      if (!batchStartResponse.ok) {
        throw new Error('Failed to start batch operation')
      }
      
      // Make a copy of the original transactions for optimistic updates
      let updatedTransactions = [...transactions]
      
      // Update each transaction optimistically in the UI first
      updatedTransactions = updatedTransactions.map(transaction => {
        if (ids.includes(transaction.id)) {
          return { ...transaction, cleared }
        }
        return transaction
      })
      
      // Make the actual API calls sequentially
      try {
        for (const id of ids) {
          // Use a small delay to prevent UI freezing
          await new Promise(resolve => setTimeout(resolve, 5))
          
          const response = await fetch(`/api/transactions/${id}/cleared`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cleared })
          })
          
          if (!response.ok) {
            throw new Error(`Failed to update transaction ${id}`)
          }
        }
        
        // End batch operation
        const batchEndResponse = await fetch('/api/batch-budget-end', {
          method: 'POST'
        })
        
        if (!batchEndResponse.ok) {
          throw new Error('Failed to end batch operation')
        }
        
        toast.success(
          `${ids.length} transactions ${cleared ? 'marked as cleared' : 'marked as uncleared'}`
        )
        
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
      toast.error('Failed to update transactions')
      console.error('Batch update error:', error)
      
      // Return the original transactions
      return { data: transactions, success: false }
    } finally {
      // Clear the updating state after a small delay
      setTimeout(() => {
        setIsUpdating(false)
      }, 300)
    }
  }, [])
  
  return {
    isUpdating,
    updatingTransactionId,
    updateTransactionStatus,
    batchUpdateTransactionStatus
  }
} 