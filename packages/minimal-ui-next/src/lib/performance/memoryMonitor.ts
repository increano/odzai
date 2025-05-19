'use client';

import { useEffect } from 'react';

interface MemoryStats {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  timeStamp: number;
}

interface MemoryMonitorOptions {
  sampleInterval?: number;    // ms between samples
  alertThreshold?: number;    // 0-1, percentage of heap limit
  growthAlertThreshold?: number; // percentage growth between samples to trigger alert
  historyLength?: number;     // number of samples to keep
  onAlert?: (stats: MemoryStats, growth: number) => void;
}

/**
 * Memory monitoring utility to help identify memory leaks
 * Uses the performance.memory API when available (Chrome only)
 */
class MemoryMonitor {
  private options: MemoryMonitorOptions;
  private history: MemoryStats[] = [];
  private intervalId: number | null = null;
  private isSupported: boolean;

  constructor(options: MemoryMonitorOptions = {}) {
    this.options = {
      sampleInterval: 5000,
      alertThreshold: 0.9,
      growthAlertThreshold: 0.1,
      historyLength: 20,
      onAlert: undefined,
      ...options
    };

    // Check if performance.memory is supported
    this.isSupported = typeof performance !== 'undefined' && 
      'memory' in performance &&
      typeof (performance as any).memory?.usedJSHeapSize === 'number';
  }

  /**
   * Start monitoring memory usage
   */
  start(): void {
    if (!this.isSupported) {
      console.warn('Memory monitoring is not supported in this browser');
      return;
    }

    if (this.intervalId !== null) {
      this.stop();
    }

    this.collectSample(); // Collect initial sample

    // Set up interval for regular sampling
    this.intervalId = window.setInterval(() => {
      this.collectSample();
    }, this.options.sampleInterval);
  }

  /**
   * Stop monitoring memory usage
   */
  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Collect a memory usage sample
   */
  private collectSample(): void {
    if (!this.isSupported) return;

    const memory = (performance as any).memory;
    
    const sample: MemoryStats = {
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      timeStamp: Date.now()
    };

    // Add to history
    this.history.push(sample);

    // Trim history if needed
    if (this.history.length > (this.options.historyLength || 20)) {
      this.history.shift();
    }

    // Check alert conditions
    this.checkAlerts(sample);
  }

  /**
   * Check if any alert thresholds have been exceeded
   */
  private checkAlerts(current: MemoryStats): void {
    // Check percentage of heap limit
    const heapPercentage = current.usedJSHeapSize / current.jsHeapSizeLimit;
    
    if (heapPercentage > (this.options.alertThreshold || 0.9)) {
      console.warn(
        `Memory usage alert: ${Math.round(heapPercentage * 100)}% of heap limit used`,
        current
      );
      
      this.options.onAlert?.(current, heapPercentage);
    }

    // Check for growth since last sample
    if (this.history.length > 1) {
      const previous = this.history[this.history.length - 2];
      const growth = (current.usedJSHeapSize - previous.usedJSHeapSize) / previous.usedJSHeapSize;
      
      if (growth > (this.options.growthAlertThreshold || 0.1)) {
        console.warn(
          `Memory growth alert: ${Math.round(growth * 100)}% increase in ${current.timeStamp - previous.timeStamp}ms`,
          { previous, current }
        );
        
        this.options.onAlert?.(current, growth);
      }
    }
  }

  /**
   * Get current memory statistics
   */
  getStats(): MemoryStats | null {
    if (!this.isSupported) return null;
    
    const memory = (performance as any).memory;
    return {
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      timeStamp: Date.now()
    };
  }

  /**
   * Get memory usage history
   */
  getHistory(): MemoryStats[] {
    return [...this.history];
  }

  /**
   * Force garbage collection if supported
   * Note: This requires special browser flags to be enabled
   */
  static triggerGC(): void {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc();
        console.info('Manual garbage collection triggered');
      } catch (e) {
        console.warn('Failed to trigger garbage collection', e);
      }
    } else {
      console.warn('Manual garbage collection not available. Run with --expose-gc flag');
    }
  }
}

// Create singleton instance
export const memoryMonitor = new MemoryMonitor();

// Hook for components to use memory monitoring
export function useMemoryMonitoring(options: MemoryMonitorOptions = {}): void {
  // Start monitoring when component mounts
  useEffect(() => {
    const monitor = new MemoryMonitor(options);
    monitor.start();
    
    // Clean up when component unmounts
    return () => {
      monitor.stop();
    };
  }, [options]);
} 