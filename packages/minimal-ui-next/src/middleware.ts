import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for adding Server-Timing headers and performance monitoring
 */
export function middleware(request: NextRequest) {
  // Create a response object to modify
  const response = NextResponse.next();
  
  // Add request timestamp
  const requestStartTime = Date.now();
  
  // Add custom response headers for monitoring
  response.headers.set('Server-Timing', `request-received;dur=0`);
  
  // Function to measure execution time and add server timing headers
  const measureAndAddHeader = (
    name: string, 
    // The operation returns a Promise or a value that completes the measurement
    operation: () => any
  ) => {
    const startTime = Date.now();
    const result = operation();
    const duration = Date.now() - startTime;
    
    // Add the timing header
    const existingTiming = response.headers.get('Server-Timing') || '';
    response.headers.set(
      'Server-Timing',
      `${existingTiming}, ${name};dur=${duration}`
    );
    
    return result;
  };
  
  // Process the response
  response.headers.set('x-server-response-time', `${Date.now() - requestStartTime}ms`);
  
  // Add custom headers for monitoring and debugging
  // Removed process.version and process.memoryUsage() which aren't supported in Edge Runtime
  
  return response;
}

/**
 * Only apply the middleware to specific paths
 */
export const config = {
  matcher: [
    // Apply to all routes except for public files, API routes that handle their own timing,
    // and Next.js internal routes
    '/((?!_next/static|_next/image|favicon.ico|public/|api/metrics).*)',
  ],
}; 