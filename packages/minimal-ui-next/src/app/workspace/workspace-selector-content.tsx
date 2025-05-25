'use client';

import { User } from '@supabase/supabase-js';
import { Workspace, UserPreferences } from '@/lib/supabase/workspace';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkspaceSelectorContentProps {
  user: User;
  workspaces: Workspace[];
  defaultWorkspace: Workspace | null;
  preferences: UserPreferences | null;
}

export function WorkspaceSelectorContent({
  user,
  workspaces,
  defaultWorkspace,
  preferences,
}: WorkspaceSelectorContentProps) {
  const { loadWorkspace, loadingWorkspace, setAsDefaultWorkspace, clearDefaultWorkspace, isDefaultWorkspace } = useWorkspace();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Select a Workspace</CardTitle>
            <CardDescription>Choose a workspace to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: workspace.color || '#3B82F6' }}
                    />
                    <div>
                      <h3 className="font-medium">{workspace.display_name || workspace.name}</h3>
                      {isDefaultWorkspace(workspace.id) && (
                        <p className="text-sm text-gray-500">Default workspace</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isDefaultWorkspace(workspace.id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAsDefaultWorkspace(workspace.id)}
                      >
                        Set as Default
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearDefaultWorkspace()}
                      >
                        Clear Default
                      </Button>
                    )}
                    <Button
                      onClick={() => loadWorkspace(workspace.id)}
                      disabled={loadingWorkspace}
                    >
                      {loadingWorkspace ? 'Loading...' : 'Select'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 