'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-full">
      {children}
    </div>
  )
}

export function DashboardContent({
  children,
  className,
  title,
  actions,
}: {
  children: ReactNode
  className?: string
  title?: string
  actions?: ReactNode
}) {
  return (
    <div className={cn("p-6", className)}>
      {(title || actions) && (
        <div className="mb-6 flex items-center justify-between">
          {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
          {actions && <div className="flex items-center gap-4">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
} 