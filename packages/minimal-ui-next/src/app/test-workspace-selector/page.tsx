import { createClient } from '@/lib/supabase/server';
import { WorkspaceSelectorWrapper } from './WorkspaceSelectorWrapper';
import { ProfileButtonWrapper } from './ProfileButtonWrapper';
import type { Workspace } from '@/lib/supabase/workspace';

export default async function TestWorkspaceSelectorPage() {
  const supabase = createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not found');
  }

  // Get user's workspaces
  const { data: workspaces, error: workspacesError } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_users!inner (
        user_id,
        access_level
      )
    `)
    .eq('workspace_users.user_id', user.id)
    .order('created_at', { ascending: false });

  if (workspacesError) {
    throw new Error('Failed to fetch workspaces');
  }

  // Get user preferences
  const { data: preferences, error: preferencesError } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (preferencesError && preferencesError.code !== 'PGRST116') {
    throw new Error('Failed to fetch user preferences');
  }

  // Transform workspaces to include access_level
  const transformedWorkspaces: Workspace[] = workspaces.map(workspace => ({
    id: workspace.id,
    name: workspace.name,
    display_name: workspace.display_name || workspace.name,
    color: workspace.color || '#3B82F6',
    owner_id: workspace.owner_id,
    created_at: workspace.created_at,
    updated_at: workspace.updated_at,
    access_level: workspace.workspace_users[0].access_level as 'read' | 'write' | 'admin'
  }));

  return (
    <div className="container mx-auto py-8 space-y-6">
      <WorkspaceSelectorWrapper initialWorkspaces={transformedWorkspaces} />
      <ProfileButtonWrapper user={user} />
    </div>
  );
} 