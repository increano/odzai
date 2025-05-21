-- -------------------------------------------------------
-- Odzai/Actual Budget Supabase Migration Script
-- -------------------------------------------------------
-- This script sets up a complete Supabase instance with all 
-- necessary tables, functions, triggers, policies, and indices
-- required for the Odzai/Actual Budget application.
-- -------------------------------------------------------

-- Start transaction for atomic updates
BEGIN;

-- -------------------------------------------------------
-- Table Creation
-- -------------------------------------------------------

-- Create users_roles table to store user role information
CREATE TABLE IF NOT EXISTS public.users_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create workspaces table (budgets)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id)
);

-- Create workspace_users table for workspace access control
CREATE TABLE IF NOT EXISTS public.workspace_users (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Create category_groups table
CREATE TABLE IF NOT EXISTS public.category_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_income BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.category_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_income BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'mortgage', 'asset', 'liability')),
  on_budget BOOLEAN NOT NULL DEFAULT TRUE,
  closed BOOLEAN NOT NULL DEFAULT FALSE,
  current_balance INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);

-- Create payees table
CREATE TABLE IF NOT EXISTS public.payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  payee_id UUID REFERENCES public.payees(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  amount INTEGER NOT NULL,
  cleared BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  is_parent BOOLEAN NOT NULL DEFAULT FALSE,
  is_child BOOLEAN NOT NULL DEFAULT FALSE,
  parent_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by UUID REFERENCES auth.users(id),
  metadata JSONB
);

-- Create budget_allocations table
CREATE TABLE IF NOT EXISTS public.budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL CHECK (year_month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, year_month)
);

-- Create rules table
CREATE TABLE IF NOT EXISTS public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create scheduled_transactions table
CREATE TABLE IF NOT EXISTS public.scheduled_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  payee_id UUID REFERENCES public.payees(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  frequency_interval INTEGER NOT NULL DEFAULT 1,
  next_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('account', 'transaction', 'category', 'payee')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  changed_by UUID REFERENCES auth.users(id),
  change_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create performance_alerts table
CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create balance_inconsistencies table
CREATE TABLE IF NOT EXISTS public.balance_inconsistencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  expected_balance INTEGER NOT NULL,
  actual_balance INTEGER NOT NULL,
  difference INTEGER NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create bank_connections table
CREATE TABLE IF NOT EXISTS public.bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'error', 'revoked')),
  credentials JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- Functions and Triggers
-- -------------------------------------------------------

-- Function to automatically set user role on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is inserted
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to grant admin role to a user (callable by existing admins only)
CREATE OR REPLACE FUNCTION public.grant_admin_role(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  calling_user_role TEXT;
BEGIN
  -- Check if the calling user is an admin
  SELECT role INTO calling_user_role FROM public.users_roles 
  WHERE user_id = auth.uid();
  
  IF calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can grant admin roles';
  END IF;
  
  -- Update or insert the role
  INSERT INTO public.users_roles (user_id, role)
  VALUES (user_id, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new workspace and assign the creator as owner
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  workspace_name TEXT,
  workspace_currency TEXT DEFAULT 'USD'
)
RETURNS UUID AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Insert the new workspace
  INSERT INTO public.workspaces (name, currency, created_by, last_modified_by)
  VALUES (workspace_name, workspace_currency, auth.uid(), auth.uid())
  RETURNING id INTO new_workspace_id;
  
  -- Add the creator as owner
  INSERT INTO public.workspace_users (workspace_id, user_id, permission)
  VALUES (new_workspace_id, auth.uid(), 'owner');
  
  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to share a workspace with another user
CREATE OR REPLACE FUNCTION public.share_workspace(
  workspace_id UUID,
  email TEXT,
  permission TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  user_has_permission BOOLEAN;
BEGIN
  -- Get the target user ID from email
  SELECT id INTO target_user_id FROM auth.users
  WHERE email = share_workspace.email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email;
  END IF;
  
  -- Check if the current user has 'owner' permission for this workspace
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE workspace_id = share_workspace.workspace_id
    AND user_id = auth.uid()
    AND permission = 'owner'
  ) INTO user_has_permission;
  
  IF NOT user_has_permission THEN
    RAISE EXCEPTION 'You must be the workspace owner to share it';
  END IF;
  
  -- Add the user to the workspace with specified permission
  INSERT INTO public.workspace_users (workspace_id, user_id, permission)
  VALUES (workspace_id, target_user_id, permission)
  ON CONFLICT (workspace_id, user_id)
  DO UPDATE SET permission = share_workspace.permission;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update account balance when transactions change
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  account_id UUID;
  adjustment INTEGER;
BEGIN
  -- For inserts or updates
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    account_id := NEW.account_id;
    
    IF TG_OP = 'UPDATE' AND OLD.account_id != NEW.account_id THEN
      -- If the account changed, update the old account too
      UPDATE public.accounts
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.account_id;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
      -- For updates, calculate the adjustment (difference between new and old amount)
      adjustment := NEW.amount - OLD.amount;
    ELSE
      -- For inserts, the adjustment is the full amount
      adjustment := NEW.amount;
    END IF;
    
  -- For deletes
  ELSIF TG_OP = 'DELETE' THEN
    account_id := OLD.account_id;
    adjustment := -OLD.amount; -- Negative adjustment to subtract the amount
  END IF;
  
  -- Update the account balance
  UPDATE public.accounts
  SET current_balance = current_balance + adjustment
  WHERE id = account_id;
  
  -- Return the appropriate record based on the operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for transactions
DROP TRIGGER IF EXISTS update_balance_on_transaction ON public.transactions;
CREATE TRIGGER update_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_account_balance();

-- Function to get available budget for a category in a month
CREATE OR REPLACE FUNCTION public.get_category_budget(
  category_id UUID,
  year_month TEXT
)
RETURNS JSONB AS $$
DECLARE
  allocation_amount INTEGER;
  spent_amount INTEGER;
  workspace_id UUID;
  result JSONB;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Get the workspace_id for the category
  SELECT c.workspace_id INTO workspace_id
  FROM public.categories c
  WHERE c.id = category_id;
  
  IF workspace_id IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;
  
  -- Ensure user has access to this workspace
  PERFORM 1
  FROM public.workspace_users
  WHERE workspace_id = workspace_id
  AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'You do not have access to this workspace';
  END IF;
  
  -- Parse the year_month string (format: 'YYYY-MM')
  start_date := (year_month || '-01')::DATE;
  end_date := (start_date + INTERVAL '1 month')::DATE - INTERVAL '1 day';
  
  -- Get allocated amount
  SELECT COALESCE(amount, 0) INTO allocation_amount
  FROM public.budget_allocations
  WHERE category_id = get_category_budget.category_id
  AND year_month = get_category_budget.year_month;
  
  -- Get spent amount
  SELECT COALESCE(SUM(amount), 0) INTO spent_amount
  FROM public.transactions
  WHERE category_id = get_category_budget.category_id
  AND date BETWEEN start_date AND end_date;
  
  -- Build result
  result := jsonb_build_object(
    'category_id', category_id,
    'year_month', year_month,
    'allocated', allocation_amount,
    'spent', spent_amount,
    'available', allocation_amount - spent_amount
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set created/updated timestamps
CREATE OR REPLACE FUNCTION public.set_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = NOW();
    NEW.updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
    NEW.created_at = OLD.created_at; -- Preserve original creation time
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all tables with timestamp columns
DROP TRIGGER IF EXISTS set_timestamps_workspaces ON public.workspaces;
CREATE TRIGGER set_timestamps_workspaces
  BEFORE INSERT OR UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE PROCEDURE public.set_timestamps();

DROP TRIGGER IF EXISTS set_timestamps_accounts ON public.accounts;
CREATE TRIGGER set_timestamps_accounts
  BEFORE INSERT OR UPDATE ON public.accounts
  FOR EACH ROW EXECUTE PROCEDURE public.set_timestamps();

DROP TRIGGER IF EXISTS set_timestamps_transactions ON public.transactions;
CREATE TRIGGER set_timestamps_transactions
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.set_timestamps();

-- Apply to remaining tables (add more as needed)

-- Function to update last_modified fields
CREATE OR REPLACE FUNCTION public.update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS set_transactions_last_modified ON public.transactions;
CREATE TRIGGER set_transactions_last_modified
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_last_modified();

DROP TRIGGER IF EXISTS set_workspaces_last_modified ON public.workspaces;
CREATE TRIGGER set_workspaces_last_modified
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE PROCEDURE public.update_last_modified();

-- Function to record changes for audit purposes
CREATE OR REPLACE FUNCTION public.record_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  change_type TEXT;
  change_data JSONB;
BEGIN
  -- Determine change type
  IF TG_OP = 'INSERT' THEN
    change_type := 'insert';
    change_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    change_type := 'update';
    change_data := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'changed_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW)->key != to_jsonb(OLD)->key
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    change_type := 'delete';
    change_data := to_jsonb(OLD);
  END IF;
  
  -- Insert into audit log
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    operation,
    changed_by,
    change_data
  )
  VALUES (
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id 
      ELSE NEW.id
    END,
    change_type,
    auth.uid(),
    change_data
  );
  
  -- Return the appropriate record based on the operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
DROP TRIGGER IF EXISTS audit_transactions ON public.transactions;
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.record_audit_log();

DROP TRIGGER IF EXISTS audit_accounts ON public.accounts;
CREATE TRIGGER audit_accounts
  AFTER INSERT OR UPDATE OR DELETE ON public.accounts
  FOR EACH ROW EXECUTE PROCEDURE public.record_audit_log();

-- Function to validate transaction amount format
CREATE OR REPLACE FUNCTION public.validate_transaction_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure amount is stored in cents/smallest currency unit
  IF NEW.amount IS NULL THEN
    RAISE EXCEPTION 'Transaction amount cannot be NULL';
  END IF;
  
  -- Ensure transaction has an associated account
  IF NEW.account_id IS NULL THEN
    RAISE EXCEPTION 'Transaction must be associated with an account';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger to transactions
DROP TRIGGER IF EXISTS validate_transaction ON public.transactions;
CREATE TRIGGER validate_transaction
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.validate_transaction_amount();

-- Function to record performance metrics for queries
CREATE OR REPLACE FUNCTION public.record_query_performance(
  operation TEXT,
  duration_ms INTEGER,
  details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.performance_metrics (
    operation,
    duration_ms,
    user_id,
    details,
    recorded_at
  )
  VALUES (
    operation,
    duration_ms,
    auth.uid(),
    details,
    NOW()
  );
  
  -- Alert if query is slow (for admin monitoring)
  IF duration_ms > 1000 THEN -- 1 second threshold
    INSERT INTO public.performance_alerts (
      operation,
      duration_ms,
      user_id,
      details,
      severity,
      recorded_at
    )
    VALUES (
      operation,
      duration_ms,
      auth.uid(),
      details,
      CASE
        WHEN duration_ms > 5000 THEN 'high'
        WHEN duration_ms > 2000 THEN 'medium'
        ELSE 'low'
      END,
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------
-- Row Level Security (RLS) Policies
-- -------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.users_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_inconsistencies ENABLE ROW LEVEL SECURITY;

-- Users and Roles Policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.users_roles;
CREATE POLICY "Admins can manage all roles" ON public.users_roles
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can view their own role" ON public.users_roles;
CREATE POLICY "Users can view their own role" ON public.users_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Workspaces Policies
DROP POLICY IF EXISTS "Admins can manage all workspaces" ON public.workspaces;
CREATE POLICY "Admins can manage all workspaces" ON public.workspaces
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
CREATE POLICY "Users can view their own workspaces" ON public.workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
CREATE POLICY "Users can update their own workspaces" ON public.workspaces
  FOR UPDATE USING (
    id IN (
      SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;
CREATE POLICY "Users can delete their own workspaces" ON public.workspaces
  FOR DELETE USING (
    id IN (
      SELECT workspace_id FROM public.workspace_users 
      WHERE user_id = auth.uid() AND permission = 'owner'
    )
  );

DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (true);

-- Workspace Users Policies
DROP POLICY IF EXISTS "Admins can manage all workspace users" ON public.workspace_users;
CREATE POLICY "Admins can manage all workspace users" ON public.workspace_users
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_users;
CREATE POLICY "Users can view members of their workspaces" ON public.workspace_users
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace owners can manage members" ON public.workspace_users;
CREATE POLICY "Workspace owners can manage members" ON public.workspace_users
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_users 
      WHERE user_id = auth.uid() AND permission = 'owner'
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_users 
      WHERE user_id = auth.uid() AND permission = 'owner'
    )
  );

-- Accounts Policies
DROP POLICY IF EXISTS "Admins can manage all accounts" ON public.accounts;
CREATE POLICY "Admins can manage all accounts" ON public.accounts
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can manage accounts in their workspaces" ON public.accounts;
CREATE POLICY "Users can manage accounts in their workspaces" ON public.accounts
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    )
  );

-- Transactions Policies
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;
CREATE POLICY "Admins can manage all transactions" ON public.transactions
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can manage transactions in their workspaces" ON public.transactions;
CREATE POLICY "Users can manage transactions in their workspaces" ON public.transactions
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_users WHERE user_id = auth.uid()
    )
  );

-- User Preferences Policies
DROP POLICY IF EXISTS "Admins can manage all user preferences" ON public.user_preferences;
CREATE POLICY "Admins can manage all user preferences" ON public.user_preferences
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can manage only their own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage only their own preferences" ON public.user_preferences
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Performance Metrics Policies
DROP POLICY IF EXISTS "Only admins can view performance metrics" ON public.performance_metrics;
CREATE POLICY "Only admins can view performance metrics" ON public.performance_metrics
  FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Bank Connections Policies
DROP POLICY IF EXISTS "Admins can manage all bank connections" ON public.bank_connections;
CREATE POLICY "Admins can manage all bank connections" ON public.bank_connections
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can manage only their own bank connections" ON public.bank_connections;
CREATE POLICY "Users can manage only their own bank connections" ON public.bank_connections
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add policies for other tables...

-- -------------------------------------------------------
-- Indices for Performance
-- -------------------------------------------------------

-- Users and Roles Indices
CREATE INDEX IF NOT EXISTS idx_users_roles_user_id ON public.users_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_users_roles_role ON public.users_roles (role);

-- Workspaces Indices
CREATE INDEX IF NOT EXISTS idx_workspaces_name ON public.workspaces (name);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON public.workspaces (created_at);
CREATE INDEX IF NOT EXISTS idx_workspaces_updated_at ON public.workspaces (updated_at);

-- Workspace Users Indices
CREATE INDEX IF NOT EXISTS idx_workspace_users_user_id ON public.workspace_users (user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_users_permission ON public.workspace_users (permission);
CREATE INDEX IF NOT EXISTS idx_workspace_users_access ON public.workspace_users (user_id, workspace_id, permission);

-- Accounts Indices
CREATE INDEX IF NOT EXISTS idx_accounts_workspace_id ON public.accounts (workspace_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts (type);
CREATE INDEX IF NOT EXISTS idx_accounts_workspace_type ON public.accounts (workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_on_budget ON public.accounts (workspace_id, on_budget);
CREATE INDEX IF NOT EXISTS idx_accounts_closed ON public.accounts (workspace_id, closed);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON public.accounts (workspace_id, name);
CREATE INDEX IF NOT EXISTS idx_accounts_balance ON public.accounts (workspace_id, current_balance);

-- Transactions Indices
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON public.transactions (workspace_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee_id ON public.transactions (payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON public.transactions (account_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_cleared ON public.transactions (account_id, cleared, date);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON public.transactions (workspace_id, amount);
CREATE INDEX IF NOT EXISTS idx_transactions_parent_id ON public.transactions (parent_id);

-- Add indices for other tables...

-- -------------------------------------------------------
-- Initial Data
-- -------------------------------------------------------

-- Create a default admin user if none exists
DO $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.users_roles WHERE role = 'admin'
  ) INTO admin_exists;
  
  IF NOT admin_exists THEN
    -- Find the first user and make them an admin
    DECLARE
      first_user_id UUID;
    BEGIN
      SELECT id INTO first_user_id FROM auth.users LIMIT 1;
      
      IF first_user_id IS NOT NULL THEN
        INSERT INTO public.users_roles (user_id, role)
        VALUES (first_user_id, 'admin')
        ON CONFLICT (user_id) 
        DO UPDATE SET role = 'admin';
      END IF;
    END;
  END IF;
END $$;

-- Commit the transaction
COMMIT; 