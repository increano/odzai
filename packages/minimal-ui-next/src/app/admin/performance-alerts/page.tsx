'use client';

import React from 'react';
import { useUser } from '@/hooks/useUser';
import PerformanceAlertsPanel from '@/components/performance/PerformanceAlertsPanel';
import { ShieldAlert, BarChart2, Bell, ActivitySquare } from 'lucide-react';

/**
 * Performance Alerts Admin Page
 * This page displays the performance alerts dashboard for admins
 */
export default function PerformanceAlertsPage() {
  const { user, isAdmin, isLoading } = useUser();

  // If still loading user data, show loading state
  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // If not an admin, show access denied
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
          </div>
          <p className="mb-2">
            You do not have permission to view the Performance Alerts Dashboard. This feature is restricted to administrators only.
          </p>
          <p>
            Please contact your system administrator if you believe you should have access to this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ActivitySquare className="h-7 w-7 text-blue-600" />
          <h1 className="text-3xl font-bold">Performance Alerts Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Monitor application performance metrics and receive alerts when performance degrades.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceAlertsPanel refreshInterval={30000} maxAlerts={10} />
        </div>
        
        <div className="space-y-6">
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-medium">Performance Metrics</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Core Web Vitals</h3>
                <p className="text-sm text-muted-foreground">LCP, CLS, FID, INP</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Response Times</h3>
                <p className="text-sm text-muted-foreground">API response, page load, navigation</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Resource Usage</h3>
                <p className="text-sm text-muted-foreground">Memory, network, CPU</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-medium">Alert Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Alert Channels</h3>
                <p className="text-sm text-muted-foreground">Dashboard, Email, Console</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Thresholds</h3>
                <p className="text-sm text-muted-foreground">Warning and critical levels configurable</p>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
                Configure Alert Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 