'use client';

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  preferences?: Record<string, any>;
}

// Admin users who should always have admin privileges
const ADMIN_USERS = ['Fabrice Mhr'];

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
        // For now, we'll mock the response based on localStorage or a cookie
        const userJson = localStorage.getItem('odzai-user');
        
        if (userJson) {
          // If we have user data, parse and use it
          const userData = JSON.parse(userJson);
          
          // Check if the user is in the admin list - if so, always set isAdmin to true
          if (ADMIN_USERS.includes(userData.name)) {
            userData.isAdmin = true;
            // Update localStorage to persist admin status
            localStorage.setItem('odzai-user', JSON.stringify(userData));
          }
          
          setUser(userData);
        } else {
          // For demo purposes, we'll check if there's an admin cookie
          // In a real app, this would be proper authentication
          const isAdmin = document.cookie.includes('odzai-admin=true');
          
          // Check if we can identify the user from the URL or other sources
          // This is for demo purposes and specifically for Fabrice Mhr
          const isFabriceMhr = window.location.href.includes('user=fabricemhr') || 
                             document.cookie.includes('user=fabricemhr');
          
          if (isAdmin || isFabriceMhr) {
            // Auto-create admin user for demo
            const adminUser: User = {
              id: 'admin-user',
              email: isFabriceMhr ? 'fabrice.mhr@example.com' : 'admin@example.com',
              name: isFabriceMhr ? 'Fabrice Mhr' : 'Admin User',
              isAdmin: true
            };
            
            // Store in localStorage for persistence
            localStorage.setItem('odzai-user', JSON.stringify(adminUser));
            
            // Set the admin cookie if it's Fabrice Mhr
            if (isFabriceMhr && !isAdmin) {
              document.cookie = 'odzai-admin=true; path=/; max-age=86400'; // 1 day
            }
            
            setUser(adminUser);
          } else {
            // No user found, create a default user without admin privileges
            const regularUser: User = {
              id: 'regular-user',
              email: 'user@example.com',
              name: 'Regular User',
              isAdmin: false
            };
            
            localStorage.setItem('odzai-user', JSON.stringify(regularUser));
            setUser(regularUser);
          }
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
  
  /**
   * Set current user as admin (for demo purposes)
   */
  const setAdmin = (isAdmin: boolean) => {
    if (isAdmin) {
      // Set admin cookie
      document.cookie = 'odzai-admin=true; path=/; max-age=86400'; // 1 day
      
      // Create or update user
      const adminUser: User = {
        id: user?.id || 'admin-user',
        email: user?.email || 'admin@example.com',
        name: user?.name || 'Admin User',
        isAdmin: true,
        ...(user && { preferences: user.preferences })
      };
      
      localStorage.setItem('odzai-user', JSON.stringify(adminUser));
      setUser(adminUser);
    } else {
      // Special check for permanent admin users
      if (user && ADMIN_USERS.includes(user.name)) {
        console.log(`${user.name} is a permanent admin and cannot have admin privileges removed.`);
        return; // Don't remove admin status from permanent admin users
      }
      
      // Remove admin status
      document.cookie = 'odzai-admin=false; path=/; max-age=0'; // remove cookie
      
      if (user) {
        const regularUser: User = {
          ...user,
          isAdmin: false
        };
        
        localStorage.setItem('odzai-user', JSON.stringify(regularUser));
        setUser(regularUser);
      }
    }
  };
  
  /**
   * Login as Fabrice Mhr with admin privileges
   */
  const loginAsFabriceMhr = () => {
    const fabriceUser: User = {
      id: 'fabrice-mhr',
      email: 'fabrice.mhr@example.com',
      name: 'Fabrice Mhr',
      isAdmin: true,
      preferences: user?.preferences || {}
    };
    
    // Set admin cookie
    document.cookie = 'odzai-admin=true; path=/; max-age=86400'; // 1 day
    document.cookie = 'user=fabricemhr; path=/; max-age=86400'; // 1 day
    
    // Save to localStorage
    localStorage.setItem('odzai-user', JSON.stringify(fabriceUser));
    
    // Update state
    setUser(fabriceUser);
  };

  return {
    user,
    isLoading,
    error,
    setAdmin,
    loginAsFabriceMhr,
    isAdmin: user?.isAdmin || false
  };
} 