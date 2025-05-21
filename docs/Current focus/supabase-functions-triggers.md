# Supabase Database Functions and Triggers

This document contains all the PostgreSQL functions and triggers needed for the Odzai/Actual Budget application when migrating to Supabase. These implement business logic, maintain data integrity, and ensure proper data validation.

## User Management Functions

### Set User Role on Registration

```sql
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Grant Admin Role Function

```sql
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
```

## Workspace Management Functions

### Create Workspace With Owner

```sql
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
```

### Share Workspace Function

```sql
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
```

## Transaction Management Functions

### Create Transaction with Validation

```sql
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
```

### Update Account Balance Function

```sql
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
CREATE TRIGGER update_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_transaction_balance();
```

## Budget Management Functions

### Track Budget Allocations and Usage

```sql
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
```

### Update Budget Allocation Function

```sql
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
```

## Audit and Tracking Functions

### Record Audit Trail

```sql
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

-- Example of applying the audit trigger to a table
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.record_audit_log();

-- Apply similar triggers to other important tables
```

### Automatic Timestamp Management

```sql
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

-- Apply to all tables (example for transactions)
CREATE TRIGGER set_timestamps
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.set_timestamps();
```

### Payee Auto-Creation on New Transaction

```sql
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
CREATE TRIGGER ensure_payee_before_transaction
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.ensure_payee_exists();
```

## Data Validation and Integrity Triggers

### Transaction Amount Validation

```sql
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

-- Apply validation trigger to transactions
CREATE TRIGGER validate_transaction
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.validate_transaction_amount();
```

### Account Balance Consistency Check

```sql
-- Function to check account balance consistency
CREATE OR REPLACE FUNCTION public.check_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  calculated_balance BIGINT;
BEGIN
  -- Calculate balance from transactions
  SELECT COALESCE(SUM(amount), 0) INTO calculated_balance
  FROM public.transactions
  WHERE account_id = NEW.id;
  
  -- If there's a view with current_balance column, we can compare
  -- Here we'll just log any inconsistencies
  INSERT INTO public.balance_inconsistencies (
    account_id,
    expected_balance,
    actual_balance,
    difference,
    detected_at
  )
  VALUES (
    NEW.id,
    calculated_balance,
    calculated_balance, -- Actual matches expected since we're using calculated values
    0, -- No difference
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This trigger would only be useful if we were storing a separate balance field
-- For now, we'll leave it commented out
-- CREATE TRIGGER check_account_balance
--  AFTER UPDATE ON public.accounts
--  FOR EACH ROW EXECUTE PROCEDURE public.check_account_balance();
```

## Implementation Notes

1. All functions should be created with appropriate security context (`SECURITY DEFINER` for functions that need elevated permissions).
2. Triggers should be applied to all relevant tables to maintain data consistency.
3. Functions should include proper error handling and validation.
4. Performance-sensitive functions should be optimized and potentially use materialized views.
5. Consider adding appropriate indexes to support the functions and triggers.
6. Regularly review the audit logs and performance metrics to identify optimization opportunities.

These functions and triggers should be implemented as part of the Phase 3 and Phase 4 of the Supabase migration roadmap. 