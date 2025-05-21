# Supabase Database Indices for Performance Optimization

This document outlines all the recommended database indices that should be created in Supabase to ensure optimal performance for the Odzai/Actual Budget application. These indices will significantly improve query performance, especially for frequently accessed data patterns.

## Core Table Indices

### Users and Roles

```sql
-- Primary indices (created automatically)
-- auth.users primary key (id)
-- public.user_roles primary key (id)

-- Lookup by user ID (for role checks)
CREATE INDEX idx_user_roles_user_id ON public.user_roles (user_id);

-- Lookup users by role (for admin dashboards)
CREATE INDEX idx_user_roles_role ON public.user_roles (role);
```

### Workspaces (Budgets)

```sql
-- Primary indices (created automatically)
-- public.workspaces primary key (id)

-- Search workspaces by name
CREATE INDEX idx_workspaces_name ON public.workspaces (name);

-- Filter workspaces by owner
CREATE INDEX idx_workspaces_owner_id ON public.workspaces (owner_id);

-- Filter workspaces by creation date (reporting)
CREATE INDEX idx_workspaces_created_at ON public.workspaces (created_at);

-- Filter workspaces by last updated (sync priority)
CREATE INDEX idx_workspaces_updated_at ON public.workspaces (updated_at);
```

### Workspace Users (Many-to-Many)

```sql
-- Primary indices (created automatically)
-- public.workspace_users primary key (workspace_id, user_id)

-- Find all workspaces for a user (common operation)
CREATE INDEX idx_workspace_users_user_id ON public.workspace_users (user_id);

-- Find users with specific access level (for admin features)
CREATE INDEX idx_workspace_users_access_level ON public.workspace_users (access_level);

-- Composite index for access checks (common authorization query)
CREATE INDEX idx_workspace_users_access ON public.workspace_users (user_id, workspace_id, access_level);
```

## Financial Data Indices

### Accounts

```sql
-- Primary indices (created automatically)
-- public.accounts primary key (id)

-- Foreign key to workspace
CREATE INDEX idx_accounts_workspace_id ON public.accounts (workspace_id);

-- Filtering accounts by type (common in UI)
CREATE INDEX idx_accounts_type ON public.accounts (type);

-- Combined index for workspace accounts by type (common query pattern)
CREATE INDEX idx_accounts_workspace_type ON public.accounts (workspace_id, type);

-- Accounts by on_budget flag (for budget vs tracking accounts)
CREATE INDEX idx_accounts_on_budget ON public.accounts (workspace_id, on_budget);

-- Closed accounts filter
CREATE INDEX idx_accounts_closed ON public.accounts (workspace_id, closed);

-- For sorting accounts by name within a workspace
CREATE INDEX idx_accounts_name ON public.accounts (workspace_id, name);

-- For sorting accounts by sort order
CREATE INDEX idx_accounts_sort_order ON public.accounts (workspace_id, sort_order);
```

### Transactions

```sql
-- Primary indices (created automatically)
-- public.transactions primary key (id)

-- Foreign keys
CREATE INDEX idx_transactions_account_id ON public.transactions (account_id);
CREATE INDEX idx_transactions_workspace_id ON public.transactions (workspace_id);
CREATE INDEX idx_transactions_category_id ON public.transactions (category_id);
CREATE INDEX idx_transactions_payee_id ON public.transactions (payee_id);
CREATE INDEX idx_transactions_transfer_id ON public.transactions (transfer_id);

-- Date-based access (critical for performance with large transaction history)
CREATE INDEX idx_transactions_date ON public.transactions (workspace_id, date);

-- Combined account and date lookup (extremely common query pattern)
CREATE INDEX idx_transactions_account_date ON public.transactions (account_id, date);

-- For filtering by cleared status (register view)
CREATE INDEX idx_transactions_cleared ON public.transactions (account_id, cleared, date);

-- For filtering by reconciled status
CREATE INDEX idx_transactions_reconciled ON public.transactions (account_id, reconciled, date);

-- Search by amount (for reconciliation and search features)
CREATE INDEX idx_transactions_amount ON public.transactions (workspace_id, amount);

-- Search optimization (for transaction search feature)
CREATE INDEX idx_transactions_notes_gin ON public.transactions USING gin (to_tsvector('english', coalesce(notes, '')));

-- Partial index for uncleared transactions (helps with optimizing "to be cleared" view)
CREATE INDEX idx_transactions_uncleared ON public.transactions (account_id, date) 
WHERE cleared = false;

-- Special index for monthly reports (transactions by category per month)
-- Note: We need to create an IMMUTABLE function for this to work in an index
CREATE OR REPLACE FUNCTION public.extract_month_year(date_value DATE) RETURNS TEXT
IMMUTABLE LANGUAGE SQL AS $$
  SELECT to_char(date_value, 'YYYY-MM');
$$;

CREATE INDEX idx_transactions_category_month_text 
ON public.transactions (category_id, extract_month_year(date));
```

### Categories and Category Groups

```sql
-- Primary indices (created automatically)
-- public.categories primary key (id)
-- public.category_groups primary key (id)

-- Foreign keys
CREATE INDEX idx_categories_workspace_id ON public.categories (workspace_id);
CREATE INDEX idx_categories_group_id ON public.categories (group_id);
CREATE INDEX idx_category_groups_workspace_id ON public.category_groups (workspace_id);

-- For ordering categories within groups
CREATE INDEX idx_categories_sort_order ON public.categories (group_id, sort_order);

-- For ordering category groups
CREATE INDEX idx_category_groups_sort_order ON public.category_groups (workspace_id, sort_order);
```

### Budget Allocations

```sql
-- Primary indices (created automatically)
-- public.budget_allocations primary key (id)

-- Foreign keys
CREATE INDEX idx_budget_allocations_category_id ON public.budget_allocations (category_id);
CREATE INDEX idx_budget_allocations_workspace_id ON public.budget_allocations (workspace_id);

-- Combined index for retrieving a specific month's budget (critical query path)
CREATE INDEX idx_budget_allocations_month ON public.budget_allocations (workspace_id, month);

-- Combined category and month lookup (common operation)
CREATE UNIQUE INDEX idx_budget_allocations_category_month ON public.budget_allocations (category_id, month);

-- For reports that look at allocation amounts across categories
CREATE INDEX idx_budget_allocations_amount ON public.budget_allocations (workspace_id, month, amount);
```

### Payees

```sql
-- Primary indices (created automatically)
-- public.payees primary key (id)

-- Foreign key
CREATE INDEX idx_payees_workspace_id ON public.payees (workspace_id);

-- For payee search (case insensitive)
CREATE INDEX idx_payees_name_lower ON public.payees (workspace_id, lower(name));

-- Full text search on payee names
CREATE INDEX idx_payees_name_gin ON public.payees USING gin (to_tsvector('english', name));
```

### Rules

```sql
-- Primary indices (created automatically)
-- public.rules primary key (id)

-- Foreign key
CREATE INDEX idx_rules_workspace_id ON public.rules (workspace_id);

-- For rule application ordering
CREATE INDEX idx_rules_sort_order ON public.rules (workspace_id, sort_order);

-- For checking rule conditions efficiently
CREATE INDEX idx_rules_conditions_gin ON public.rules USING gin (conditions jsonb_path_ops);

-- For checking rule actions efficiently
CREATE INDEX idx_rules_actions_gin ON public.rules USING gin (actions jsonb_path_ops);
```

### Scheduled Transactions

```sql
-- Primary indices (created automatically)
-- public.scheduled_transactions primary key (id)

-- Foreign keys
CREATE INDEX idx_scheduled_transactions_workspace_id ON public.scheduled_transactions (workspace_id);
CREATE INDEX idx_scheduled_transactions_account_id ON public.scheduled_transactions (account_id);
CREATE INDEX idx_scheduled_transactions_category_id ON public.scheduled_transactions (category_id);
CREATE INDEX idx_scheduled_transactions_payee_id ON public.scheduled_transactions (payee_id);

-- For next occurrence checks (very important for scheduling)
CREATE INDEX idx_scheduled_transactions_next_date ON public.scheduled_transactions (workspace_id, next_date);

-- Filter by frequency type
CREATE INDEX idx_scheduled_transactions_frequency ON public.scheduled_transactions (workspace_id, frequency_type);

-- Filter by status
CREATE INDEX idx_scheduled_transactions_status ON public.scheduled_transactions (workspace_id, status);
```

### Notes

```sql
-- Primary indices (created automatically)
-- public.notes primary key (id)

-- Foreign keys
CREATE INDEX idx_notes_workspace_id ON public.notes (workspace_id);
CREATE INDEX idx_notes_target_id ON public.notes (target_id);

-- Type filtering (account notes, transaction notes, etc)
CREATE INDEX idx_notes_target_type ON public.notes (workspace_id, target_type);

-- Full text search on note content
CREATE INDEX idx_notes_text_gin ON public.notes USING gin (to_tsvector('english', text));

-- By date created
CREATE INDEX idx_notes_created_at ON public.notes (workspace_id, created_at);
```

## User Preferences and Settings

```sql
-- Primary indices (created automatically)
-- public.user_preferences primary key (user_id)

-- For fast JSON field access
CREATE INDEX idx_user_preferences_data_gin ON public.user_preferences USING gin (data jsonb_path_ops);
```

## Health Check Table

```sql
-- Primary indices (created automatically)
-- public.health_check primary key (id)

-- By creation date
CREATE INDEX idx_health_check_created_at ON public.health_check (created_at);
```

## Future Tables Indices

### Audit Logs

```sql
-- Primary indices (created automatically)
-- public.audit_logs primary key (id)

-- For filtering logs by table
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs (table_name);

-- For filtering logs by operation type
CREATE INDEX idx_audit_logs_operation ON public.audit_logs (operation);

-- For filtering logs by user
CREATE INDEX idx_audit_logs_changed_by ON public.audit_logs (changed_by);

-- For time-based filtering
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs (timestamp);

-- Combined index for common audit review pattern
CREATE INDEX idx_audit_logs_record ON public.audit_logs (table_name, record_id);

-- Full text search on changes
CREATE INDEX idx_audit_logs_data_gin ON public.audit_logs USING gin (change_data jsonb_path_ops);
```

### Performance Metrics

```sql
-- Primary indices (created automatically)
-- public.performance_metrics primary key (id)

-- For operation type filtering
CREATE INDEX idx_perf_metrics_operation ON public.performance_metrics (operation);

-- For slow query analysis
CREATE INDEX idx_perf_metrics_duration ON public.performance_metrics (duration_ms DESC);

-- For user experience analysis
CREATE INDEX idx_perf_metrics_user_id ON public.performance_metrics (user_id);

-- Time-based analysis
CREATE INDEX idx_perf_metrics_recorded_at ON public.performance_metrics (recorded_at);
```

### Balance Inconsistencies

```sql
-- Primary indices (created automatically)
-- public.balance_inconsistencies primary key (id)

-- For filtering by account
CREATE INDEX idx_balance_inconsistencies_account_id ON public.balance_inconsistencies (account_id);

-- For filtering by resolved status
CREATE INDEX idx_balance_inconsistencies_resolved ON public.balance_inconsistencies (resolved);

-- For time-based analysis
CREATE INDEX idx_balance_inconsistencies_detected_at ON public.balance_inconsistencies (detected_at);
```

### Bank Connections

```sql
-- Primary indices (created automatically)
-- public.bank_connections primary key (id)

-- For filtering by user
CREATE INDEX idx_bank_connections_user_id ON public.bank_connections (user_id);

-- For filtering by provider
CREATE INDEX idx_bank_connections_provider ON public.bank_connections (provider);

-- For filtering by status
CREATE INDEX idx_bank_connections_status ON public.bank_connections (status);

-- For sync scheduling based on last sync time
CREATE INDEX idx_bank_connections_last_synced_at ON public.bank_connections (last_synced_at);
```

### Bank Transactions

```sql
-- Primary indices (created automatically)
-- public.bank_transactions primary key (id)

-- For filtering by connection
CREATE INDEX idx_bank_transactions_connection_id ON public.bank_transactions (connection_id);

-- For filtering by account
CREATE INDEX idx_bank_transactions_account_id ON public.bank_transactions (account_id);

-- For date-based filtering
CREATE INDEX idx_bank_transactions_date ON public.bank_transactions (date);

-- For filtering pending transactions
CREATE INDEX idx_bank_transactions_pending ON public.bank_transactions (pending);

-- For filtering imported transactions
CREATE INDEX idx_bank_transactions_imported ON public.bank_transactions (imported);

-- For finding matched transactions
CREATE INDEX idx_bank_transactions_matched_transaction_id ON public.bank_transactions (matched_transaction_id);

-- For external ID lookups (important for deduplication)
CREATE INDEX idx_bank_transactions_external_id ON public.bank_transactions (connection_id, external_id);
```

## Implementation Notes

1. **Add indices incrementally**: Don't add all indices at once. Start with the core indices and add more as needed based on performance monitoring.

2. **Monitor index usage**: After adding indices, monitor which ones are being used and their effectiveness with:
   ```sql
   SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
   ```

3. **Index maintenance**: Regularly run `ANALYZE` on your tables to keep statistics up to date:
   ```sql
   ANALYZE public.transactions;
   ```

4. **Remove unused indices**: If an index isn't being used after a few weeks of operation, consider removing it to reduce write overhead.

5. **Consider index size**: Each index increases the database size and slows down writes. Ensure the performance benefit justifies this cost.

6. **Use partial indices**: For tables where certain columns have many NULL values or you typically filter on specific values.

7. **Apply indices in phases**:
   - Phase 1: Primary keys and foreign keys
   - Phase 2: Common query patterns (based on app usage)
   - Phase 3: Report-specific optimizations
   - Phase 4: Full-text search indices

These indices should be implemented during Phase 3 (Incremental Data Migration) and Phase 4 (Dual-Write System and Completion) of the Supabase migration roadmap. 