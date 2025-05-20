import { useState } from 'react'
import { toast } from 'sonner'

interface ImportOptions {
  accountId: string
  file: File
  defaultCleared?: boolean
  skipDuplicates?: boolean
}

interface ImportResult {
  added: number
  updated: number
  skipped: number
  errors?: string[]
}

/**
 * Hook for importing transactions from files
 */
export function useTransactionImport() {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  
  /**
   * Import transactions from a file
   * @param options Import configuration options
   * @returns Promise that resolves with import results
   */
  const importTransactions = async (options: ImportOptions): Promise<ImportResult> => {
    if (!options.accountId) {
      throw new Error('Account ID is required')
    }
    
    if (!options.file) {
      throw new Error('Import file is required')
    }
    
    setIsImporting(true)
    setProgress(0)
    
    try {
      // Create form data for file upload
      const formData = new FormData()
      formData.append('file', options.file)
      formData.append('accountId', options.accountId)
      
      if (options.defaultCleared !== undefined) {
        formData.append('defaultCleared', options.defaultCleared.toString())
      }
      
      if (options.skipDuplicates !== undefined) {
        formData.append('skipDuplicates', options.skipDuplicates.toString())
      }
      
      // Use a more advanced fetch approach that can track progress
      const xhr = new XMLHttpRequest()
      
      // Create a promise to handle the XHR response
      const importPromise = new Promise<ImportResult>((resolve, reject) => {
        xhr.open('POST', '/api/transactions-import', true)
        
        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            setProgress(percentComplete)
          }
        }
        
        // Handle response
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              
              // Show appropriate success message based on results
              if (response.added > 0 || response.updated > 0) {
                const addedMsg = response.added > 0 ? `${response.added} added` : ''
                const updatedMsg = response.updated > 0 ? `${response.updated} updated` : ''
                const skippedMsg = response.skipped > 0 ? `${response.skipped} skipped` : ''
                
                const resultMsg = [addedMsg, updatedMsg, skippedMsg]
                  .filter(Boolean)
                  .join(', ')
                
                toast.success(`Import complete: ${resultMsg}`)
              } else {
                toast.info('No new transactions were imported')
              }
              
              resolve(response)
            } catch (error) {
              reject(new Error('Invalid response from server'))
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(new Error(errorData.error || errorData.message || 'Import failed'))
            } catch (e) {
              reject(new Error('Failed to import transactions'))
            }
          }
        }
        
        // Handle network errors
        xhr.onerror = () => {
          reject(new Error('Network error occurred during import'))
        }
        
        // Handle timeouts
        xhr.ontimeout = () => {
          reject(new Error('Import request timed out'))
        }
        
        // Send the form data
        xhr.send(formData)
      })
      
      return await importPromise
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import transactions')
      throw error
    } finally {
      setIsImporting(false)
      setProgress(0)
    }
  }
  
  return {
    importTransactions,
    isImporting,
    progress
  }
} 