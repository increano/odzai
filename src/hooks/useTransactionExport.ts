import { useState } from 'react'
import { toast } from 'sonner'

interface ExportOptions {
  transactionIds?: string[]
  accountId?: string
  format?: 'csv' | 'json' | 'xlsx'
  dateRange?: {
    startDate: string
    endDate: string
  }
}

/**
 * Hook for exporting transactions to different formats
 */
export function useTransactionExport() {
  const [isExporting, setIsExporting] = useState(false)
  
  /**
   * Export transactions to the specified format
   * @param options Export configuration options
   */
  const exportTransactions = async (options: ExportOptions): Promise<void> => {
    if (!options.transactionIds && !options.accountId) {
      throw new Error('Either transactionIds or accountId must be provided')
    }
    
    setIsExporting(true)
    
    try {
      // Create form data for file download
      const formData = new FormData()
      formData.append('format', options.format || 'csv')
      
      if (options.transactionIds) {
        formData.append('transactionIds', JSON.stringify(options.transactionIds))
      }
      
      if (options.accountId) {
        formData.append('accountId', options.accountId)
      }
      
      if (options.dateRange) {
        formData.append('startDate', options.dateRange.startDate)
        formData.append('endDate', options.dateRange.endDate)
      }
      
      // Use POST for large transaction sets
      const response = await fetch('/api/transactions-export', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.message || 'Failed to export transactions'
        )
      }
      
      // Get the filename from the content-disposition header
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'transactions-export.csv'
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      // Create a download link and trigger it
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Transactions exported successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export transactions')
      throw error
    } finally {
      setIsExporting(false)
    }
  }
  
  return {
    exportTransactions,
    isExporting
  }
} 