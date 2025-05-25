import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { runDatabaseSetup } from '@/lib/migrations/setupDatabase';

// Admin-only API route for setting up the database
export async function POST(req: NextRequest) {
  try {
    // Create server client to verify admin permissions
    const supabase = createClient();
    
    // Verify admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    // Check if the user has admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' }, 
        { status: 403 }
      );
    }
    
    // Admin verified, run database setup
    console.log('Admin user verified, running database setup...');
    const result = await runDatabaseSetup();
    
    if (result.success) {
      return NextResponse.json({ success: true, message: 'Database setup completed successfully' });
    } else {
      console.error('Database setup failed:', result.error);
      return NextResponse.json(
        { success: false, error: 'Database setup failed', details: result.error }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in database setup API route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Disallow other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 