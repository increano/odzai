'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Switch } from '@/components/ui/switch'
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Configure your account settings and integrations
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">General Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure general account settings
              </p>
              {/* General settings content goes here */}
            </div>
          </TabsContent>
          
          <TabsContent value="preferences">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preferences</h3>
              <p className="text-sm text-muted-foreground">
                Configure your preferences and defaults
              </p>
              {/* Preferences content goes here */}
            </div>
          </TabsContent>
          
          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function IntegrationsTab() {
  const [secretId, setSecretId] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [syncSettings, setSyncSettings] = useState({
    autoSyncEnabled: false,
    syncFrequency: 'daily'
  })
  const [refreshingStats, setRefreshingStats] = useState(false)
  
  // Check current configuration status on load
  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch('/api/gocardless/status')
        const data = await response.json()
        setIsConfigured(data.isConfigured)
        if (data.isConfigured && data.stats) {
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Failed to check GoCardless status:', error)
        toast.error('Failed to check GoCardless configuration status')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkStatus()
  }, [])
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!secretId || !secretKey) {
      toast.error('Secret ID and Secret Key are required')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/admin/gocardless/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secretId,
          secretKey
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to configure GoCardless')
      }
      
      toast.success('GoCardless configured successfully')
      setIsConfigured(true)
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error configuring GoCardless:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to configure GoCardless')
    } finally {
      setIsSubmitting(false)
    }
  }

  const refreshStats = async () => {
    if (!isConfigured) return;
    
    setRefreshingStats(true);
    try {
      const response = await fetch('/api/gocardless/status?refresh=true');
      const data = await response.json();
      
      if (data.stats) {
        setStats(data.stats);
        toast.success('Connection statistics refreshed');
      }
    } catch (error) {
      console.error('Failed to refresh GoCardless stats:', error);
      toast.error('Failed to refresh statistics');
    } finally {
      setRefreshingStats(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Bank Synchronization</h3>
        <p className="text-sm text-muted-foreground">
          Configure integration with banking services
        </p>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>GoCardless Integration</CardTitle>
              <CardDescription>
                Connect to European banks using GoCardless
              </CardDescription>
            </div>
            {isConfigured && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isConfigured ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                <div>
                  <p className="font-medium">GoCardless is configured</p>
                  <p className="text-sm">API credentials are set up and working correctly.</p>
                </div>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="stats">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <span>Connection Statistics</span>
                      {refreshingStats && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Institutions Connected</p>
                          <p className="text-2xl font-bold">{stats?.connectedBanks || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Accounts Linked</p>
                          <p className="text-2xl font-bold">{stats?.linkedAccounts || 0}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">API Usage</p>
                        <div className="text-sm text-muted-foreground">
                          <p>Monthly Limit: {stats?.limits?.monthlyLimit || '50'} institutions</p>
                          <p>Daily Sync Limit: {stats?.limits?.dailyLimit || '4'} syncs per institution</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={refreshStats}
                          disabled={refreshingStats}
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Refresh Stats
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="advanced">
                  <AccordionTrigger>Advanced Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autoSync" className="text-sm font-medium">
                            Auto-Sync
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Not yet available in this version
                          </p>
                        </div>
                        <Switch 
                          id="autoSync" 
                          checked={syncSettings.autoSyncEnabled}
                          onCheckedChange={(value) => setSyncSettings({...syncSettings, autoSyncEnabled: value})}
                          disabled={true}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Banks with Limited History</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Some banks only provide limited transaction history
                        </p>
                        <div className="text-xs p-2 bg-muted rounded">
                          To add a bank to this list, see documentation on adding banks with limited history.
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <a 
                          href="https://bankaccountdata.gocardless.com/overview/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary flex items-center hover:underline"
                        >
                          <span>View GoCardless Dashboard</span>
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded text-sm">
                <div className="flex items-start">
                  <AlertTriangle className="mr-2 h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Important Notes</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Actual does not sync automatically with your bank</li>
                      <li>You can sync up to 4 times per day per institution</li>
                      <li>Free tier supports up to 50 bank connections per month</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secretId">Secret ID</Label>
                <Input
                  id="secretId"
                  value={secretId}
                  onChange={(e) => setSecretId(e.target.value)}
                  placeholder="nordigen_secret_id_1234567890"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter your GoCardless Secret Key"
                  required
                />
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">
                  Create these credentials in your <a href="https://bankaccountdata.gocardless.com/overview/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GoCardless dashboard</a> under Developers → User secrets.
                </p>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Configuration'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        
        {isConfigured && (
          <CardFooter className="border-t pt-4 flex justify-end">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setIsConfigured(false);
                setSecretId('');
                setSecretKey('');
              }}
            >
              Reconfigure API Keys
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
} 