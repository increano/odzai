import { Badge } from '@/components/ui/badge'
import { LandmarkIcon, PencilIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Define the possible transaction origins
type TransactionOrigin = 'bank' | 'manual' | undefined

interface TransactionOriginBadgeProps {
  origin?: TransactionOrigin
  className?: string
  showIcon?: boolean
  showText?: boolean
}

export function TransactionOriginBadge({ 
  origin, 
  className,
  showIcon = true,
  showText = true
}: TransactionOriginBadgeProps) {
  // If no origin provided, don't render anything
  if (!origin) return null
  
  // Define display properties based on origin
  const config = {
    bank: {
      text: "Bank Import",
      icon: <LandmarkIcon className="h-3 w-3" />,
      variant: "outline" as const
    },
    manual: {
      text: "Manual Entry",
      icon: <PencilIcon className="h-3 w-3" />,
      variant: "secondary" as const
    }
  }
  
  const { text, icon, variant } = config[origin]
  
  return (
    <Badge 
      variant={variant} 
      className={cn(
        "text-xs font-normal", 
        showIcon && showText ? "px-2" : "px-1.5",
        className
      )}
    >
      {showIcon && (
        <span className={cn("inline-block", showText && "mr-1")}>
          {icon}
        </span>
      )}
      {showText && text}
    </Badge>
  )
} 