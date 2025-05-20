'use client'

import React from 'react'
import { StatusCard } from './status-card'
import { ClockIcon, ArrowRightCircleIcon, TruckIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'

// Define types for the transaction status metrics
interface TransactionStatusMetrics {
  waiting: {
    count: number
    changePercent?: number
  }
  processing: {
    count: number
    changePercent?: number
  }
  shipping: {
    count: number
    changePercent?: number
  }
  completed: {
    count: number
    changePercent?: number
  }
  canceled: {
    count: number
    changePercent?: number
  }
}

// Optional loading prop to show loading state
interface StatusOverviewSectionProps {
  metrics?: TransactionStatusMetrics
  isLoading?: boolean
}

export function StatusOverviewSection({ 
  metrics,
  isLoading = false
}: StatusOverviewSectionProps) {
  // Default/placeholder metrics when loading or no data
  const defaultMetrics: TransactionStatusMetrics = {
    waiting: { count: 0 },
    processing: { count: 0 },
    shipping: { count: 0 },
    completed: { count: 0 },
    canceled: { count: 0 }
  }
  
  // Use provided metrics or fallback to defaults
  const displayMetrics = metrics || defaultMetrics
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {/* Waiting Payments Card */}
      <StatusCard
        title="Waiting Payments"
        count={isLoading ? 0 : displayMetrics.waiting.count}
        changePercent={!isLoading ? displayMetrics.waiting.changePercent : undefined}
        icon={<ClockIcon className="h-5 w-5" />}
        className={isLoading ? "animate-pulse" : ""}
      />
      
      {/* Processing Card */}
      <StatusCard
        title="On Process"
        count={isLoading ? 0 : displayMetrics.processing.count}
        changePercent={!isLoading ? displayMetrics.processing.changePercent : undefined}
        icon={<ArrowRightCircleIcon className="h-5 w-5" />}
        className={isLoading ? "animate-pulse" : ""}
      />
      
      {/* Shipping Card */}
      <StatusCard
        title="On Delivery"
        count={isLoading ? 0 : displayMetrics.shipping.count}
        changePercent={!isLoading ? displayMetrics.shipping.changePercent : undefined}
        icon={<TruckIcon className="h-5 w-5" />}
        className={isLoading ? "animate-pulse" : ""}
      />
      
      {/* Completed Card */}
      <StatusCard
        title="Completed"
        count={isLoading ? 0 : displayMetrics.completed.count}
        changePercent={!isLoading ? displayMetrics.completed.changePercent : undefined}
        icon={<CheckCircleIcon className="h-5 w-5" />}
        className={isLoading ? "animate-pulse" : ""}
      />
      
      {/* Canceled Card */}
      <StatusCard
        title="Canceled"
        count={isLoading ? 0 : displayMetrics.canceled.count}
        changePercent={!isLoading ? displayMetrics.canceled.changePercent : undefined}
        icon={<XCircleIcon className="h-5 w-5" />}
        className={isLoading ? "animate-pulse" : ""}
      />
    </div>
  )
} 