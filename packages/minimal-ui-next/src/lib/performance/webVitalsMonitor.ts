'use client';

import { 
  onCLS, 
  onFCP, 
  onLCP, 
  onTTFB, 
  onINP, 
  type Metric 
} from 'web-vitals';
import { 
  processMetricForAlerts, 
  setBaselineMetrics, 
  calculateBaseline, 
  getBaselineMetrics 
} from './performanceAlerts';
import { storage } from '../storage';

// Minimum number of metrics needed to establish a baseline
const MIN_METRICS_FOR_BASELINE = 5;

// Types for performance metrics
export type WebVitalsMetric = Metric & {
  id: string;
  page: string;
  timestamp: number;
  userAgent?: string;
  deviceType?: string;
  connection?: string;
};

// Metric thresholds as per Google's recommendations
export const METRIC_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  LCP: { good: 2500, poor: 4000 }, // in ms
  FID: { good: 100, poor: 300 },   // in ms
  INP: { good: 200, poor: 500 },   // in ms
  FCP: { good: 1800, poor: 3000 }, // in ms
  TTFB: { good: 800, poor: 1800 }, // in ms
};

// In-memory storage of recent metrics for baseline calculation
const recentMetrics: WebVitalsMetric[] = [];
const STORAGE_KEYS = {
  COLLECTED_METRICS: 'performance-collected-metrics',
};

// Report metrics to analytics endpoint
async function reportMetric(metric: WebVitalsMetric) {
  try {
    // Store metrics for baseline calculation
    storeMetricForBaseline(metric);
    
    // Check for regressions if we have a baseline
    processMetricForAlerts(metric);
    
    // Create an endpoint URL for reporting
    const endpoint = '/api/metrics';
    
    // Send the metric data
    await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(metric),
      headers: {
        'Content-Type': 'application/json',
      },
      // Use keepalive to ensure the request completes even if page is unloading
      keepalive: true,
    });
  } catch (error) {
    // Silently fail to avoid impacting user experience
    console.error('Error reporting web vitals:', error);
  }
}

// Store metric for baseline calculation
function storeMetricForBaseline(metric: WebVitalsMetric) {
  // Add to in-memory array
  recentMetrics.push(metric);
  
  // Keep only the most recent metrics
  if (recentMetrics.length > 100) {
    recentMetrics.shift();
  }
  
  // Store in persistent storage as well
  const storedMetrics = storage.get<WebVitalsMetric[]>(STORAGE_KEYS.COLLECTED_METRICS) || [];
  storedMetrics.push(metric);
  
  // Keep only the most recent 500 metrics
  if (storedMetrics.length > 500) {
    storedMetrics.splice(0, storedMetrics.length - 500);
  }
  
  storage.set(STORAGE_KEYS.COLLECTED_METRICS, storedMetrics);
  
  // Check if we need to update the baseline
  updateBaselineIfNeeded();
}

// Update baseline metrics if we have enough data
function updateBaselineIfNeeded() {
  // Check if we already have a baseline
  const currentBaseline = getBaselineMetrics();
  const hasBaseline = Object.keys(currentBaseline).length > 0;
  
  // If we don't have a baseline and have enough metrics, calculate one
  if (!hasBaseline && recentMetrics.length >= MIN_METRICS_FOR_BASELINE) {
    const baseline = calculateBaseline(recentMetrics);
    setBaselineMetrics(baseline);
    console.info('Initial performance baseline established:', baseline);
  }
  
  // Also periodically update the baseline with new data (weekly)
  // This helps adapt to changes in the application over time
  const lastBaselineUpdate = storage.get<number>('last-baseline-update') || 0;
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  
  if (hasBaseline && now - lastBaselineUpdate > oneWeek && recentMetrics.length >= MIN_METRICS_FOR_BASELINE) {
    const newBaseline = calculateBaseline(recentMetrics);
    setBaselineMetrics(newBaseline);
    storage.set('last-baseline-update', now);
    console.info('Performance baseline updated weekly:', newBaseline);
  }
}

// Helper function to extend the metric with additional context
function extendMetric(metric: Metric): WebVitalsMetric {
  return {
    ...metric,
    id: generateUniqueID(),
    page: window.location.pathname,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    deviceType: getDeviceType(),
    connection: getConnectionType(),
  };
}

// Generate a unique ID for each metric report
function generateUniqueID() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

// Determine device type based on user agent and screen size
function getDeviceType() {
  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

// Get connection information if available
function getConnectionType() {
  const nav = navigator as any;
  if (nav.connection) {
    return `${nav.connection.effectiveType || 'unknown'}/${nav.connection.saveData ? 'saveData' : 'normal'}`;
  }
  return 'unknown';
}

// Initialize web vitals collection
export function initWebVitals() {
  try {
    // Core Web Vitals
    onCLS(metric => reportMetric(extendMetric(metric)));
    onLCP(metric => reportMetric(extendMetric(metric)));
    // FID is deprecated in favor of INP in web-vitals v3+
    onINP(metric => reportMetric(extendMetric(metric)));
    
    // Additional metrics
    onFCP(metric => reportMetric(extendMetric(metric)));
    onTTFB(metric => reportMetric(extendMetric(metric)));
    
    // Initialize with any existing baseline or create a new one
    // if we already have enough stored metrics
    const storedMetrics = storage.get<WebVitalsMetric[]>(STORAGE_KEYS.COLLECTED_METRICS) || [];
    if (storedMetrics.length >= MIN_METRICS_FOR_BASELINE) {
      const currentBaseline = getBaselineMetrics();
      if (Object.keys(currentBaseline).length === 0) {
        const baseline = calculateBaseline(storedMetrics);
        setBaselineMetrics(baseline);
        storage.set('last-baseline-update', Date.now());
        console.info('Performance baseline established from stored metrics:', baseline);
      }
    }
    
    console.info('Web Vitals monitoring and alerting initialized');
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
}

// Add a method to collect metrics on demand
export function capturePageMetrics(label: string) {
  // Get current performance timing data
  if (typeof performance === 'undefined') return null;
  
  const timing = performance.timing;
  const navigationStart = timing.navigationStart;
  
  const metrics = {
    label,
    timestamp: Date.now(),
    page: window.location.pathname,
    // Navigation timing metrics
    dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
    tcpConnection: timing.connectEnd - timing.connectStart,
    requestStart: timing.requestStart - navigationStart,
    responseStart: timing.responseStart - navigationStart,
    responseEnd: timing.responseEnd - navigationStart,
    domLoaded: timing.domContentLoadedEventEnd - navigationStart,
    windowLoaded: timing.loadEventEnd - navigationStart,
    // Resource timing
    resourceCount: performance.getEntriesByType('resource').length,
    // Memory info (Chrome only)
    memory: (performance as any).memory ? {
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
    } : null,
  };
  
  // Report custom metrics
  reportMetric(metrics as any);
  return metrics;
}

// Classify a metric value based on thresholds
export function classifyMetric(name: keyof typeof METRIC_THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = METRIC_THRESHOLDS[name];
  
  if (value <= thresholds.good) {
    return 'good';
  } else if (value <= thresholds.poor) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

// Get a summary of performance issues
export function getPerformanceSummary(metrics: Record<string, number>): string[] {
  const issues: string[] = [];
  
  Object.entries(metrics).forEach(([name, value]) => {
    if (name in METRIC_THRESHOLDS) {
      const metricName = name as keyof typeof METRIC_THRESHOLDS;
      const classification = classifyMetric(metricName, value);
      
      if (classification === 'poor') {
        issues.push(`${name} is poor (${value}ms). Consider optimizing.`);
      } else if (classification === 'needs-improvement') {
        issues.push(`${name} needs improvement (${value}ms).`);
      }
    }
  });
  
  return issues;
}

// Force creation of a new baseline from recent metrics
// Useful for resetting after performance improvements
export function forceCreateNewBaseline(): Record<string, number> | null {
  if (recentMetrics.length < MIN_METRICS_FOR_BASELINE) {
    const storedMetrics = storage.get<WebVitalsMetric[]>(STORAGE_KEYS.COLLECTED_METRICS) || [];
    if (storedMetrics.length >= MIN_METRICS_FOR_BASELINE) {
      const baseline = calculateBaseline(storedMetrics);
      setBaselineMetrics(baseline);
      storage.set('last-baseline-update', Date.now());
      console.info('New performance baseline created from stored metrics:', baseline);
      return baseline;
    }
    return null;
  }
  
  const baseline = calculateBaseline(recentMetrics);
  setBaselineMetrics(baseline);
  storage.set('last-baseline-update', Date.now());
  console.info('New performance baseline created:', baseline);
  return baseline;
} 