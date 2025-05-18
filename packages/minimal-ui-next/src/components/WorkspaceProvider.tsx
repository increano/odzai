'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Workspace {
  id: string
  name: string
  color: string
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
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const DEFAULT_WORKSPACE_COLOR = '#FF7043'

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
        
        toast.success('Default workspace set successfully')
        
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
      toast.error('Failed to set default workspace')
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
        toast.success('Default workspace cleared')
        return true
      }
      throw new Error('Failed to clear default workspace')
    } catch (error) {
      console.error('Error clearing default workspace:', error)
      toast.error('Failed to clear default workspace')
      return false
    }
  }

  // Check if a workspace is the default
  const isDefaultWorkspace = (id: string) => {
    return defaultWorkspaceId === id
  }

  // Check localStorage and default workspace setting on mount
  useEffect(() => {
    const initializeWorkspace = async () => {
      console.log('Initializing workspace...');
      if (typeof window !== 'undefined') {
        try {
          // First check if we want to force a logout - useful for debugging
          const forceLogout = new URLSearchParams(window.location.search).get('forceLogout');
          if (forceLogout === 'true') {
            console.log('Force logout requested, clearing localStorage');
            localStorage.removeItem('odzai-current-workspace');
          }
          
          // Force default workspace - useful for debugging
          const forceDefault = new URLSearchParams(window.location.search).get('forceDefault');
          if (forceDefault === 'true') {
            console.log('Force default workspace requested, bypassing localStorage');
            const defaultId = await fetchDefaultWorkspace();
            if (defaultId) {
              console.log('Loading forced default workspace:', defaultId);
              await loadWorkspaceData(defaultId);
              // Update localStorage
              localStorage.setItem('odzai-current-workspace', defaultId);
              return;
            }
          }
          
          // First check localStorage for current workspace
          const storedWorkspaceId = localStorage.getItem('odzai-current-workspace');
          console.log('Stored workspace ID from localStorage:', storedWorkspaceId);
          
          // Only proceed with localStorage if we're sure it has a value
          if (storedWorkspaceId && storedWorkspaceId.trim() !== '') {
            // If there's a workspace in localStorage, load it
            console.log('Loading workspace from localStorage:', storedWorkspaceId);
            await loadWorkspaceData(storedWorkspaceId);
            // Return early to avoid the default workspace loading
            return;
          }
          
          // If no valid workspace in localStorage, check for default workspace in preferences
          console.log('No workspace in localStorage, checking for default workspace');
          const defaultId = await fetchDefaultWorkspace();
          if (defaultId) {
            // Load the default workspace
            console.log('Loading default workspace:', defaultId);
            await loadWorkspaceData(defaultId);
            // Also update localStorage (only after successful loading)
            console.log('Updating localStorage with default workspace ID');
            localStorage.setItem('odzai-current-workspace', defaultId);
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
      // Try to get the workspace details from the API
      console.log(`Fetching workspace details from /api/budgets/${id}`);
      const response = await fetch(`/api/budgets/${id}`);
      console.log('Workspace API response status:', response.status);
      
      // If the API is available and returns a valid response, use that data
      if (response.ok) {
        const workspaceData = await response.json();
        console.log('Workspace data received:', workspaceData);
        
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
        setCurrentWorkspace(workspaceData);
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
          
          // Use the workspace data from the list
          setCurrentWorkspace({
            id,
            name: matchingWorkspace.name,
            color: matchingWorkspace.color || DEFAULT_WORKSPACE_COLOR
          })
          setCurrentWorkspaceId(id)
          setIsWorkspaceLoaded(true)
          return
        }
      }
      
      // Fallback to a simple workspace object if we couldn't get the data from the API
      const workspaceData = {
        id,
        name: id, // Just use the ID as the name
        color: DEFAULT_WORKSPACE_COLOR
      }

      setCurrentWorkspace(workspaceData)
      setCurrentWorkspaceId(id)
      setIsWorkspaceLoaded(true)
    } catch (error) {
      console.error('Error loading workspace data:', error)
      toast.error('Failed to load workspace data')
      // Clear the workspace selection since loading failed
      if (typeof window !== 'undefined') {
        localStorage.removeItem('odzai-current-workspace')
      }
      setIsWorkspaceLoaded(false)
      setCurrentWorkspaceId(null)
      setCurrentWorkspace(null)
    }
  }

  const loadWorkspace = (id: string) => {
    setLoadingWorkspace(true)
    
    // Store the current workspace ID in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('odzai-current-workspace', id)
    }
    
    // Load the workspace data
    loadWorkspaceData(id)
      .then(() => {
        setLoadingWorkspace(false)
        toast.success('Workspace loaded successfully')
        
        // Use router.push for navigation without the conditional check
        router.push('/')
      })
      .catch(() => {
        setLoadingWorkspace(false)
      })
  }

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
        isDefaultWorkspace
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