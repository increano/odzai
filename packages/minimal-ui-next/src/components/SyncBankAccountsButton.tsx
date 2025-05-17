"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SyncBankAccountsButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Button component that syncs connected bank accounts 
 */
export default function SyncBankAccountsButton({
  variant = "default",
  size = "default",
  className = ""
}: SyncBankAccountsButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      toast.info("Syncing your connected accounts...", {
        duration: 2000,
      });
      
      const response = await fetch('/api/gocardless/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sync accounts');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Synced ${data.updatedAccounts || 0} account(s) with ${data.newTransactions || 0} new transactions`);
      } else {
        toast.warning('No accounts were updated during sync');
      }
    } catch (error) {
      console.error('Error syncing accounts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync accounts');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isSyncing}
      className={className}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync Accounts'}
    </Button>
  );
} 