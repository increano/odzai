require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const log = {
  info: (msg) => console.log('\x1b[36m%s\x1b[0m', `[INFO] ${msg}`),
  success: (msg) => console.log('\x1b[32m%s\x1b[0m', `[SUCCESS] ${msg}`),
  error: (msg) => console.log('\x1b[31m%s\x1b[0m', `[ERROR] ${msg}`),
};

async function testAuth() {
  try {
    log.info(`Supabase URL: ${supabaseUrl}`);
    log.info(`Supabase Key: ${supabaseAnonKey?.substring(0, 10)}...`);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Check connection
    log.info('Testing connection to Supabase...');
    const { data, error } = await supabase.from('user_roles').select('count');
    
    if (error) {
      log.error(`Database connection error: ${error.message}`);
    } else {
      log.success('Successfully connected to Supabase!');
    }
    
    // Test sign in with email/password
    const email = 'test@test.com'; // Use the working test account
    const password = 'password'; // Default test password
    
    log.info(`Attempting to sign in with email: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      log.error(`Authentication error: ${authError.message}`);
    } else if (authData.session) {
      log.success('Successfully authenticated!');
      log.info(`User ID: ${authData.user.id}`);
      log.info(`Session expires at: ${new Date(authData.session.expires_at * 1000).toLocaleString()}`);
    } else {
      log.error('No session returned, but no error either.');
    }
    
  } catch (err) {
    log.error(`Unexpected error: ${err.message}`);
  }
}

testAuth(); 