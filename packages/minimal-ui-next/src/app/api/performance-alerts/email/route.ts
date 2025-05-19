import { NextResponse } from 'next/server';
import { analyzeRecentMetrics, createAlertsSummary } from '@/lib/performance/metricsAnalyzer';
import { cookies } from 'next/headers';

/**
 * POST handler for sending performance alert emails
 * Only accessible to admin users
 * In a production environment, this would connect to an email service like SendGrid or AWS SES
 */
export async function POST(request: Request) {
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
    
    // Get configuration from request body
    const config = await request.json();
    
    // Validate the email configuration
    if (!config || !config.recipients || !Array.isArray(config.recipients)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email configuration' },
        { status: 400 }
      );
    }
    
    // Set default threshold level if not provided
    const alertLevel = config.alertLevel || 'critical';
    
    // Analyze the most recent metrics
    const allAlerts = await analyzeRecentMetrics();
    
    // Filter alerts based on threshold level
    const filteredAlerts = alertLevel === 'critical' 
      ? allAlerts.filter(alert => alert.level === 'critical')
      : allAlerts;
    
    // Create a summary of the alerts
    const summary = createAlertsSummary(filteredAlerts);
    
    // No alerts to send
    if (filteredAlerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No ${alertLevel} alerts found to send`,
        emailSent: false
      });
    }
    
    // In a real implementation, this would send an email using a service
    // For now, we'll just log to console
    console.log(`[ALERT EMAIL] Would send performance alerts to ${config.recipients.join(', ')}`);
    console.log(`[ALERT EMAIL] Alert Summary: ${summary.criticalCount} critical, ${summary.warningCount} warning alerts`);
    
    // For the most problematic pages
    const topPages = Object.entries(summary.byPage)
      .sort((a: any, b: any) => (b[1].critical + b[1].warning) - (a[1].critical + a[1].warning))
      .slice(0, 3);
    
    console.log('[ALERT EMAIL] Most affected pages:');
    topPages.forEach(([page, stats]: [string, any]) => {
      console.log(`- ${page}: ${stats.critical} critical, ${stats.warning} warning`);
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `Performance alert email would be sent to ${config.recipients.length} recipients`,
      alertsSent: filteredAlerts.length,
      summary: {
        criticalCount: summary.criticalCount,
        warningCount: summary.warningCount,
        topPages: topPages
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error sending performance alert emails:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send performance alert emails' },
      { status: 500 }
    );
  }
} 