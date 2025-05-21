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

-- Create user_roles table to store user role information
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create workspaces table (budgets)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT,
  color TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workspace_users table for workspace access control
CREATE TABLE IF NOT EXISTS public.workspace_users (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Create category_groups table
CREATE TABLE IF NOT EXISTS public.category_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  group_id UUID REFERENCES category_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  on_budget BOOLEAN DEFAULT true,
  closed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payees table
CREATE TABLE IF NOT EXISTS public.payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  payee_id UUID REFERENCES payees(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  amount BIGINT NOT NULL, -- Stored in cents
  notes TEXT,
  cleared BOOLEAN DEFAULT false,
  reconciled BOOLEAN DEFAULT false,
  transfer_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget_allocations table
CREATE TABLE IF NOT EXISTS public.budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  amount BIGINT DEFAULT 0, -- Stored in cents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (workspace_id, category_id, month)
);

-- Create rules table for transaction categorization
CREATE TABLE IF NOT EXISTS public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled_transactions table
CREATE TABLE IF NOT EXISTS public.scheduled_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  payee_id UUID REFERENCES payees(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  frequency_interval INTEGER NOT NULL DEFAULT 1,
  next_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('account', 'transaction', 'category', 'payee')),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_workspace_id TEXT,
  theme TEXT DEFAULT 'light',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is inserted
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to grant admin role to a user (callable by existing admins only)
CREATE OR REPLACE FUNCTION public.grant_admin_role(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  calling_user_role TEXT;
BEGIN
  -- Check if the calling user is an admin
  SELECT role INTO calling_user_role FROM public.user_roles 
  WHERE user_id = auth.uid();
  
  IF calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can grant admin roles';
  END IF;
  
  -- Update or insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new workspace and assign the creator as admin
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  workspace_name TEXT,
  workspace_color TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  new_workspace_id TEXT;
  workspace_display_name TEXT;
BEGIN
  -- Generate a workspace ID (slug from name)
  new_workspace_id := lower(regexp_replace(workspace_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || 
                     substring(md5(random()::text) from 1 for 7);
  
  -- Set display name same as name if not provided
  workspace_display_name := workspace_name;
  
  -- Insert the new workspace
  INSERT INTO public.workspaces (id, name, display_name, color, owner_id)
  VALUES (new_workspace_id, workspace_name, workspace_display_name, workspace_color, auth.uid());
  
  -- Add the creator as admin
  INSERT INTO public.workspace_users (workspace_id, user_id, access_level)
  VALUES (new_workspace_id, auth.uid(), 'admin');
  
  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to share a workspace with another user
CREATE OR REPLACE FUNCTION public.share_workspace(
  workspace_id TEXT,
  email TEXT,
  access_level TEXT DEFAULT 'read'
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  user_has_permission BOOLEAN;
BEGIN
  -- Validate access_level
  IF access_level NOT IN ('read', 'write', 'admin') THEN
    RAISE EXCEPTION 'Invalid access level. Must be read, write, or admin';
  END IF;
  
  -- Get the target user ID from email
  SELECT id INTO target_user_id FROM auth.users
  WHERE email = share_workspace.email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email;
  END IF;
  
  -- Check if the current user has 'admin' access for this workspace
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE workspace_id = share_workspace.workspace_id
    AND user_id = auth.uid()
    AND access_level = 'admin'
  ) INTO user_has_permission;
  
  IF NOT user_has_permission THEN
    RAISE EXCEPTION 'You must be a workspace admin to share it';
  END IF;
  
  -- Add the user to the workspace with specified access_level
  INSERT INTO public.workspace_users (workspace_id, user_id, access_level)
  VALUES (workspace_id, target_user_id, access_level)
  ON CONFLICT (workspace_id, user_id)
  DO UPDATE SET access_level = share_workspace.access_level;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a transaction with validation
CREATE OR REPLACE FUNCTION public.create_transaction(
  transaction_data JSONB
)
RETURNS UUID AS $$
DECLARE
  new_transaction_id UUID;
  account_id UUID;
  workspace_id TEXT;
  user_has_access BOOLEAN;
BEGIN
  -- Extract the account_id from the transaction data
  account_id := (transaction_data->>'account_id')::UUID;
  
  -- Get the workspace_id for the account
  SELECT a.workspace_id INTO workspace_id
  FROM public.accounts a
  WHERE a.id = account_id;
  
  IF workspace_id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  
  -- Check if user has access to this workspace
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE workspace_id = workspace_id
    AND user_id = auth.uid()
    AND access_level IN ('write', 'admin')
  ) INTO user_has_access;
  
  IF NOT user_has_access THEN
    RAISE EXCEPTION 'You do not have write access to this workspace';
  END IF;
  
  -- Insert the transaction
  INSERT INTO public.transactions (
    account_id,
    workspace_id,
    amount,
    date,
    payee_id,
    category_id,
    notes,
    cleared
  )
  VALUES (
    account_id,
    workspace_id,
    (transaction_data->>'amount')::BIGINT,
    (transaction_data->>'date')::DATE,
    (transaction_data->>'payee_id')::UUID,
    (transaction_data->>'category_id')::UUID,
    transaction_data->>'notes',
    COALESCE((transaction_data->>'cleared')::BOOLEAN, FALSE)
  )
  RETURNING id INTO new_transaction_id;
  
  RETURN new_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update account balance when transactions change
CREATE OR REPLACE FUNCTION public.update_transaction_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a recursive update from within this trigger
  IF EXISTS (SELECT 1 FROM pg_trigger_depth() WHERE pg_trigger_depth() > 1) THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- For new transactions, just update the calculated_balance in accounts view
    -- No direct action needed as we're using a calculated field
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If account changed, we need to refresh both old and new account
    IF OLD.account_id != NEW.account_id THEN
      -- No direct action needed as we're using a calculated field
    END IF;
    
    -- If amount changed, we need to update the calculated balance
    IF OLD.amount != NEW.amount THEN
      -- No direct action needed as we're using a calculated field
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- For deleted transactions, update the calculated_balance
    -- No direct action needed as we're using a calculated field
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for transactions
DROP TRIGGER IF EXISTS update_balance_on_transaction ON public.transactions;
CREATE TRIGGER update_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_transaction_balance();

-- Function to get available budget for a category in a month
CREATE OR REPLACE FUNCTION public.get_category_budget(
  p_workspace_id TEXT,
  p_category_id UUID,
  p_month TEXT
)
RETURNS JSONB AS $$
DECLARE
  budget_data JSONB;
  allocated BIGINT;
  activity BIGINT;
BEGIN
  -- Get the allocated amount
  SELECT COALESCE(amount, 0) INTO allocated
  FROM public.budget_allocations
  WHERE workspace_id = p_workspace_id
  AND category_id = p_category_id
  AND month = p_month;
  
  -- If no allocation found, default to 0
  IF allocated IS NULL THEN
    allocated := 0;
  END IF;
  
  -- Calculate the activity (sum of transactions) for this category in this month
  SELECT COALESCE(SUM(amount), 0) INTO activity
  FROM public.transactions
  WHERE workspace_id = p_workspace_id
  AND category_id = p_category_id
  AND date >= (p_month || '-01')::DATE
  AND date < (p_month || '-01')::DATE + INTERVAL '1 month';
  
  -- If no activity found, default to 0
  IF activity IS NULL THEN
    activity := 0;
  END IF;
  
  -- Construct the response JSON
  budget_data := jsonb_build_object(
    'category_id', p_category_id,
    'month', p_month,
    'allocated', allocated,
    'activity', activity,
    'available', allocated + activity -- For expenses, activity is negative
  );
  
  RETURN budget_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set a budget allocation for a category in a month
CREATE OR REPLACE FUNCTION public.set_budget_allocation(
  category_id UUID,
  month TEXT,
  amount BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  workspace_id TEXT;
BEGIN
  -- Get the workspace_id for the category
  SELECT c.workspace_id INTO workspace_id
  FROM public.categories c
  WHERE c.id = category_id;
  
  IF workspace_id IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;
  
  -- Ensure user has write access to this workspace
  PERFORM 1
  FROM public.workspace_users
  WHERE workspace_id = workspace_id
  AND user_id = auth.uid()
  AND access_level IN ('write', 'admin');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'You do not have write access to this workspace';
  END IF;
  
  -- Insert or update the budget allocation
  INSERT INTO public.budget_allocations (
    category_id,
    workspace_id,
    month,
    amount
  )
  VALUES (
    category_id,
    workspace_id,
    month,
    amount
  )
  ON CONFLICT (workspace_id, category_id, month)
  DO UPDATE SET amount = set_budget_allocation.amount;
  
  RETURN TRUE;
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
    -- Preserve original creation time if it exists
    IF OLD.created_at IS NOT NULL THEN
      NEW.created_at = OLD.created_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create a payee if it doesn't exist
CREATE OR REPLACE FUNCTION public.ensure_payee_exists()
RETURNS TRIGGER AS $$
DECLARE
  payee_name TEXT;
  workspace_id TEXT;
  existing_payee_id UUID;
BEGIN
  -- Only process if we have a payee name but no payee_id
  IF NEW.payee_id IS NULL AND TG_ARGV[0] IS NOT NULL THEN
    payee_name := TG_ARGV[0];
    workspace_id := NEW.workspace_id;
    
    -- Check if this payee already exists
    SELECT id INTO existing_payee_id
    FROM public.payees
    WHERE workspace_id = NEW.workspace_id
    AND lower(name) = lower(payee_name);
    
    IF existing_payee_id IS NULL THEN
      -- Create the payee
      INSERT INTO public.payees (workspace_id, name)
      VALUES (workspace_id, payee_name)
      RETURNING id INTO NEW.payee_id;
    ELSE
      -- Use the existing payee
      NEW.payee_id := existing_payee_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to transactions table
DROP TRIGGER IF EXISTS ensure_payee_before_transaction ON public.transactions;
CREATE TRIGGER ensure_payee_before_transaction
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.ensure_payee_exists();

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
  
  -- Ensure transaction has an associated workspace
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM public.accounts
    WHERE id = NEW.account_id;
    
    IF NEW.workspace_id IS NULL THEN
      RAISE EXCEPTION 'Could not determine workspace for this transaction';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function that extracts month and year in a standardized format
CREATE OR REPLACE FUNCTION public.extract_month_year(date_value DATE) RETURNS TEXT
IMMUTABLE LANGUAGE SQL AS $$
  SELECT to_char(date_value, 'YYYY-MM');
$$;

-- Apply validation trigger to transactions
DROP TRIGGER IF EXISTS validate_transaction ON public.transactions;
CREATE TRIGGER validate_transaction
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_transaction_amount();

-- Apply timestamp triggers to key tables
DROP TRIGGER IF EXISTS set_timestamps_accounts ON public.accounts;
CREATE TRIGGER set_timestamps_accounts
  BEFORE INSERT OR UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

DROP TRIGGER IF EXISTS set_timestamps_transactions ON public.transactions;
CREATE TRIGGER set_timestamps_transactions
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

DROP TRIGGER IF EXISTS set_timestamps_categories ON public.categories;
CREATE TRIGGER set_timestamps_categories
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

DROP TRIGGER IF EXISTS set_timestamps_category_groups ON public.category_groups;
CREATE TRIGGER set_timestamps_category_groups
  BEFORE INSERT OR UPDATE ON public.category_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

DROP TRIGGER IF EXISTS set_timestamps_payees ON public.payees;
CREATE TRIGGER set_timestamps_payees
  BEFORE INSERT OR UPDATE ON public.payees
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

DROP TRIGGER IF EXISTS audit_transactions ON public.transactions;
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();

-- -------------------------------------------------------
-- Indices for Performance
-- -------------------------------------------------------

-- Users and Roles Indices
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);

-- Workspaces Indices
CREATE INDEX IF NOT EXISTS idx_workspaces_name ON public.workspaces (name);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces (owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON public.workspaces (created_at);
CREATE INDEX IF NOT EXISTS idx_workspaces_updated_at ON public.workspaces (updated_at);

-- Workspace Users Indices
CREATE INDEX IF NOT EXISTS idx_workspace_users_user_id ON public.workspace_users (user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_users_access_level ON public.workspace_users (access_level);
CREATE INDEX IF NOT EXISTS idx_workspace_users_access ON public.workspace_users (user_id, workspace_id, access_level);

-- Accounts Indices
CREATE INDEX IF NOT EXISTS idx_accounts_workspace_id ON public.accounts (workspace_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts (type);
CREATE INDEX IF NOT EXISTS idx_accounts_workspace_type ON public.accounts (workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_on_budget ON public.accounts (workspace_id, on_budget);
CREATE INDEX IF NOT EXISTS idx_accounts_closed ON public.accounts (workspace_id, closed);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON public.accounts (workspace_id, name);
CREATE INDEX IF NOT EXISTS idx_accounts_sort_order ON public.accounts (workspace_id, sort_order);

-- Categories Indices
CREATE INDEX IF NOT EXISTS idx_categories_workspace_id ON public.categories (workspace_id);
CREATE INDEX IF NOT EXISTS idx_categories_group_id ON public.categories (group_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories (group_id, sort_order);

-- Category Groups Indices
CREATE INDEX IF NOT EXISTS idx_category_groups_workspace_id ON public.category_groups (workspace_id);
CREATE INDEX IF NOT EXISTS idx_category_groups_sort_order ON public.category_groups (workspace_id, sort_order);

-- Transactions Indices
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON public.transactions (workspace_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee_id ON public.transactions (payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON public.transactions (transfer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON public.transactions (account_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_cleared ON public.transactions (account_id, cleared, date);
CREATE INDEX IF NOT EXISTS idx_transactions_reconciled ON public.transactions (account_id, reconciled, date);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON public.transactions (workspace_id, amount);
CREATE INDEX IF NOT EXISTS idx_transactions_notes_gin ON public.transactions USING gin (to_tsvector('english', coalesce(notes, '')));
CREATE INDEX IF NOT EXISTS idx_transactions_uncleared ON public.transactions (account_id, date) 
WHERE cleared = false;
CREATE INDEX IF NOT EXISTS idx_transactions_category_month_text 
ON public.transactions (category_id, extract_month_year(date));

-- Budget Allocations Indices
CREATE INDEX IF NOT EXISTS idx_budget_allocations_category_id ON public.budget_allocations (category_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_workspace_id ON public.budget_allocations (workspace_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_month ON public.budget_allocations (workspace_id, month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_allocations_category_month ON public.budget_allocations (category_id, month);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_amount ON public.budget_allocations (workspace_id, month, amount);

-- Payees Indices
CREATE INDEX IF NOT EXISTS idx_payees_workspace_id ON public.payees (workspace_id);
CREATE INDEX IF NOT EXISTS idx_payees_name_lower ON public.payees (workspace_id, lower(name));
CREATE INDEX IF NOT EXISTS idx_payees_name_gin ON public.payees USING gin (to_tsvector('english', name));

-- Rules Indices
CREATE INDEX IF NOT EXISTS idx_rules_workspace_id ON public.rules (workspace_id);
CREATE INDEX IF NOT EXISTS idx_rules_sort_order ON public.rules (workspace_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_rules_conditions_gin ON public.rules USING gin (conditions jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_rules_actions_gin ON public.rules USING gin (actions jsonb_path_ops);

-- Notes Indices
CREATE INDEX IF NOT EXISTS idx_notes_workspace_id ON public.notes (workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_target_id ON public.notes (target_id);
CREATE INDEX IF NOT EXISTS idx_notes_target_type ON public.notes (workspace_id, target_type);
CREATE INDEX IF NOT EXISTS idx_notes_text_gin ON public.notes USING gin (to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes (workspace_id, created_at);

-- User Preferences Indices
CREATE INDEX IF NOT EXISTS idx_user_preferences_data_gin ON public.user_preferences USING gin (data jsonb_path_ops);

-- -------------------------------------------------------
-- Row Level Security (RLS) Policies
-- -------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users and Roles Policies
CREATE POLICY "Admins can manage all roles" ON user_roles
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Workspaces Policies
CREATE POLICY "Admins can manage all workspaces" ON workspaces
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their workspaces" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

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

CREATE POLICY "Users can delete their workspaces" ON workspaces
  FOR DELETE USING (
    id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid() AND access_level = 'admin'
    )
  );

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (true);

-- Workspace Users Policies
CREATE POLICY "Admins can manage all workspace users" ON workspace_users
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view members of their workspaces" ON workspace_users
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

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

-- Commit the transaction
COMMIT; 