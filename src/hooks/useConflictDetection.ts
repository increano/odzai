import { useState, useCallback, useEffect } from 'react'
import { debounce } from '../lib/utils'

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
  imported_id?: string
  hasConflict?: boolean
}

interface ConflictPair {
  manual: Transaction
  imported: Transaction
  similarity: number
  conflictType: 'date_amount_payee' | 'amount_payee' | 'date_amount' | 'potential'
}

interface ConflictDetectionOptions {
  threshold?: number // Amount threshold (in cents) for considering transactions similar
  dateDifferenceThreshold?: number // Date difference threshold (in days) for considering dates close
  onConflictFound?: (conflicts: ConflictPair[]) => void
  autoResolve?: boolean
}

/**
 * Hook for detecting and managing conflicts between manually entered and bank-imported transactions
 */
export function useConflictDetection(
  transactions: Transaction[],
  options: ConflictDetectionOptions = {}
) {
  const [conflicts, setConflicts] = useState<ConflictPair[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Default options
  const {
    threshold = 100, // Default 1 dollar (100 cents) threshold
    dateDifferenceThreshold = 3, // Default 3 days threshold
    onConflictFound,
    autoResolve = false
  } = options

  /**
   * Calculates similarity between two strings using Levenshtein distance
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score between 0 and 1
   */
  const calculateStringSimilarity = (str1: string, str2: string): number => {
    if (!str1 && !str2) return 1
    if (!str1 || !str2) return 0
    
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()
    
    // Use Levenshtein distance
    const track = Array(s2.length + 1).fill(null).map(() => 
      Array(s1.length + 1).fill(null))
    
    for (let i = 0; i <= s1.length; i += 1) {
      track[0][i] = i
    }
    
    for (let j = 0; j <= s2.length; j += 1) {
      track[j][0] = j
    }
    
    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        )
      }
    }
    
    const maxLength = Math.max(s1.length, s2.length)
    if (maxLength === 0) return 1
    
    // Convert distance to similarity (0 to 1)
    return 1 - (track[s2.length][s1.length] / maxLength)
  }
  
  /**
   * Calculates similarity between two dates
   * @param date1 First date string
   * @param date2 Second date string
   * @returns 1 if dates are equal, 0 if they differ by more than 3 days, fraction otherwise
   */
  const calculateDateSimilarity = (date1: string, date2: string): number => {
    if (!date1 || !date2) return 0
    
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    
    // Check if dates are valid
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0
    
    // Calculate difference in days
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Return similarity score based on day difference
    if (diffDays === 0) return 1
    if (diffDays <= 3) return 1 - (diffDays / 10) // Partial similarity for close dates
    return 0 // Different dates
  }
  
  /**
   * Calculates similarity between two transactions (0-100)
   * @param tx1 First transaction
   * @param tx2 Second transaction
   * @returns Similarity score between 0 and 100
   */
  const calculateSimilarity = (tx1: Transaction, tx2: Transaction): number => {
    let score = 0
    
    // Amount similarity (up to 40 points)
    const amountDiff = Math.abs(tx1.amount - tx2.amount)
    if (amountDiff === 0) {
      score += 40
    } else if (amountDiff <= threshold) {
      score += Math.max(0, 40 - (amountDiff / threshold) * 40)
    }
    
    // Date proximity (up to 30 points)
    const dateDiff = calculateDateSimilarity(tx1.date, tx2.date)
    if (dateDiff === 1) {
      score += 30
    } else if (dateDiff <= dateDifferenceThreshold) {
      score += Math.max(0, 30 - (dateDiff / dateDifferenceThreshold) * 30)
    }
    
    // Payee similarity (up to 30 points)
    // This is a simple check; in a real app, you might use string similarity algorithms
    if (tx1.payee.toLowerCase() === tx2.payee.toLowerCase()) {
      score += 30
    } else if (tx1.payee.toLowerCase().includes(tx2.payee.toLowerCase()) || 
               tx2.payee.toLowerCase().includes(tx1.payee.toLowerCase())) {
      score += 15
    }
    
    return score
  }
  
  /**
   * Detect conflicts between manually entered and bank-imported transactions
   * @param transactions Array of all transactions
   * @param similarityThreshold Minimum similarity score to consider as conflict (0-1)
   * @returns Array of transactions with hasConflict flag set
   */
  const detectConflicts = useCallback(
    debounce(async (txs: Transaction[]) => {
      setIsAnalyzing(true)
      setError(null)
      
      try {
        // Wrap in setTimeout to avoid blocking UI thread during processing
        setTimeout(() => {
          const manualTransactions = txs.filter(tx => tx.origin === 'manual')
          const bankTransactions = txs.filter(tx => tx.origin === 'bank')
          const newConflicts: ConflictPair[] = []
          
          // Break up processing into chunks to prevent UI freezes
          // using requestAnimationFrame for better performance
          const processChunk = (
            startIdx: number, 
            chunkSize: number
          ) => {
            requestAnimationFrame(() => {
              const endIdx = Math.min(startIdx + chunkSize, manualTransactions.length)
              
              for (let i = startIdx; i < endIdx; i++) {
                const manualTx = manualTransactions[i]
                
                for (const bankTx of bankTransactions) {
                  // Skip if not same account
                  if (manualTx.accountId !== bankTx.accountId) continue
                  
                  const similarityScore = calculateSimilarity(manualTx, bankTx)
                  
                  // If similarity is high enough, add to conflicts
                  if (similarityScore >= 70) { // Threshold for considering a conflict
                    newConflicts.push({
                      manual,
                      imported: bankTx,
                      similarity: similarityScore / 100,
                      conflictType: 'potential'
                    })
                  }
                }
              }
              
              // Continue with next chunk or finalize
              if (endIdx < manualTransactions.length) {
                processChunk(endIdx, chunkSize)
              } else {
                // Deduplicate conflicts (same transactions might be flagged multiple times)
                const uniqueConflicts = Array.from(
                  new Map(newConflicts.map(c => [c.manual.id, c])).values()
                )
                
                setConflicts(uniqueConflicts)
                setIsAnalyzing(false)
                
                // Notify if conflicts found
                if (uniqueConflicts.length > 0 && onConflictFound) {
                  onConflictFound(uniqueConflicts)
                }
                
                // Auto-resolve if configured
                if (autoResolve && uniqueConflicts.length > 0) {
                  // Implement auto-resolution logic here
                  // This would typically be based on confidence scores
                }
              }
            })
          }
          
          // Start processing in chunks of 20 transactions
          processChunk(0, 20)
        }, 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error in conflict detection')
        setIsAnalyzing(false)
      }
    }, 300), // Debounce delay of 300ms to match UI animations
    []
  )

  // Automatically detect conflicts when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      detectConflicts(transactions)
    }
    
    return () => {
      // Clean up any pending operations
      detectConflicts.cancel()
    }
  }, [transactions, detectConflicts])

  /**
   * Get all conflicts involving a specific transaction
   * @param transactionId Transaction ID to find conflicts for
   * @returns Array of conflict pairs
   */
  const getConflictsForTransaction = useCallback((
    transactionId: string
  ): ConflictPair[] => {
    return conflicts.filter(
      conflict => conflict.manual.id === transactionId || conflict.imported.id === transactionId
    )
  }, [conflicts])

  // Resolve a specific conflict
  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'keep-both' | 'keep-manual' | 'keep-bank'
  ) => {
    try {
      setConflicts(prev => 
        prev.map(conflict => 
          conflict.manual.id === conflictId 
            ? { 
                ...conflict, 
                conflictType: 'potential',
                similarity: 0,
                resolutionStatus: 'resolved',
                resolution
              } 
            : conflict
        )
      )
      
      // In a real app, you'd also call an API to persist the resolution
      const apiEndpoint = '/api/transactions-conflict/resolve'
      
      // Use optimistic UI update pattern from UI freeze guidelines
      // We've already updated the UI state, now perform the API call
      return await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictId,
          resolution
        })
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to resolve conflict')
        }
        return response.json()
      })
    } catch (err) {
      // Revert the optimistic update
      setConflicts(prev => 
        prev.map(conflict => 
          conflict.manual.id === conflictId 
            ? { ...conflict, resolutionStatus: 'unresolved', resolution: undefined } 
            : conflict
        )
      )
      setError(err instanceof Error ? err.message : 'Failed to resolve conflict')
      throw err
    }
  }, [])

  // Resolve all conflicts with the same resolution
  const resolveAllConflicts = useCallback(async (
    resolution: 'keep-both' | 'keep-manual' | 'keep-bank'
  ) => {
    const unresolvedConflicts = conflicts.filter(
      c => c.resolutionStatus === 'unresolved'
    )
    
    if (unresolvedConflicts.length === 0) return
    
    // Optimistic update
    setConflicts(prev => 
      prev.map(conflict => 
        conflict.resolutionStatus === 'unresolved'
          ? { ...conflict, resolutionStatus: 'resolved', resolution }
          : conflict
      )
    )
    
    try {
      // In a real app, you'd batch these operations for better performance
      // Following the UI freeze prevention batch operations pattern
      const apiEndpoint = '/api/transactions-conflict/resolve-batch'
      
      return await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictIds: unresolvedConflicts.map(c => c.manual.id),
          resolution
        })
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to resolve conflicts')
        }
        return response.json()
      })
    } catch (err) {
      // Revert the optimistic update
      setConflicts(prev => 
        prev.map(conflict => 
          conflict.resolutionStatus === 'resolved' && !conflict.resolution
            ? { ...conflict, resolutionStatus: 'unresolved', resolution: undefined } 
            : conflict
        )
      )
      setError(err instanceof Error ? err.message : 'Failed to resolve conflicts')
      throw err
    }
  }, [conflicts])

  return {
    conflicts,
    isAnalyzing,
    error,
    resolveConflict,
    resolveAllConflicts,
    // Reset conflicts and state
    resetConflicts: () => {
      setConflicts([])
      setError(null)
    },
    getConflictsForTransaction
  }
} 