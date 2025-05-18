import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint for logging client-side errors
 * In a production environment, this would typically send errors to a monitoring service
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the error data
    if (!body.error || !body.timestamp) {
      return NextResponse.json({ error: 'Invalid error data' }, { status: 400 });
    }
    
    // Extract error details
    const { error, componentStack, timestamp } = body;
    
    // In development, log to console and file
    if (process.env.NODE_ENV === 'development') {
      console.error('Client error logged:', error);
      
      // Log to a file in development
      try {
        const logDir = path.join(process.cwd(), 'logs');
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, 'client-errors.log');
        const logEntry = `[${timestamp}] ${error.name}: ${error.message}\n${error.stack || ''}\nComponent: ${componentStack || 'N/A'}\n\n`;
        
        fs.appendFileSync(logFile, logEntry);
      } catch (fileError) {
        console.error('Error writing to log file:', fileError);
      }
    } else {
      // In production, you would send to a monitoring service
      // Example: await sendToMonitoringService(body);
      
      // For now, just log to console in production too
      console.error('Client error:', error);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in log-error API route:', error);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
} 