import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if environment variables are loaded
    const secretId = process.env.GOCARDLESS_SECRET_ID;
    const secretKey = process.env.GOCARDLESS_SECRET_KEY;
    
    // Return a safe version that doesn't expose the full credentials
    return NextResponse.json({
      secretIdAvailable: !!secretId,
      secretIdLength: secretId?.length || 0,
      secretKeyAvailable: !!secretKey,
      secretKeyLength: secretKey?.length || 0,
      secretIdPrefix: secretId ? secretId.substring(0, 8) + '...' : null,
      secretKeyPrefix: secretKey ? secretKey.substring(0, 8) + '...' : null,
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Error in test-env endpoint:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 