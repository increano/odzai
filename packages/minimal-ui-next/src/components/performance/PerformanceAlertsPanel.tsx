'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { AlertTriangle, Bell, CheckCircle, Info, Mail, RefreshCw, Webhook, Shield } from "lucide-react";
import { 
  PerformanceAlert, 
  AlertConfig, 
  AlertChannel, 
  getAlerts, 
  acknowledgeAlert, 
  getAlertConfig, 
  updateAlertConfig, 
  getBaselineMetrics,
  generateAlertsSummary 
} from '@/lib/performance/performanceAlerts';
import { forceCreateNewBaseline } from '@/lib/performance/webVitalsMonitor';
import { toast } from 'sonner';
import { MetricAlert, ThresholdLevel } from '@/lib/performance/metricsAnalyzer';
import { useUser } from '@/hooks/useUser'; // Assuming we have a user context hook

interface AlertsSummary {
  totalAlerts: number;
  criticalCount: number;
  warningCount: number;
  byPage: Record<string, any>;
  byMetric: Record<string, any>;
}

interface PerformanceAlertsData {
  success: boolean;
  alerts: MetricAlert[];
  summary: AlertsSummary;
  timestamp: number;
}

interface PerformanceAlertsPanelProps {
  refreshInterval?: number; // in milliseconds, default 60000 (1 minute)
  maxAlerts?: number; // maximum number of alerts to display, default 5
}

/**
 * Alert badge component
 */
function AlertBadge({ severity }: { severity: string }) {
  switch (severity) {
    case 'critical':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <AlertTriangle className="h-3 w-3 mr-1" /> Critical
        </Badge>
      );
    case 'warning':
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          <AlertTriangle className="h-3 w-3 mr-1" /> Warning
        </Badge>
      );
    default:
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Info className="h-3 w-3 mr-1" /> Info
        </Badge>
      );
  }
}

/**
 * Performance Alerts Panel Component
 * Only accessible to admin users
 */
export default function PerformanceAlertsPanel({ 
  refreshInterval = 60000, 
  maxAlerts = 5 
}: PerformanceAlertsPanelProps) {
  const [alertsData, setAlertsData] = useState<PerformanceAlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: isUserLoading } = useUser();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/performance-alerts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setAlertsData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance alerts');
      console.error('Error fetching performance alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch alerts if user is admin
    if (user?.isAdmin) {
      fetchAlerts();
      
      // Set up refresh interval
      const intervalId = setInterval(fetchAlerts, refreshInterval);
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, user]);

  // Helper to get severity color
  const getSeverityColor = (level: ThresholdLevel) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Format metric value based on type
  const formatMetricValue = (name: string, value: number) => {
    if (name === 'CLS') {
      return value.toFixed(3); // CLS has no units, just a score
    } else if (['LCP', 'FID', 'TTI', 'TTFB', 'INP'].includes(name)) {
      return `${value.toFixed(0)}ms`; // Time metrics in milliseconds
    } else {
      return value.toString(); // Default formatting
    }
  };

  // If user is loading, show loading state
  if (isUserLoading) {
    return <div className="p-4 border rounded shadow animate-pulse">Checking access permissions...</div>;
  }

  // If user is not an admin, don't show the component
  if (!user?.isAdmin) {
    return (
      <div className="p-4 border rounded shadow bg-amber-50 text-amber-700">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h3 className="font-semibold">Admin Access Required</h3>
        </div>
        <p className="mt-1">Performance monitoring is only available to administrators.</p>
      </div>
    );
  }

  if (loading && !alertsData) {
    return <div className="p-4 border rounded shadow animate-pulse">Loading performance alerts...</div>;
  }

  if (error) {
    return (
      <div className="p-4 border rounded shadow bg-red-50 text-red-700">
        <h3 className="font-semibold">Error loading performance alerts</h3>
        <p>{error}</p>
        <button 
          onClick={fetchAlerts}
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!alertsData || alertsData.alerts.length === 0) {
    return (
      <div className="p-4 border rounded shadow bg-green-50 text-green-700">
        <h3 className="font-semibold">Performance Monitoring</h3>
        <p>No performance alerts detected. Everything looks good! 👍</p>
        <p className="text-xs text-green-600 mt-1">
          Last checked: {new Date().toLocaleTimeString()}
        </p>
      </div>
    );
  }

  // Sort alerts by severity and recency
  const sortedAlerts = [...alertsData.alerts].sort((a, b) => {
    // Sort by severity first (critical before warning)
    if (a.level === 'critical' && b.level !== 'critical') return -1;
    if (a.level !== 'critical' && b.level === 'critical') return 1;
    // Then by timestamp (newer first)
    return b.metric.serverTimestamp - a.metric.serverTimestamp;
  });

  // Limit to maxAlerts
  const displayAlerts = sortedAlerts.slice(0, maxAlerts);

  return (
    <div className="border rounded shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Shield className="h-4 w-4 mr-2 text-blue-500" />
          <h3 className="font-semibold text-lg">Performance Alerts</h3>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">
            {new Date(alertsData.timestamp).toLocaleTimeString()}
          </span>
          <button 
            onClick={fetchAlerts}
            className="p-1 rounded hover:bg-gray-100"
            title="Refresh alerts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="flex mb-4 text-sm">
        <div className="mr-4">
          <span className="font-medium">Total: </span>
          <span>{alertsData.summary.totalAlerts}</span>
        </div>
        {alertsData.summary.criticalCount > 0 && (
          <div className="mr-4 text-red-700">
            <span className="font-medium">Critical: </span>
            <span>{alertsData.summary.criticalCount}</span>
          </div>
        )}
        {alertsData.summary.warningCount > 0 && (
          <div className="text-amber-700">
            <span className="font-medium">Warning: </span>
            <span>{alertsData.summary.warningCount}</span>
          </div>
        )}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {displayAlerts.map((alert, index) => (
          <div 
            key={`${alert.metric.name}-${alert.metric.serverTimestamp}-${index}`}
            className={`border rounded p-3 ${getSeverityColor(alert.level)}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{alert.metric.name}</div>
                <div className="text-sm">
                  Value: {formatMetricValue(alert.metric.name, alert.metric.value)} 
                  <span className="mx-1">•</span>
                  Threshold: {formatMetricValue(alert.metric.name, alert.threshold)}
                </div>
              </div>
              <div className="text-xs">
                {new Date(alert.metric.serverTimestamp).toLocaleString()}
              </div>
            </div>
            <div className="text-sm mt-1">
              Page: {alert.metric.page}
            </div>
          </div>
        ))}
      </div>
      
      {alertsData.alerts.length > maxAlerts && (
        <div className="mt-3 text-center text-sm text-gray-500">
          +{alertsData.alerts.length - maxAlerts} more alerts not shown
        </div>
      )}
    </div>
  );
} 