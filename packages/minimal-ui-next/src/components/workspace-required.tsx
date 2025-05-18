'use client'

import { ReactNode, useState } from 'react'
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
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Function to open settings to the general tab
  const openWorkspaceSettings = () => {
    if (openSettingsModal) {
      openSettingsModal("general")
    }
  }

  // Debug function to test default workspace loading
  const testDefaultWorkspaceLoading = async () => {
    try {
      setDebugInfo('Testing default workspace loading...');
      
      // Try to load the default workspace
      const response = await fetch('/api/load-default-workspace');
      const data = await response.json();
      
      console.log('Debug test result:', data);
      setDebugInfo(JSON.stringify(data, null, 2));
      
      if (data.success) {
        // Force reload the page to apply the workspace
        window.location.reload();
      }
    } catch (error) {
      console.error('Error testing default workspace:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!isWorkspaceLoaded) {
    if (fallbackCard) {
      return <>{fallbackCard}</>
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <PlaceholderCard 
          onButtonClick={() => openWorkspaceSettings()}
        />
        
        <div className="mt-6 text-center">
          <button 
            onClick={testDefaultWorkspaceLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Debug: Test Default Workspace
          </button>
          
          <div className="mt-3">
            <a 
              href="/?forceDefault=true"
              className="text-blue-500 hover:text-blue-700 underline text-sm mx-2"
            >
              Force Default Workspace
            </a>
            <a 
              href="/?forceLogout=true"
              className="text-blue-500 hover:text-blue-700 underline text-sm mx-2"
            >
              Force Logout
            </a>
          </div>
          
          {debugInfo && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-60 text-xs text-left max-w-lg">
              {debugInfo}
            </pre>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
} 