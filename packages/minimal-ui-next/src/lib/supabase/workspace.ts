import { createClient } from './server';
import { redirect } from 'next/navigation';

export interface Workspace {
  id: string;
  name: string;
  display_name: string | null;
  color: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  access_level: 'read' | 'write' | 'admin';
}

export interface UserPreferences {
  user_id: string;
  default_workspace_id: string | null;
  theme: string | null;
  data: any;
  created_at: string;
  updated_at: string;
}

/**
 * Get all workspaces for a user
 */
export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('workspace_users')
    .select(`
      access_level,
      workspaces (
        id,
        name,
        display_name,
        color,
        owner_id,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user workspaces:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data
    .filter(item => item.workspaces) // Filter out any null workspaces
    .map(item => ({
      id: (item.workspaces as any).id,
      name: (item.workspaces as any).name,
      display_name: (item.workspaces as any).display_name,
      color: (item.workspaces as any).color,
      owner_id: (item.workspaces as any).owner_id,
      created_at: (item.workspaces as any).created_at,
      updated_at: (item.workspaces as any).updated_at,
      access_level: item.access_level
    }));
}

/**
 * Get user preferences including default workspace
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }

  return data;
}

/**
 * Get the default workspace for a user
 * If no default is set, return the first workspace they have access to
 */
export async function getDefaultWorkspace(userId: string): Promise<Workspace | null> {
  const preferences = await getUserPreferences(userId);
  const workspaces = await getUserWorkspaces(userId);

  if (workspaces.length === 0) {
    return null;
  }

  // If user has a default workspace set, try to find it
  if (preferences?.default_workspace_id) {
    const defaultWorkspace = workspaces.find(w => w.id === preferences.default_workspace_id);
    if (defaultWorkspace) {
      return defaultWorkspace;
    }
  }

  // Otherwise, return the first workspace (preferably one they own)
  const ownedWorkspace = workspaces.find(w => w.owner_id === userId);
  return ownedWorkspace || workspaces[0];
}

/**
 * Set the default workspace for a user
 */
export async function setDefaultWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      default_workspace_id: workspaceId,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error setting default workspace:', error);
    return false;
  }

  return true;
}

/**
 * Load user workspace data for login
 * Returns the default workspace and all workspaces
 */
export async function loadUserWorkspaceData(userId: string) {
  const [workspaces, defaultWorkspace, preferences] = await Promise.all([
    getUserWorkspaces(userId),
    getDefaultWorkspace(userId),
    getUserPreferences(userId)
  ]);

  return {
    workspaces,
    defaultWorkspace,
    preferences,
    hasWorkspaces: workspaces.length > 0
  };
}

/**
 * Server-side workspace check for pages
 * This function should be called at the top of server components that require a workspace
 * Returns workspace data if available, redirects if not
 */
export async function requireWorkspace() {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Load user workspace data
  const workspaceData = await loadUserWorkspaceData(user.id);

  // If user has no workspaces, redirect to workspace creation
  if (!workspaceData.hasWorkspaces) {
    redirect('/onboarding/workspace');
  }

  // If no default workspace is set, redirect to workspace selection
  if (!workspaceData.defaultWorkspace) {
    redirect('/onboarding/workspace');
  }

  return {
    user,
    workspaces: workspaceData.workspaces,
    defaultWorkspace: workspaceData.defaultWorkspace,
    preferences: workspaceData.preferences
  };
} 