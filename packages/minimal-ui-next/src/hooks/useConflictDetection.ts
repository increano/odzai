import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  payee: string;
  payee_name?: string;
  category?: string;
  category_name?: string;
  notes?: string;
  cleared?: boolean;
  accountId: string;
  origin?: 'manual' | 'bank';
}

interface ConflictPair {
  manual: Transaction;
  imported: Transaction;
  conflictType: 'date' | 'amount' | 'payee' | 'multiple';
  score: number;
}

interface UseConflictDetectionOptions {
  onConflictFound?: (conflicts: ConflictPair[]) => void;
  chunkSize?: number;
  similarityThreshold?: number;
}

/**
 * A hook for detecting and resolving potential conflicts between manually entered 
 * and bank-imported transactions.
 * Uses chunked processing with requestAnimationFrame to prevent UI freezes.
 */
export function useConflictDetection(
  transactions: Transaction[],
  options: UseConflictDetectionOptions = {}
) {
  const { 
    onConflictFound, 
    chunkSize = 50, 
    similarityThreshold = 0.8 
  } = options;
  
  const [conflicts, setConflicts] = useState<ConflictPair[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  
  // Use refs to avoid stale closures in long-running operations
  const transactionsRef = useRef(transactions);
  const processingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  
  // Update ref when transactions change
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);
  
  // Calculate similarity score between two transactions
  const calculateSimilarity = useCallback((t1: Transaction, t2: Transaction): { score: number; type: 'date' | 'amount' | 'payee' | 'multiple' } => {
    let score = 0;
    const types: Array<'date' | 'amount' | 'payee'> = [];
    
    // Compare date (within 2 days)
    const date1 = new Date(t1.date);
    const date2 = new Date(t2.date);
    const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 2) {
      score += 0.3;
      types.push('date');
    }
    
    // Compare amount (exact match)
    if (Math.abs(t1.amount - t2.amount) < 0.01) {
      score += 0.4;
      types.push('amount');
    }
    
    // Compare payee (case-insensitive substring match)
    const payee1 = (t1.payee_name || t1.payee || '').toLowerCase();
    const payee2 = (t2.payee_name || t2.payee || '').toLowerCase();
    
    if (payee1 === payee2) {
      score += 0.3;
      types.push('payee');
    } else if (payee1.includes(payee2) || payee2.includes(payee1)) {
      score += 0.2;
      types.push('payee');
    }
    
    // Determine conflict type
    const type = types.length > 1 ? 'multiple' : (types[0] || 'multiple');
    
    return { score, type };
  }, []);
  
  // Process transactions in chunks to prevent UI freezes
  const detectConflicts = useCallback(() => {
    if (!transactionsRef.current.length || processingRef.current) return;
    
    const manualTransactions = transactionsRef.current.filter(t => t.origin === 'manual');
    const importedTransactions = transactionsRef.current.filter(t => t.origin === 'bank');
    
    // Only proceed if we have both types of transactions
    if (!manualTransactions.length || !importedTransactions.length) {
      setConflicts([]);
      setProgress(100);
      return;
    }
    
    // Start processing
    setIsAnalyzing(true);
    processingRef.current = true;
    setProgress(0);
    
    const detectedConflicts: ConflictPair[] = [];
    let processed = 0;
    const totalComparisons = manualTransactions.length * importedTransactions.length;
    let currentManualIndex = 0;
    let currentImportedIndex = 0;
    
    // Function to process a chunk of transactions
    const processChunk = () => {
      const startTime = performance.now();
      let chunkProcessed = 0;
      
      // Process until we hit the chunk size or run out of time (20ms max)
      while (chunkProcessed < chunkSize && performance.now() - startTime < 20) {
        // If we've reached the end of our transactions, we're done
        if (currentManualIndex >= manualTransactions.length) {
          break;
        }
        
        // Get current transactions to compare
        const manualTx = manualTransactions[currentManualIndex];
        const importedTx = importedTransactions[currentImportedIndex];
        
        // Calculate similarity
        const { score, type } = calculateSimilarity(manualTx, importedTx);
        
        // If similar enough, add to conflicts
        if (score >= similarityThreshold) {
          detectedConflicts.push({
            manual: manualTx,
            imported: importedTx,
            conflictType: type,
            score
          });
        }
        
        // Move to the next pair
        currentImportedIndex++;
        if (currentImportedIndex >= importedTransactions.length) {
          currentImportedIndex = 0;
          currentManualIndex++;
        }
        
        // Update progress
        processed++;
        chunkProcessed++;
        setProgress(Math.round((processed / totalComparisons) * 100));
      }
      
      // Check if we're done
      if (currentManualIndex >= manualTransactions.length) {
        setConflicts(detectedConflicts);
        setIsAnalyzing(false);
        processingRef.current = false;
        
        // Notify about conflicts if callback provided
        if (onConflictFound && detectedConflicts.length > 0) {
          onConflictFound(detectedConflicts);
        }
        
        return;
      }
      
      // Schedule next chunk
      animationFrameRef.current = requestAnimationFrame(processChunk);
    };
    
    // Start processing chunks
    animationFrameRef.current = requestAnimationFrame(processChunk);
    
  }, [calculateSimilarity, chunkSize, similarityThreshold, onConflictFound]);
  
  // Start detection when transactions change
  useEffect(() => {
    detectConflicts();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detectConflicts, transactions]);
  
  /**
   * Resolve a specific conflict
   * @param conflictId ID of the manual transaction involved in the conflict
   * @param resolution How to resolve: keep both, keep manual entry, or keep bank import
   */
  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'keep-both' | 'keep-manual' | 'keep-bank'
  ) => {
    try {
      setIsResolving(true);
      
      // Find the conflict
      const conflict = conflicts.find(c => c.manual.id === conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }
      
      // Send resolution to API
      const response = await fetch('/api/transactions-conflict/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualTransactionId: conflict.manual.id,
          importedTransactionId: conflict.imported.id,
          resolution
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to resolve conflict');
      }
      
      // Update local state optimistically
      setConflicts(prev => 
        prev.filter(c => c.manual.id !== conflictId)
      );
      
      return true;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast.error('Failed to resolve conflict');
      throw error;
    } finally {
      // Use setTimeout to ensure UI responsiveness
      setTimeout(() => {
        setIsResolving(false);
      }, 300);
    }
  }, [conflicts]);
  
  /**
   * Resolve all conflicts with the same resolution strategy
   * @param resolution How to resolve all conflicts
   */
  const resolveAllConflicts = useCallback(async (
    resolution: 'keep-both' | 'keep-manual' | 'keep-bank'
  ) => {
    if (conflicts.length === 0) return;
    
    try {
      setIsResolving(true);
      
      // Prepare batch of conflicts to resolve
      const conflictBatch = conflicts.map(conflict => ({
        manualTransactionId: conflict.manual.id,
        importedTransactionId: conflict.imported.id,
        resolution
      }));
      
      // Send batch resolution to API
      const response = await fetch('/api/transactions-conflict/resolve-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflicts: conflictBatch })
      });
      
      if (!response.ok) {
        throw new Error('Failed to resolve conflicts');
      }
      
      // Clear conflicts after successful resolution
      setConflicts([]);
      
      return true;
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      toast.error('Failed to resolve conflicts');
      throw error;
    } finally {
      // Use setTimeout to ensure UI responsiveness
      setTimeout(() => {
        setIsResolving(false);
      }, 300);
    }
  }, [conflicts]);
  
  // Force a re-analysis of conflicts
  const reanalyzeConflicts = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    processingRef.current = false;
    detectConflicts();
  }, [detectConflicts]);
  
  return { 
    conflicts,
    isAnalyzing,
    isResolving,
    progress,
    resolveConflict,
    resolveAllConflicts,
    reanalyzeConflicts
  };
}

export default useConflictDetection; 