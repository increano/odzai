import { useState } from 'react'
import { toast } from 'sonner'

interface SplitItem {
  amount: number
  category: string | null
  notes: string
}

/**
 * Hook for splitting transactions into multiple parts
 */
export function useTransactionSplit() {
  const [isSplitting, setIsSplitting] = useState(false)
  
  /**
   * Split a transaction into multiple parts
   * @param transactionId ID of the transaction to split
   * @param splits Array of split transactions to create
   * @returns Promise that resolves when splitting is complete
   */
  const splitTransaction = async (transactionId: string, splits: SplitItem[]): Promise<void> => {
    if (!transactionId) {
      throw new Error('Transaction ID is required')
    }
    
    if (!splits || splits.length < 2) {
      throw new Error('At least two splits are required')
    }
    
    setIsSplitting(true)
    
    try {
      const response = await fetch(`/api/transactions/${transactionId}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ splits })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.message || 'Failed to split transaction'
        )
      }
      
      const result = await response.json()
      
      // Show success message
      toast.success(result.message || 'Transaction split successfully')
      
      return result
    } catch (error) {
      // Show error message to the user
      toast.error(error instanceof Error ? error.message : 'Failed to split transaction')
      throw error
    } finally {
      setIsSplitting(false)
    }
  }
  
  return {
    splitTransaction,
    isSplitting
  }
} 