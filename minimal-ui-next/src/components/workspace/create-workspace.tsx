'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  FolderPlus,
  Folder,
  FolderOpen,
  Clock,
  Calendar,
  Trash2,
  FileUp,
  RefreshCw,
  AlertTriangle,
  FilePlus,
  Check,
  X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

// Types
interface Workspace {
  id: string;
  name: string;
  lastOpened: string;
  createdAt: string;
  size: string; // In MB
  path: string;
  useSampleData?: boolean;
}

export function CreateWorkspace() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [pendingWorkspace, setPendingWorkspace] = useState<Workspace | null>(null);
  const [sampleDataOptionOpen, setSampleDataOptionOpen] = useState(false);
  const [useSampleData, setUseSampleData] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Load workspaces from API
  useEffect(() => {
    const fetchWorkspaces = async () => {
      setIsLoading(true);

      try {
        // Fetch workspaces from API
        const response = await fetch('/api/workspaces');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setWorkspaces(data);
        } else {
          // If for some reason the response is not an array, set empty array
          setWorkspaces([]);
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        toast.error('Failed to load workspaces');
        setWorkspaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  // Initiate workspace creation process
  const initiateCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    // Create pending workspace object (just for UI state)
    const newWorkspace: Workspace = {
      id: `${newWorkspaceName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: newWorkspaceName,
      lastOpened: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      size: '0.1',
      path: `/data/${newWorkspaceName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    };

    setPendingWorkspace(newWorkspace);
    setIsCreateDialogOpen(false);
    setSampleDataOptionOpen(true);
  };

  // Create new workspace
  const handleCreateWorkspace = async () => {
    if (!pendingWorkspace) return;
    
    setIsCreating(true);

    try {
      // Call API to create workspace
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: pendingWorkspace.name })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create workspace');
      }
      
      // Update workspaces list
      setWorkspaces(result.workspaces);
      
      // Find the newly created workspace
      const newWorkspace = result.workspaces.find((w: Workspace) => 
        w.name === pendingWorkspace.name
      );
      
      if (!newWorkspace) {
        throw new Error('Created workspace not found in response');
      }
      
      // Save sample data preference for this workspace (UI-only state)
      const finalWorkspace = {
        ...newWorkspace,
        useSampleData
      };
      
      setNewWorkspaceName('');
      setSampleDataOptionOpen(false);
      setPendingWorkspace(null);
      toast.success('Workspace created successfully');
      
      // Automatically select the new workspace
      setSelectedWorkspaceId(finalWorkspace.id);
      
      // Save current workspace ID to localStorage
      localStorage.setItem('odzai-current-workspace', finalWorkspace.id);
      
      // Load the workspace via API
      await fetch('/api/workspaces/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workspaceId: finalWorkspace.id })
      });
      
      // Navigate to transactions page
      router.push('/transactions');
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      toast.error(error.message || 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete workspace
  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    setIsLoading(true);

    try {
      // In a real implementation, you would call an API endpoint to delete the workspace
      // For now, we'll just update the UI
      toast.error('Delete functionality not implemented yet');
      
      // If we're deleting the selected workspace, clear the selection
      if (selectedWorkspaceId === workspaceToDelete.id) {
        setSelectedWorkspaceId(null);
        localStorage.removeItem('odzai-current-workspace');
      }
      
      setIsDeleteDialogOpen(false);
      setWorkspaceToDelete(null);
    } catch (error: any) {
      console.error('Error deleting workspace:', error);
      toast.error(error.message || 'Failed to delete workspace');
    } finally {
      setIsLoading(false);
    }
  };

  // Open workspace
  const handleOpenWorkspace = async (workspaceId: string) => {
    setIsLoading(true);
    try {
      // Load workspace with API
      const response = await fetch('/api/workspaces/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workspaceId })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load workspace');
      }
      
      // Update selected workspace
      setSelectedWorkspaceId(workspaceId);
      
      // Save to localStorage for persistence
      localStorage.setItem('odzai-current-workspace', workspaceId);
      
      // Navigate to transactions page
      router.push('/transactions');
      
      toast.success('Workspace loaded successfully');
    } catch (error: any) {
      console.error('Error opening workspace:', error);
      toast.error(error.message || 'Failed to open workspace');
    } finally {
      setIsLoading(false);
    }
  };

  // Import workspace
  const handleImportWorkspace = () => {
    // In a real app, this would open a file picker and import a workspace file
    toast.error('Import functionality not implemented yet');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
        <Button variant="outline" onClick={handleImportWorkspace} disabled={isImporting}>
          <FileUp className="mr-2 h-4 w-4" />
          {isImporting ? (
            <>
              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
              Importing...
            </>
          ) : 'Import Workspace'}
        </Button>
      </div>

      {workspaces.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Available Workspaces</h3>
          <div className="grid gap-2">
            {workspaces.map(workspace => (
              <Card key={workspace.id} className={selectedWorkspaceId === workspace.id ? 'border-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-medium">{workspace.name}</h4>
                        {workspace.useSampleData && (
                          <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
                            Sample Data
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Last opened: {new Date(workspace.lastOpened).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {new Date(workspace.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWorkspaceToDelete(workspace);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenWorkspace(workspace.id)}
                        disabled={isLoading}
                      >
                        {isLoading && selectedWorkspaceId === workspace.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Open'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-10 w-10 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="mb-2 font-medium">Loading Workspaces...</h3>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderPlus className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2 font-medium">No Workspaces Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new workspace to get started
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Workspace Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Enter a name for your new workspace
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="col-span-3"
                placeholder="My Workspace"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={initiateCreateWorkspace}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sample Data Option Dialog */}
      <Dialog open={sampleDataOptionOpen} onOpenChange={setSampleDataOptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sample Data</DialogTitle>
            <DialogDescription>
              Would you like to include sample data in your new workspace?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sample-data"
                checked={useSampleData}
                onCheckedChange={(checked) => setUseSampleData(checked as boolean)}
              />
              <Label htmlFor="sample-data">Include sample transactions and categories</Label>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {useSampleData 
                ? "This will create a workspace with pre-populated categories, accounts, and transactions."
                : "This will create an empty workspace. You'll need to set up categories and accounts manually."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSampleDataOptionOpen(false);
              setPendingWorkspace(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={isCreating}>
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Workspace'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workspace "{workspaceToDelete?.name}" and all its data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setWorkspaceToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkspace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 