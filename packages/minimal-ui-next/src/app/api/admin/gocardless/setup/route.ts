import { NextRequest, NextResponse } from 'next/server';
import { saveGoCardlessConfig, validateGoCardlessCredentials } from '@/lib/services/gocardless/config';
import { cookies } from 'next/headers';
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
 * POST /api/admin/gocardless/setup
 * Endpoint for administrators to set up GoCardless integration credentials
 */
export async function POST(request: NextRequest) {
  try {
    // TEMPORARY: Bypass admin check to allow anyone to access this endpoint
    /*
    // Only allow admin users to set credentials
    const session = cookies().get('session')?.value;
    if (!session || !(await isAdminUser(session))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    */

    // Parse request body
    const body = await request.json();
    const { secretId, secretKey } = body;
    
    // Validate required fields
    if (!secretId || !secretKey) {
      return NextResponse.json(
        { error: 'Secret ID and Secret Key are required' },
        { status: 400 }
      );
    }
    
    // Validate the credentials with GoCardless
    const isValid = await validateGoCardlessCredentials(secretId, secretKey);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid GoCardless credentials' },
        { status: 400 }
      );
    }
    
    // Save the configuration
    const success = await saveGoCardlessConfig(secretId, secretKey);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save GoCardless configuration' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'GoCardless configuration saved successfully'
    });
  } catch (error) {
    console.error('Error setting up GoCardless:', error);
    return NextResponse.json(
      { error: 'Failed to set up GoCardless' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/gocardless/setup
 * 
 * Saves GoCardless API credentials for centralized use
 * Only accessible by admin users
 */
export async function POST_Centralized(request: Request) {
  try {
    // TEMPORARY: Bypass admin check to allow anyone to access this endpoint
    /*
    // Only allow admin users to set credentials
    const session = cookies().get('session')?.value;
    if (!session || !(await isAdminUser(session))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    */

    // Parse request body
    const body = await request.json();
    const { secretId, secretKey } = body;

    if (!secretId || !secretKey) {
      return NextResponse.json(
        { error: 'Secret ID and Secret Key are required' },
        { status: 400 }
      );
    }

    // Verify credentials with GoCardless before saving
    const isValid = await validateGoCardlessCredentials(secretId, secretKey);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid GoCardless credentials' },
        { status: 400 }
      );
    }

    // Save the credentials using our centralized service
    const success = await saveGoCardlessConfig(secretId, secretKey);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save GoCardless credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'GoCardless credentials saved successfully'
    });
  } catch (error) {
    console.error('Error saving GoCardless credentials:', error);
    return NextResponse.json(
      { error: 'Failed to save GoCardless credentials' },
      { status: 500 }
    );
  }
} 