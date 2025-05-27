'use client';

import { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Workspace } from '@/lib/supabase/workspace';

interface SupabaseWorkspaceSelectorProps {
  collapsed?: boolean;
  onWorkspaceSelect?: (workspace: Workspace) => void;
  onSettingsClick?: () => void;
  initialWorkspaces?: Workspace[];
}

export function SupabaseWorkspaceSelector({ 
  collapsed = false,
  onWorkspaceSelect,
  onSettingsClick,
  initialWorkspaces = []
}: SupabaseWorkspaceSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(initialWorkspaces[0] || null);
  const [isLoading, setIsLoading] = useState(!initialWorkspaces.length);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (!initialWorkspaces.length) {
      fetchWorkspaces();
    }
  }, [initialWorkspaces]);

  const fetchWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userWorkspaces, error } = await supabase
        .from('workspaces')
        .select(`
          id,
          name,
          display_name,
          color,
          owner_id,
          created_at,
          updated_at,
          workspace_users!inner (
            access_level,
            user_id
          )
        `)
        .eq('workspace_users.user_id', user.id);

      if (error) throw error;
      
      if (userWorkspaces) {
        const transformedWorkspaces: Workspace[] = userWorkspaces.map(workspace => ({
          id: workspace.id,
          name: workspace.name,
          display_name: workspace.display_name || workspace.name,
          color: workspace.color || '#3B82F6',
          owner_id: workspace.owner_id,
          created_at: workspace.created_at,
          updated_at: workspace.updated_at,
          access_level: workspace.workspace_users[0].access_level as 'read' | 'write' | 'admin'
        }));
        setWorkspaces(transformedWorkspaces);
        if (!selectedWorkspace && transformedWorkspaces.length > 0) {
          setSelectedWorkspace(transformedWorkspaces[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    onWorkspaceSelect?.(workspace);
    setDropdownOpen(false);
  };

  return (
    <div className="flex-none px-2 py-2">
      <div className="overflow-hidden">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full text-left flex items-center gap-2 py-2",
                { "justify-center": collapsed }
              )} 
              size="sm"
            >
              {selectedWorkspace ? (
                <>
                  <div 
                    className={cn(
                      "h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-medium",
                      { "mx-auto": collapsed }
                    )}
                    style={{ backgroundColor: selectedWorkspace.color || '#3B82F6' }}
                  >
                    {(selectedWorkspace.display_name || selectedWorkspace.name).charAt(0)}
                  </div>
                  <div className={cn(
                    "flex flex-1 flex-col gap-0 whitespace-nowrap transition-all duration-300 ease-in-out",
                    collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                  )}>
                    <span className="text-sm font-medium">
                      {selectedWorkspace.display_name || selectedWorkspace.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Supabase Workspace
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className={cn(
                    "h-6 w-6 rounded-md bg-primary/20 animate-pulse",
                    { "mx-auto": collapsed }
                  )}></div>
                  {!collapsed && (
                    <div className="flex flex-col gap-0">
                      <div className="h-3 w-24 bg-primary/20 rounded-sm animate-pulse"></div>
                      <div className="h-3 w-16 bg-primary/20 rounded-sm animate-pulse mt-1"></div>
                    </div>
                  )}
                </>
              )}
              <ChevronDown className={cn(
                "h-4 w-4 ml-auto transition-transform duration-300",
                dropdownOpen ? "rotate-180" : "rotate-0",
                collapsed ? "hidden" : "block"
              )} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px]">
            <div className="px-2 py-1.5">
              <h3 className="text-sm font-medium mb-1">
                Switch Supabase workspace
              </h3>
              <p className="text-xs text-muted-foreground mb-2">Your available workspaces</p>
            </div>
            {isLoading ? (
              <DropdownMenuItem disabled>
                <span className="text-sm">Loading workspaces...</span>
              </DropdownMenuItem>
            ) : workspaces.length === 0 ? (
              <DropdownMenuItem disabled>
                <span className="text-sm">No workspaces found</span>
              </DropdownMenuItem>
            ) : (
              <div className="max-h-[135px] overflow-y-auto pr-1 py-1">
                {workspaces.map(workspace => (
                  <DropdownMenuItem 
                    key={workspace.id}
                    className="flex items-center gap-2 py-2"
                    onClick={() => handleWorkspaceSelect(workspace)}
                  >
                    <div 
                      className="h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: workspace.color || '#3B82F6' }}
                    >
                      {(workspace.display_name || workspace.name).charAt(0)}
                    </div>
                    <span className="text-sm">{workspace.display_name || workspace.name}</span>
                    {selectedWorkspace?.id === workspace.id && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            {onSettingsClick && (
              <div className="border-t mt-1 pt-1">
                <DropdownMenuItem onClick={onSettingsClick}>
                  <span className="text-sm">Manage workspaces</span>
                </DropdownMenuItem>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 