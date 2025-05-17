import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAdminUser } from '@/lib/services/auth';

/**
 * GET /api/admin/check-access
 * 
 * Verifies if the current user has admin access
 * Used for access control to admin-only areas
 */
export async function GET() {
  try {
    // TEMPORARY: Bypass admin check to allow anyone access
    // Always return success and isAdmin: true
    return NextResponse.json({
      success: true,
      isAdmin: true
    });
    
    /*
    // Get the session token from cookies
    const session = cookies().get('session')?.value;
    
    // Check if session exists and user has admin privileges
    if (!session || !(await isAdminUser(session))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    // User has admin access
    return NextResponse.json({
      success: true,
      isAdmin: true
    });
    */
  } catch (error) {
    console.error('Error checking admin access:', error);
    
    // TEMPORARY: Even on error, return success
    return NextResponse.json({
      success: true,
      isAdmin: true
    });
    
    /*
    return NextResponse.json(
      { error: 'Failed to verify admin access' },
      { status: 500 }
    );
    */
  }
} 