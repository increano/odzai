'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase/client';
import { Workspace, UserPreferences } from '@/lib/supabase/workspace';
import { storage } from '@/lib/storage';

const DEFAULT_WORKSPACE_COLOR = '#3B82F6';

interface WorkspaceContextType {
  isWorkspaceLoaded: boolean;
  loadWorkspace: (id: string) => Promise<void>;
  currentWorkspaceId: string | null;
  loadingWorkspace: boolean;
  currentWorkspace: Workspace | null;
  setAsDefaultWorkspace: (id: string) => Promise<void>;
  clearDefaultWorkspace: () => Promise<void>;
  isDefaultWorkspace: (id: string) => boolean;
  refreshCurrentWorkspace: () => Promise<boolean>;
}

interface WorkspaceProviderProps {
  children: ReactNode;
  initialPreferences: UserPreferences | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export function WorkspaceProvider({ children, initialPreferences }: WorkspaceProviderProps) {
  const [isWorkspaceLoaded, setIsWorkspaceLoaded] = useState(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [defaultWorkspaceId, setDefaultWorkspaceId] = useState<string | null>(
    initialPreferences?.default_workspace_id || null
  );
  const router = useRouter();
  const supabase = createBrowserClient();

  const loadWorkspaceData = async (id: string) => {
    console.log('Loading workspace data for ID:', id);
    try {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_users!inner (
            user_id,
            access_level
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching workspace:', error);
        return;
      }

      if (!workspace) {
        console.error('Workspace not found');
        return;
      }

      setCurrentWorkspace({
        id: workspace.id,
        name: workspace.name,
        display_name: workspace.display_name || workspace.name,
        color: workspace.color || DEFAULT_WORKSPACE_COLOR,
        owner_id: workspace.owner_id,
        created_at: workspace.created_at,
        updated_at: workspace.updated_at,
        access_level: workspace.workspace_users[0].access_level
      });
      setCurrentWorkspaceId(id);
      setIsWorkspaceLoaded(true);
    } catch (error) {
      console.error('Error loading workspace data:', error);
    }
  };

  // Function to set a workspace as default
  const setAsDefaultWorkspace = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ default_workspace_id: id }, { onConflict: 'user_id' });

      if (error) throw error;
      setDefaultWorkspaceId(id);
      toast.success('Default workspace updated');
    } catch (error) {
      console.error('Error setting default workspace:', error);
      toast.error('Failed to update default workspace');
    }
  };

  // Function to clear default workspace
  const clearDefaultWorkspace = async () => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ default_workspace_id: null }, { onConflict: 'user_id' });

      if (error) throw error;
      setDefaultWorkspaceId(null);
      toast.success('Default workspace cleared');
    } catch (error) {
      console.error('Error clearing default workspace:', error);
      toast.error('Failed to clear default workspace');
    }
  };

  // Check if a workspace is the default one
  const isDefaultWorkspace = (id: string) => {
    return defaultWorkspaceId === id;
  };

  // Load workspace
  const loadWorkspace = async (id: string) => {
    setLoadingWorkspace(true);
    try {
      await loadWorkspaceData(id);
      storage.set('odzai-current-workspace', id);
      router.push('/');
    } catch (error) {
      console.error('Error loading workspace:', error);
      toast.error('Failed to load workspace');
    } finally {
      setLoadingWorkspace(false);
    }
  };

  // Initialize workspace on mount
  useEffect(() => {
    const initializeWorkspace = async () => {
      console.log('Initializing workspace...');
      if (typeof window !== 'undefined') {
        try {
          // First check if we want to force a logout - useful for debugging
          const forceLogout = new URLSearchParams(window.location.search).get('forceLogout');
          if (forceLogout === 'true') {
            console.log('Force logout requested, clearing storage');
            storage.remove('odzai-current-workspace');
            return;
          }
          
          // First check storage for current workspace
          const storedWorkspaceId = storage.get<string>('odzai-current-workspace');
          console.log('Stored workspace ID from storage:', storedWorkspaceId);
          
          // Only proceed with storage if we're sure it has a value
          if (storedWorkspaceId && storedWorkspaceId.trim() !== '') {
            console.log('Loading workspace from storage:', storedWorkspaceId);
            await loadWorkspaceData(storedWorkspaceId);
            return;
          }
          
          // If no valid workspace in storage, use default workspace from preferences
          if (defaultWorkspaceId) {
            console.log('Loading default workspace:', defaultWorkspaceId);
            await loadWorkspaceData(defaultWorkspaceId);
            storage.set('odzai-current-workspace', defaultWorkspaceId);
          } else {
            console.log('No default workspace found, user will need to select one');
          }
        } catch (error) {
          console.error('Error during workspace initialization:', error);
        }
      }
    };

    initializeWorkspace();
  }, [defaultWorkspaceId]);

  // Refresh current workspace data without navigation
  const refreshCurrentWorkspace = async () => {
    if (currentWorkspaceId) {
      try {
        await loadWorkspaceData(currentWorkspaceId);
        return true;
      } catch (error) {
        console.error('Error refreshing workspace data:', error);
      }
    }
    return false;
  };

  return (
    <WorkspaceContext.Provider 
      value={{ 
        isWorkspaceLoaded, 
        loadWorkspace, 
        currentWorkspaceId,
        loadingWorkspace,
        currentWorkspace,
        setAsDefaultWorkspace,
        clearDefaultWorkspace,
        isDefaultWorkspace,
        refreshCurrentWorkspace
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
} 