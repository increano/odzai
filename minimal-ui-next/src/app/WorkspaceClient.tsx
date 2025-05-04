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
  AlertTriangle
} from 'lucide-react';

// Types
interface Workspace {
  id: string;
  name: string;
  lastOpened: string;
  createdAt: string;
  size: string; // In MB
  path: string;
}

export default function WorkspaceClient() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Load workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      setIsLoading(true);

      try {
        // In a real app, this would fetch from API
        // Using mock data for demonstration
        const mockWorkspaces: Workspace[] = [
          {
            id: 'sample-workspace',
            name: 'Sample Workspace',
            lastOpened: '2023-12-15T10:30:00Z',
            createdAt: '2023-01-01T08:00:00Z',
            size: '2.3',
            path: '/data/sample-workspace'
          },
          {
            id: 'home-finances-2023',
            name: 'Home Finances 2023',
            lastOpened: '2023-11-30T14:45:00Z',
            createdAt: '2023-01-15T09:00:00Z',
            size: '4.1',
            path: '/data/home-finances-2023'
          },
          {
            id: 'business-expenses',
            name: 'Business Expenses',
            lastOpened: '2023-10-22T16:20:00Z',
            createdAt: '2023-02-05T11:30:00Z',
            size: '3.7',
            path: '/data/business-expenses'
          }
        ];

        setWorkspaces(mockWorkspaces);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        toast.error('Failed to load workspaces');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  // Create new workspace
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    setIsCreating(true);

    try {
      // In a real app, this would be an API call
      const newWorkspace: Workspace = {
        id: `${newWorkspaceName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: newWorkspaceName,
        lastOpened: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        size: '0.1',
        path: `/data/${newWorkspaceName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      };

      setWorkspaces(prev => [...prev, newWorkspace]);
      setNewWorkspaceName('');
      toast.success('Workspace created successfully');
      
      // Automatically open the new workspace
      handleOpenWorkspace(newWorkspace.id);
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete workspace
  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    setIsLoading(true);

    try {
      // In a real app, this would be an API call
      setWorkspaces(prev => prev.filter(workspace => workspace.id !== workspaceToDelete.id));
      setIsDeleteDialogOpen(false);
      setWorkspaceToDelete(null);
      toast.success('Workspace deleted successfully');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    } finally {
      setIsLoading(false);
    }
  };

  // Open workspace
  const handleOpenWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    
    // In a real app, this would load the workspace and redirect to the dashboard
    // For now, simulate loading and redirect
    setIsLoading(true);
    
    setTimeout(() => {
      toast.success('Workspace loaded successfully');
      router.push('/transactions');
    }, 1000);
  };

  // Import workspace
  const handleImportWorkspace = () => {
    // In a real app, this would open a file picker and import a workspace file
    setIsImporting(true);
    
    setTimeout(() => {
      toast.success('Workspace imported successfully');
      setIsImporting(false);
      
      // Add the imported workspace to the list
      const importedWorkspace: Workspace = {
        id: `imported-workspace-${Date.now()}`,
        name: 'Imported Workspace',
        lastOpened: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        size: '3.2',
        path: `/data/imported-workspace-${Date.now()}`
      };
      
      setWorkspaces(prev => [...prev, importedWorkspace]);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Select Workspace</h1>
        <p className="text-muted-foreground">Choose an existing workspace or create a new one</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Workspaces</CardTitle>
          <CardDescription>
            Select a workspace to open or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              <span>Loading workspaces...</span>
            </div>
          ) : workspaces.length > 0 ? (
            <div className="space-y-4">
              {workspaces.map(workspace => (
                <div 
                  key={workspace.id} 
                  className={`p-4 border rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                    selectedWorkspaceId === workspace.id ? 'bg-slate-100 dark:bg-slate-800 border-primary' : ''
                  }`}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Folder className="h-5 w-5 mt-0.5 text-primary" />
                      <div>
                        <h3 className="font-medium">{workspace.name}</h3>
                        <div className="flex text-xs text-muted-foreground space-x-4 mt-1">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> Last opened: {formatDate(workspace.lastOpened)}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" /> Created: {formatDate(workspace.createdAt)}
                          </span>
                          <span>{workspace.size} MB</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkspaceToDelete(workspace);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No workspaces found. Create a new workspace to get started.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={handleImportWorkspace}
            disabled={isImporting}
          >
            <FileUp className="mr-2 h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import Workspace'}
          </Button>
          <Button 
            className="w-full sm:w-auto"
            onClick={() => setNewWorkspaceName('My Workspace')}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Create New Workspace
          </Button>
        </CardFooter>
      </Card>

      {selectedWorkspaceId && (
        <div className="flex justify-center mb-6">
          <Button 
            size="lg" 
            onClick={() => handleOpenWorkspace(selectedWorkspaceId)}
            disabled={isLoading}
          >
            <FolderOpen className="mr-2 h-5 w-5" />
            {isLoading ? 'Opening...' : 'Open Selected Workspace'}
          </Button>
        </div>
      )}

      {/* Create Workspace Dialog */}
      <Dialog open={!!newWorkspaceName} onOpenChange={(open) => !open && setNewWorkspaceName('')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Enter a name for your new workspace file.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="My Workspace"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewWorkspaceName('')}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workspace? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {workspaceToDelete && (
            <div className="py-4">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="font-medium text-destructive">Warning: This will permanently delete your workspace data</p>
              </div>
              <p className="font-medium">{workspaceToDelete.name}</p>
              <p className="text-sm text-muted-foreground mt-1">Created: {formatDate(workspaceToDelete.createdAt)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWorkspace} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 