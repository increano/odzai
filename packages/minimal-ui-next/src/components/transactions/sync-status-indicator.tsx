'use client'

import React from 'react'
import { RefreshCwIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// Define the possible sync states
type SyncState = 'idle' | 'syncing' | 'success' | 'error'

interface SyncStatusIndicatorProps {
  accountId: string
  lastSyncTime?: Date | null
  syncState?: SyncState
  error?: string | null
  className?: string
}

export function SyncStatusIndicator({
  accountId,
  lastSyncTime,
  syncState = 'idle',
  error = null,
  className,
}: SyncStatusIndicatorProps) {
  // Determine styling based on sync state
  const getStatusStyles = () => {
    switch (syncState) {
      case 'syncing':
        return 'text-blue-500'
      case 'success':
        return 'text-emerald-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  // Get the appropriate icon based on state
  const getStatusIcon = () => {
    switch (syncState) {
      case 'syncing':
        return <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />
      case 'success':
        return <CheckCircleIcon className="h-3.5 w-3.5" />
      case 'error':
        return <AlertCircleIcon className="h-3.5 w-3.5" />
      default:
        return <RefreshCwIcon className="h-3.5 w-3.5" />
    }
  }

  // Get the status text
  const getStatusText = () => {
    switch (syncState) {
      case 'syncing':
        return 'Syncing with bank...'
      case 'success':
        return lastSyncTime
          ? `Last synced: ${format(lastSyncTime, 'MMM d, h:mm a')}`
          : 'Sync successful'
      case 'error':
        return error || 'Sync failed'
      default:
        return lastSyncTime
          ? `Last synced: ${format(lastSyncTime, 'MMM d, h:mm a')}`
          : 'Not synced yet'
    }
  }

  return (
    <div className={cn(
      "flex items-center text-xs mt-2", 
      getStatusStyles(),
      className
    )}>
      <span className="mr-1.5">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
    </div>
  )
} 