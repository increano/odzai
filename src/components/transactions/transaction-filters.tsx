import React, { useState } from 'react'
import { FilterIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { TransactionFilters } from '@/hooks/useTransactionFilters'

interface TransactionFiltersProps {
  filters: TransactionFilters
  setFilter: <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => void
  setMultipleFilters: (newFilters: Partial<TransactionFilters>) => void
  clearFilters: () => void
  clearFilter: (key: keyof TransactionFilters) => void
  activeFilterCount: number
  categories?: { id: string; name: string }[]
  payees?: { id: string; name: string }[]
}

export function TransactionFiltersButton({
  filters,
  setFilter,
  setMultipleFilters,
  clearFilters,
  clearFilter,
  activeFilterCount,
  categories = [],
  payees = []
}: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fromDate, setFromDate] = useState<Date | undefined>(
    filters.date?.from ? new Date(filters.date.from) : undefined
  )
  const [toDate, setToDate] = useState<Date | undefined>(
    filters.date?.to ? new Date(filters.date.to) : undefined
  )
  const [minAmount, setMinAmount] = useState<string>(
    filters.amount?.min?.toString() || ''
  )
  const [maxAmount, setMaxAmount] = useState<string>(
    filters.amount?.max?.toString() || ''
  )

  // Handle date filter changes
  const handleDateChange = () => {
    setFilter('date', {
      from: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
      to: toDate ? format(toDate, 'yyyy-MM-dd') : undefined
    })
  }

  // Handle amount filter changes
  const handleAmountChange = () => {
    setFilter('amount', {
      min: minAmount ? parseInt(minAmount, 10) : undefined,
      max: maxAmount ? parseInt(maxAmount, 10) : undefined
    })
  }

  // Reset all filters
  const handleClearFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
    setMinAmount('')
    setMaxAmount('')
    clearFilters()
    setIsOpen(false)
  }

  // Convert filters to badges
  const getFilterBadges = () => {
    const badges = []

    // Date filter badge
    if (filters.date?.from || filters.date?.to) {
      const dateText = filters.date.from && filters.date.to
        ? `${filters.date.from} to ${filters.date.to}`
        : filters.date.from
          ? `From ${filters.date.from}`
          : `To ${filters.date.to}`

      badges.push(
        <Badge 
          key="date" 
          variant="secondary" 
          className="flex items-center gap-1"
        >
          <span>Date: {dateText}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0" 
            onClick={() => clearFilter('date')}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )
    }

    // Amount filter badge
    if (filters.amount?.min !== undefined || filters.amount?.max !== undefined) {
      const amountText = filters.amount.min !== undefined && filters.amount.max !== undefined
        ? `$${filters.amount.min / 100} to $${filters.amount.max / 100}`
        : filters.amount.min !== undefined
          ? `Min $${filters.amount.min / 100}`
          : `Max $${filters.amount.max / 100}`

      badges.push(
        <Badge 
          key="amount" 
          variant="secondary" 
          className="flex items-center gap-1"
        >
          <span>Amount: {amountText}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0" 
            onClick={() => clearFilter('amount')}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )
    }

    // Origin filter badge
    if (filters.origin && filters.origin !== 'all') {
      badges.push(
        <Badge 
          key="origin" 
          variant="secondary" 
          className="flex items-center gap-1"
        >
          <span>Origin: {filters.origin}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0" 
            onClick={() => clearFilter('origin')}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )
    }

    // Status filter badge
    if (filters.status && filters.status !== 'all') {
      badges.push(
        <Badge 
          key="status" 
          variant="secondary" 
          className="flex items-center gap-1"
        >
          <span>Status: {filters.status}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0" 
            onClick={() => clearFilter('status')}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )
    }

    // Has conflicts filter badge
    if (filters.hasConflicts) {
      badges.push(
        <Badge 
          key="conflicts" 
          variant="secondary" 
          className="flex items-center gap-1"
        >
          <span>Has conflicts</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0" 
            onClick={() => clearFilter('hasConflicts')}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )
    }

    return badges
  }

  return (
    <div className="flex flex-col items-start">
      <div className="flex flex-wrap gap-1 mb-2">
        {getFilterBadges()}
      </div>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
          >
            <FilterIcon className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Filter Transactions</CardTitle>
              <CardDescription>
                Narrow down transactions by applying filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date range filter */}
              <div className="space-y-2">
                <Label htmlFor="date-filter">Date Range</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      className="border rounded-md p-3"
                      disabled={(date) => toDate ? date > toDate : false}
                    />
                    <Label className="text-xs text-muted-foreground mt-1">From</Label>
                  </div>
                  <div className="flex-1">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      className="border rounded-md p-3"
                      disabled={(date) => fromDate ? date < fromDate : false}
                    />
                    <Label className="text-xs text-muted-foreground mt-1">To</Label>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleDateChange}
                >
                  Apply Date Filter
                </Button>
              </div>
              
              <Separator />
              
              {/* Amount range filter */}
              <div className="space-y-2">
                <Label htmlFor="amount-filter">Amount Range</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="min-amount" className="text-xs text-muted-foreground">Min Amount</Label>
                    <Input
                      id="min-amount"
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="max-amount" className="text-xs text-muted-foreground">Max Amount</Label>
                    <Input
                      id="max-amount"
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleAmountChange}
                >
                  Apply Amount Filter
                </Button>
              </div>
              
              <Separator />
              
              {/* Origin filter */}
              <div className="space-y-2">
                <Label htmlFor="origin-filter">Transaction Origin</Label>
                <Select 
                  value={filters.origin || 'all'} 
                  onValueChange={(value) => 
                    setFilter('origin', value as 'bank' | 'manual' | 'all')
                  }
                >
                  <SelectTrigger id="origin-filter">
                    <SelectValue placeholder="All Origins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Origins</SelectItem>
                    <SelectItem value="bank">Bank Imported</SelectItem>
                    <SelectItem value="manual">Manually Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Transaction Status</Label>
                <Select 
                  value={filters.status || 'all'} 
                  onValueChange={(value) => 
                    setFilter('status', value as 'all' | 'cleared' | 'uncleared')
                  }
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="uncleared">Uncleared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Has Conflicts filter */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="has-conflicts"
                  checked={!!filters.hasConflicts}
                  onChange={(e) => setFilter('hasConflicts', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="has-conflicts">Show only transactions with conflicts</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4 pb-1">
              <Button variant="ghost" onClick={handleClearFilters}>Clear All</Button>
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            </CardFooter>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
} 