'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/components/WorkspaceProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Budget = {
  id: string;
  name: string;
  // Add other fields as needed
};

export default function BudgetsClient() {
  const router = useRouter();
  const { loadWorkspace, loadingWorkspace } = useWorkspace();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [newBudgetName, setNewBudgetName] = useState('');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Fetch budgets on component mount
  useEffect(() => {
    fetchBudgets();
  }, []);
  
  // Function to fetch budgets
  async function fetchBudgets() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/budgets');
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }
      
      const data = await response.json();
      setBudgets(data);
      
      // Set the first budget as selected if available and no selection exists
      if (data.length > 0 && !selectedBudgetId) {
        setSelectedBudgetId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  }
  
  // Function to create a new budget
  async function createBudget(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newBudgetName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/budgets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budgetName: newBudgetName }),
      });
      
      // Handle success response
      if (response.ok) {
        try {
          const result = await response.json();
          toast.success(result.message || `Workspace "${newBudgetName}" created successfully`);
        } catch (jsonError) {
          // If response is not JSON but still OK, just show a generic success message
          toast.success(`Workspace "${newBudgetName}" created successfully`);
        }
        
        setNewBudgetName('');
        fetchBudgets();
      } else {
        // Handle error response
        let errorMessage = `Failed to create workspace "${newBudgetName}"`;
        
        try {
          // Try to parse error as JSON
          const errorData = await response.json();
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error;
          }
        } catch (jsonError) {
          // If error response is not JSON, use status text or a generic error
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  }
  
  // Function to load a budget
  async function handleLoadBudget(budgetId: string) {
    if (!budgetId) {
      toast.error('Please select a workspace to load');
      return;
    }
    
    // First do a backend call to load the budget data
    try {
      const response = await fetch('/api/budgets/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budgetId }),
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to load workspace';
        
        try {
          const errorData = await response.json();
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error;
          }
        } catch (jsonError) {
          // If error response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      // Now that backend load succeeded, use the workspace provider to update the app state
      loadWorkspace(budgetId);
      
    } catch (error) {
      console.error('Error loading workspace:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load workspace');
    }
  }
  
  const actions = (
    <Button onClick={() => document.getElementById('new-workspace-name')?.focus()}>
      <Plus className="mr-2 h-4 w-4" />
      New Workspace
    </Button>
  );
  
  return (
    <DashboardLayout>
      <DashboardContent title="Workspaces" actions={actions}>
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold mb-2">Workspace Manager</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Workspaces are separate environments for organizing your financial data and budgets.
                <span className="block mt-1">Create a new workspace or select an existing one.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Tabs defaultValue="existing" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="existing">Use Existing</TabsTrigger>
                  <TabsTrigger value="create">Create New</TabsTrigger>
                </TabsList>
                
                <TabsContent value="existing" className="space-y-6 px-1">
                  {isLoading ? (
                    <div className="py-12 text-center">
                      <div className="inline-block mx-auto mb-3 opacity-70">
                        {/* You could add a loading spinner here */}
                      </div>
                      <p>Loading workspaces...</p>
                    </div>
                  ) : budgets.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <p className="mb-2">No workspaces found.</p>
                      <p>Create one to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="workspace-select" className="text-base">Select a Workspace</Label>
                        <Select
                          value={selectedBudgetId}
                          onValueChange={setSelectedBudgetId}
                        >
                          <SelectTrigger id="workspace-select" className="h-11">
                            <SelectValue placeholder="Select a workspace" />
                          </SelectTrigger>
                          <SelectContent>
                            {budgets.map((budget) => (
                              <SelectItem key={budget.id} value={budget.id}>
                                {budget.name || budget.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        className="w-full h-11 mt-6"
                        onClick={() => handleLoadBudget(selectedBudgetId)}
                        disabled={loadingWorkspace || !selectedBudgetId}
                      >
                        {loadingWorkspace ? 'Loading...' : 'Load Workspace'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="create" className="space-y-6 px-1">
                  <form onSubmit={createBudget}>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="new-workspace-name" className="text-base">Workspace Name</Label>
                        <Input
                          id="new-workspace-name"
                          placeholder="e.g. Personal Workspace"
                          value={newBudgetName}
                          onChange={(e) => setNewBudgetName(e.target.value)}
                          className="h-11"
                          required
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full h-11 mt-6"
                        disabled={isCreating || !newBudgetName.trim()}
                      >
                        {isCreating ? 'Creating...' : 'Create Workspace'}
                        <Plus className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DashboardContent>
    </DashboardLayout>
  );
} 