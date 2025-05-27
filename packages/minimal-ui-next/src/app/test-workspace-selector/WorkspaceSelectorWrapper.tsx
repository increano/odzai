'use client';

import { SupabaseWorkspaceSelector } from '@/components/workspace/SupabaseWorkspaceSelector';
import type { Workspace } from '@/lib/supabase/workspace';

interface WorkspaceSelectorWrapperProps {
  initialWorkspaces: Workspace[];
}

export function WorkspaceSelectorWrapper({ initialWorkspaces }: WorkspaceSelectorWrapperProps) {
  const handleWorkspaceSelect = (workspace: Workspace) => {
    console.log('Selected workspace:', workspace);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Server-Side Implementation</h2>
      <SupabaseWorkspaceSelector 
        initialWorkspaces={initialWorkspaces}
        onWorkspaceSelect={handleWorkspaceSelect}
      />
    </div>
  );
} 