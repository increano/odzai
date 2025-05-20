import React, { useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SyncNowButtonProps {
  accountId: string
  onSyncComplete: () => void
}

export function SyncNowButton({ accountId, onSyncComplete }: SyncNowButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  
  const handleSync = async () => {
    setIsSyncing(true)
    
    try {
      // API call would go here in a real implementation
      // await fetch(`/api/accounts/${accountId}/sync`, { method: 'POST' });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Notify success
      toast.success('Account synced successfully')
      
      // Call completion handler
      onSyncComplete()
    } catch (error) {
      console.error('Error syncing account:', error)
      toast.error('Failed to sync account')
    } finally {
      setIsSyncing(false)
    }
  }
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleSync}
      disabled={isSyncing}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync Now'}
    </Button>
  )
} 