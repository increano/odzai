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
      // TODO: replace with actual API call once implemented
      // const response = await fetch(`/api/budgets/${id}`)
      // if (!response.ok) throw new Error('Failed to fetch workspace data')
      // const data = await response.json()
      
      // Mock workspace data for now
      const workspaceData = {
        id,
        name: `Workspace ${id}`,
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
        // Redirect to home page
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