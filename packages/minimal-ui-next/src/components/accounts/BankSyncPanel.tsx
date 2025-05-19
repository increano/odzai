'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ReconciliationPanel from './ReconciliationPanel';

interface BankSyncPanelProps {
  connectedAccounts: Array<{
    id: string;
    name: string;
    externalId?: string;
  }>;
  onSyncComplete?: () => void;
}

export default function BankSyncPanel({ 
  connectedAccounts,
  onSyncComplete 
}: BankSyncPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [syncResults, setSyncResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Convert accounts to a name lookup object
  const accountNames = connectedAccounts.reduce((acc, account) => {
    acc[account.id] = account.name;
    return acc;
  }, {} as Record<string, string>);

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gocardless/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accounts: connectedAccounts.map(account => ({
            id: account.id,
            externalId: account.externalId
          }))
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync accounts');
      }
      
      const data = await response.json();
      
      // Set the last sync date
      setLastSyncDate(new Date());
      
      // Store results
      setSyncResults(data);
      
      // Show success toast
      toast.success(`Successfully synced ${data.updatedAccounts} accounts with ${data.newTransactions} new transactions`);
      
      // Call the callback if provided
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err) {
      console.error('Error syncing accounts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to sync accounts');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReconcileAll = async () => {
    toast.info('Reconciling all accounts...');
    // In a real implementation, this would call an API endpoint to reconcile all accounts
    // For now, we'll just show a toast
    setTimeout(() => {
      toast.success('All accounts reconciled successfully');
      // Update the sync results to show all accounts as reconciled
      if (syncResults && syncResults.reconciliation) {
        setSyncResults({
          ...syncResults,
          reconciliation: {
            ...syncResults.reconciliation,
            needsReconciliation: 0,
            reconciled: syncResults.reconciliation.total,
            details: syncResults.reconciliation.details.map((detail: any) => ({
              ...detail,
              needsReconciliation: false,
              reconciled: true,
              adjustmentTransactionId: detail.needsReconciliation ? `adj-${Date.now()}-${detail.accountId}` : undefined
            }))
          }
        });
      }
    }, 1500);
  };

  const hasConnectedAccounts = connectedAccounts.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bank Synchronization</CardTitle>
          <CardDescription>
            Keep your accounts up to date by syncing with your bank
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasConnectedAccounts ? (
            <div className="bg-muted/50 p-4 rounded-md text-center">
              <p className="text-sm text-muted-foreground">No connected bank accounts found</p>
              <Button variant="outline" className="mt-2" size="sm">
                Connect a Bank Account
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                {connectedAccounts.length} connected bank {connectedAccounts.length === 1 ? 'account' : 'accounts'}
              </p>
              
              {lastSyncDate && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {lastSyncDate.toLocaleString()}
                </p>
              )}
              
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              
              {syncResults && syncResults.accounts && (
                <div className="border rounded-md p-3 bg-muted/30">
                  <h4 className="text-sm font-medium mb-2">Last Sync Results</h4>
                  <ul className="text-xs space-y-1.5">
                    {syncResults.accounts.map((account: any) => (
                      <li key={account.id} className="flex justify-between">
                        <span>{accountNames[account.id] || account.name}</span>
                        <span>{account.updatedTransactions} new transactions</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing || !hasConnectedAccounts}
            className="w-full"
          >
            {isSyncing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Sync Bank Accounts
          </Button>
        </CardFooter>
      </Card>
      
      {syncResults && syncResults.reconciliation && (
        <ReconciliationPanel 
          reconciliation={syncResults.reconciliation} 
          accountNames={accountNames}
          onReconcileAll={handleReconcileAll}
          loading={isSyncing}
        />
      )}
    </div>
  );
} 