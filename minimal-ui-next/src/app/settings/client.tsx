'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Laptop, 
  Database, 
  User, 
  ArrowUpDown, 
  FileUp, 
  FileDown, 
  HardDrive,
  Clock,
  Calendar,
  Trash2,
  FolderOpen,
  Plus,
  RefreshCw
} from "lucide-react";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import { useWorkspace } from "@/context/workspace-context";
import { toast } from 'sonner';
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

// Types
interface Workspace {
  id: string;
  name: string;
  lastOpened: string;
  createdAt: string;
  size: string;
  path: string;
  transactions?: number;
  accounts?: number;
}

export default function SettingsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState("workspaces");
  const { currentWorkspace, loadWorkspace } = useWorkspace();
  
  // State for workspace management
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<keyof Workspace>('lastOpened');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Set the active tab based on URL parameter
  useEffect(() => {
    if (tabParam) {
      const validTabs = ["workspaces", "account", "general", "system"];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam]);

  // Load workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      setIsLoading(true);

      try {
        // Try to load from localStorage first
        const savedWorkspaces = localStorage.getItem('odzai-workspaces');
        
        if (savedWorkspaces) {
          setWorkspaces(JSON.parse(savedWorkspaces));
        } else {
          // If no saved workspaces, use mock data for demonstration
          const mockWorkspaces: Workspace[] = [
            {
              id: 'sample-workspace',
              name: 'Sample Workspace',
              lastOpened: '2023-12-15T10:30:00Z',
              createdAt: '2023-01-01T08:00:00Z',
              size: '2.3',
              path: '/data/sample-workspace',
              transactions: 152,
              accounts: 5
            }
          ];
          
          setWorkspaces(mockWorkspaces);
          // Save to localStorage
          localStorage.setItem('odzai-workspaces', JSON.stringify(mockWorkspaces));
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        toast.error('Failed to load workspaces');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Create new workspace
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, this would be an API call
      const newWorkspace: Workspace = {
        id: `${newWorkspaceName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: newWorkspaceName,
        lastOpened: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        size: '0.1',
        path: `/data/${newWorkspaceName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        transactions: 0,
        accounts: 0
      };

      const updatedWorkspaces = [...workspaces, newWorkspace];
      setWorkspaces(updatedWorkspaces);
      
      // Save to localStorage
      localStorage.setItem('odzai-workspaces', JSON.stringify(updatedWorkspaces));
      
      setNewWorkspaceName('');
      setIsCreateDialogOpen(false);
      toast.success('Workspace created successfully');
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete workspace
  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    setIsLoading(true);

    try {
      // Remove from state
      const updatedWorkspaces = workspaces.filter(workspace => workspace.id !== workspaceToDelete.id);
      setWorkspaces(updatedWorkspaces);
      
      // Save to localStorage
      localStorage.setItem('odzai-workspaces', JSON.stringify(updatedWorkspaces));
      
      setIsDeleteDialogOpen(false);
      setWorkspaceToDelete(null);
      
      // If we're deleting the current workspace, clear the selection
      if (currentWorkspace?.id === workspaceToDelete.id) {
        localStorage.removeItem('odzai-current-workspace');
        router.push('/');
      }
      
      toast.success('Workspace deleted successfully');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    } finally {
      setIsLoading(false);
    }
  };

  // Open workspace
  const handleOpenWorkspace = async (workspaceId: string) => {
    setIsLoading(true);
    
    try {
      const success = await loadWorkspace(workspaceId);
      
      if (success) {
        toast.success('Workspace loaded successfully');
        router.push('/transactions');
      } else {
        toast.error('Failed to load workspace');
      }
    } catch (error) {
      console.error('Error opening workspace:', error);
      toast.error('Failed to open workspace');
    } finally {
      setIsLoading(false);
    }
  };

  // Import workspace
  const handleImportWorkspace = () => {
    // In a real app, this would open a file picker and import a workspace file
    setIsImporting(true);
    
    setTimeout(() => {
      const importedWorkspace: Workspace = {
        id: `imported-workspace-${Date.now()}`,
        name: 'Imported Workspace',
        lastOpened: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        size: '3.2',
        path: `/data/imported-workspace-${Date.now()}`,
        transactions: 175,
        accounts: 4
      };
      
      const updatedWorkspaces = [...workspaces, importedWorkspace];
      setWorkspaces(updatedWorkspaces);
      
      // Save to localStorage
      localStorage.setItem('odzai-workspaces', JSON.stringify(updatedWorkspaces));
      
      toast.success('Workspace imported successfully');
      setIsImporting(false);
    }, 1500);
  };

  // Export workspace
  const handleExportWorkspace = (workspaceId: string) => {
    setIsExporting(true);
    
    setTimeout(() => {
      toast.success('Workspace exported successfully');
      setIsExporting(false);
    }, 1000);
  };

  // Sort workspaces
  const handleSort = (column: keyof Workspace) => {
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  // Get sorted workspaces
  const getSortedWorkspaces = () => {
    return [...workspaces].sort((a, b) => {
      if (sortBy === 'name') {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'lastOpened' || sortBy === 'createdAt') {
        return sortDirection === 'asc'
          ? new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime()
          : new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime();
      } else if (sortBy === 'size') {
        return sortDirection === 'asc'
          ? parseFloat(a.size) - parseFloat(b.size)
          : parseFloat(b.size) - parseFloat(a.size);
      }
      return 0;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage application settings and workspaces</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="workspaces" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Workspaces</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="workspaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Management</CardTitle>
              <CardDescription>
                Create, edit, and manage your workspaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)} 
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Workspace
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleImportWorkspace} 
                    disabled={isImporting}
                    className="flex items-center gap-2"
                  >
                    <FileUp className="h-4 w-4" />
                    Import Workspace
                    {isImporting && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-1 font-medium"
                          >
                            Name
                            {sortBy === 'name' && (
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('lastOpened')}
                            className="flex items-center gap-1 font-medium"
                          >
                            Last Opened
                            {sortBy === 'lastOpened' && (
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('createdAt')}
                            className="flex items-center gap-1 font-medium"
                          >
                            Created
                            {sortBy === 'createdAt' && (
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('size')}
                            className="flex items-center gap-1 font-medium"
                          >
                            Size
                            {sortBy === 'size' && (
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : getSortedWorkspaces().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No workspaces found. Create a workspace to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        getSortedWorkspaces().map((workspace) => (
                          <TableRow key={workspace.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-muted-foreground" />
                                <span>{workspace.name}</span>
                                {currentWorkspace?.id === workspace.id && (
                                  <span className="ml-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(workspace.lastOpened)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(workspace.createdAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-muted-foreground" />
                                <span>{workspace.size} MB</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenWorkspace(workspace.id)}
                                  disabled={isLoading || currentWorkspace?.id === workspace.id}
                                  className="h-8"
                                >
                                  <FolderOpen className="h-4 w-4 mr-1" />
                                  {currentWorkspace?.id === workspace.id ? 'Current' : 'Open'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExportWorkspace(workspace.id)}
                                  disabled={isExporting}
                                  className="h-8"
                                >
                                  <FileDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setWorkspaceToDelete(workspace);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={isLoading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-muted-foreground border-t pt-6">
              <div>
                Total Workspaces: {workspaces.length}
              </div>
              <div>
                Total Size: {workspaces.reduce((sum, workspace) => sum + parseFloat(workspace.size), 0).toFixed(2)} MB
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Account settings functionality will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">General settings functionality will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                View system information and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">System information functionality will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Workspace Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
            <Button 
              type="submit" 
              onClick={handleCreateWorkspace}
              disabled={!newWorkspaceName.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the workspace "{workspaceToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkspace}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 