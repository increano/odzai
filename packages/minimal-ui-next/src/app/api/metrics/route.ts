import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple in-memory buffer for metrics before writing to disk
let metricsBuffer: any[] = [];
const BUFFER_LIMIT = 50; // Write to disk after collecting this many metrics
const METRICS_FOLDER = path.join(process.cwd(), 'data', 'performance-metrics');

// Ensure the metrics folder exists on startup - this is now just an initial check
try {
  if (!fs.existsSync(METRICS_FOLDER)) {
    fs.mkdirSync(METRICS_FOLDER, { recursive: true });
    console.log(`Created metrics folder at ${METRICS_FOLDER}`);
  }
} catch (err) {
  console.error('Error creating metrics folder on startup:', err);
  // Continue anyway, we'll check again when writing
}

/**
 * POST handler for receiving performance metrics
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const metric = await request.json();
    
    // Validate the metric data
    if (!metric || !metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid metric format' },
        { status: 400 }
      );
    }
    
    // Add server timestamp
    metric.serverTimestamp = Date.now();
    
    // Add to buffer
    metricsBuffer.push(metric);
    
    // If buffer reaches limit, try to write to disk
    if (metricsBuffer.length >= BUFFER_LIMIT) {
      try {
        await flushMetricsBuffer();
      } catch (error) {
        console.warn('Failed to flush metrics buffer, continuing with in-memory storage only', error);
        // We'll continue even if writing fails
      }
    }
    
    // Log interesting metrics for immediate attention
    if (
      (metric.name === 'CLS' && metric.value > 0.25) ||
      (metric.name === 'LCP' && metric.value > 4000) ||
      (metric.name === 'FID' && metric.value > 300) ||
      (metric.name === 'INP' && metric.value > 500)
    ) {
      console.warn(`Poor ${metric.name} detected: ${metric.value} on ${metric.page}`);
    }
    
    // Always return success, even if writing to disk fails
    return NextResponse.json({ 
      success: true,
      message: 'Metric recorded',
      metricName: metric.name,
      bufferSize: metricsBuffer.length
    });
  } catch (error) {
    console.error('Error processing metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving aggregated metrics
 */
export async function GET() {
  try {
    // Return the current buffer and folder status for debugging
    return NextResponse.json({
      success: true,
      message: 'Metrics endpoint is working. Use POST to submit metrics.',
      bufferSize: metricsBuffer.length,
      metricsFolder: METRICS_FOLDER,
      folderExists: fs.existsSync(METRICS_FOLDER)
    });
  } catch (error) {
    console.error('Error retrieving metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to write metrics buffer to disk
 */
async function flushMetricsBuffer() {
  if (metricsBuffer.length === 0) return;
  
  try {
    // Check again if the folder exists, create if needed
    if (!fs.existsSync(METRICS_FOLDER)) {
      console.log(`Creating metrics folder at ${METRICS_FOLDER}`);
      fs.mkdirSync(METRICS_FOLDER, { recursive: true });
    }
    
    // Create a filename based on the current timestamp
    const filename = `${Date.now()}.json`;
    const filePath = path.join(METRICS_FOLDER, filename);
    
    // Create a copy of the buffer for writing to avoid race conditions
    const metricsToWrite = [...metricsBuffer];
    
    // Write metrics to file
    fs.writeFileSync(
      filePath,
      JSON.stringify(metricsToWrite, null, 2)
    );
    
    // Clear the buffer only if writing was successful
    metricsBuffer = [];
    
    console.log(`Wrote ${filename} with ${metricsToWrite.length} metrics`);
    return true;
  } catch (error) {
    console.error('Error writing metrics to disk:', error);
    throw error; // Rethrow to handle at call site
  }
}

// Ensure metrics are flushed when the server is shutting down
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    flushMetricsBuffer().catch(console.error);
  });
  
  process.on('SIGINT', () => {
    flushMetricsBuffer().catch(console.error);
  });
} 