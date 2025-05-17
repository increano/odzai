import { NextRequest, NextResponse } from 'next/server';
import { getGoCardlessConfig } from '@/lib/services/gocardless/config';
import fs from 'fs';
import path from 'path';

// Constants
const CREDENTIALS_FILE = process.env.GOCARDLESS_CREDENTIALS_PATH || 
  path.join(process.cwd(), 'data', 'gocardless-credentials.json');

/**
 * GET /api/gocardless/status
 * Endpoint to check GoCardless integration status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if the credentials file exists
    const isConfigured = fs.existsSync(CREDENTIALS_FILE);
    
    // Get the credentials from the file if it exists
    let secretId = '';
    if (isConfigured) {
      try {
        const credentialsContent = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
        const credentials = JSON.parse(credentialsContent);
        secretId = credentials.secretId || '';
      } catch (readError) {
        console.error('Error reading GoCardless credentials:', readError);
      }
    }
    
    return NextResponse.json({
      configured: isConfigured,
      secretId: secretId ? `${secretId.substring(0, 3)}...` : ''
    });
  } catch (error) {
    console.error('Failed to get GoCardless status:', error);
    return NextResponse.json(
      { error: 'Failed to get GoCardless status' },
      { status: 500 }
    );
  }
} 