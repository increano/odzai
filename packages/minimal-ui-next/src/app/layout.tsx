import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Sidebar } from '../components/sidebar';
import { SettingsModalProvider } from '../components/SettingsModalProvider';
import { WorkspaceProvider } from '../components/WorkspaceProvider';
import AppErrorBoundary from '../components/AppErrorBoundary';
import { SupabaseAuthProvider } from '../components/providers/SupabaseAuthProvider';
import { createClient } from '@/lib/supabase/server';
import type { Workspace } from '@/lib/supabase/workspace';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

// Debug function to check for auth cookies in browser
function debugAuthCookies() {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const authCookies = cookies.filter(c => 
      c.startsWith('sb-') || 
      c.startsWith('supabase-auth')
    );
    
    console.log('Auth cookies check:', authCookies.length ? authCookies : 'No auth cookies found');
    
    // Check local storage for tokens too
    const localStorageKeys = Object.keys(localStorage);
    const authKeys = localStorageKeys.filter(k => 
      k.includes('supabase') || 
      k.includes('sb-')
    );
    
    if (authKeys.length > 0) {
      console.log('Auth storage keys:', authKeys);
    }
  }
}

async function getWorkspaces() {
  const supabase = createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return [];
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
    console.error('Failed to fetch workspaces:', workspacesError);
    return [];
  }

  // Transform workspaces to include access_level
  return workspaces.map(workspace => ({
    id: workspace.id,
    name: workspace.name,
    display_name: workspace.display_name || workspace.name,
    color: workspace.color || '#3B82F6',
    owner_id: workspace.owner_id,
    created_at: workspace.created_at,
    updated_at: workspace.updated_at,
    access_level: workspace.workspace_users[0].access_level as 'read' | 'write' | 'admin'
  }));
}

// Create a client component wrapper for providers

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary>
      <SupabaseAuthProvider>
        <WorkspaceProvider>
          <SettingsModalProvider>
            {children}
          </SettingsModalProvider>
        </WorkspaceProvider>
      </SupabaseAuthProvider>
    </AppErrorBoundary>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '/';
  const isAuthPage = pathname === '/login' || 
                    pathname === '/signup' || 
                    pathname.startsWith('/onboarding');

  const workspaces = await getWorkspaces();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen overflow-hidden bg-background">
            {!isAuthPage && <Sidebar initialWorkspaces={workspaces} />}
            <div className={`overflow-auto ${isAuthPage ? 'w-full' : 'flex-1'}`}>
              <main className="h-full">
                {children}
              </main>
              <Toaster position="top-right" richColors />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
} 