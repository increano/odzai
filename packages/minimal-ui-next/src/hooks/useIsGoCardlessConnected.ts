import { useState, useEffect } from 'react'

type SyncState = 'idle' | 'syncing' | 'success' | 'error'

interface GoCardlessConnectionStatus {
  isConnected: boolean
  lastSyncTime: Date | null
  syncState: SyncState
  error: string | null
}

/**
 * Custom hook to check if an account is connected to GoCardless
 * and get its sync status
 */
export function useIsGoCardlessConnected(accountId?: string): GoCardlessConnectionStatus {
  const [status, setStatus] = useState<GoCardlessConnectionStatus>({
    isConnected: false,
    lastSyncTime: null,
    syncState: 'idle',
    error: null
  })

  useEffect(() => {
    if (!accountId) {
      return
    }

    // Function to fetch the GoCardless connection status
    const fetchConnectionStatus = async () => {
      try {
        const response = await fetch(`/api/gocardless/status?accountId=${accountId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch GoCardless status')
        }
        
        const data = await response.json()
        
        setStatus({
          isConnected: data.isConnected || false,
          lastSyncTime: data.lastSyncTime ? new Date(data.lastSyncTime) : null,
          syncState: 'idle',
          error: null
        })
      } catch (error) {
        console.error('Error checking GoCardless connection:', error)
        setStatus(prev => ({
          ...prev,
          error: 'Failed to check connection status'
        }))
      }
    }

    // Fetch the initial status
    fetchConnectionStatus()
    
    // Set up a refresh interval (every 5 minutes)
    const intervalId = setInterval(fetchConnectionStatus, 5 * 60 * 1000)
    
    // Clean up the interval on unmount
    return () => {
      clearInterval(intervalId)
    }
  }, [accountId])

  return status
} 