import { ReactNode } from 'react'
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string
  icon?: ReactNode
  trend?: {
    value: number | string
    direction?: 'up' | 'down' | 'neutral'
    label?: string
  }
  description?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  description,
  className,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend?.direction || trend.direction === 'neutral') {
      return <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
    }
    
    if (trend.direction === 'up') {
      return <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
    }
    
    return <ArrowDownIcon className="h-4 w-4 text-red-500" />
  }
  
  const getTrendColor = () => {
    if (!trend?.direction || trend.direction === 'neutral') {
      return 'text-muted-foreground'
    }
    
    if (trend.direction === 'up') {
      return 'text-emerald-500'
    }
    
    return 'text-red-500'
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
          {trend && (
            <span className={cn("ml-2 text-xs", getTrendColor())}>
              {getTrendIcon()}
              {typeof trend.value === 'number' ? (
                <span className="ml-1">{`${trend.value > 0 ? '+' : ''}${trend.value}%`}</span>
              ) : (
                <span className="ml-1">{trend.value}</span>
              )}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {icon && (
            <div className="rounded-full p-2 bg-muted">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 