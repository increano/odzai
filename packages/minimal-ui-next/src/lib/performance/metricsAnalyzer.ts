import fs from 'fs';
import path from 'path';

// Define performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  LCP: { warning: 2500, critical: 4000 }, // in ms
  FID: { warning: 100, critical: 300 }, // in ms
  CLS: { warning: 0.1, critical: 0.25 }, // unitless
  INP: { warning: 200, critical: 500 }, // in ms
  TTFB: { warning: 800, critical: 1800 }, // in ms
  // Add custom metrics as needed
  'test-metric': { warning: 30, critical: 45 } // example for our test metric
};

export type MetricType = keyof typeof PERFORMANCE_THRESHOLDS;
export type ThresholdLevel = 'normal' | 'warning' | 'critical';

export interface PerformanceMetric {
  name: string;
  value: number;
  page: string;
  serverTimestamp: number;
  [key: string]: any; // Allow for additional properties
}

export interface MetricAlert {
  metric: PerformanceMetric;
  level: ThresholdLevel;
  threshold: number;
  timestamp: number;
}

/**
 * Analyzes a single metric and determines if it exceeds thresholds
 */
export function analyzeMetric(metric: PerformanceMetric): MetricAlert | null {
  const metricName = metric.name as MetricType;
  const thresholds = PERFORMANCE_THRESHOLDS[metricName];
  
  if (!thresholds) {
    return null; // Unknown metric type
  }
  
  if (metric.value >= thresholds.critical) {
    return {
      metric,
      level: 'critical',
      threshold: thresholds.critical,
      timestamp: Date.now()
    };
  } else if (metric.value >= thresholds.warning) {
    return {
      metric,
      level: 'warning',
      threshold: thresholds.warning,
      timestamp: Date.now()
    };
  }
  
  return null; // Metric is within normal range
}

/**
 * Read and analyze the most recent metrics file 
 */
export async function analyzeRecentMetrics(): Promise<MetricAlert[]> {
  const METRICS_FOLDER = path.join(process.cwd(), 'data', 'performance-metrics');
  const alerts: MetricAlert[] = [];
  
  try {
    // Get the most recent metrics file
    const files = fs.readdirSync(METRICS_FOLDER)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      return alerts;
    }
    
    const latestFile = files[0];
    const filePath = path.join(METRICS_FOLDER, latestFile);
    
    // Read and parse the metrics file
    const metricsData = JSON.parse(fs.readFileSync(filePath, 'utf8')) as PerformanceMetric[];
    
    // Analyze each metric
    for (const metric of metricsData) {
      const alert = analyzeMetric(metric);
      if (alert) {
        alerts.push(alert);
      }
    }
    
    return alerts;
  } catch (error) {
    console.error('Error analyzing metrics:', error);
    return alerts;
  }
}

/**
 * Create a summary of alerts grouped by page and metric type
 */
export function createAlertsSummary(alerts: MetricAlert[]): Record<string, any> {
  const summary: Record<string, any> = {
    totalAlerts: alerts.length,
    criticalCount: 0,
    warningCount: 0,
    byPage: {},
    byMetric: {}
  };
  
  for (const alert of alerts) {
    // Count by severity
    if (alert.level === 'critical') {
      summary.criticalCount++;
    } else {
      summary.warningCount++;
    }
    
    // Group by page
    const page = alert.metric.page;
    if (!summary.byPage[page]) {
      summary.byPage[page] = { 
        critical: 0, 
        warning: 0,
        metrics: {}
      };
    }
    
    summary.byPage[page][alert.level]++;
    
    // Add to page metrics detail
    if (!summary.byPage[page].metrics[alert.metric.name]) {
      summary.byPage[page].metrics[alert.metric.name] = [];
    }
    summary.byPage[page].metrics[alert.metric.name].push({
      value: alert.metric.value,
      level: alert.level,
      timestamp: alert.metric.serverTimestamp
    });
    
    // Group by metric type
    if (!summary.byMetric[alert.metric.name]) {
      summary.byMetric[alert.metric.name] = {
        critical: 0,
        warning: 0,
        pages: {}
      };
    }
    
    summary.byMetric[alert.metric.name][alert.level]++;
    
    // Add to metric pages detail
    if (!summary.byMetric[alert.metric.name].pages[page]) {
      summary.byMetric[alert.metric.name].pages[page] = [];
    }
    summary.byMetric[alert.metric.name].pages[page].push({
      value: alert.metric.value,
      level: alert.level,
      timestamp: alert.metric.serverTimestamp
    });
  }
  
  return summary;
} 