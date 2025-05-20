import React from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TransactionPaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  itemsPerPageOptions?: number[]
  className?: string
}

export function TransactionPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  className = ''
}: TransactionPaginationProps) {
  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Add first page
      pageNumbers.push(1)
      
      // Add middle pages with ellipsis
      if (currentPage <= 3) {
        // Near beginning
        for (let i = 2; i <= 4; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('ellipsis')
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pageNumbers.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages - 1; i++) {
          pageNumbers.push(i)
        }
      } else {
        // In middle
        pageNumbers.push('ellipsis')
        pageNumbers.push(currentPage - 1)
        pageNumbers.push(currentPage)
        pageNumbers.push(currentPage + 1)
        pageNumbers.push('ellipsis')
      }
      
      // Add last page
      pageNumbers.push(totalPages)
    }
    
    return pageNumbers
  }
  
  // Calculate displayed item range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)
  
  const pageNumbers = getPageNumbers()
  
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between px-2 py-3 ${className}`}>
      {/* Items per page selector and item range info */}
      <div className="flex items-center text-sm text-muted-foreground mb-3 sm:mb-0">
        <span className="mr-2">Rows per page:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={pageSize.toString()} />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <span className="ml-4">
          {totalItems > 0
            ? `${startItem}-${endItem} of ${totalItems} items`
            : 'No items'}
        </span>
      </div>
      
      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* First page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          <ChevronsLeftIcon className="h-4 w-4" />
        </Button>
        
        {/* Previous page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        {/* Page numbers */}
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span>
            )
          }
          
          return (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              className="h-8 w-8"
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Button>
          )
        })}
        
        {/* Next page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        
        {/* Last page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          aria-label="Last page"
        >
          <ChevronsRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 