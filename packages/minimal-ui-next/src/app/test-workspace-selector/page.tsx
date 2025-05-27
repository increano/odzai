import { createClient } from '@/lib/supabase/server';
import { WorkspaceSelectorWrapper } from './WorkspaceSelectorWrapper';
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Workspace Selector Test Page</h1>
        
        <WorkspaceSelectorWrapper initialWorkspaces={transformedWorkspaces} />

        {/* Debug Information */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify({ 
              user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                user_metadata: user.user_metadata
              },
              workspaces: transformedWorkspaces,
              preferences
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 