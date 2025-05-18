'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { navigate, NavigationType, navigateAfterModalClose, TIMING } from '../lib/navigation'
import { storage } from '../lib/storage'

interface Workspace {
  id: string
  name: string
  color: string
  originalName?: string // Add this to store the original full ID
  displayName?: string // Add this to store the clean display name
}

interface WorkspaceContextType {
  isWorkspaceLoaded: boolean
  loadWorkspace: (id: string) => void
  currentWorkspaceId: string | null
  loadingWorkspace: boolean
  currentWorkspace: Workspace | null
  setAsDefaultWorkspace: (id: string) => Promise<boolean>
  clearDefaultWorkspace: () => Promise<boolean>
  isDefaultWorkspace: (id: string) => boolean
  refreshCurrentWorkspace: () => Promise<boolean>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const DEFAULT_WORKSPACE_COLOR = '#FF7043'

// Helper function to get the clean name from a workspace ID
const getCleanWorkspaceName = (name: string): string => {
  if (!name) return '';
  
  // If the name contains a dash, extract the part before it
  if (name.includes('-')) {
    const namePart = name.split('-')[0];
    // Capitalize first letter if it's not already
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
  }
  
  // If no dash, return the name as is
  return name;
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [isWorkspaceLoaded, setIsWorkspaceLoaded] = useState(false)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [loadingWorkspace, setLoadingWorkspace] = useState(false)
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [defaultWorkspaceId, setDefaultWorkspaceId] = useState<string | null>(null)
  const router = useRouter()

  // Fetch default workspace from user preferences
  const fetchDefaultWorkspace = async () => {
    console.log('Fetching default workspace from preferences...');
    try {
      const response = await fetch('/api/user/preferences');
      console.log('Preferences API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Preferences data:', data);
        if (data.defaultWorkspaceId) {
          console.log('Found default workspace ID:', data.defaultWorkspaceId);
          setDefaultWorkspaceId(data.defaultWorkspaceId);
          return data.defaultWorkspaceId;
        } else {
          console.log('No default workspace ID found in preferences');
        }
      } else {
        console.error('Error response from preferences API:', response.statusText);
      }
      return null;
    } catch (error) {
      console.error('Error fetching default workspace:', error);
      return null;
    }
  }

  // Set a workspace as default
  const setAsDefaultWorkspace = async (id: string) => {
    try {
      console.log('Setting workspace as default:', id);
      
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ defaultWorkspaceId: id }),
      })
      
      if (response.ok) {
        // Update local state
        setDefaultWorkspaceId(id)
        
        // If we're setting the default for a workspace that isn't loaded yet,
        // check if we should load it
        if (currentWorkspaceId !== id) {
          console.log('Default workspace differs from current workspace');
        }
        
        // Delay toast notification to prevent UI freezes during transitions
        // This follows the architecture guide recommendation for proper timing
        setTimeout(() => {
          toast.success('Default workspace set successfully');
        }, 300); // Use standard animation duration
        
        // If the current workspace is not set, load the default one
        if (!currentWorkspaceId && id) {
          console.log('No current workspace, loading the default one');
          loadWorkspace(id);
        }
        
        return true
      }
      throw new Error('Failed to set default workspace')
    } catch (error) {
      console.error('Error setting default workspace:', error)
      // Delay error toast notification as well
      setTimeout(() => {
        toast.error('Failed to set default workspace');
      }, 300);
      return false
    }
  }

  // Clear default workspace setting
  const clearDefaultWorkspace = async () => {
    try {
      console.log('Clearing default workspace');
      
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ defaultWorkspaceId: null }),
      })
      
      if (response.ok) {
        // Update local state
        setDefaultWorkspaceId(null)
        
        // Delay toast notification to prevent UI freezes during transitions
        setTimeout(() => {
          toast.success('Default workspace cleared');
        }, 300);
        
        return true
      }
      throw new Error('Failed to clear default workspace')
    } catch (error) {
      console.error('Error clearing default workspace:', error)
      // Delay error toast notification
      setTimeout(() => {
        toast.error('Failed to clear default workspace');
      }, 300);
      return false
    }
  }

  // Check if a workspace is the default
  const isDefaultWorkspace = (id: string) => {
    return defaultWorkspaceId === id
  }

// Function to get the stored custom display name for a workspace
const getStoredDisplayName = (id: string): string | null => {
  try {
    // Using our optimized storage utility
    const workspaceNames = storage.get<Record<string, string>>('odzai-workspace-names');
    return workspaceNames?.[id] || null;
  } catch (error) {
    console.error('Error getting stored display name:', error);
    return null;
  }
};

// Function to update stored workspace name
const updateStoredWorkspaceName = (id: string, displayName: string): void => {
  try {
    // Get current workspace names from optimized storage
    let workspaceNames = storage.get<Record<string, string>>('odzai-workspace-names') || {};
    
    // Update in memory
    workspaceNames = {
      ...workspaceNames,
      [id]: displayName
    };
    
    // Store back using optimized batched storage
    storage.set('odzai-workspace-names', workspaceNames);
    console.log(`Updated workspace name in storage: ${id} => ${displayName}`);
  } catch (error) {
    console.error('Error updating stored workspace name:', error);
  }
};

  // Check storage settings and default workspace on mount
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
          }
          
          // Force default workspace - useful for debugging
          const forceDefault = new URLSearchParams(window.location.search).get('forceDefault');
          if (forceDefault === 'true') {
            console.log('Force default workspace requested, bypassing storage');
            const defaultId = await fetchDefaultWorkspace();
            if (defaultId) {
              console.log('Loading forced default workspace:', defaultId);
              await loadWorkspaceData(defaultId);
              // Update storage
              storage.set('odzai-current-workspace', defaultId);
              return;
            }
          }
          
                // First check storage for current workspace
      const storedWorkspaceId = storage.get<string>('odzai-current-workspace');
      console.log('Stored workspace ID from storage:', storedWorkspaceId);
      
      // Only proceed with storage if we're sure it has a value
      if (storedWorkspaceId && storedWorkspaceId.trim() !== '') {
        // If there's a workspace in storage, load it
        console.log('Loading workspace from storage:', storedWorkspaceId);
        await loadWorkspaceData(storedWorkspaceId);
        // Return early to avoid the default workspace loading
        return;
      }
      
      // If no valid workspace in storage, check for default workspace in preferences
      console.log('No workspace in storage, checking for default workspace');
      const defaultId = await fetchDefaultWorkspace();
      if (defaultId) {
        // Load the default workspace
        console.log('Loading default workspace:', defaultId);
        await loadWorkspaceData(defaultId);
        // Also update storage (only after successful loading)
        console.log('Updating storage with default workspace ID');
        storage.set('odzai-current-workspace', defaultId);
          } else {
            console.log('No default workspace found, user will need to select one');
          }
        } catch (error) {
          console.error('Error during workspace initialization:', error);
        }
      }
    };

    // Call the async function
    initializeWorkspace();
  }, []);

  const loadWorkspaceData = async (id: string) => {
    console.log('Loading workspace data for ID:', id);
    try {
      // Check if we have a custom name stored
      const storedDisplayName = getStoredDisplayName(id);
      
      // Try to get the workspace details from the API
      console.log(`Fetching workspace details from /api/budgets/${id}`);
      const response = await fetch(`/api/budgets/${id}`);
      console.log('Workspace API response status:', response.status);
      
      // If the API is available and returns a valid response, use that data
      if (response.ok) {
        const workspaceData = await response.json();
        console.log('Workspace data received:', workspaceData);
        
        // Extract the display name, using stored custom name first,
        // then API-provided displayName, then generate from name
        const displayName = storedDisplayName || 
                           workspaceData.displayName || 
                           getCleanWorkspaceName(workspaceData.name);
        
        // Save the display name to storage if it's from API or newly generated
        if (!storedDisplayName && displayName !== workspaceData.name) {
          updateStoredWorkspaceName(id, displayName);
        }
        
        console.log('Using display name:', displayName);
        
        // Also load the budget on the Express server
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          console.log(`Loading budget on Express server: ${apiUrl}/api/budgets/load`);
          
          // Use different fetch options to ensure cookies are included
          const loadResponse = await fetch(`${apiUrl}/api/budgets/load`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ budgetId: id }),
            credentials: 'include',
            mode: 'cors',
            cache: 'no-cache',
          });
          
          if (!loadResponse.ok) {
            console.error('Failed to load budget on Express server:', loadResponse.statusText);
            // Try an alternative approach via our Next.js API as a proxy
            console.log('Trying via Next.js API proxy...');
            const proxyResponse = await fetch(`/api/budgets/load`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ budgetId: id }),
            });
            
            if (!proxyResponse.ok) {
              console.error('Proxy load also failed:', proxyResponse.statusText);
            } else {
              console.log('Budget loaded successfully via proxy');
            }
          } else {
            console.log('Budget loaded successfully on Express server');
          }
        } catch (expressError) {
          console.error('Error loading budget on Express server:', expressError);
          // Continue even if Express load fails
        }
        
        console.log('Setting current workspace in state');
        // Store the original name and set a clean display name
        setCurrentWorkspace({
          id: workspaceData.id,
          originalName: workspaceData.name, // Store original full ID
          name: workspaceData.name, // Keep the full name for backend operations
          color: workspaceData.color || DEFAULT_WORKSPACE_COLOR,
          displayName // Use the display name for UI
        });
        setCurrentWorkspaceId(id);
        setIsWorkspaceLoaded(true);
        return;
      } else {
        console.error('Error response from workspace API:', response.statusText);
      }
      
      // If we couldn't get the workspace data from the API, try to get the list of available workspaces
      const budgetsResponse = await fetch('/api/budgets')
      if (budgetsResponse.ok) {
        const budgets = await budgetsResponse.json()
        // Find the workspace with the matching ID
        const matchingWorkspace = budgets.find((budget: any) => budget.id === id)
        
        if (matchingWorkspace) {
          // Load the budget on the Express server
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
            await fetch(`${apiUrl}/api/budgets/load`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ budgetId: id }),
              credentials: 'include'
            })
          } catch (expressError) {
            console.error('Error loading budget on Express server:', expressError)
            // Continue even if Express load fails
          }
          
          // Use the workspace data from the list with clean name
          setCurrentWorkspace({
            id,
            originalName: matchingWorkspace.name, // Store original full ID
            name: getCleanWorkspaceName(matchingWorkspace.name), // Use clean name for display
            color: matchingWorkspace.color || DEFAULT_WORKSPACE_COLOR,
            displayName: matchingWorkspace.displayName || getCleanWorkspaceName(matchingWorkspace.name)
          })
          setCurrentWorkspaceId(id)
          setIsWorkspaceLoaded(true)
          return
        }
      }
      
      // Fallback to a simple workspace object if we couldn't get the data from the API
      const workspaceData = {
        id,
        originalName: id, // Store original full ID 
        name: getCleanWorkspaceName(id), // Use clean name for display
        color: DEFAULT_WORKSPACE_COLOR,
        displayName: getCleanWorkspaceName(id)
      }

      setCurrentWorkspace(workspaceData)
      setCurrentWorkspaceId(id)
      setIsWorkspaceLoaded(true)
    } catch (error) {
      console.error('Error loading workspace data:', error)
      toast.error('Failed to load workspace data')
      // Clear the workspace selection since loading failed
      storage.remove('odzai-current-workspace');
      setIsWorkspaceLoaded(false)
      setCurrentWorkspaceId(null)
      setCurrentWorkspace(null)
    }
  }

  const loadWorkspace = (id: string) => {
    // Set loading state
    setLoadingWorkspace(true);
    
    // Show loading toast for better user feedback
    const loadingToast = toast.loading('Loading workspace...');
    
    // First update storage
    try {
      storage.set('odzai-current-workspace', id);
    } catch (error) {
      console.error('Error updating storage:', error);
      // Continue even if storage fails
    }
    
    // Load the workspace data
    loadWorkspaceData(id)
      .then(() => {
        // Update state before navigation
        setLoadingWorkspace(false);
        
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success('Workspace loaded successfully');
        
        // Use standardized navigation pattern with appropriate timing
        setTimeout(() => {
          navigate(router, NavigationType.PUSH, '/', {
            showLoading: true,
            delay: TIMING.NAVIGATION_DELAY,
            fallbackUrl: '/',
            suppressToast: false,
            callback: () => {
              console.log('Navigation to home page complete after workspace load');
            }
          }).catch((error: unknown) => {
            console.error('Error navigating after workspace load:', error);
          });
        }, TIMING.MODAL_CLOSE);
      })
      .catch((error) => {
        console.error('Error loading workspace:', error);
        setLoadingWorkspace(false);
        toast.dismiss(loadingToast);
        toast.error('Failed to load workspace');
      });
  }

  // Refresh current workspace data without navigation
  const refreshCurrentWorkspace = async () => {
    if (currentWorkspaceId) {
      try {
        console.log('Refreshing current workspace data');
        const response = await fetch(`/api/budgets/${currentWorkspaceId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          console.log('Refreshed workspace data:', data);
          
          // Get stored display name or use server-provided or clean name
          const storedDisplayName = getStoredDisplayName(currentWorkspaceId);
          const displayName = storedDisplayName || data.displayName || getCleanWorkspaceName(data.name);
          
          // Update the current workspace data with refreshed values
          setCurrentWorkspace({
            id: data.id,
            originalName: data.name,
            name: data.name,
            color: data.color || DEFAULT_WORKSPACE_COLOR,
            displayName
          });
          
          return true;
        }
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
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
} 