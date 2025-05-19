'use client';

import React, { useState } from 'react';
import { useUser } from '@/hooks/useUser';

/**
 * Admin Toggle Component
 * For demonstration/testing purposes only - would not exist in production
 */
export default function AdminToggle() {
  const { user, isAdmin, setAdmin } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  
  const toggleAdmin = async () => {
    setIsLoading(true);
    
    try {
      // Update the API
      const response = await fetch('/api/admin/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin: !isAdmin }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle admin status');
      }
      
      // Update local state
      setAdmin(!isAdmin);
    } catch (error) {
      console.error('Error toggling admin status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleAdmin}
        disabled={isLoading}
        className={`rounded-full px-4 py-2 text-sm font-medium text-white shadow-md transition-all
          ${isAdmin 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-600 hover:bg-gray-700'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLoading ? 'Loading...' : (isAdmin ? 'Admin Mode (On)' : 'Admin Mode (Off)')}
      </button>
    </div>
  );
} 