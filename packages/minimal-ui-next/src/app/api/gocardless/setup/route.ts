import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Constants
const CREDENTIALS_FILE = process.env.GOCARDLESS_CREDENTIALS_PATH || 
  path.join(process.cwd(), 'data', 'gocardless-credentials.json');

// Ensure credentials directory exists
const ensureCredentialsDir = () => {
  const dir = path.dirname(CREDENTIALS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * POST /api/gocardless/setup
 * Endpoint for setting up GoCardless integration credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { secretId, secretKey } = body;
    
    // Validate required fields
    if (!secretId || !secretKey) {
      return NextResponse.json(
        { error: 'Missing credentials', message: 'Both Secret ID and Secret Key are required' },
        { status: 400 }
      );
    }
    
    // Validate the credentials (simplified validation)
    // In a real implementation, we would make a request to GoCardless API
    const isValid = Boolean(secretId) && Boolean(secretKey);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid GoCardless credentials' },
        { status: 400 }
      );
    }
    
    // Ensure directory exists
    ensureCredentialsDir();
    
    // Save the configuration
    const credentials = {
      secretId,
      secretKey,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: 'GoCardless configured successfully' 
    });
  } catch (error) {
    console.error('Failed to set up GoCardless:', error);
    return NextResponse.json(
      { 
        error: 'Failed to set up GoCardless',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 