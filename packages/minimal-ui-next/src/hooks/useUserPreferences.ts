import { useState, useEffect, useCallback } from 'react';

interface UserPreferences {
  defaultWorkspaceId?: string;
  theme?: 'light' | 'dark' | 'system';
  compactMode?: boolean;
  [key: string]: any;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user preferences');
      }
      
      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update user preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    try {
      // Optimistically update UI
      setPreferences(prev => ({ ...prev, ...newPreferences }));
      
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user preferences');
      }
      
      // Refresh preferences to ensure consistency
      fetchPreferences();
      
      return true;
    } catch (err) {
      console.error('Error updating user preferences:', err);
      // Revert to previous state on error
      fetchPreferences();
      return false;
    }
  }, [fetchPreferences]);

  // Set default workspace preference
  const setDefaultWorkspace = useCallback(async (workspaceId: string) => {
    return updatePreferences({ defaultWorkspaceId: workspaceId });
  }, [updatePreferences]);

  // Clear default workspace preference
  const clearDefaultWorkspace = useCallback(async () => {
    return updatePreferences({ defaultWorkspaceId: undefined });
  }, [updatePreferences]);

  // Initialize preferences on component mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    setDefaultWorkspace,
    clearDefaultWorkspace,
    refreshPreferences: fetchPreferences
  };
} 