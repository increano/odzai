import { Card } from '@/components/ui/card'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusCardProps {
  title: string
  count: number
  icon: React.ReactNode
  changePercent?: number
  className?: string
}

export function StatusCard({ 
  title, 
  count, 
  icon, 
  changePercent, 
  className 
}: StatusCardProps) {
  // Determine if the change is positive or negative
  const isPositive = changePercent !== undefined && changePercent >= 0
  const hasChange = changePercent !== undefined
  
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-muted-foreground text-sm font-medium">{title}</div>
        <div className="text-primary">{icon}</div>
      </div>
      
      <div className="text-2xl font-bold">{count}</div>
      
      {hasChange && (
        <div className="flex items-center mt-2">
          {isPositive ? (
            <ArrowUpIcon className="h-4 w-4 text-emerald-500 mr-1" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={cn(
            "text-xs",
            isPositive ? "text-emerald-500" : "text-red-500"
          )}>
            {Math.abs(changePercent)}% from last month
          </span>
        </div>
      )}
    </Card>
  )
} 