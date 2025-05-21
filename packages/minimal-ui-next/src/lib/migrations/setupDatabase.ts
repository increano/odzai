import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Maximum size for a single SQL statement (to avoid hitting API limits)
const MAX_SQL_STATEMENT_SIZE = 100000;

/**
 * Executes the initial database setup by running the SQL script
 * This should only be run by an administrator with the service role key
 */
export async function setupDatabase(supabaseUrl: string, serviceRoleKey: string) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL and service role key are required');
  }
  
  // Create a Supabase client with admin privileges
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    console.log('Starting database setup...');
    
    // Read the SQL setup file
    const sqlFilePath = path.join(process.cwd(), 'src/lib/migrations/supabase/001-initial-setup.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL into manageable chunks
    // We need to be careful to split at statement boundaries (semicolons)
    // but keep CREATE FUNCTION statements together
    const statements = splitSqlStatements(sqlContent);
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement with appropriate error handling
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      try {
        // Execute the SQL via RPC call
        const { error } = await supabase.rpc('run_sql', { sql: statement });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement.substring(0, 150) + '...');
          
          // Don't fail on "already exists" errors
          if (error.message.includes('already exists')) {
            console.log('Skipping "already exists" error and continuing...');
            continue;
          }
          
          throw error;
        }
        
        // Log progress periodically
        if ((i + 1) % 10 === 0 || i === statements.length - 1) {
          console.log(`Completed ${i + 1}/${statements.length} statements`);
        }
      } catch (err) {
        console.error(`Failed at statement ${i + 1}:`, err);
        throw err;
      }
    }
    
    console.log('Database setup completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Database setup failed:', error);
    return { success: false, error };
  }
}

/**
 * Split SQL content into individual statements
 * This is more complex than simple splitting by semicolons because:
 * 1. Functions contain semicolons within their body
 * 2. We need to handle comments correctly
 * 3. Some statements might be too large and need splitting
 */
function splitSqlStatements(sqlContent: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inFunction = false;
  let inComment = false;
  
  // Split the SQL into lines to handle comments properly
  const lines = sqlContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      currentStatement += '\n';
      continue;
    }
    
    // Handle line comments
    if (trimmedLine.startsWith('--')) {
      currentStatement += line + '\n';
      continue;
    }
    
    // Check if this line starts a function definition
    if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || 
        trimmedLine.includes('CREATE FUNCTION')) {
      inFunction = true;
    }
    
    // Add the line to the current statement
    currentStatement += line + '\n';
    
    // Check if this line ends a function definition
    if (inFunction && trimmedLine.includes('LANGUAGE ') && 
        (trimmedLine.endsWith(';') || line.endsWith(';'))) {
      inFunction = false;
    }
    
    // If we're not in a function and the line ends with a semicolon,
    // this is the end of a statement
    if (!inFunction && line.trim().endsWith(';')) {
      statements.push(currentStatement);
      currentStatement = '';
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement);
  }
  
  return statements;
}

/**
 * Admin utility function to run the database setup
 * This should be called from an admin-only API route or CLI tool
 */
export async function runDatabaseSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or service role key in environment variables');
    return { success: false, error: 'Missing environment variables' };
  }
  
  return await setupDatabase(supabaseUrl, serviceRoleKey);
} 