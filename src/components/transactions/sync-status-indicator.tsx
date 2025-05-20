import React from 'react'
import { RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

type SyncState = 'idle' | 'syncing' | 'success' | 'error' | 'conflicts-detected';

interface SyncStatusIndicatorProps {
  accountId: string
  lastSyncTime: Date | null
  syncState?: SyncState
  syncProgress?: number
  syncError?: string
}

export function SyncStatusIndicator({
  accountId,
  lastSyncTime,
  syncState = 'idle',
  syncProgress = 0,
  syncError = ''
}: SyncStatusIndicatorProps) {
  if (syncState === 'syncing') {
    return (
      <div className="flex items-center my-1 text-sm text-muted-foreground">
        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
        <span className="mr-4">Syncing account transactions...</span>
        <Progress value={syncProgress} className="h-2 w-36" />
      </div>
    )
  }

  if (syncState === 'error') {
    return (
      <div className="flex items-center my-1 text-sm text-rose-600">
        <AlertCircle className="h-3 w-3 mr-2" />
        <span>{syncError || 'Error syncing account transactions'}</span>
      </div>
    )
  }

  if (syncState === 'conflicts-detected') {
    return (
      <div className="flex items-center my-1 text-sm text-amber-600">
        <AlertCircle className="h-3 w-3 mr-2" />
        <span>Conflicts detected during sync. Please review.</span>
      </div>
    )
  }

  if (syncState === 'success') {
    return (
      <div className="flex items-center my-1 text-sm text-emerald-600">
        <CheckCircle className="h-3 w-3 mr-2" />
        <span>Sync completed successfully</span>
      </div>
    )
  }

  if (lastSyncTime) {
    return (
      <div className="flex items-center my-1 text-sm text-muted-foreground">
        <Clock className="h-3 w-3 mr-2" />
        <span title={format(lastSyncTime, 'PPP p')}>
          Last synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
        </span>
      </div>
    )
  }

  return null
} 