"use client"

import React, { useState } from 'react'
import { ArrowUpDown, Check, ChevronsUpDown } from 'lucide-react'
import { format } from 'date-fns'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface Transaction {
  id: string
  date: string
  account: string
  account_name?: string
  amount: number
  payee: string
  payee_name?: string
  category?: string
  category_name?: string
  cleared?: boolean
  reconciled?: boolean
  notes?: string
  origin?: 'bank' | 'manual'
  hasConflict?: boolean
}

type SortDirection = 'asc' | 'desc'

interface TransactionTableProps {
  transactions: Transaction[]
  selectedTransactions: Set<string>
  onSelectTransaction: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onRowClick: (transaction: Transaction) => void
  onSort: (field: keyof Transaction, direction: SortDirection) => void
  sortField: keyof Transaction
  sortDirection: SortDirection
  renderBadge?: (transaction: Transaction) => React.ReactNode
}

export function TransactionTable({
  transactions,
  selectedTransactions,
  onSelectTransaction,
  onSelectAll,
  onRowClick,
  onSort,
  sortField,
  sortDirection,
  renderBadge
}: TransactionTableProps) {
  const handleHeaderClick = (field: keyof Transaction) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(field, newDirection)
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount / 100)
  }

  const getSortIcon = (field: keyof Transaction) => {
    if (field !== sortField) {
      return <ChevronsUpDown className="ml-1 h-4 w-4" />
    }
    return (
      <ArrowUpDown 
        className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} 
      />
    )
  }

  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={
                  transactions.length > 0 && 
                  selectedTransactions.size === transactions.length
                }
                onCheckedChange={(checked) => {
                  onSelectAll(!!checked)
                }}
                aria-label="Select all transactions"
              />
            </TableHead>
            <TableHead className="w-[120px]">
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => handleHeaderClick('date')}
              >
                Date
                {getSortIcon('date')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => handleHeaderClick('payee')}
              >
                Payee
                {getSortIcon('payee')}
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => handleHeaderClick('category')}
              >
                Category
                {getSortIcon('category')}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div 
                className="flex items-center justify-end cursor-pointer"
                onClick={() => handleHeaderClick('amount')}
              >
                Amount
                {getSortIcon('amount')}
              </div>
            </TableHead>
            <TableHead className="w-[80px] text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No transactions found.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow 
                key={transaction.id}
                onClick={() => onRowClick(transaction)}
                className={`
                  cursor-pointer
                  ${selectedTransactions.has(transaction.id) ? 'bg-muted/50' : ''}
                  ${transaction.hasConflict ? 'border-l-4 border-amber-500' : ''}
                `}
              >
                <TableCell className="py-2">
                  <Checkbox 
                    checked={selectedTransactions.has(transaction.id)}
                    onCheckedChange={(checked) => {
                      onSelectTransaction(transaction.id, !!checked)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select transaction ${transaction.id}`}
                  />
                </TableCell>
                <TableCell className="py-2">
                  {format(new Date(transaction.date), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="py-2 flex items-center gap-2">
                  {transaction.payee_name || transaction.payee}
                  {renderBadge && renderBadge(transaction)}
                </TableCell>
                <TableCell className="py-2">
                  {transaction.category_name || 
                   (transaction.category ? 'Uncategorized' : '')}
                </TableCell>
                <TableCell className={`py-2 text-right ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatAmount(transaction.amount)}
                </TableCell>
                <TableCell className="py-2 text-center">
                  {transaction.reconciled ? (
                    <Badge variant="outline" className="bg-green-100 border-green-300">
                      Reconciled
                    </Badge>
                  ) : transaction.cleared ? (
                    <Badge variant="outline" className="bg-blue-100 border-blue-300">
                      Cleared
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-100 border-amber-300">
                      Pending
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 