'use client';

import { useState } from 'react';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

interface Workspace {
  id: string;
  name: string;
  display_name: string | null;
  color: string | null;
  owner_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  workspace_users: {
    access_level: string;
    user_id: string;
  }[];
}

interface WorkspaceSelectorClientProps {
  initialWorkspaces: Workspace[];
}

interface MenuItemRenderPropArg {
  active: boolean;
  disabled: boolean;
  selected: boolean;
}

export function WorkspaceSelectorClient({ initialWorkspaces }: WorkspaceSelectorClientProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    initialWorkspaces[0] || null
  );

  return (
    <div className="relative">
      <Menu>
        <Menu.Button className="inline-flex w-full items-center justify-between rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <span>
            {selectedWorkspace ? (
              <span className="flex items-center">
                {selectedWorkspace.color && (
                  <span 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: selectedWorkspace.color }}
                  />
                )}
                {selectedWorkspace.display_name || selectedWorkspace.name}
              </span>
            ) : (
              'Select a workspace'
            )}
          </span>
          <ChevronDownIcon className="ml-2 h-5 w-5" aria-hidden="true" />
        </Menu.Button>

        <Menu.Items className="absolute right-0 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            {initialWorkspaces.map((workspace) => (
              <Menu.Item key={workspace.id}>
                {({ active }: MenuItemRenderPropArg) => (
                  <button
                    onClick={() => setSelectedWorkspace(workspace)}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } ${
                      selectedWorkspace?.id === workspace.id ? 'bg-gray-50' : ''
                    } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                  >
                    <span className="flex items-center">
                      {workspace.color && (
                        <span 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: workspace.color }}
                        />
                      )}
                      {workspace.display_name || workspace.name}
                    </span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Menu>
    </div>
  );
} 