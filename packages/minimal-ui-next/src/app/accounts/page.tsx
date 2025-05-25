// Server Component
import { requireWorkspace } from '@/lib/supabase/workspace';
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';
import { AccountsContent } from './accounts-content';

export default async function AccountsPage() {
  // Server-side workspace check and data loading
  const { user, workspaces, defaultWorkspace, preferences } = await requireWorkspace();

  return (
    <WorkspaceProvider
      initialWorkspaces={workspaces}
      initialCurrentWorkspace={defaultWorkspace}
      initialPreferences={preferences}
    >
      <AccountsContent 
        user={user}
        workspaces={workspaces}
        defaultWorkspace={defaultWorkspace}
        preferences={preferences}
      />
    </WorkspaceProvider>
  );
} 