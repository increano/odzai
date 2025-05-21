import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * API route to set up Supabase credentials
 * POST /api/admin/supabase/setup
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin access
    const cookieStore = cookies();
    const isAdmin = cookieStore.get('user-role')?.value === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get credentials from request body
    const { url, serviceKey } = await request.json();

    if (!url || !serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required credentials' },
        { status: 400 }
      );
    }

    // Validate the credentials by attempting to connect
    try {
      const supabase = createClient(url, serviceKey, {
        auth: { persistSession: false }
      });
      
      // Try to query the database to verify credentials
      const { data, error } = await supabase.from('user_roles').select('count');
      
      if (error) {
        throw new Error(`Failed to connect to Supabase: ${error.message}`);
      }
    } catch (error) {
      console.error('Error validating Supabase credentials:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid Supabase credentials' },
        { status: 400 }
      );
    }

    // Store credentials in server environment
    // For development, we'll write to a local .env.local file
    // In production, this should use a secure storage mechanism like AWS Secrets Manager
    if (process.env.NODE_ENV === 'development') {
      try {
        const envPath = path.join(process.cwd(), '.env.local');
        let envContent = '';
        
        // Read existing .env.local if it exists
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Update or add the Supabase variables
        const updateEnvVar = (name: string, value: string) => {
          const regex = new RegExp(`^${name}=.*`, 'gm');
          if (regex.test(envContent)) {
            // Replace existing variable
            return envContent.replace(regex, `${name}=${value}`);
          } else {
            // Add new variable
            return `${envContent}\n${name}=${value}`;
          }
        };
        
        envContent = updateEnvVar('NEXT_PUBLIC_SUPABASE_URL', url);
        envContent = updateEnvVar('SUPABASE_SERVICE_ROLE_KEY', serviceKey);
        
        // Write to .env.local
        fs.writeFileSync(envPath, envContent);
      } catch (error) {
        console.error('Error writing Supabase credentials to .env.local:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to store credentials' },
          { status: 500 }
        );
      }
    } else {
      // In production, we would store these in a secure vault
      console.log('Production environment detected. Credentials should be stored in a secure vault.');
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Supabase credentials configured successfully'
    });
  } catch (error) {
    console.error('Error in Supabase setup endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 