require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin operations

// Test user info
const EMAIL = 'fmuhirwa@gmail.com';
const PASSWORD = 'test123456'; // Use a stronger password in production

// Utility to log success/error messages with colors
const log = {
  info: (msg) => console.log('\x1b[36m%s\x1b[0m', `[INFO] ${msg}`),
  success: (msg) => console.log('\x1b[32m%s\x1b[0m', `[SUCCESS] ${msg}`),
  error: (msg) => console.log('\x1b[31m%s\x1b[0m', `[ERROR] ${msg}`),
};

// Verify environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  log.error('Missing Supabase credentials in .env.local file');
  log.info('Please ensure both NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

async function createTestUser() {
  log.info(`Creating test user: ${EMAIL}`);
  
  // Initialize Supabase admin client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', EMAIL)
      .maybeSingle();
      
    if (existingUsers) {
      log.info(`User ${EMAIL} already exists. Will try to update password.`);
      
      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUsers.id,
        { password: PASSWORD }
      );
      
      if (updateError) {
        log.error(`Failed to update user password: ${updateError.message}`);
        return;
      }
      
      log.success(`Updated password for ${EMAIL}`);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true // Auto-confirm email
      });
      
      if (createError) {
        log.error(`Failed to create user: ${createError.message}`);
        return;
      }
      
      log.success(`Created user: ${EMAIL}`);
      
      // Assign admin role
      if (newUser?.user?.id) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: 'admin'
          });
        
        if (roleError) {
          log.error(`Failed to assign admin role: ${roleError.message}`);
        } else {
          log.success(`Assigned admin role to ${EMAIL}`);
        }
      }
    }
    
    log.info(`Test user setup complete. You can now sign in with:`);
    log.info(`Email: ${EMAIL}`);
    log.info(`Password: ${PASSWORD}`);
    
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
  }
}

createTestUser(); 