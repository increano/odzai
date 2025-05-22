'use client';

import { useFormState } from 'react-dom';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { createWorkspace } from './actions';

type WorkspaceState = {
  error?: string;
  message?: string;
} | null;

export function WorkspaceForm() {
  const [state, formAction] = useFormState<WorkspaceState, FormData>(createWorkspace, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.message) {
      toast.success(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Workspace Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="My Budget"
        />
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Create Workspace
      </button>
    </form>
  );
} 