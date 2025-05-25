import { createClient } from '@/lib/supabase/server';
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider';

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not found');
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

  return (
    <WorkspaceProvider 
      initialPreferences={preferences || null}
    >
      {children}
    </WorkspaceProvider>
  );
} 