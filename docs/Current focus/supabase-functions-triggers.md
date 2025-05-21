# Supabase Database Functions and Triggers

This document contains all the PostgreSQL functions and triggers needed for the Odzai/Actual Budget application when migrating to Supabase. These implement business logic, maintain data integrity, and ensure proper data validation.

## User Management Functions

### Set User Role on Registration

```sql
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
```

## Workspace Management Functions

### Create Workspace With Owner

```sql
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
  INSERT INTO public.workspaces (name, currency)
  VALUES (workspace_name, workspace_currency)
  RETURNING id INTO new_workspace_id;
  
  -- Add the creator as owner
  INSERT INTO public.workspace_users (workspace_id, user_id, permission)
  VALUES (new_workspace_id, auth.uid(), 'owner');
  
  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Share Workspace Function

```sql
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
  workspace_id UUID;
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
  ) INTO user_has_access;
  
  IF NOT user_has_access THEN
    RAISE EXCEPTION 'You do not have access to this workspace';
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
    (transaction_data->>'amount')::INTEGER,
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
CREATE TRIGGER update_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_account_balance();
```

## Budget Management Functions

### Track Budget Allocations and Usage

```sql
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
```

### Update Budget Allocation Function

```sql
-- Function to set a budget allocation for a category in a month
CREATE OR REPLACE FUNCTION public.set_budget_allocation(
  category_id UUID,
  year_month TEXT,
  amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  workspace_id UUID;
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
  
  -- Insert or update the budget allocation
  INSERT INTO public.budget_allocations (
    category_id,
    workspace_id,
    year_month,
    amount
  )
  VALUES (
    category_id,
    workspace_id,
    year_month,
    amount
  )
  ON CONFLICT (category_id, year_month)
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

### Track Last Modified Time and User

```sql
-- Function to update last_modified fields
CREATE OR REPLACE FUNCTION public.update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = NOW();
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to transactions table as an example
CREATE TRIGGER set_transactions_last_modified
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_last_modified();
```

## Automation Triggers

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
  payee_id UUID;
BEGIN
  -- If payee name is provided but no payee_id
  IF NEW.payee_name IS NOT NULL AND NEW.payee_id IS NULL THEN
    -- Check if payee already exists
    SELECT id INTO payee_id
    FROM public.payees
    WHERE LOWER(name) = LOWER(NEW.payee_name)
    AND workspace_id = NEW.workspace_id;
    
    -- Create payee if it doesn't exist
    IF payee_id IS NULL THEN
      INSERT INTO public.payees (name, workspace_id)
      VALUES (NEW.payee_name, NEW.workspace_id)
      RETURNING id INTO payee_id;
    END IF;
    
    -- Set the payee_id on the transaction
    NEW.payee_id = payee_id;
    -- Clear the temporary payee_name field if it exists
    NEW.payee_name = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to transactions table
CREATE TRIGGER ensure_payee_before_transaction
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.ensure_payee_exists();
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
  calculated_balance INTEGER;
BEGIN
  -- Calculate balance from transactions
  SELECT COALESCE(SUM(amount), 0) INTO calculated_balance
  FROM public.transactions
  WHERE account_id = NEW.id;
  
  -- If current_balance doesn't match, log issue
  IF NEW.current_balance != calculated_balance THEN
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
      NEW.current_balance,
      NEW.current_balance - calculated_balance,
      NOW()
    );
    
    -- Optionally, auto-correct
    -- NEW.current_balance = calculated_balance;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply check to accounts table
CREATE TRIGGER check_account_balance
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE PROCEDURE public.check_account_balance();
```

## Performance Functions

### Generate Performance Metrics

```sql
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
```

## Implementation Notes

1. All functions should be created with appropriate security context (`SECURITY DEFINER` for functions that need elevated permissions).
2. Triggers should be applied to all relevant tables to maintain data consistency.
3. Functions should include proper error handling and validation.
4. Performance-sensitive functions should be optimized and potentially use materialized views.
5. Consider adding appropriate indexes to support the functions and triggers.
6. Regularly review the audit logs and performance metrics to identify optimization opportunities.

These functions and triggers should be implemented as part of the Phase 3 and Phase 4 of the Supabase migration roadmap. 