'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from './WorkspaceProvider'
import { useSettingsModal } from './SettingsModalProvider'
import { PlaceholderCard } from './ui/placeholder-card'

interface WorkspaceRequiredProps {
  children: ReactNode
  fallbackCard?: ReactNode
}

export function WorkspaceRequired({ 
  children, 
  fallbackCard 
}: WorkspaceRequiredProps) {
  const { isWorkspaceLoaded } = useWorkspace()
  const router = useRouter()
  const { openSettingsModal } = useSettingsModal()
  
  // Function to open settings to the general tab
  const openWorkspaceSettings = () => {
    if (openSettingsModal) {
      openSettingsModal("general")
    }
  }

  if (!isWorkspaceLoaded) {
    if (fallbackCard) {
      return <>{fallbackCard}</>
    }
    
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <PlaceholderCard 
          onButtonClick={() => openWorkspaceSettings()}
        />
      </div>
    )
  }

  return <>{children}</>
} 