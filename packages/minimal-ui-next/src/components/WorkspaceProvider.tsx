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
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const DEFAULT_WORKSPACE_COLOR = '#FF7043'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [isWorkspaceLoaded, setIsWorkspaceLoaded] = useState(false)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [loadingWorkspace, setLoadingWorkspace] = useState(false)
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const router = useRouter()

  // Check localStorage on mount to see if a workspace ID is stored
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedWorkspaceId = localStorage.getItem('odzai-current-workspace')
      if (storedWorkspaceId) {
        // Load the workspace data from the API
        loadWorkspaceData(storedWorkspaceId)
      }
    }
  }, [])

  const loadWorkspaceData = async (id: string) => {
    try {
      // Try to get the workspace details from the API
      const response = await fetch(`/api/budgets/${id}`)
      
      // If the API is available and returns a valid response, use that data
      if (response.ok) {
        const workspaceData = await response.json()
        
        // Also load the budget on the Express server
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const loadResponse = await fetch(`${apiUrl}/api/budgets/load`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ budgetId: id }),
          })
          
          if (!loadResponse.ok) {
            console.error('Failed to load budget on Express server, but continuing with frontend data')
          } else {
            console.log('Budget loaded successfully on Express server')
          }
        } catch (expressError) {
          console.error('Error loading budget on Express server:', expressError)
          // Continue even if Express load fails
        }
        
        setCurrentWorkspace(workspaceData)
        setCurrentWorkspaceId(id)
        setIsWorkspaceLoaded(true)
        return
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
        
        // Only redirect to home page if not already there
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          router.push('/')
        }
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
        currentWorkspace
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