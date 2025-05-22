import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface WorkspaceGuardProps {
  children: React.ReactNode;
  workspaceId: string;
}

export async function WorkspaceGuard({ children, workspaceId }: WorkspaceGuardProps) {
  const supabase = createServerComponentClient({ cookies });

  // This uses getUser() which is safe server-side
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Check workspace access
  const { data: workspaceAccess, error: workspaceError } = await supabase
    .from('workspace_users')
    .select('access_level')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (workspaceError || !workspaceAccess) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
} 