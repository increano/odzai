// Simple script to test Supabase connection and authentication
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminEmail = process.env.NEXT_ADMIN_EMAIL || 'fmuhirwa@gmail.com';

// Utility to log success/error messages with colors
const log = {
  info: (msg) => console.log('\x1b[36m%s\x1b[0m', `[INFO] ${msg}`),
  success: (msg) => console.log('\x1b[32m%s\x1b[0m', `[SUCCESS] ${msg}`),
  error: (msg) => console.log('\x1b[31m%s\x1b[0m', `[ERROR] ${msg}`),
  warning: (msg) => console.log('\x1b[33m%s\x1b[0m', `[WARNING] ${msg}`),
};

// Verify environment variables
if (!supabaseUrl || !supabaseKey) {
  log.error('Missing Supabase credentials in .env.local file');
  log.info('Please copy .env.local.example to .env.local and add your Supabase credentials');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Run tests
async function runTests() {
  log.info('Starting Supabase connection and authentication tests...');
  
  try {
    // Test 1: Connection to Supabase
    log.info('Test 1: Checking connection to Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase.from('health_check').select('*').limit(1).maybeSingle();
    
    if (connectionError) {
      if (connectionError.code === 'PGRST104') {
        // This is actually fine - it means the table doesn't exist but connection works
        log.success('Connection to Supabase established successfully!');
      } else {
        log.error(`Connection error: ${connectionError.message}`);
        log.info('Please check your Supabase URL and key');
      }
    } else {
      log.success('Connection to Supabase established successfully!');
    }
    
    // Test 2: User role system
    log.info('Test 2: Checking for user_roles table...');
    const { data: roleTest, error: roleError } = await supabase.from('user_roles').select('count').limit(1);
    
    if (roleError) {
      if (roleError.code === 'PGRST104') {
        log.warning('user_roles table not found. You may need to create it:');
        log.info(`
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies to restrict access
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own role" ON user_roles 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON user_roles 
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));
`);
      } else {
        log.error(`Role system error: ${roleError.message}`);
      }
    } else {
      log.success('User role system is properly set up!');
    }
    
    // Test 3: Check admin setup for fmuhirwa@gmail.com
    log.info(`Test 3: Checking if ${adminEmail} is set up as admin...`);
    // This would need sign-in to actually check, so we'll just provide guidance
    log.info(`
To verify ${adminEmail} has admin role:
1. Sign in with this email in your application
2. Manually assign admin role using Supabase dashboard or SQL:

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users 
WHERE email = '${adminEmail}'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
`);
    
    log.info('Tests completed. See above for results and any needed actions.');
    
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
  }
}

// Run the tests
runTests(); 