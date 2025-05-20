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
  imported_id?: string
  hasConflict?: boolean
}

interface ConflictPair {
  manual: Transaction
  imported: Transaction
  similarity: number
  conflictType: 'date_amount_payee' | 'amount_payee' | 'date_amount' | 'potential'
}

/**
 * Hook for detecting and managing conflicts between manually entered and bank-imported transactions
 */
export function useConflictDetection() {
  const [conflicts, setConflicts] = useState<ConflictPair[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
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
   * Detect conflicts between manually entered and bank-imported transactions
   * @param transactions Array of all transactions
   * @param similarityThreshold Minimum similarity score to consider as conflict (0-1)
   * @returns Array of transactions with hasConflict flag set
   */
  const detectConflicts = useCallback((
    transactions: Transaction[],
    similarityThreshold = 0.8
  ): Transaction[] => {
    setIsAnalyzing(true)
    
    try {
      // Separate transactions by origin
      const manualTransactions = transactions.filter(t => t.origin === 'manual' || !t.origin)
      const importedTransactions = transactions.filter(t => t.origin === 'bank')
      
      // Reset conflict status
      const resetTransactions = transactions.map(t => ({
        ...t,
        hasConflict: false
      }))
      
      // No conflicts if no imported transactions
      if (importedTransactions.length === 0) {
        setConflicts([])
        return resetTransactions
      }
      
      const detectedConflicts: ConflictPair[] = []
      
      // Check each manual transaction against imported ones
      for (const manual of manualTransactions) {
        // Skip transactions that already have an imported_id (they were linked)
        if (manual.imported_id) continue
        
        for (const imported of importedTransactions) {
          // Skip transactions with different account IDs
          if (manual.accountId !== imported.accountId) continue
          
          // Calculate similarity scores
          const amountSimilarity = manual.amount === imported.amount ? 1 : 0
          const dateSimilarity = calculateDateSimilarity(manual.date, imported.date)
          const payeeSimilarity = calculateStringSimilarity(
            manual.payee_name || '', 
            imported.payee_name || ''
          )
          
          // Calculate overall similarity
          let similarity = 0
          let conflictType: ConflictPair['conflictType'] = 'potential'
          
          // Exact match on date, amount and similar payee
          if (dateSimilarity === 1 && amountSimilarity === 1 && payeeSimilarity > 0.7) {
            similarity = 0.9 + (payeeSimilarity * 0.1)
            conflictType = 'date_amount_payee'
          }
          // Same amount and similar payee
          else if (amountSimilarity === 1 && payeeSimilarity > 0.7) {
            similarity = 0.7 + (dateSimilarity * 0.2) + (payeeSimilarity * 0.1)
            conflictType = 'amount_payee'
          }
          // Same date and amount
          else if (dateSimilarity === 1 && amountSimilarity === 1) {
            similarity = 0.8 + (payeeSimilarity * 0.2)
            conflictType = 'date_amount'
          }
          // Other potential conflicts with high amount similarity
          else if (amountSimilarity === 1 && (dateSimilarity > 0.5 || payeeSimilarity > 0.5)) {
            similarity = 0.6 + (dateSimilarity * 0.2) + (payeeSimilarity * 0.2)
            conflictType = 'potential'
          }
          
          // If similarity exceeds threshold, mark as conflict
          if (similarity >= similarityThreshold) {
            detectedConflicts.push({
              manual,
              imported,
              similarity,
              conflictType
            })
          }
        }
      }
      
      // Sort conflicts by similarity (highest first)
      detectedConflicts.sort((a, b) => b.similarity - a.similarity)
      
      // Store conflicts
      setConflicts(detectedConflicts)
      
      // Mark transactions that have conflicts
      const conflictTransactionIds = new Set([
        ...detectedConflicts.map(c => c.manual.id),
        ...detectedConflicts.map(c => c.imported.id)
      ])
      
      return resetTransactions.map(transaction => ({
        ...transaction,
        hasConflict: conflictTransactionIds.has(transaction.id)
      }))
    } finally {
      setIsAnalyzing(false)
    }
  }, [])
  
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
  
  return {
    conflicts,
    isAnalyzing,
    detectConflicts,
    getConflictsForTransaction
  }
} 