'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';

interface ReconciliationDetail {
  accountId: string;
  needsReconciliation: boolean;
  difference: number;
  reconciled: boolean;
  adjustmentTransactionId?: string;
}

interface ReconciliationSummary {
  total: number;
  needsReconciliation: number;
  reconciled: number;
  details: ReconciliationDetail[];
}

interface ReconciliationPanelProps {
  reconciliation: ReconciliationSummary;
  accountNames: Record<string, string>;
  onReconcileAll?: () => void;
  loading?: boolean;
}

export default function ReconciliationPanel({
  reconciliation,
  accountNames,
  onReconcileAll,
  loading = false
}: ReconciliationPanelProps) {
  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // If there are no reconciliation details, show a simplified view
  if (!reconciliation.details || reconciliation.details.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Reconciliation</CardTitle>
          <CardDescription>
            No accounts were reconciled during the last sync.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Check if any accounts need reconciliation
  const needsReconciliation = reconciliation.needsReconciliation > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Balance Reconciliation</CardTitle>
            <CardDescription>
              Account balance reconciliation status
            </CardDescription>
          </div>
          {needsReconciliation && onReconcileAll && (
            <Button 
              onClick={onReconcileAll}
              disabled={loading}
              size="sm"
              className="flex items-center gap-1"
            >
              {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
              Reconcile All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {needsReconciliation ? (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Balance discrepancies detected</AlertTitle>
            <AlertDescription>
              Some accounts have balance differences that need reconciliation.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Balances are in sync</AlertTitle>
            <AlertDescription>
              All account balances match their bank records.
            </AlertDescription>
          </Alert>
        )}

        <Table>
          <TableCaption>
            Reconciliation results from the most recent account sync.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Difference</TableHead>
              <TableHead>Adjustment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reconciliation.details.map((detail) => (
              <TableRow key={detail.accountId}>
                <TableCell className="font-medium">
                  {accountNames[detail.accountId] || detail.accountId}
                </TableCell>
                <TableCell>
                  {detail.needsReconciliation ? (
                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                      <AlertCircle className="h-3 w-3" />
                      Needs Reconciliation
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <CheckCircle className="h-3 w-3" />
                      In Sync
                    </Badge>
                  )}
                </TableCell>
                <TableCell className={detail.difference < 0 ? "text-red-500" : (detail.difference > 0 ? "text-green-500" : "")}>
                  {formatCurrency(detail.difference)}
                </TableCell>
                <TableCell>
                  {detail.reconciled ? (
                    detail.adjustmentTransactionId ? (
                      <span className="text-xs text-muted-foreground">
                        Adjusted: {detail.adjustmentTransactionId}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No adjustment needed</span>
                    )
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <XCircle className="h-3 w-3" />
                      Not Reconciled
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Reconciliation summary: {reconciliation.reconciled} of {reconciliation.total} accounts reconciled.
      </CardFooter>
    </Card>
  );
} 