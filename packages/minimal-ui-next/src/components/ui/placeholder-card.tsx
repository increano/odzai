import { ComponentProps } from 'react'
import { LucideIcon, Wallet } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface PlaceholderCardProps extends ComponentProps<'div'> {
  icon?: LucideIcon
  title?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
}

export function PlaceholderCard({
  icon: Icon = Wallet,
  title = "No Workspace Loaded",
  description = "Please load or create a workspace to access this feature.",
  buttonText = "Go to Workspaces",
  onButtonClick,
  className,
  ...props
}: PlaceholderCardProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 space-y-4 bg-muted/30 rounded-lg border border-dashed",
        className
      )}
      {...props}
    >
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-center">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {description}
      </p>
      {buttonText && (
        <Button 
          variant="outline" 
          onClick={onButtonClick}
          disabled={!onButtonClick}
          className="mt-2"
        >
          {buttonText}
        </Button>
      )}
    </div>
  )
} 