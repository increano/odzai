// Server Component
import { AuthGuard } from '@/components/auth/AuthGuard';
import { WorkspaceGuard } from '@/components/auth/WorkspaceGuard';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BudgetContent } from './budget-content';

export default async function BudgetPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Get user preferences to check for default workspace
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('default_workspace_id')
    .single();

  if (!preferences?.default_workspace_id) {
    redirect('/onboarding/workspace');
  }

  return (
    <AuthGuard requireEmailConfirmed>
      <WorkspaceGuard workspaceId={preferences.default_workspace_id}>
        <BudgetContent />
      </WorkspaceGuard>
    </AuthGuard>
  );
} 