'use client';

import { useEffect, useState } from 'react';
import { DatabaseAdapter, getDatabaseAdapter } from '../lib/database/adapters';
import { supabase } from '../lib/supabase/client';

// Feature flag for controlling Supabase usage
// In a real application, this could come from environment variables or user preferences
const USE_SUPABASE_FLAG = false;

/**
 * Hook to access the appropriate database adapter
 * This enables gradual migration between SQLite and Supabase
 */
export function useDatabase() {
  const [adapter, setAdapter] = useState<DatabaseAdapter | null>(null);
  const [isSupabase, setIsSupabase] = useState<boolean>(USE_SUPABASE_FLAG);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Create the appropriate adapter based on the feature flag
      const dbAdapter = getDatabaseAdapter({
        useSupabase: isSupabase,
        supabase: isSupabase ? supabase : undefined
      });
      
      setAdapter(dbAdapter);
      setLoading(false);
    } catch (err) {
      console.error('Error initializing database adapter:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize database'));
      setLoading(false);
    }
  }, [isSupabase]);

  /**
   * Toggle between Supabase and SQLite adapters
   * This allows for testing and gradual migration
   */
  const toggleAdapter = () => {
    setLoading(true);
    setIsSupabase(prev => !prev);
  };

  return {
    adapter,
    isSupabase,
    loading,
    error,
    toggleAdapter
  };
} 