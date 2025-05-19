import { NextResponse } from 'next/server';
import { analyzeRecentMetrics, createAlertsSummary } from '@/lib/performance/metricsAnalyzer';
import { cookies } from 'next/headers';

/**
 * GET handler for retrieving performance alerts
 * Only accessible to admin users
 */
export async function GET() {
  try {
    // Check admin authorization
    const cookieStore = cookies();
    const isAdmin = cookieStore.get('odzai-admin')?.value === 'true';
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    // Analyze the most recent metrics
    const alerts = await analyzeRecentMetrics();
    
    // Create a summary of the alerts
    const summary = createAlertsSummary(alerts);
    
    // Return the alerts and summary
    return NextResponse.json({
      success: true,
      alerts,
      summary,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error processing performance alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process performance alerts' },
      { status: 500 }
    );
  }
} 