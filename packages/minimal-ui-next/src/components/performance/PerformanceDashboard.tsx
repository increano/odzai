'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { HelpCircle, RefreshCw, AlertTriangle, CheckCircle, Bell } from "lucide-react";
import { classifyMetric, METRIC_THRESHOLDS } from '@/lib/performance/webVitalsMonitor';
import PerformanceAlertsPanel from './PerformanceAlertsPanel';

// Types for dashboard data
interface MetricSummary {
  name: string;
  value: number;
  unit: string;
  classification?: 'good' | 'needs-improvement' | 'poor';
  description: string;
}

interface ResourceSummary {
  type: string;
  count: number;
  size: number;
  avgLoadTime: number;
}

// Sample data (would be fetched from the server in a real app)
const sampleMetrics: MetricSummary[] = [
  {
    name: 'LCP',
    value: 2800,
    unit: 'ms',
    classification: 'needs-improvement',
    description: 'Largest Contentful Paint - measures loading performance'
  },
  {
    name: 'CLS',
    value: 0.08,
    unit: '',
    classification: 'good',
    description: 'Cumulative Layout Shift - measures visual stability'
  },
  {
    name: 'INP',
    value: 450,
    unit: 'ms',
    classification: 'needs-improvement',
    description: 'Interaction to Next Paint - measures responsiveness'
  },
  {
    name: 'FCP',
    value: 1500,
    unit: 'ms',
    classification: 'good',
    description: 'First Contentful Paint - measures perceived load speed'
  },
  {
    name: 'TTFB',
    value: 350,
    unit: 'ms',
    classification: 'good',
    description: 'Time to First Byte - measures server response time'
  }
];

const sampleResources: ResourceSummary[] = [
  { type: 'script', count: 12, size: 876543, avgLoadTime: 320 },
  { type: 'stylesheet', count: 3, size: 45678, avgLoadTime: 110 },
  { type: 'image', count: 8, size: 1234567, avgLoadTime: 580 },
  { type: 'font', count: 2, size: 98765, avgLoadTime: 140 },
  { type: 'fetch', count: 5, size: 34567, avgLoadTime: 210 }
];

// Helper functions
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getColorForClassification = (classification?: string): string => {
  switch (classification) {
    case 'good':
      return 'bg-green-600';
    case 'needs-improvement':
      return 'bg-amber-500';
    case 'poor':
      return 'bg-red-600';
    default:
      return 'bg-gray-400';
  }
};

const getBadgeForClassification = (classification?: string) => {
  switch (classification) {
    case 'good':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" /> Good</Badge>;
    case 'needs-improvement':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100"><AlertTriangle className="h-3 w-3 mr-1" /> Needs Improvement</Badge>;
    case 'poor':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertTriangle className="h-3 w-3 mr-1" /> Poor</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>;
  }
};

/**
 * Performance Dashboard Component
 */
export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<MetricSummary[]>(sampleMetrics);
  const [resources, setResources] = useState<ResourceSummary[]>(sampleResources);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch metrics (would connect to a real API in production)
  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, fetch from API
      // const response = await fetch('/api/performance-metrics');
      // const data = await response.json();
      // setMetrics(data.metrics);
      // setResources(data.resources);
      
      // For demo, just use sample data with slight randomization
      setMetrics(sampleMetrics.map(metric => ({
        ...metric,
        value: metric.value * (0.9 + Math.random() * 0.2),
        classification: classifyMetric(
          metric.name as keyof typeof METRIC_THRESHOLDS, 
          metric.value * (0.9 + Math.random() * 0.2)
        )
      })));
      
      setResources(sampleResources);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (err) {
      setError('Failed to fetch performance metrics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch metrics on initial load
  useEffect(() => {
    fetchMetrics();
  }, []);
  
  // Render the dashboard
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Button 
          onClick={fetchMetrics} 
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          {isLoading ? 
            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Refreshing...</> : 
            <><RefreshCw className="mr-2 h-4 w-4" /> Refresh</>
          }
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="core-web-vitals">
        <TabsList>
          <TabsTrigger value="core-web-vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-1" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        {/* Core Web Vitals Tab */}
        <TabsContent value="core-web-vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics
              .filter(metric => ['LCP', 'CLS', 'INP'].includes(metric.name))
              .map(metric => (
                <Card key={metric.name}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{metric.name}</CardTitle>
                      {getBadgeForClassification(metric.classification)}
                    </div>
                    <CardDescription className="text-xs">{metric.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metric.value.toFixed(metric.name === 'CLS' ? 2 : 0)}{metric.unit}
                    </div>
                    <Progress 
                      value={
                        metric.name === 'CLS' 
                          ? Math.min(100, (metric.value / METRIC_THRESHOLDS.CLS.poor) * 100)
                          : Math.min(100, (metric.value / (METRIC_THRESHOLDS[metric.name as keyof typeof METRIC_THRESHOLDS].poor * 1.5)) * 100)
                      }
                      className={`h-2 mt-2 ${getColorForClassification(metric.classification)}`}
                    />
                  </CardContent>
                  <CardFooter className="pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <HelpCircle className="h-3 w-3 mr-1" />
                      Target: {
                        metric.name === 'CLS' 
                          ? `< ${METRIC_THRESHOLDS.CLS.good}`
                          : `< ${METRIC_THRESHOLDS[metric.name as keyof typeof METRIC_THRESHOLDS].good}ms`
                      }
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>All Metrics</CardTitle>
              <CardDescription>Complete performance metrics for this page</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map(metric => (
                    <TableRow key={metric.name}>
                      <TableCell className="font-medium">{metric.name}</TableCell>
                      <TableCell>{metric.value.toFixed(metric.name === 'CLS' ? 2 : 0)}{metric.unit}</TableCell>
                      <TableCell>{getBadgeForClassification(metric.classification)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{metric.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Breakdown</CardTitle>
              <CardDescription>Analysis of loaded resources</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Total Size</TableHead>
                    <TableHead>Avg Load Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map(resource => (
                    <TableRow key={resource.type}>
                      <TableCell className="font-medium capitalize">{resource.type}</TableCell>
                      <TableCell>{resource.count}</TableCell>
                      <TableCell>{formatBytes(resource.size)}</TableCell>
                      <TableCell>{resource.avgLoadTime}ms</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="font-bold">{resources.reduce((acc, r) => acc + r.count, 0)}</TableCell>
                    <TableCell className="font-bold">{formatBytes(resources.reduce((acc, r) => acc + r.size, 0))}</TableCell>
                    <TableCell className="font-bold">{Math.round(resources.reduce((acc, r) => acc + r.avgLoadTime * r.count, 0) / resources.reduce((acc, r) => acc + r.count, 0))}ms avg</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <PerformanceAlertsPanel />
        </TabsContent>
        
        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {metrics.some(m => m.classification === 'poor' || m.classification === 'needs-improvement') ? (
            <ul className="space-y-3">
              {metrics.filter(m => m.classification === 'poor').map(metric => (
                <li key={metric.name} className="flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Critical: Improve {metric.name} ({metric.value.toFixed(metric.name === 'CLS' ? 2 : 0)}{metric.unit})</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {metric.name === 'LCP' && 'Consider optimizing image sizes, implementing lazy loading, and improving server response times.'}
                      {metric.name === 'CLS' && 'Fix layout shifts by properly sizing images and setting dimensions for all media elements.'}
                      {metric.name === 'INP' && 'Minimize JavaScript execution time and optimize event handlers to improve responsiveness.'}
                      {metric.name === 'FCP' && 'Reduce render-blocking resources and optimize critical rendering path.'}
                      {metric.name === 'TTFB' && 'Optimize server response time and consider using a CDN for faster content delivery.'}
                    </p>
                  </div>
                </li>
              ))}
              
              {metrics.filter(m => m.classification === 'needs-improvement').map(metric => (
                <li key={metric.name} className="flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Improve {metric.name} ({metric.value.toFixed(metric.name === 'CLS' ? 2 : 0)}{metric.unit})</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {metric.name === 'LCP' && 'Consider implementing image optimization and lazy loading for non-critical resources.'}
                      {metric.name === 'CLS' && 'Check for layout shifts and ensure all media elements have explicit dimensions.'}
                      {metric.name === 'INP' && 'Review JavaScript execution and optimize event handlers to improve responsiveness.'}
                      {metric.name === 'FCP' && 'Consider reducing the size of render-blocking resources like CSS and JavaScript.'}
                      {metric.name === 'TTFB' && 'Review server response time and consider caching strategies for faster delivery.'}
                    </p>
                  </div>
                </li>
              ))}
              
              {resources.length > 0 && (
                <li className="flex items-start">
                  <HelpCircle className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Optimize resources</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total of {formatBytes(resources.reduce((acc, r) => acc + r.size, 0))} resources loaded. 
                      Consider implementing code splitting, image optimization, and lazy loading for non-critical resources.
                    </p>
                  </div>
                </li>
              )}
            </ul>
          ) : (
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              <span>Great job! All metrics are within good ranges. Continue monitoring performance regularly.</span>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 