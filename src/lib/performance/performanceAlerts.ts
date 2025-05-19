'use client';

import { WebVitalsMetric, METRIC_THRESHOLDS, classifyMetric } from '@/lib/performance/webVitalsMonitor';
import { storage } from '@/lib/storage';

// Types
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertChannel = 'console' | 'dashboard' | 'email' | 'webhook';

export interface PerformanceAlert {
  id: string;
  metricName: string;
  currentValue: number;
  baselineValue: number;
  percentChange: number;
  timestamp: number;
  severity: AlertSeverity;
  url: string;
  deviceType?: string;
  acknowledged: boolean;
}

export interface AlertThreshold {
  metric: keyof typeof METRIC_THRESHOLDS;
  warning: number; // Percentage degradation for warning
  critical: number; // Percentage degradation for critical alert
}

export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  thresholds: AlertThreshold[];
  minSampleSize: number;
  webhookUrl?: string;
  emailRecipients?: string[];
}

// Default alert thresholds for common metrics
const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  { metric: 'LCP', warning: 20, critical: 50 },
  { metric: 'CLS', warning: 20, critical: 50 },
  { metric: 'FID', warning: 20, critical: 50 },
  { metric: 'INP', warning: 20, critical: 50 },
  { metric: 'FCP', warning: 20, critical: 50 },
  { metric: 'TTFB', warning: 20, critical: 50 },
];

// Default alert configuration
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enabled: true,
  channels: ['console', 'dashboard'],
  thresholds: DEFAULT_THRESHOLDS,
  minSampleSize: 5,
};

// Storage keys
const STORAGE_KEYS = {
  BASELINE_METRICS: 'performance-baseline-metrics',
  ALERTS: 'performance-alerts',
  ALERT_CONFIG: 'performance-alert-config',
};

/**
 * Get or initialize performance alert configuration
 */
export function getAlertConfig(): AlertConfig {
  const config = storage.get<AlertConfig>(STORAGE_KEYS.ALERT_CONFIG);
  if (!config) {
    storage.set(STORAGE_KEYS.ALERT_CONFIG, DEFAULT_ALERT_CONFIG);
    return DEFAULT_ALERT_CONFIG;
  }
  return config;
}

/**
 * Update performance alert configuration
 */
export function updateAlertConfig(config: Partial<AlertConfig>): AlertConfig {
  const currentConfig = getAlertConfig();
  const newConfig = { ...currentConfig, ...config };
  storage.set(STORAGE_KEYS.ALERT_CONFIG, newConfig);
  return newConfig;
}

/**
 * Get stored performance baseline metrics
 */
export function getBaselineMetrics(): Record<string, number> {
  return storage.get<Record<string, number>>(STORAGE_KEYS.BASELINE_METRICS) || {};
}

/**
 * Set baseline metrics for future comparison
 */
export function setBaselineMetrics(metrics: Record<string, number>): void {
  storage.set(STORAGE_KEYS.BASELINE_METRICS, metrics);
  console.info('Performance baseline updated:', metrics);
}

/**
 * Get all stored performance alerts
 */
export function getAlerts(): PerformanceAlert[] {
  return storage.get<PerformanceAlert[]>(STORAGE_KEYS.ALERTS) || [];
}

/**
 * Store a new performance alert
 */
function storeAlert(alert: PerformanceAlert): void {
  const alerts = getAlerts();
  alerts.push(alert);
  
  // Keep only the most recent 100 alerts
  if (alerts.length > 100) {
    alerts.splice(0, alerts.length - 100);
  }
  
  storage.set(STORAGE_KEYS.ALERTS, alerts);
}

/**
 * Check if a metric has regressed compared to baseline
 */
export function checkForRegression(
  metricName: string, 
  currentValue: number,
  url: string,
  deviceType: string = 'desktop'
): PerformanceAlert | null {
  const config = getAlertConfig();
  if (!config.enabled) return null;
  
  const baselines = getBaselineMetrics();
  const baselineValue = baselines[metricName];
  
  // Skip if we don't have a baseline yet
  if (baselineValue === undefined) return null;
  
  // Calculate percentage change (positive means performance degradation)
  // For CLS, higher is worse, for timing metrics, higher is worse
  const percentChange = ((currentValue - baselineValue) / baselineValue) * 100;
  
  // Skip if performance improved
  if (percentChange <= 0) return null;
  
  // Find the threshold for this metric
  const threshold = config.thresholds.find(t => t.metric === metricName);
  if (!threshold) return null;
  
  // Determine severity
  let severity: AlertSeverity = 'info';
  if (percentChange >= threshold.critical) {
    severity = 'critical';
  } else if (percentChange >= threshold.warning) {
    severity = 'warning';
  } else {
    // No regression beyond thresholds
    return null;
  }
  
  // Create alert
  const alert: PerformanceAlert = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    metricName,
    currentValue,
    baselineValue,
    percentChange,
    timestamp: Date.now(),
    severity,
    url,
    deviceType,
    acknowledged: false,
  };
  
  // Dispatch alert through configured channels
  dispatchAlert(alert, config);
  
  return alert;
}

/**
 * Dispatch an alert through configured channels
 */
function dispatchAlert(alert: PerformanceAlert, config: AlertConfig): void {
  // Store the alert
  storeAlert(alert);
  
  // Send to each configured channel
  config.channels.forEach(channel => {
    switch (channel) {
      case 'console':
        logAlertToConsole(alert);
        break;
      case 'dashboard':
        // Dashboard will read from storage automatically
        break;
      case 'email':
        if (config.emailRecipients?.length) {
          sendEmailAlert(alert, config.emailRecipients);
        }
        break;
      case 'webhook':
        if (config.webhookUrl) {
          sendWebhookAlert(alert, config.webhookUrl);
        }
        break;
    }
  });
}

/**
 * Log an alert to the console
 */
function logAlertToConsole(alert: PerformanceAlert): void {
  const message = `[PERFORMANCE ALERT] ${alert.severity.toUpperCase()}: ${alert.metricName} degraded by ${alert.percentChange.toFixed(1)}% (${alert.baselineValue.toFixed(2)} → ${alert.currentValue.toFixed(2)})`;
  
  switch (alert.severity) {
    case 'critical':
      console.error(message, alert);
      break;
    case 'warning':
      console.warn(message, alert);
      break;
    default:
      console.info(message, alert);
  }
}

/**
 * Send an alert via email
 */
async function sendEmailAlert(alert: PerformanceAlert, recipients: string[]): Promise<void> {
  try {
    const response = await fetch('/api/performance-alerts/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alert,
        recipients,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send email alert: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending email alert:', error);
  }
}

/**
 * Send an alert to a webhook
 */
async function sendWebhookAlert(alert: PerformanceAlert, webhookUrl: string): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alert),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send webhook alert: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending webhook alert:', error);
  }
}

/**
 * Acknowledge an alert (mark as read/processed)
 */
export function acknowledgeAlert(alertId: string): void {
  const alerts = getAlerts();
  const updatedAlerts = alerts.map(alert => 
    alert.id === alertId 
      ? { ...alert, acknowledged: true } 
      : alert
  );
  
  storage.set(STORAGE_KEYS.ALERTS, updatedAlerts);
}

/**
 * Process a new metric to check for regressions
 */
export function processMetricForAlerts(metric: WebVitalsMetric): PerformanceAlert | null {
  const url = metric.page || window.location.pathname;
  return checkForRegression(
    metric.name,
    metric.value,
    url,
    metric.deviceType
  );
}

/**
 * Calculate baseline metrics from a collection of metrics
 */
export function calculateBaseline(metrics: WebVitalsMetric[]): Record<string, number> {
  // Group metrics by name
  const metricsByName: Record<string, number[]> = {};
  
  metrics.forEach(metric => {
    if (!metricsByName[metric.name]) {
      metricsByName[metric.name] = [];
    }
    metricsByName[metric.name].push(metric.value);
  });
  
  // Calculate median value for each metric type
  const baseline: Record<string, number> = {};
  
  for (const [name, values] of Object.entries(metricsByName)) {
    if (values.length === 0) continue;
    
    // Sort values and take the median
    values.sort((a, b) => a - b);
    const medianIndex = Math.floor(values.length / 2);
    baseline[name] = values.length % 2 === 0
      ? (values[medianIndex - 1] + values[medianIndex]) / 2
      : values[medianIndex];
  }
  
  return baseline;
}

/**
 * Generate a human-readable summary of performance alerts
 */
export function generateAlertsSummary(alerts: PerformanceAlert[]): string {
  if (alerts.length === 0) {
    return 'No performance alerts detected.';
  }
  
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;
  
  let summary = `Performance Alerts: ${alerts.length} total (${criticalCount} critical, ${warningCount} warnings, ${infoCount} info)\n\n`;
  
  // Group by metric name
  const metricGroups = alerts.reduce((groups, alert) => {
    if (!groups[alert.metricName]) {
      groups[alert.metricName] = [];
    }
    groups[alert.metricName].push(alert);
    return groups;
  }, {} as Record<string, PerformanceAlert[]>);
  
  // Add details for each metric
  for (const [metricName, metricAlerts] of Object.entries(metricGroups)) {
    const worstAlert = metricAlerts.reduce((worst, alert) => 
      alert.percentChange > worst.percentChange ? alert : worst
    , metricAlerts[0]);
    
    summary += `${metricName}: Worst regression of ${worstAlert.percentChange.toFixed(1)}% (${metricAlerts.length} alerts)\n`;
  }
  
  return summary;
} 