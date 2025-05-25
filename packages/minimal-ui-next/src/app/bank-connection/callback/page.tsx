"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ClientWrapper } from "@/components/ClientWrapper";

interface BankAccount {
  id: string;
  name: string;
  balance: {
    amount: number;
    currency: string;
  };
  iban?: string;
  accountNumber?: string;
}

export default function BankConnectionCallback() {
  return (
    <ClientWrapper>
      <BankConnectionCallbackContent />
    </ClientWrapper>
  );
}

function BankConnectionCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requisitionId, setRequisitionId] = useState<string | null>(null);

  // Get reference parameter from URL
  const reference = searchParams.get('ref');
  
  // Get account ID from session storage (if linking to existing account)
  const existingAccountId = typeof window !== 'undefined'
    ? window.sessionStorage.getItem('gocardless_account_id')
    : null;

  // Retrieve the requisition ID either from session storage or from the server using the reference
  useEffect(() => {
    async function getRequisitionId() {
      // First check session storage
      if (typeof window !== 'undefined') {
        const storedRequisitionId = window.sessionStorage.getItem('gocardless_requisition_id');
        if (storedRequisitionId) {
          console.log(`Using requisition ID from session storage: ${storedRequisitionId}`);
          setRequisitionId(storedRequisitionId);
          return;
        }
      }

      // If we have a reference parameter but no requisition ID, try to get it from the server
      if (reference) {
        try {
          console.log(`Looking up requisition ID for reference: ${reference}`);
          
          // Call our lookup endpoint to get the requisition ID from the reference
          const response = await fetch(`/api/gocardless/lookup-requisition?reference=${reference}`);
          if (response.ok) {
            const data = await response.json();
            if (data.requisitionId) {
              console.log(`Found requisition ID: ${data.requisitionId}`);
              setRequisitionId(data.requisitionId);
              // Also store it in session storage for future use
              if (typeof window !== 'undefined') {
                window.sessionStorage.setItem('gocardless_requisition_id', data.requisitionId);
              }
              return;
            }
          }
          
          // If we couldn't find a requisition ID, show an error
          setError("Missing requisition information. Please start the process again.");
        } catch (e) {
          console.error("Error looking up requisition ID:", e);
          setError("Error retrieving connection information. Please try again.");
        }
      } else {
        setError("Missing connection reference. Please start the process again.");
      }
    }
    
    getRequisitionId();
  }, [reference]);

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      setError(null);
      
      // Need a requisition ID to proceed
      if (!requisitionId) {
        console.error("Missing requisition ID in callback page");
        setError("Missing requisition information. Please start the process again.");
        setIsLoading(false);
        return;
      }
      
      try {
        console.log(`Fetching accounts with requisitionId: ${requisitionId}`);
        
        const response = await fetch('/api/gocardless/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requisitionId,
          }),
        });
        
        if (!response.ok) {
          let errorMsg = 'Failed to fetch accounts';
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            // If the response isn't valid JSON, use text or status
            errorMsg = `Server error: ${response.status}`;
          }
          console.error('API error response:', errorMsg);
          throw new Error(errorMsg);
        }
        
        const data = await response.json();
        console.log('Account data received:', data);
        
        if (!data.accounts || !Array.isArray(data.accounts) || data.accounts.length === 0) {
          console.error('No valid accounts in response:', data);
          throw new Error('No accounts found for this bank connection');
        }
        
        setAccounts(data.accounts);
        setIsSuccess(true);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setError(error instanceof Error ? error.message : 'Failed to retrieve bank accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [requisitionId]);

  const handleCheckboxChange = (accountId: string) => {
    setSelectedAccountIds(prevSelected => {
      if (prevSelected.includes(accountId)) {
        return prevSelected.filter(id => id !== accountId);
      } else {
        return [...prevSelected, accountId];
      }
    });
  };

  const handleLinkAccounts = async () => {
    if (selectedAccountIds.length === 0) {
      toast.error('Please select at least one account to link');
      return;
    }
    
    setIsLinking(true);
    
    try {
      console.log('Linking accounts:', selectedAccountIds.map(id => {
        const account = accounts.find(acc => acc.id === id);
        return {
          id,
          name: account?.name,
          balance: account?.balance
        };
      }));
      
      const response = await fetch('/api/accounts/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accounts: selectedAccountIds.map(id => {
            const account = accounts.find(acc => acc.id === id);
            return {
              id,
              name: account?.name,
              balance: account?.balance,
              iban: account?.iban,
              accountNumber: account?.accountNumber,
              requisitionId,
              existingAccountId: existingAccountId || undefined,
            };
          }),
        }),
      });
      
      // Parse the response data first
      const responseData = await response.json();
      console.log('Account link response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to link accounts');
      }
      
      toast.success('Bank accounts linked successfully');
      
      // Clear session storage
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('gocardless_requisition_id');
        window.sessionStorage.removeItem('gocardless_account_id');
      }
      
      // Redirect to accounts page after a short delay
      setTimeout(() => {
        router.push('/accounts');
      }, 1500);
    } catch (error) {
      console.error('Error linking accounts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to link accounts. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const goBack = () => {
    router.push('/bank-connection');
  };

  // Format currency value
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="container max-w-3xl py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Processing your bank connection...</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait while we retrieve your accounts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="container max-w-3xl py-10">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-6" 
          onClick={goBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Connection Error</p>
            <p className="text-center text-sm text-muted-foreground mt-1 max-w-md">{error}</p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={goBack}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-6" 
        onClick={goBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <CardTitle>Connection Successful</CardTitle>
          </div>
          <CardDescription>
            Select which accounts you would like to link to your budget.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-sm font-medium">Available Accounts</div>
            
            <div className="space-y-3">
              {accounts.map((account) => (
                <div 
                  key={account.id} 
                  className="flex items-center justify-between border rounded-md p-4"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id={`account-${account.id}`} 
                      checked={selectedAccountIds.includes(account.id)}
                      onCheckedChange={() => handleCheckboxChange(account.id)}
                    />
                    <div>
                      <Label htmlFor={`account-${account.id}`} className="text-sm font-medium">
                        {account.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {account.iban || account.accountNumber || 'No account number available'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(account.balance.amount, account.balance.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={goBack}>Cancel</Button>
          <Button 
            onClick={handleLinkAccounts} 
            disabled={selectedAccountIds.length === 0 || isLinking}
          >
            {isLinking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              `Link ${selectedAccountIds.length} ${selectedAccountIds.length === 1 ? 'Account' : 'Accounts'}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 