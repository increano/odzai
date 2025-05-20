import React from 'react'
import { Bank, Edit } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TransactionOriginBadgeProps {
  origin: 'bank' | 'manual'
}

export function TransactionOriginBadge({ origin }: TransactionOriginBadgeProps) {
  if (origin === 'bank') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1 px-2 py-0.5">
              <Bank className="h-3 w-3" />
              <span className="text-xs">Bank</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Imported from bank</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 flex items-center gap-1 px-2 py-0.5">
            <Edit className="h-3 w-3" />
            <span className="text-xs">Manual</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Manually entered</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 