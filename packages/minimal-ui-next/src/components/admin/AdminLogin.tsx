'use client';

import React, { useState } from 'react';
import { useUser } from '@/hooks/useUser';

/**
 * Admin Login Component
 * For demonstration/testing purposes only - would not exist in production
 */
export default function AdminLogin() {
  const { user, loginAsFabriceMhr } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      // Login as Fabrice Mhr
      loginAsFabriceMhr();
      
      // Reload the page to ensure all components recognize the new user
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error('Error logging in:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // If already logged in as Fabrice Mhr, don't show the login button
  if (user?.name === 'Fabrice Mhr') {
    return (
      <div className="fixed top-4 right-4 z-50 bg-blue-100 text-blue-800 px-4 py-2 rounded-md shadow-md">
        Logged in as Fabrice Mhr (Admin)
      </div>
    );
  }
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-md transition-all
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLoading ? 'Logging in...' : 'Login as Fabrice Mhr'}
      </button>
    </div>
  );
} 