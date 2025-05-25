'use client';

import { User } from '@supabase/supabase-js';
import { Workspace, UserPreferences } from '@/lib/supabase/workspace';
import { WorkspaceSelector } from './workspace-selector';

interface WorkspaceContentProps {
  user: User;
  defaultWorkspace: Workspace | null;
  preferences: UserPreferences | null;
}

export function WorkspaceContent({
  user,
  defaultWorkspace,
  preferences,
}: WorkspaceContentProps) {
  return (
    <WorkspaceSelector
      user={user}
      defaultWorkspace={defaultWorkspace}
      preferences={preferences}
    />
  );
} 