'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react'
import { ConflictResolutionPanel } from '@/components/transactions/conflict-resolution-panel'
import { useConflictDetection } from '@/hooks/useConflictDetection'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
}

export default function AdminTransactionConflicts() {
  const router = useRouter()
  const { user, isAdmin } = useUser()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null)
  
  // Use the conflict detection hook to find and manage conflicts
  const { 
    conflicts, 
    isAnalyzing, 
    resolveConflict,
    resolveAllConflicts
  } = useConflictDetection(transactions, {
    onConflictFound: (foundConflicts) => {
      if (foundConflicts.length > 0) {
        toast.info(`Found ${foundConflicts.length} potential conflicts`)
      }
    }
  })

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error('You need admin privileges to access this page')
      router.push('/')
    }
  }, [isAdmin, isLoading, router])

  // Fetch all transactions
  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      
      // Fetch transactions from all accounts
      const response = await fetch('/api/transactions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  // Load transactions on mount
  useEffect(() => {
    fetchTransactions()
  }, [])

  // Handle resolving a conflict
  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'keep-both' | 'keep-manual' | 'keep-bank'
  ) => {
    try {
      await resolveConflict(conflictId, resolution)
      toast.success('Conflict resolved successfully')
      
      // Refresh data after resolving
      setTimeout(() => {
        fetchTransactions()
      }, 500)
      
      // Clear selection
      setSelectedConflictId(null)
    } catch (error) {
      toast.error('Failed to resolve conflict')
    }
  }

  // Handle resolving all conflicts
  const handleResolveAllConflicts = async (
    resolution: 'keep-both' | 'keep-manual' | 'keep-bank'
  ) => {
    try {
      await resolveAllConflicts(resolution)
      toast.success('All conflicts resolved successfully')
      
      // Refresh data after resolving
      setTimeout(() => {
        fetchTransactions()
      }, 500)
    } catch (error) {
      toast.error('Failed to resolve conflicts')
    }
  }

  // Handle refreshing conflicts
  const handleRefreshConflicts = () => {
    fetchTransactions()
  }

  // Get the selected conflict
  const selectedConflict = conflicts.find(c => c.manual.id === selectedConflictId)

  return (
    <DashboardLayout>
      <DashboardContent
        title={
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
            <span>Transaction Conflict Resolution</span>
          </div>
        }
        subtitle="Admin-only tool to manage and resolve transaction conflicts"
        actions={
          <Button 
            variant="outline"
            onClick={handleRefreshConflicts}
            disabled={isLoading || isAnalyzing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Conflicts
          </Button>
        }
      >
        {isLoading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading transactions...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Admin-only warning */}
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Admin-Only Area</AlertTitle>
              <AlertDescription>
                This page is restricted to administrators only. Use caution when resolving conflicts.
              </AlertDescription>
            </Alert>
            
            {/* Conflicts overview */}
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-lg font-medium mb-4">Transaction Conflicts</h2>
              
              {isAnalyzing ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Analyzing transactions for conflicts...</div>
                </div>
              ) : conflicts.length > 0 ? (
                <div className="space-y-6">
                  {/* Bulk action buttons */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveAllConflicts('keep-both')}
                      className="border-green-200 hover:border-green-400 text-green-700"
                    >
                      Keep All Transactions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveAllConflicts('keep-bank')}
                      className="border-blue-200 hover:border-blue-400 text-blue-700"
                    >
                      Keep Bank Versions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveAllConflicts('keep-manual')}
                      className="border-purple-200 hover:border-purple-400 text-purple-700"
                    >
                      Keep Manual Versions
                    </Button>
                  </div>
                  
                  {/* Selected conflict details */}
                  {selectedConflict && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">Selected Conflict</h3>
                      <ConflictResolutionPanel
                        transaction={selectedConflict.manual}
                        conflictingTransaction={selectedConflict.imported}
                        onResolve={(resolution) => handleResolveConflict(selectedConflict.manual.id, resolution)}
                        onClose={() => setSelectedConflictId(null)}
                      />
                    </div>
                  )}
                  
                  {/* Conflict list */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">All Conflicts ({conflicts.length})</h3>
                    <div className="space-y-2">
                      {conflicts.map((conflict) => (
                        <div 
                          key={conflict.manual.id}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            selectedConflictId === conflict.manual.id 
                              ? 'bg-amber-50 border-amber-300' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedConflictId(conflict.manual.id)}
                        >
                          <div className="flex justify-between">
                            <div className="font-medium">
                              {conflict.manual.payee_name || conflict.manual.payee}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(conflict.manual.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <div>
                              {conflict.manual.origin === 'manual' ? 'Manual Entry' : 'Bank Import'} 
                              vs 
                              {conflict.imported.origin === 'manual' ? ' Manual Entry' : ' Bank Import'}
                            </div>
                            <div className={`${conflict.manual.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {(conflict.manual.amount / 100).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <div className="text-muted-foreground">No conflicts detected</div>
                </div>
              )}
            </div>
          </div>
        )}
      </DashboardContent>
    </DashboardLayout>
  )
} 