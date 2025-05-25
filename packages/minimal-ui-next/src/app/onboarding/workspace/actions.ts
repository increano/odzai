'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createWorkspace(formData: FormData) {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const workspaceName = formData.get('workspaceName') as string;
  
  if (!workspaceName) {
    throw new Error('Workspace name is required');
  }

  // Create workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name: workspaceName,
      owner_id: user.id,
    })
    .select()
    .single();

  if (workspaceError) {
    throw new Error('Failed to create workspace');
  }

  // Update user preferences with default workspace
  const { error: preferencesError } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      default_workspace_id: workspace.id,
      data: {
        onboarding: {
          completed: true,
          completedAt: new Date().toISOString()
        }
      },
      updated_at: new Date().toISOString()
    });

  if (preferencesError) {
    console.error('Error updating preferences:', preferencesError);
  }

  redirect('/budget');
} 