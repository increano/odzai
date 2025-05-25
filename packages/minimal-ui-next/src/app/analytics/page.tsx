// Server Component
import { requireWorkspace } from '@/lib/supabase/workspace';
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';
import { AnalyticsContent } from './analytics-content';

export default async function AnalyticsPage() {
  // Server-side workspace check and data loading
  const { user, workspaces, defaultWorkspace, preferences } = await requireWorkspace();

  return (
    <WorkspaceProvider
      initialWorkspaces={workspaces}
      initialCurrentWorkspace={defaultWorkspace}
      initialPreferences={preferences}
    >
      <AnalyticsContent 
        user={user}
        workspaces={workspaces}
        defaultWorkspace={defaultWorkspace}
        preferences={preferences}
      />
    </WorkspaceProvider>
  );
} 