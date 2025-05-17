'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import ManualAccountForm from '@/components/accounts/ManualAccountForm'

export default function CreateAccountPage() {
  const router = useRouter()
  const [isGoCardlessConfigured, setIsGoCardlessConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Check if GoCardless is configured
  useEffect(() => {
    async function checkGoCardlessStatus() {
      try {
        const response = await fetch('/api/gocardless/status')
        const data = await response.json()
        setIsGoCardlessConfigured(data.isConfigured)
      } catch (error) {
        console.error('Failed to check GoCardless status:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkGoCardlessStatus()
  }, [])
  
  const handleConnectBank = () => {
    // If GoCardless is configured, redirect to bank selection
    // Otherwise, show error
    if (isGoCardlessConfigured) {
      router.push('/bank-connection')
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Account</CardTitle>
          <CardDescription>Add a new account to track your finances.</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="manual">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="bank">Connect Bank</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="manual">
            <CardContent className="pt-6">
              <ManualAccountForm />
            </CardContent>
          </TabsContent>
          
          <TabsContent value="bank">
            <CardContent className="pt-6">
              {!isLoading && !isGoCardlessConfigured && (
                <Alert variant="warning" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    GoCardless is not configured for this system. Please contact
                    your administrator to set up the GoCardless integration.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect to your bank account to automatically import transactions and keep your budget up to date.
                </p>
                
                <Button 
                  onClick={handleConnectBank}
                  disabled={!isGoCardlessConfigured}
                  className="w-full"
                >
                  Connect Bank
                </Button>
                
                {!isGoCardlessConfigured && (
                  <p className="text-xs text-muted-foreground">
                    Bank synchronization requires GoCardless configuration. You can 
                    <a href="/accounts" className="text-primary font-medium hover:underline px-1">
                      configure GoCardless in Account Settings
                    </a>.
                  </p>
                )}
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter>
          <Button variant="outline" onClick={() => router.push('/accounts')} className="w-full">
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 