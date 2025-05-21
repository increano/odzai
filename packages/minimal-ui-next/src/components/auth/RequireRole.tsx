'use client';

import React from 'react';
import { useAuth } from '../providers/SupabaseAuthProvider';
import { redirect } from 'next/navigation';

type Props = {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'user')[];
  fallback?: React.ReactNode;
  redirectTo?: string;
};

/**
 * Component that restricts access based on user role
 * Implement's the RBAC component from the migration roadmap
 */
export function RequireRole({ 
  children, 
  allowedRoles, 
  fallback, 
  redirectTo = '/login' 
}: Props) {
  const { user, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    redirect(redirectTo);
  }
  
  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles.includes(user.role as any);
  
  // If not authorized but authenticated, render fallback or redirect
  if (!hasAllowedRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    redirect('/unauthorized');
  }
  
  // If authenticated and authorized, render children
  return <>{children}</>;
} 