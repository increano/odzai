'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'

interface SyncNowButtonProps {
  accountId: string
  onSyncComplete?: () => void
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function SyncNowButton({
  accountId,
  onSyncComplete,
  variant = 'outline',
  size = 'sm'
}: SyncNowButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    if (isSyncing) return
    
    setIsSyncing(true)
    
    try {
      const response = await fetch(`/api/accounts/${accountId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync account')
      }
      
      const data = await response.json()
      
      if (data.conflicts && data.conflicts.length > 0) {
        toast(`Sync complete with ${data.conflicts.length} conflicts to resolve`)
      } else {
        toast.success('Account synced successfully')
      }
      
      // Notify parent component that sync is complete
      if (onSyncComplete) {
        setTimeout(() => {
          onSyncComplete()
        }, 300) // Allow time for UI to update
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Failed to sync account')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isSyncing}
    >
      <RefreshCwIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : 'mr-2'}`} />
      {size !== 'icon' && 'Sync Now'}
    </Button>
  )
} 