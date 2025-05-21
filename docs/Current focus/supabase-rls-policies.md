# Supabase Row Level Security (RLS) Policies

This document contains all the Row Level Security (RLS) policies needed for the Odzai/Actual Budget application when migrating to Supabase. These policies enforce data access rules based on user roles and workspace ownership.

## Core Table Policies

### Users and Roles Tables

```sql
-- Enable RLS on the users_roles table
ALTER TABLE users_roles ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all roles
CREATE POLICY "Admins can manage all roles" ON user_roles
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can view their own role
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);
```

### Workspaces (Budgets)

```sql
-- Enable RLS on the workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Admin users can see and manage all workspaces
CREATE POLICY "Admins can manage all workspaces" ON workspaces
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can see workspaces they own
CREATE POLICY "Users can view their own workspaces" ON workspaces
  FOR SELECT USING (
    public.workspaces.id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can update workspaces they own
CREATE POLICY "Users can update their own workspaces" ON workspaces
  FOR UPDATE USING (
    public.workspaces.id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.workspaces.id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can delete workspaces they own
CREATE POLICY "Users can delete their own workspaces" ON workspaces
  FOR DELETE USING (
    public.workspaces.id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can create workspaces (ownership will be set in code)
CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (true);
```
🧶
### Workspace Users (Many-to-Many)

```sql
-- Enable RLS on the workspace_users table
ALTER TABLE workspace_users ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all workspace users
CREATE POLICY "Admins can manage all workspace users" ON workspace_users
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can see workspace users for workspaces they belong to
CREATE POLICY "Users can view members of their workspaces" ON workspace_users
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users with owner permission can manage workspace users
CREATE POLICY "Workspace owners can manage members" ON workspace_users
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid() AND permission = 'owner'
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid() AND permission = 'owner'
    )
  );
```

## Financial Data Tables

### Accounts

```sql
-- Enable RLS on the accounts table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all accounts
CREATE POLICY "Admins can manage all accounts" ON accounts
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can manage accounts in workspaces they have access to
CREATE POLICY "Users can manage accounts in their workspaces" ON accounts
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );
```

### Transactions

```sql
-- Enable RLS on the transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all transactions
CREATE POLICY "Admins can manage all transactions" ON transactions
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can manage transactions in workspaces they have access to
CREATE POLICY "Users can manage transactions in their workspaces" ON transactions
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );
```

### Categories and Category Groups

```sql
-- Enable RLS on the categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all categories
CREATE POLICY "Admins can manage all categories" ON categories
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can manage categories in workspaces they have access to
CREATE POLICY "Users can manage categories in their workspaces" ON categories
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Enable RLS on the category_groups table
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all category groups
CREATE POLICY "Admins can manage all category groups" ON category_groups
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can manage category groups in workspaces they have access to
CREATE POLICY "Users can manage category groups in their workspaces" ON category_groups
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );
```

### Budget Allocations

```sql
-- Enable RLS on the budget_allocations table
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all budget allocations
CREATE POLICY "Admins can manage all budget allocations" ON budget_allocations
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can manage budget allocations in workspaces they have access to
CREATE POLICY "Users can manage budget allocations in their workspaces" ON budget_allocations
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );
```

### Payees

```sql
-- Enable RLS on the payees table
ALTER TABLE payees ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all payees
CREATE POLICY "Admins can manage all payees" ON payees
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can manage payees in workspaces they have access to
CREATE POLICY "Users can manage payees in their workspaces" ON payees
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );
```

### Rules

```sql
-- Enable RLS on the rules table
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all rules
CREATE POLICY "Admins can manage all rules" ON rules
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can manage rules in workspaces they have access to
CREATE POLICY "Users can manage rules in their workspaces" ON rules
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );
```

### Scheduled Transactions

```sql
-- Enable RLS on the scheduled_transactions table
ALTER TABLE scheduled_transactions ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all scheduled transactions
CREATE POLICY "Admins can manage all scheduled transactions" ON scheduled_transactions
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can manage scheduled transactions in workspaces they have access to
CREATE POLICY "Users can manage scheduled transactions in their workspaces" ON scheduled_transactions
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );
```

### Notes

```sql
-- Enable RLS on the notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all notes
CREATE POLICY "Admins can manage all notes" ON notes
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can manage notes in workspaces they have access to
CREATE POLICY "Users can manage notes in their workspaces" ON notes
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );
```

## User Preferences and Settings

```sql
-- Enable RLS on the user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all user preferences
CREATE POLICY "Admins can manage all user preferences" ON user_preferences
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can only manage their own preferences
CREATE POLICY "Users can manage only their own preferences" ON user_preferences
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Performance and Analytics Tables

```sql
-- Enable RLS on the performance_metrics table
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Only admin users can view performance metrics
CREATE POLICY "Only admins can view performance metrics" ON performance_metrics
  FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Only admin users can insert/update performance metrics
CREATE POLICY "Only admins can manage performance metrics" ON performance_metrics
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## External Connections (Bank Sync)

```sql
-- Enable RLS on the bank_connections table
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all bank connections
CREATE POLICY "Admins can manage all bank connections" ON bank_connections
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Users can only manage their own bank connections
CREATE POLICY "Users can manage only their own bank connections" ON bank_connections
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Implementation Notes

1. All tables should have a `workspace_id` column that refers to the workspace (budget) that the record belongs to.
2. The `workspace_users` table establishes which users have access to which workspaces and with what permission level.
3. The `auth.jwt() -> 'app_metadata' ->> 'role'` pattern is used to check user roles stored in Supabase JWT metadata.
4. Policies are structured with both `USING` (for SELECT/UPDATE/DELETE operations) and `WITH CHECK` (for INSERT/UPDATE) clauses.
5. The admin role should have full access to all data for administrative purposes.
6. Regular users should only see and modify data that belongs to workspaces they have access to.

These policies should be applied as part of the Phase 2 implementation of the Supabase migration roadmap. 