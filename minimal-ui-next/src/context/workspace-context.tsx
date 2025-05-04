'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

interface Workspace {
  id: string;
  name: string;
  lastOpened: string;
  createdAt: string;
  size: string;
  path: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  loadWorkspace: (workspaceId: string) => Promise<boolean>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load current workspace from localStorage on initial render
  useEffect(() => {
    const loadInitialWorkspace = async () => {
      // Check if any workspace is loaded via the API
      try {
        const response = await fetch('/api/workspaces/status');
        const status = await response.json();
        
        if (!status.workspaceLoaded) {
          // Only redirect on protected routes
          if (pathname !== '/' && pathname !== '/budgets') {
            // Redirect to home if no workspace is selected
            router.push('/');
            return;
          }
        } else {
          // A workspace is loaded, but we need to get its details
          const currentWorkspaceId = localStorage.getItem('odzai-current-workspace');
          if (currentWorkspaceId) {
            const workspacesResponse = await fetch('/api/workspaces');
            const workspaces = await workspacesResponse.json();
            const workspace = workspaces.find((w: Workspace) => w.id === currentWorkspaceId);
            
            if (workspace) {
              setCurrentWorkspace(workspace);
            }
          }
        }
      } catch (error) {
        console.error('Error checking workspace status:', error);
      }
    };
    
    loadInitialWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWorkspace = async (workspaceId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Load budget with the API
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
      
      // Get the workspace details
      const workspacesResponse = await fetch('/api/workspaces');
      const workspaces = await workspacesResponse.json();
      const workspace = workspaces.find((w: Workspace) => w.id === workspaceId);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      // Update last opened timestamp (only in our UI model)
      const updatedWorkspace = {
        ...workspace,
        lastOpened: new Date().toISOString()
      };
      
      // Store current selection in localStorage
      localStorage.setItem('odzai-current-workspace', workspaceId);
      
      // Set as current workspace
      setCurrentWorkspace(updatedWorkspace);
      return true;
    } catch (error: any) {
      console.error('Error loading workspace:', error);
      toast.error(error.message || 'Failed to load workspace');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ currentWorkspace, setCurrentWorkspace, loadWorkspace, isLoading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
} 