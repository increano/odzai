'use client';

import { useWorkspace } from '@/context/workspace-context';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface WorkspaceRequiredProps {
  children: React.ReactNode;
}

export function WorkspaceRequired({ children }: WorkspaceRequiredProps) {
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Handle hydration mismatch by only showing content on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8">
        <div className="flex flex-col max-w-md mx-auto p-6 text-center bg-muted rounded-lg shadow-sm">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Workspace Required</h2>
          <p className="text-muted-foreground mb-4">
            Please select a workspace to access this feature. 
            You need to load a workspace first to view and manage your financial data.
          </p>
          <Button 
            onClick={() => router.push('/settings?tab=workspaces')}
            className="mx-auto"
          >
            Go to Workspace Management
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 