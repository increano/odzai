"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { useWorkspace } from "./WorkspaceProvider";
import { toast } from "sonner";
import { 
  Settings, 
  Users, 
  Lock, 
  BellRing, 
  Globe,
  Download, 
  Upload, 
  Brush, 
  Calendar, 
  DollarSign, 
  Upload as UploadIcon,
  UserCog,
  Sliders,
  Share2,
  Plug,
  Cog,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  X
} from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

interface Workspace {
  id: string;
  name: string;
  size?: number;
  created?: string;
  status?: 'active' | 'inactive';
}

// Helper component for section headings
const SectionHeading = ({ title }: { title: string }) => (
  <div className="px-3 pt-5 pb-2 text-left">
    <h3 className="text-xs font-semibold text-muted-foreground tracking-wider">
      {title}
    </h3>
  </div>
);

const SettingsModal = ({ open, onOpenChange, defaultTab = "account" }: SettingsModalProps) => {
  // Get workspace context
  const { currentWorkspaceId, loadWorkspace } = useWorkspace();
  
  // Initial state values
  const [workspaceName, setWorkspaceName] = useState("Fabrice Muhirwa's Notion");
  const [workspaceIcon, setWorkspaceIcon] = useState("/placeholder-icon.png");
  
  // Using a state object to track the original values before changes
  const [originalValues, setOriginalValues] = useState({
    workspaceName: "Fabrice Muhirwa's Notion",
    workspaceIcon: "/placeholder-icon.png"
  });
  
  // State to track whether to show changes live
  const [liveChanges, setLiveChanges] = useState(false);
  
  // Add user profile state
  const [username, setUsername] = useState("fmuhirwa");
  const [profilePicture, setProfilePicture] = useState("/placeholder-avatar.png");
  
  // Delete account modal state
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const userEmail = "fmuhirwa@gmail.com"; // This would come from user data
  
  // Delete workspace modal state
  const [deleteWorkspaceModalOpen, setDeleteWorkspaceModalOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string>("");
  const [confirmWorkspaceName, setConfirmWorkspaceName] = useState("");
  
  // Workspaces state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(currentWorkspaceId || '');
  
  // New workspace modal state
  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  
  // The values to display are either the current values (if live changes)
  // or the original values (if not live changes)
  const displayName = liveChanges ? workspaceName : originalValues.workspaceName;
  const displayIcon = liveChanges ? workspaceIcon : originalValues.workspaceIcon;

  // Function to handle profile picture error and show initials instead
  const handleProfilePictureError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "";
    e.currentTarget.alt = username.substring(0, 2).toUpperCase();
  };

  // Function to fetch workspaces when the dialog is opened
  useEffect(() => {
    if (open) {
      fetchWorkspaces();
    }
  }, [open]);

  // Update selectedWorkspaceId when currentWorkspaceId changes
  useEffect(() => {
    if (currentWorkspaceId) {
      setSelectedWorkspaceId(currentWorkspaceId);
    }
  }, [currentWorkspaceId]);

  // Fetch workspaces from the API
  const fetchWorkspaces = async () => {
    setIsLoadingWorkspaces(true);
    setWorkspacesError(null);

    try {
      const response = await fetch('/api/budgets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }
      
      const data = await response.json();
      
      // Transform the data to match our Workspace interface
      const formattedWorkspaces = data.map((workspace: any) => {
        // Calculate a random size in MB (1-10 MB range)
        const randomSize = (Math.random() * 9 + 1).toFixed(1);
        
        // Generate a random date within the last 6 months
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const randomTimestamp = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
        const randomDate = new Date(randomTimestamp);
        
        // Format the date
        const formattedDate = randomDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        return {
          id: workspace.id,
          name: workspace.name,
          size: parseFloat(randomSize),
          created: formattedDate,
          status: Math.random() > 0.3 ? 'active' : 'inactive'
        };
      });
      
      setWorkspaces(formattedWorkspaces);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      setWorkspacesError(error instanceof Error ? error.message : 'Failed to load workspaces');
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  const handleSave = () => {
    // Update the original values with current values
    setOriginalValues({
      workspaceName: workspaceName,
      workspaceIcon: workspaceIcon
    });
    
    // Here we would persist changes to backend
    // For now, just close the modal
    onOpenChange(false);
  };
  
  const handleDeleteAccount = () => {
    // Handle actual account deletion
    // This would make API calls to delete the account
    console.log("Account deleted");
    setDeleteAccountModalOpen(false);
    onOpenChange(false);
  };
  
  const handleDeleteWorkspace = () => {
    // Handle actual workspace deletion
    console.log(`Workspace "${workspaceToDelete}" deleted`);
    setDeleteWorkspaceModalOpen(false);
    setWorkspaceToDelete("");
    setConfirmWorkspaceName("");
  };
  
  const openDeleteWorkspaceModal = (workspaceName: string) => {
    setWorkspaceToDelete(workspaceName);
    setDeleteWorkspaceModalOpen(true);
  };

  // Handle workspace switch
  const handleSwitchWorkspace = () => {
    if (selectedWorkspaceId && selectedWorkspaceId !== currentWorkspaceId) {
      loadWorkspace(selectedWorkspaceId);
      toast.success(`Switching to workspace: ${workspaces.find(w => w.id === selectedWorkspaceId)?.name}`);
    }
  };

  // Handle creating a new workspace
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error("Workspace name cannot be empty");
      return;
    }
    
    setIsCreatingWorkspace(true);
    
    try {
      // Create a new workspace via API
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWorkspaceName.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create workspace');
      }
      
      const data = await response.json();
      
      // Refresh the workspaces list
      fetchWorkspaces();
      
      // Close the modal and reset the form
      setCreateWorkspaceModalOpen(false);
      setNewWorkspaceName("");
      
      toast.success(`Workspace "${newWorkspaceName.trim()}" created successfully`);
      
      // Optionally switch to the new workspace
      if (data.id) {
        loadWorkspace(data.id);
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create workspace');
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl">Settings</DialogTitle>
            <DialogDescription>
              Configure your workspace, account, and application preferences
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={defaultTab} className="flex flex-1 overflow-hidden">
            <div className="w-64 border-r p-4 space-y-1 overflow-y-auto">
              <TabsList className="flex flex-col h-auto bg-transparent p-0 items-start justify-start">
                {/* Account Section */}
                <SectionHeading title="ACCOUNT" />
                <TabsTrigger 
                  value="account" 
                  className="w-full justify-start px-3 py-2 gap-3 text-sm h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    <img 
                      src={profilePicture} 
                      alt={username.substring(0, 2).toUpperCase()}
                      className="w-full h-full object-cover"
                      onError={handleProfilePictureError}
                    />
                  </div>
                  <span>{username}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="preferences" 
                  className="w-full justify-start px-3 py-2 gap-3 text-sm h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <UserCog className="h-5 w-5" />
                  <span>Preferences</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="w-full justify-start px-3 py-2 gap-3 text-sm h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <BellRing className="h-5 w-5" />
                  <span>Notifications</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="integrations" 
                  className="w-full justify-start px-3 py-2 gap-3 text-sm h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Plug className="h-5 w-5" />
                  <span>Integrations</span>
                </TabsTrigger>

                {/* Workspace Section */}
                <SectionHeading title="WORKSPACE" />
                <TabsTrigger 
                  value="general" 
                  className="w-full justify-start px-3 py-2 gap-3 text-sm h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Settings className="h-5 w-5" />
                  <span>General</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="members" 
                  className="w-full justify-start px-3 py-2 gap-3 text-sm h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Users className="h-5 w-5" />
                  <span>People</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sharing" 
                  className="w-full justify-start px-3 py-2 gap-3 text-sm h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Sharing</span>
                </TabsTrigger>
                {/* Other Section */}
                <SectionHeading title="OTHER" />
                <TabsTrigger 
                  value="import" 
                  className="w-full justify-start px-3 py-2 gap-3 text-sm h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Download className="h-5 w-5" />
                  <span>Import</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="export" 
                  className="w-full justify-start px-3 py-2 gap-3 text-sm h-auto data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Upload className="h-5 w-5" />
                  <span>Export</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              {/* General Tab Content (formerly workspace) */}
              <TabsContent value="general" className="mt-0 h-full overflow-y-auto p-6">
                {/* Inner Tabs for Sites/Settings */}
                <Tabs defaultValue="sites" className="w-full">
                  <div className="border-b mb-6">
                    <TabsList className="bg-transparent p-0 h-auto">
                      <TabsTrigger 
                        value="sites" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                      >
                        General
                      </TabsTrigger>
                      <TabsTrigger 
                        value="settings" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                      >
                        Settings
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  {/* Sites Tab Content */}
                  <TabsContent value="sites" className="mt-0 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h3 className="text-xl font-medium">General</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage your workspace
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto">
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v-4"></path>
                          <path d="M12 8h.01"></path>
                        </svg>
                        Learn more
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-base font-medium">Workspaces</h4>
                          <p className="text-sm text-muted-foreground">
                            Workspaces are separate environments for organizing your financial data and budgets.
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => setCreateWorkspaceModalOpen(true)}>New workspace</Button>
                      </div>
                      
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="text-left p-3 font-medium">Workspace</th>
                              <th className="text-left p-3 font-medium">Size (MB)</th>
                              <th className="text-left p-3 font-medium">Created</th>
                              <th className="text-left p-3 font-medium">Status</th>
                              <th className="text-right p-3 font-medium"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoadingWorkspaces ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center">
                                  <div className="flex justify-center items-center space-x-2">
                                    <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-primary animate-spin"></div>
                                    <span className="text-muted-foreground">Loading workspaces...</span>
                                  </div>
                                </td>
                              </tr>
                            ) : workspacesError ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-destructive">
                                  {workspacesError}
                                </td>
                              </tr>
                            ) : workspaces.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                  No workspaces found. Create your first workspace to get started.
                                </td>
                              </tr>
                            ) : (
                              workspaces.map(workspace => (
                                <tr key={workspace.id} className="border-b">
                                  <td className="p-3">
                                    <div className="flex items-center">
                                      <span>{workspace.name}</span>
                                      <Button variant="ghost" size="sm" className="p-1 h-auto ml-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                                        </svg>
                                      </Button>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span>{workspace.size}</span>
                                  </td>
                                  <td className="p-3">
                                    <span>{workspace.created}</span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center">
                                      <span className={`flex h-2 w-2 rounded-full ${workspace.status === 'active' ? 'bg-green-500' : 'bg-amber-500'} mr-2`}></span>
                                      <span>{workspace.status === 'active' ? 'Active' : 'Inactive'}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="p-1 h-auto">
                                          <MoreVertical className="h-5 w-5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {workspace.status === 'inactive' ? (
                                          <DropdownMenuItem className="flex gap-2 cursor-pointer">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                            <span>Activate</span>
                                          </DropdownMenuItem>
                                        ) : null}
                                        <DropdownMenuItem className="flex gap-2 cursor-pointer">
                                          <Pencil className="h-4 w-4" />
                                          <span>Update</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="flex gap-2 cursor-pointer text-destructive focus:text-destructive"
                                          onClick={() => openDeleteWorkspaceModal(workspace.name)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span>Delete</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Settings Tab Content */}
                  <TabsContent value="settings" className="mt-0 space-y-8">
                    <div>
                      <h3 className="text-xl font-medium">Workspace settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure your workspace appearance and access settings
                      </p>
                    </div>
                    
                    {/* Workspace Selector */}
                    <div className="space-y-4">
                      <h4 className="text-base font-medium border-b pb-2">Select workspace</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="relative w-full max-w-md">
                            {isLoadingWorkspaces ? (
                              <div className="flex items-center px-3 py-2 border rounded-md">
                                <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-primary animate-spin mr-2"></div>
                                <span className="text-muted-foreground">Loading workspaces...</span>
                              </div>
                            ) : (
                              <select 
                                className="w-full rounded-md border border-input py-2 pl-3 pr-10 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                value={selectedWorkspaceId || ''}
                                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                              >
                                {workspaces.length === 0 ? (
                                  <option value="" disabled>No workspaces available</option>
                                ) : (
                                  workspaces.map(workspace => (
                                    <option key={workspace.id} value={workspace.id}>
                                      {workspace.name}
                                    </option>
                                  ))
                                )}
                              </select>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isLoadingWorkspaces || workspaces.length === 0 || selectedWorkspaceId === currentWorkspaceId}
                            onClick={handleSwitchWorkspace}
                          >
                            Switch
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Select the workspace you want to configure
                        </p>
                      </div>
                    </div>
                    
                    {/* Workspace Name */}
                    <div className="space-y-4">
                      <h4 className="text-base font-medium border-b pb-2">Name</h4>
                      <div className="space-y-2">
                        <Input 
                          id="workspace-name" 
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          placeholder="Enter workspace name"
                          className="max-w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          You can use your organization or company name. Keep it simple.
                        </p>
                      </div>
                    </div>
                    
                    {/* Workspace Icon */}
                    <div className="space-y-4">
                      <h4 className="text-base font-medium border-b pb-2">Icon</h4>
                      <div className="flex items-start gap-4">
                        <div className="border rounded-md w-16 h-16 flex items-center justify-center overflow-hidden">
                          <img 
                            src={workspaceIcon} 
                            alt="Workspace icon" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "";
                              e.currentTarget.alt = workspaceName.substring(0, 2).toUpperCase();
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Button size="sm" variant="outline" className="flex gap-2">
                            <UploadIcon className="h-4 w-4" />
                            <span>Upload image</span>
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Upload an image or pick an emoji. It will show up in your sidebar and notifications.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Public Settings */}
                    <div className="space-y-4">
                      <h4 className="text-base font-medium border-b pb-2">Public settings</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email-domain">Allowed email domains</Label>
                        <Input 
                          id="email-domain" 
                          placeholder="Type an email domain..."
                          className="max-w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Anyone with email addresses at these domains can automatically join your workspace.
                        </p>
                      </div>
                    </div>
                    
                    {/* Export Section */}
                    <div className="space-y-4">
                      <h4 className="text-base font-medium border-b pb-2">Export</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">Export content</p>
                        </div>
                        <Button variant="outline" className="flex gap-2">
                          <Download className="h-4 w-4" />
                          <span>Export all workspace content</span>
                        </Button>
                      </div>
                      
                      <div className="space-y-3 pt-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium">Export members</p>
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">BUSINESS</span>
                        </div>
                        <Button variant="outline" className="flex gap-2">
                          <Download className="h-4 w-4" />
                          <span>Export members as CSV</span>
                        </Button>
                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                          </svg>
                          <span>Learn about exporting members</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Danger Zone */}
                    <div className="space-y-5 mt-12 border-t pt-8">
                      <h4 className="text-base font-medium text-destructive">Danger zone</h4>
                      
                      <div className="space-y-2 border border-destructive/20 rounded-md p-4 bg-destructive/5">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-destructive">Delete entire workspace</p>
                            <p className="text-sm text-muted-foreground">Permanently delete this workspace and all of its contents.</p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => openDeleteWorkspaceModal(workspaceName)}
                          >
                            Delete entire workspace
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Export Tab Content */}
              <TabsContent value="export" className="mt-0 h-full overflow-y-auto p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-medium">Export Content</h3>
                    <p className="text-sm text-muted-foreground">
                      Export your workspace data for backup or transfer
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4 bg-muted/30 rounded-lg border border-dashed">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-center">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Enhanced export options for your financial data are currently in development and will be available in a future update.
                    </p>
                    <Button variant="outline" className="mt-2" disabled>
                      Check back later
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Import Tab Content */}
              <TabsContent value="import" className="mt-0 h-full overflow-y-auto p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-medium">Import Content</h3>
                    <p className="text-sm text-muted-foreground">
                      Import data from other financial services and applications
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4 bg-muted/30 rounded-lg border border-dashed">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Download className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-center">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Advanced import capabilities from various financial institutions and applications are currently in development and will be available in a future update.
                    </p>
                    <Button variant="outline" className="mt-2" disabled>
                      Check back later
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Members Tab Content (now called People) */}
              <TabsContent value="members" className="mt-0 h-full overflow-y-auto p-6">
                <div className="space-y-6">
                  <div className="flex items-center">
                    <h3 className="text-xl font-medium">People</h3>
                    <div className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-muted-foreground">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Invite link section */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Invite link to add members</div>
                    <div className="text-xs text-muted-foreground">
                      Only people with permission to invite members can see this. You can also{" "}
                      <button className="text-primary underline underline-offset-2">generate a new link</button>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <div className="relative flex-1">
                        <Input 
                          value="https://workspace.odzai.com/invite/hf923hf923f2" 
                          readOnly
                          className="pr-24"
                        />
                        <Button 
                          className="absolute right-1 top-1 h-7 text-xs"
                          variant="ghost"
                          size="sm"
                        >
                          Copy link
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">Share link</div>
                        <Switch id="share-link" />
                      </div>
                    </div>
                  </div>
                  
                  {/* People tabs */}
                  <div className="border-b">
                    <Tabs defaultValue="members" className="w-full">
                      <div className="flex items-center justify-between">
                        <TabsList className="bg-transparent p-0 h-auto">
                          <TabsTrigger 
                            value="members" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                          >
                            Members <span className="ml-1 text-xs">1</span>
                          </TabsTrigger>
                          <TabsTrigger 
                            value="groups" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                          >
                            Groups
                          </TabsTrigger>
                          <TabsTrigger 
                            value="contacts" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                          >
                            Contacts
                          </TabsTrigger>
                        </TabsList>
                        
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8"></circle>
                              <path d="m21 21-4.3-4.3"></path>
                            </svg>
                            <Input
                              placeholder="Search people..."
                              className="w-full pl-9 h-9"
                            />
                          </div>
                          
                          <Button className="ml-auto">
                            Add members
                            <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m6 9 6 6 6-6"></path>
                            </svg>
                          </Button>
                        </div>
                      </div>
                      
                      <TabsContent value="members" className="mt-8">
                        <p className="text-sm text-muted-foreground mb-4">
                          Manage workspace members and their roles. Add new members or update permissions for existing ones.
                        </p>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                              <tr>
                                <th className="text-left p-3 font-medium">Name</th>
                                <th className="text-left p-3 font-medium">Workspaces</th>
                                <th className="text-left p-3 font-medium">Role</th>
                                <th className="text-left p-3 font-medium">Groups</th>
                                <th className="text-right p-3 font-medium"></th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="p-3">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                      <span className="font-medium text-sm">FM</span>
                                    </div>
                                    <div>
                                      <p className="font-medium">Fabrice Muhirwa</p>
                                      <p className="text-xs text-muted-foreground">fmuhirwa@gmail.com</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="border px-2 flex items-center gap-1 h-7 rounded-md hover:bg-accent">
                                        <span>3 workspaces</span>
                                        <svg 
                                          className="h-4 w-4 text-muted-foreground" 
                                          xmlns="http://www.w3.org/2000/svg" 
                                          viewBox="0 0 24 24" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        >
                                          <path d="M6 9l6 6 6-6" />
                                        </svg>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                        Member of:
                                      </div>
                                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span>Personal Budget</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span>Family Expenses</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                        <span>Business Finances</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                                <td className="p-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="border px-2 flex items-center gap-1 h-7 rounded-md hover:bg-accent">
                                        <span>Admin</span>
                                        <svg 
                                          className="h-4 w-4 text-muted-foreground" 
                                          xmlns="http://www.w3.org/2000/svg" 
                                          viewBox="0 0 24 24" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        >
                                          <path d="M6 9l6 6 6-6" />
                                        </svg>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-72">
                                      <div className="py-1.5 px-2 bg-background border-b">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">Workspace owner</span>
                                          <svg 
                                            className="h-4 w-4 text-primary" 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                          >
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Can change workspace settings and invite new members to the workspace.
                                        </p>
                                      </div>
                                      <div className="py-1.5 px-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center">
                                            <span className="font-medium">Member</span>
                                            <span className="ml-2 text-xs text-primary px-1.5 py-0.5 bg-primary/10 rounded">PLUS</span>
                                          </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Cannot change workspace settings or invite new members to the workspace.
                                        </p>
                                      </div>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                                        Leave workspace
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                                <td className="p-3">
                                  <span>No groups</span>
                                </td>
                                <td className="p-3 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="p-1 h-auto">
                                        <MoreVertical className="h-5 w-5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem className="flex gap-2 cursor-pointer">
                                        <Pencil className="h-4 w-4" />
                                        <span>Edit permissions</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="flex gap-2 cursor-pointer text-destructive focus:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                        <span>Remove</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="groups" className="mt-8">
                        <p className="text-sm text-muted-foreground mb-4">
                          Set up groups to streamline page permissions and manage members in bulk.
                        </p>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                              <tr>
                                <th className="text-left p-3 font-medium">Group Name</th>
                                <th className="text-left p-3 font-medium">Members</th>
                                <th className="text-left p-3 font-medium">Created</th>
                                <th className="text-left p-3 font-medium">Status</th>
                                <th className="text-right p-3 font-medium"></th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="p-3 text-muted-foreground text-center" colSpan={5}>
                                  <div className="flex flex-col items-center justify-center py-8">
                                    <div className="h-12 w-12 rounded-full bg-muted-foreground/20 flex items-center justify-center mb-4">
                                      <Users className="h-6 w-6 text-muted-foreground/70" />
                                    </div>
                                    <p className="mb-4">No groups yet</p>
                                    <Button variant="outline" size="sm">
                                      Create group
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="contacts" className="mt-8">
                        <p className="text-sm text-muted-foreground mb-4">
                          Import and manage your contacts to easily invite them to your workspaces or share content.
                        </p>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                              <tr>
                                <th className="text-left p-3 font-medium">Name</th>
                                <th className="text-left p-3 font-medium">Email</th>
                                <th className="text-left p-3 font-medium">Source</th>
                                <th className="text-left p-3 font-medium">Added</th>
                                <th className="text-right p-3 font-medium"></th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="p-3 text-muted-foreground text-center" colSpan={5}>
                                  <div className="flex flex-col items-center justify-center py-8">
                                    <div className="h-12 w-12 rounded-full bg-muted-foreground/20 flex items-center justify-center mb-4">
                                      <Users className="h-6 w-6 text-muted-foreground/70" />
                                    </div>
                                    <p className="mb-4">No contacts yet</p>
                                    <Button variant="outline" size="sm">
                                      Import contacts
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </TabsContent>

              {/* Preferences Tab Content */}
              <TabsContent value="preferences" className="mt-0 h-full overflow-y-auto p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-medium">Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure your personal settings
                    </p>
                  </div>
                  
                  {/* Appearance Section */}
                  <div className="space-y-5">
                    <h4 className="text-base font-medium border-b pb-2">Appearance</h4>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Theme</p>
                          <p className="text-xs text-muted-foreground">Customize how Odzai looks on your device</p>
                        </div>
                        <select className="bg-background border rounded px-2 py-1 text-sm">
                          <option>System default</option>
                          <option>Light</option>
                          <option>Dark</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Compact mode</p>
                          <p className="text-xs text-muted-foreground">Use less whitespace in the interface</p>
                        </div>
                        <Switch id="compact-mode" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Language & Time Section */}
                  <div className="space-y-5">
                    <h4 className="text-base font-medium border-b pb-2">Language & Time</h4>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Language</p>
                          <p className="text-xs text-muted-foreground">Change the language used in the interface</p>
                        </div>
                        <select className="bg-background border rounded px-2 py-1 text-sm">
                          <option>English</option>
                          <option>French</option>
                          <option>Spanish</option>
                          <option>German</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Start week on Monday</p>
                          <p className="text-xs text-muted-foreground">This will change how all calendars in your app look</p>
                        </div>
                        <Switch id="monday-first" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Set timezone automatically</p>
                          <p className="text-xs text-muted-foreground">Use your device location to set the timezone</p>
                        </div>
                        <Switch id="auto-timezone" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Timezone</p>
                          <p className="text-xs text-muted-foreground">Current timezone setting</p>
                        </div>
                        <select className="bg-background border rounded px-2 py-1 text-sm">
                          <option>(GMT+2:00) Brussels</option>
                          <option>(GMT+0:00) London</option>
                          <option>(GMT-5:00) New York</option>
                          <option>(GMT-8:00) Los Angeles</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Currency Section */}
                  <div className="space-y-5">
                    <h4 className="text-base font-medium border-b pb-2">Currency</h4>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Default currency</p>
                          <p className="text-xs text-muted-foreground">Used for budgeting and transactions</p>
                        </div>
                        <select className="bg-background border rounded px-2 py-1 text-sm">
                          <option>USD ($)</option>
                          <option>EUR (€)</option>
                          <option>GBP (£)</option>
                          <option>JPY (¥)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Show cents/decimals</p>
                          <p className="text-xs text-muted-foreground">Display decimal places in amounts</p>
                        </div>
                        <Switch id="show-decimals" defaultChecked={true} />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Currency position</p>
                          <p className="text-xs text-muted-foreground">Where to display the currency symbol</p>
                        </div>
                        <select className="bg-background border rounded px-2 py-1 text-sm">
                          <option>Before amount ($100)</option>
                          <option>After amount (100$)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Integrations Tab Content */}
              <TabsContent value="integrations" className="mt-0 h-full overflow-y-auto p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-medium">Integrations</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect external services and tools with your Odzai account
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4 bg-muted/30 rounded-lg border border-dashed">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plug className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-center">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Integrations with banks, financial services, and other tools are currently in development and will be available in a future update.
                    </p>
                    <Button variant="outline" className="mt-2" disabled>
                      Check back later
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Notifications Tab Content */}
              <TabsContent value="notifications" className="mt-0 h-full overflow-y-auto p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-medium">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage how you receive notifications
                    </p>
                  </div>
                  
                  {/* Mobile Push Notifications */}
                  <div className="space-y-5">
                    <h4 className="text-base font-medium border-b pb-2">Mobile push notifications</h4>
                    
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-sm font-medium">Mobile push notifications</p>
                        <p className="text-sm text-muted-foreground">Receive push notifications on mentions and comments via your mobile app</p>
                      </div>
                      <Switch id="mobile-push" />
                    </div>
                  </div>
                  
                  {/* Email Notifications */}
                  <div className="space-y-5">
                    <h4 className="text-base font-medium border-b pb-2">Email notifications</h4>
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Activity in your workspace</p>
                          <p className="text-sm text-muted-foreground">Receive emails when you get comments, mentions, page invites, reminders, access requests, and property changes</p>
                        </div>
                        <Switch id="activity-notifications" />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Page updates</p>
                          <p className="text-sm text-muted-foreground">Receive email digests for changes to pages you're subscribed to</p>
                        </div>
                        <Switch id="page-updates" />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Workspace digest</p>
                          <p className="text-sm text-muted-foreground">Receive email digests of what's happening in your workspace</p>
                        </div>
                        <Switch id="workspace-digest" />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Announcements and update emails</p>
                          <p className="text-sm text-muted-foreground">Receive occasional emails about product launches and new features from Odzai</p>
                        </div>
                        <Switch id="announcement-emails" />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button variant="outline" className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span>Manage settings</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-3">
                    <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </svg>
                      <span>Learn about notifications</span>
                    </button>
                  </div>
                </div>
              </TabsContent>

              {/* Add Account Tab Content */}
              <TabsContent value="account" className="mt-0 h-full overflow-y-auto p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-medium">Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your profile and account security
                    </p>
                  </div>
                  
                  {/* Profile Section */}
                  <div className="space-y-5">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border">
                          <img 
                            src={profilePicture} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={handleProfilePictureError}
                          />
                        </div>
                        <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm hover:bg-primary/90 transition-colors">
                          <Upload className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="username" className="text-sm text-muted-foreground">Username</Label>
                          <Input
                            id="username"
                            className="max-w-xs"
                            value={username}
                            onChange={(e) => {
                              // Remove spaces and special characters
                              const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                              setUsername(value);
                            }}
                            placeholder="Enter your username"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Username must be unique, without spaces or special characters
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="display-name" className="text-sm text-muted-foreground">Display name</Label>
                          <Input
                            id="display-name"
                            className="max-w-xs"
                            defaultValue="Fabrice Muhirwa"
                            placeholder="Enter your display name"
                          />
                        </div>
                        <button className="text-xs text-primary hover:underline">
                          Create your portrait
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Account Security Section */}
                  <div className="space-y-5">
                    <h4 className="text-base font-medium border-b pb-2">Account security</h4>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{userEmail}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Change email
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Password</p>
                          <p className="text-sm text-muted-foreground">Set a permanent password to login to your account.</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Add password
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">2-step verification</p>
                          <p className="text-sm text-muted-foreground">Add an additional layer of security to your account during login.</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Add verification method
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Passkeys</p>
                          <p className="text-sm text-muted-foreground">Securely sign-in with on-device biometric authentication.</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Add passkey
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Devices Section */}
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-base font-medium border-b pb-2">Devices</h4>
                      <Button variant="outline" size="sm">
                        Log out of all devices
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">Log out of all other active sessions on other devices besides this one.</p>
                    
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium">Device Name</th>
                            <th className="text-left p-3 text-sm font-medium">Last Active</th>
                            <th className="text-left p-3 text-sm font-medium">Location</th>
                            <th className="text-right p-3 text-sm font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr className="bg-muted/20">
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line></svg>
                                </div>
                                <div>
                                  <p>Mac OS X</p>
                                  <p className="text-xs text-primary">This Device</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm">Now</td>
                            <td className="p-3 text-sm">Brussels, BE-BRU, Belgium</td>
                            <td className="p-3 text-right"></td>
                          </tr>
                          <tr>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line></svg>
                                </div>
                                <div>
                                  <p>Mac OS X</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm">Jan 27, 2024, 7:55 PM</td>
                            <td className="p-3 text-sm">Brussels Capital, Belgium</td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="sm">Log out</Button>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line></svg>
                                </div>
                                <div>
                                  <p>Mac OS X</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm">Feb 1, 2024, 6:21 PM</td>
                            <td className="p-3 text-sm">Brussels, Brussels Capital, Belgium</td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="sm">Log out</Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg>
                      Load 12 more devices
                    </button>
                  </div>
                  
                  {/* Danger Zone Section */}
                  <div className="space-y-5 mt-12 border-t pt-8">
                    <h4 className="text-base font-medium text-destructive">Danger Zone</h4>
                    
                    <div className="space-y-2 border border-destructive/20 rounded-md p-4 bg-destructive/5">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-destructive">Delete my account</p>
                          <p className="text-sm text-muted-foreground">Permanently delete the account and remove access from all workspaces.</p>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setDeleteAccountModalOpen(true)}
                        >
                          Delete account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Sharing Tab Content */}
              <TabsContent value="sharing" className="mt-0 h-full overflow-y-auto p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-medium">Teamspace settings</h3>
                    <div className="flex items-center mt-1">
                      <svg className="h-4 w-4 text-muted-foreground mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </svg>
                      <span className="text-sm text-muted-foreground">Learn about teamspaces</span>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-border"></div>
                  
                  {/* Default teamspaces */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-medium">Default teamspaces</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose teamspaces that all new and current workspace members will automatically join
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/50">
                        <div className="h-5 w-5 rounded bg-orange-600 flex items-center justify-center text-white text-xs">
                          G
                        </div>
                        <span className="text-sm">General</span>
                      </div>
                      <Button variant="default" size="sm">
                        Update
                      </Button>
                    </div>
                  </div>
                  
                  {/* Limit teamspace creation */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-base font-medium">Limit teamspace creation to only workspace owners</h4>
                        <p className="text-sm text-muted-foreground">
                          Only allow workspace owners to create teamspaces
                        </p>
                      </div>
                      <Switch id="limit-teamspace-creation" />
                    </div>
                  </div>
                  
                  {/* Manage teamspaces */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-base font-medium">Manage teamspaces</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage all teamspaces you have access to here
                        </p>
                      </div>
                      <Button variant="outline">New teamspace</Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.3-4.3"></path>
                          </svg>
                          <Input 
                            placeholder="Search teamspaces..."
                            className="pl-9"
                          />
                        </div>
                      </div>
                      
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="text-left p-3 font-medium">Teamspace</th>
                              <th className="text-left p-3 font-medium">Owners</th>
                              <th className="text-left p-3 font-medium">Access</th>
                              <th className="text-left p-3 font-medium">Updated</th>
                              <th className="text-right p-3 font-medium"></th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-3">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded bg-orange-600 flex items-center justify-center text-white text-xs mr-3">
                                    G
                                  </div>
                                  <div>
                                    <p className="font-medium">General</p>
                                    <p className="text-xs text-muted-foreground">1 member · Joined</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                    <span className="font-medium text-xs">FM</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <Button variant="ghost" size="sm" className="border px-2 flex items-center gap-1 h-7 rounded-md hover:bg-accent">
                                  <span>Default</span>
                                  <svg 
                                    className="h-4 w-4 text-muted-foreground" 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  >
                                    <path d="m6 9 6 6 6-6" />
                                  </svg>
                                </Button>
                              </td>
                              <td className="p-3">
                                <span className="text-muted-foreground">9/2/22</span>
                              </td>
                              <td className="p-3 text-right">
                                <Button variant="ghost" size="sm" className="p-1 h-auto">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteAccountModalOpen} onOpenChange={setDeleteAccountModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-lg text-center">Delete your entire account permanently?</DialogTitle>
            <DialogDescription className="text-center">
              This action cannot be undone. This will permanently delete your entire account. 
              All private workspaces will be deleted, and you will be removed from all shared workspaces.
            </DialogDescription>
          </div>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-email" className="text-sm">
                Please type in your email to confirm.
              </Label>
              <Input 
                id="confirm-email" 
                placeholder={userEmail}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={confirmEmail !== userEmail}
                onClick={handleDeleteAccount}
              >
                Permanently delete account
              </Button>
              
              <Button
                variant="secondary"
                className="w-full bg-black text-white hover:bg-black/80"
                onClick={() => setDeleteAccountModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Confirmation Dialog */}
      <Dialog open={deleteWorkspaceModalOpen} onOpenChange={setDeleteWorkspaceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-lg text-center">Delete this workspace permanently?</DialogTitle>
            <DialogDescription className="text-center">
              This action cannot be undone. This will permanently delete the "{workspaceToDelete}" workspace.
              All data, accounts, and transactions in this workspace will be lost.
            </DialogDescription>
          </div>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-workspace" className="text-sm">
                Please type <span className="font-semibold">{workspaceToDelete}</span> to confirm.
              </Label>
              <Input 
                id="confirm-workspace" 
                placeholder={workspaceToDelete}
                value={confirmWorkspaceName}
                onChange={(e) => setConfirmWorkspaceName(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={confirmWorkspaceName !== workspaceToDelete}
                onClick={handleDeleteWorkspace}
              >
                Permanently delete workspace
              </Button>
              
              <Button
                variant="secondary"
                className="w-full bg-black text-white hover:bg-black/80"
                onClick={() => setDeleteWorkspaceModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Workspace Modal */}
      <Dialog open={createWorkspaceModalOpen} onOpenChange={setCreateWorkspaceModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create new workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your financial data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                placeholder="Enter workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                disabled={isCreatingWorkspace}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateWorkspaceModalOpen(false)}
              disabled={isCreatingWorkspace}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkspace}
              disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
            >
              {isCreatingWorkspace ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-current animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create workspace'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsModal; 