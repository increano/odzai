// Server Component
import { requireWorkspace } from '@/lib/supabase/workspace';
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';
import { TransactionsContent } from './transactions-content';

export default async function TransactionsPage() {
  // Server-side workspace check and data loading
  const { user, workspaces, defaultWorkspace, preferences } = await requireWorkspace();

  return (
    <WorkspaceProvider
      initialWorkspaces={workspaces}
      initialCurrentWorkspace={defaultWorkspace}
      initialPreferences={preferences}
    >
      <TransactionsContent 
        user={user}
        workspaces={workspaces}
        defaultWorkspace={defaultWorkspace}
        preferences={preferences}
      />
    </WorkspaceProvider>
  );
} 