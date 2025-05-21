# Supabase Database Migration

This directory contains migration scripts and utilities for setting up and maintaining the Supabase PostgreSQL database.

## Overview

The migration system is designed to:
1. Create all required database tables, functions, triggers, and indices
2. Apply Row Level Security (RLS) policies for data protection
3. Support idempotent execution (can be run multiple times safely)
4. Execute in both development and production environments

## Directory Structure

- `supabase/` - Contains SQL migration scripts
  - `001-initial-setup.sql` - Main setup script with tables, functions, triggers, and indices
- `setupDatabase.ts` - TypeScript utility for executing SQL migrations
- `migrationWorker.ts` - Worker for data migration between SQLite and PostgreSQL

## Running Migrations

### Option 1: Command Line Setup

To set up the database from the command line:

```bash
# Add the service role key to your environment variables
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run the setup script
yarn setup:database
```

### Option 2: Admin UI

1. Navigate to the admin database page at `/admin/database`
2. Click the "Run Database Setup" button
3. The operation requires an admin user account

### Option 3: Programmatic Setup

```typescript
import { setupDatabase } from '@/lib/migrations/setupDatabase';

// This function requires admin/service role privileges
async function runSetup() {
  const result = await setupDatabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  if (result.success) {
    console.log('Database setup successful');
  } else {
    console.error('Database setup failed:', result.error);
  }
}
```

## Security Note

The database setup requires a service role key with admin privileges. This key should:
- Never be exposed to the client side
- Only be used in secure environments (admin API routes, CLI tools)
- Have appropriate access control via RLS policies

## Troubleshooting

- **"Function run_sql does not exist"**: You need to enable the `pg_netutil` extension in your Supabase project
- **"Permission denied"**: Your service role key doesn't have sufficient privileges
- **"Already exists" errors**: These are normal and safe to ignore (idempotent operation)

## Adding New Migrations

1. Create a new SQL file in the `supabase/` directory with an incremental version number
2. Update the `setupDatabase.ts` file to include the new migration
3. Run the migration using one of the methods above 