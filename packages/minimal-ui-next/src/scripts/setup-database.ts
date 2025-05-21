#!/usr/bin/env node
import { runDatabaseSetup } from '../lib/migrations/setupDatabase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🔧 Starting Supabase database setup...');
  
  try {
    const result = await runDatabaseSetup();
    
    if (result.success) {
      console.log('✅ Database setup completed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Database setup failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
main(); 