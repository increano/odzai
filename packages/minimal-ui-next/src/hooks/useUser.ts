'use client';

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  preferences?: Record<string, any>;
}

/**
 * Hook to get the current user and their authorization status
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        
        // In a real app, this would be an API call to get the current user
        const userJson = localStorage.getItem('odzai-user');
        
        if (userJson) {
          // If we have user data, parse and use it
          const userData = JSON.parse(userJson);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch user'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  return {
    user,
    isLoading,
    error,
    isAdmin: user?.isAdmin || false
  };
} 