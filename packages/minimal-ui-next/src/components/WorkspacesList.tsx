'use client';

import React, { useState } from 'react';
import { useCollection } from '../hooks/useSWRHooks';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, RefreshCw, Plus, Edit, Trash } from 'lucide-react';
import { storage } from '../lib/storage';

interface Workspace {
  id: string;
  name: string;
  displayName?: string;
  color?: string;
  created?: string;
}

/**
 * Demonstration component that uses our SWR hooks and storage optimization
 */
export default function WorkspacesList() {
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const {
    data: workspaces,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
  } = useCollection<Workspace>('/api/budgets');

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    // Store in local memory cache first for immediate UI feedback
    storage.set(`workspace-name-${Date.now()}`, newWorkspaceName);

    await create({
      name: newWorkspaceName,
      id: `ws-${Date.now()}`, // This would be generated on the server in a real implementation
    });

    setNewWorkspaceName('');
  };

  const handleUpdateWorkspace = async (id: string, name: string) => {
    // First update our local storage for immediate access
    storage.set(`workspace-display-${id}`, name, 'session');
    
    // Update via API with optimistic updates
    await update(id, { name });
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-800">
        <h3 className="font-medium mb-2">Error loading workspaces</h3>
        <p className="text-sm">{error.message || 'Failed to load data'}</p>
        <Button variant="outline" className="mt-3" onClick={() => refresh()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Your Workspaces</h2>
        <p className="text-muted-foreground text-sm">
          Manage all your workspaces in one place.
        </p>
      </div>

      {/* Create new workspace */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="New workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
          />
        </div>
        <Button onClick={handleCreateWorkspace} disabled={!newWorkspaceName.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Create
        </Button>
      </div>

      {/* Workspaces list */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !workspaces?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No workspaces found. Create your first workspace.
          </div>
        ) : (
          <ul className="divide-y">
            {workspaces.map((workspace) => (
              <li key={workspace.id} className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{workspace.displayName || workspace.name}</h3>
                  <p className="text-xs text-muted-foreground">{workspace.id}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newName = prompt('Enter new name', workspace.name);
                      if (newName && newName !== workspace.name) {
                        handleUpdateWorkspace(workspace.id, newName);
                      }
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      if (
                        confirm(`Are you sure you want to delete "${workspace.name}"?`)
                      ) {
                        remove(workspace.id);
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button variant="outline" onClick={() => refresh()}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
} 