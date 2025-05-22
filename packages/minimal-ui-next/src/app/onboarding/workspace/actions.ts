'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type WorkspaceState = {
  error?: string;
  message?: string;
} | null;

export async function createWorkspace(_prevState: WorkspaceState, formData: FormData): Promise<WorkspaceState> {
  const name = formData.get('name') as string;
  const supabase = createServerActionClient({ cookies });

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'You must be logged in to create a workspace' };
    }

    // Use the Supabase function to create workspace
    const { data: workspaceId, error: workspaceError } = await supabase.rpc(
      'create_workspace_with_owner',
      {
        workspace_name: name.trim(),
        workspace_color: '#3B82F6' // Default blue color
      }
    );

    if (workspaceError) {
      return { error: workspaceError.message };
    }

    // Set as default workspace in user preferences
    const { error: prefError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        default_workspace_id: workspaceId,
        data: {
          onboarding: {
            completed: true,
            completedAt: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      });

    if (prefError) {
      return { error: prefError.message };
    }

    redirect('/budget');
  } catch (error: any) {
    return { error: error.message || 'Failed to create workspace' };
  }
} 