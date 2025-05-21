# Supabase Row Level Security (RLS) Policies

This document contains all the Row Level Security (RLS) policies needed for the Odzai/Actual Budget application when migrating to Supabase. These policies enforce data access rules based on user roles and workspace ownership.

## Core Table Policies

### Users and Roles Tables

```sql
-- Enable RLS on the user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all roles
CREATE POLICY "Admins can manage all roles" ON user_roles
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

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
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can see workspaces they have access to
CREATE POLICY "Users can view their workspaces" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can update workspaces they have access to
CREATE POLICY "Users can update their workspaces" ON workspaces
  FOR UPDATE USING (
    id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  );

-- Users can delete workspaces they own
CREATE POLICY "Users can delete their workspaces" ON workspaces
  FOR DELETE USING (
    id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level = 'admin'
    )
  );

-- Users can create workspaces
CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (true);
```

### Workspace Users (Many-to-Many)

```sql
-- Enable RLS on the workspace_users table
ALTER TABLE workspace_users ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all workspace users
CREATE POLICY "Admins can manage all workspace users" ON workspace_users
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can see workspace users for workspaces they belong to
CREATE POLICY "Users can view members of their workspaces" ON workspace_users
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users with admin permission can manage workspace users
CREATE POLICY "Workspace admins can manage members" ON workspace_users
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid() AND access_level = 'admin'
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid() AND access_level = 'admin'
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
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can view accounts in workspaces they have access to
CREATE POLICY "Users can view accounts in their workspaces" ON accounts
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can modify accounts in workspaces they have write access to
CREATE POLICY "Users can modify accounts in their workspaces" ON accounts
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  );
```

### Transactions

```sql
-- Enable RLS on the transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all transactions
CREATE POLICY "Admins can manage all transactions" ON transactions
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can view transactions in workspaces they have access to
CREATE POLICY "Users can view transactions in their workspaces" ON transactions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can modify transactions in workspaces they have write access to
CREATE POLICY "Users can modify transactions in their workspaces" ON transactions
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  );
```

### Categories and Category Groups

```sql
-- Enable RLS on the categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all categories
CREATE POLICY "Admins can manage all categories" ON categories
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can view categories in workspaces they have access to
CREATE POLICY "Users can view categories in their workspaces" ON categories
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can modify categories in workspaces they have write access to
CREATE POLICY "Users can modify categories in their workspaces" ON categories
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  );

-- Enable RLS on the category_groups table
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all category groups
CREATE POLICY "Admins can manage all category groups" ON category_groups
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can view category groups in workspaces they have access to
CREATE POLICY "Users can view category groups in their workspaces" ON category_groups
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can modify category groups in workspaces they have write access to
CREATE POLICY "Users can modify category groups in their workspaces" ON category_groups
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  );
```

### Budget Allocations

```sql
-- Enable RLS on the budget_allocations table
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all budget allocations
CREATE POLICY "Admins can manage all budget allocations" ON budget_allocations
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can view budget allocations in workspaces they have access to
CREATE POLICY "Users can view budget allocations in their workspaces" ON budget_allocations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can modify budget allocations in workspaces they have write access to
CREATE POLICY "Users can modify budget allocations in their workspaces" ON budget_allocations
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  );
```

### Payees

```sql
-- Enable RLS on the payees table
ALTER TABLE payees ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all payees
CREATE POLICY "Admins can manage all payees" ON payees
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can view payees in workspaces they have access to
CREATE POLICY "Users can view payees in their workspaces" ON payees
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can modify payees in workspaces they have write access to
CREATE POLICY "Users can modify payees in their workspaces" ON payees
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  );
```

### Rules

```sql
-- Enable RLS on the rules table
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all rules
CREATE POLICY "Admins can manage all rules" ON rules
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can view rules in workspaces they have access to
CREATE POLICY "Users can view rules in their workspaces" ON rules
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can modify rules in workspaces they have write access to
CREATE POLICY "Users can modify rules in their workspaces" ON rules
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  );
```

### Scheduled Transactions

```sql
-- Enable RLS on the scheduled_transactions table
ALTER TABLE scheduled_transactions ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all scheduled transactions
CREATE POLICY "Admins can manage all scheduled transactions" ON scheduled_transactions
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can view scheduled transactions in workspaces they have access to
CREATE POLICY "Users can view scheduled transactions in their workspaces" ON scheduled_transactions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can modify scheduled transactions in workspaces they have write access to
CREATE POLICY "Users can modify scheduled transactions in their workspaces" ON scheduled_transactions
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  );
```

### Notes

```sql
-- Enable RLS on the notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all notes
CREATE POLICY "Admins can manage all notes" ON notes
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can view notes in workspaces they have access to
CREATE POLICY "Users can view notes in their workspaces" ON notes
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

-- Users can modify notes in workspaces they have write access to
CREATE POLICY "Users can modify notes in their workspaces" ON notes
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level IN ('write', 'admin')
    )
  );
```

## User Preferences and Settings

```sql
-- Enable RLS on the user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all user preferences
CREATE POLICY "Admins can manage all user preferences" ON user_preferences
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can only manage their own preferences
CREATE POLICY "Users can manage only their own preferences" ON user_preferences
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Health Check Table

```sql
-- Enable RLS on the health_check table
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

-- Only admin users can manage health checks
CREATE POLICY "Only admins can manage health checks" ON health_check
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- All authenticated users can view health checks
CREATE POLICY "Authenticated users can view health status" ON health_check
  FOR SELECT USING (auth.role() = 'authenticated');
```

## Performance and Analytics Tables

```sql
-- Enable RLS on the performance_metrics table
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Only admin users can view performance metrics
CREATE POLICY "Only admins can view performance metrics" ON performance_metrics
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Only admin users can insert/update performance metrics
CREATE POLICY "Only admins can manage performance metrics" ON performance_metrics
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
```

## Audit Logging

```sql
-- Enable RLS on the audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admin users can view audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Only system can insert audit logs (handled via functions)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true); 
```

## Balance Monitoring

```sql
-- Enable RLS on the balance_inconsistencies table
ALTER TABLE balance_inconsistencies ENABLE ROW LEVEL SECURITY;

-- Users can view inconsistencies for their accounts
CREATE POLICY "Users can view inconsistencies for their accounts" ON balance_inconsistencies
  FOR SELECT USING (
    account_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.workspace_users wu ON a.workspace_id = wu.workspace_id
      WHERE wu.user_id = auth.uid()
    )
  );

-- Admins can manage balance inconsistencies
CREATE POLICY "Admins can manage balance inconsistencies" ON balance_inconsistencies
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
```

## External Connections (Bank Sync)

```sql
-- Enable RLS on the bank_connections table
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all bank connections
CREATE POLICY "Admins can manage all bank connections" ON bank_connections
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can only manage their own bank connections
CREATE POLICY "Users can manage only their own bank connections" ON bank_connections
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  
-- Enable RLS on the bank_transactions table
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all bank transactions
CREATE POLICY "Admins can manage all bank transactions" ON bank_transactions
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can view bank transactions for their connections
CREATE POLICY "Users can view bank transactions for their connections" ON bank_transactions
  FOR SELECT USING (
    connection_id IN (
      SELECT id FROM public.bank_connections WHERE user_id = auth.uid()
    )
  );

-- Users can manage bank transactions for their connections
CREATE POLICY "Users can manage bank transactions for their connections" ON bank_transactions
  USING (
    connection_id IN (
      SELECT id FROM public.bank_connections WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    connection_id IN (
      SELECT id FROM public.bank_connections WHERE user_id = auth.uid()
    )
  );
```

## Implementation Notes

1. All tables should have a `workspace_id` column that refers to the workspace (budget) that the record belongs to.
2. The `workspace_users` table establishes which users have access to which workspaces and with what access level.
3. Access levels in workspace_users are:
   - 'read': Can view data in the workspace
   - 'write': Can modify data in the workspace
   - 'admin': Can manage the workspace and its users
4. Regular users should only see and modify data that belongs to workspaces they have access to.
5. Admin users in user_roles have full access to all data for administrative purposes.
6. RLS policies are structured to:
   - Allow admins to manage everything
   - Allow users to view resources in their workspaces
   - Allow users to modify resources only in workspaces where they have write or admin access

These policies should be applied as part of the Phase 2 implementation of the Supabase migration roadmap. 