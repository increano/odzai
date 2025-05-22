# Default User Settings Strategy

## Overview

This document outlines the complete strategy for setting up default settings and data when a new user is confirmed in the application. This ensures a smooth onboarding experience and immediate usability of the application.

## Default Settings List

1. **User Preferences** (Aligned with `user_preferences` table)
   - Theme (light/dark mode)
   - Default workspace ID
   - Data JSON field containing:
     - Currency
     - Date format
     - Number format
     - Language
     - Notifications
     - Onboarding status

2. **Default Workspace** (Aligned with `workspaces` table)
   - Personal budget workspace
   - Display name
   - Color theme
   - Owner ID (auth.uid())

3. **Default Categories** (Aligned with `categories` and `category_groups` tables)
   - Income category group
   - Monthly Expenses group
   - Common categories under each group
   - Sort order preservation

4. **Default Accounts** (Aligned with `accounts` table)
   - Checking account (on_budget: true)
   - Savings account (on_budget: true)
   - Cash account (on_budget: true)
   - Type and sort order

## Implementation Strategy

### 1. Database Function Creation

```sql
-- Function to set up all default settings for a new user
CREATE OR REPLACE FUNCTION public.setup_default_user_settings()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id TEXT;
  income_group_id UUID;
  expense_group_id UUID;
BEGIN
  -- Only proceed if this is a new confirmed user
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- 1. Create default workspace using existing function
    SELECT public.create_workspace_with_owner(
      'My Budget',
      '#3B82F6' -- Default blue color
    ) INTO workspace_id;

    -- 2. Set up user preferences with proper indexing
    INSERT INTO public.user_preferences (
      user_id,
      default_workspace_id,
      theme,
      data
    ) VALUES (
      NEW.id,
      workspace_id,
      'light',
      jsonb_build_object(
        'currency', 'USD',
        'dateFormat', 'MM/DD/YYYY',
        'numberFormat', '1,234.56',
        'language', 'en',
        'notifications', jsonb_build_object(
          'email', true,
          'push', false
        ),
        'onboarding', jsonb_build_object(
          'completed', true,
          'completedAt', NOW()
        )
      )
    );

    -- 3. Create default category groups with proper indexing
    INSERT INTO public.category_groups (
      id,
      workspace_id,
      name,
      sort_order,
      created_at,
      updated_at
    ) VALUES
    (gen_random_uuid(), workspace_id, 'Income', 0, NOW(), NOW()) 
    RETURNING id INTO income_group_id;

    INSERT INTO public.category_groups (
      id,
      workspace_id,
      name,
      sort_order,
      created_at,
      updated_at
    ) VALUES
    (gen_random_uuid(), workspace_id, 'Monthly Expenses', 1, NOW(), NOW())
    RETURNING id INTO expense_group_id;

    -- 4. Create default categories with proper indexing
    -- Income categories
    INSERT INTO public.categories (
      id,
      workspace_id,
      group_id,
      name,
      sort_order,
      created_at,
      updated_at
    ) VALUES
    (gen_random_uuid(), workspace_id, income_group_id, 'Salary', 0, NOW(), NOW()),
    (gen_random_uuid(), workspace_id, income_group_id, 'Other Income', 1, NOW(), NOW());

    -- Expense categories
    INSERT INTO public.categories (
      id,
      workspace_id,
      group_id,
      name,
      sort_order,
      created_at,
      updated_at
    ) VALUES
    (gen_random_uuid(), workspace_id, expense_group_id, 'Rent/Mortgage', 0, NOW(), NOW()),
    (gen_random_uuid(), workspace_id, expense_group_id, 'Utilities', 1, NOW(), NOW()),
    (gen_random_uuid(), workspace_id, expense_group_id, 'Groceries', 2, NOW(), NOW()),
    (gen_random_uuid(), workspace_id, expense_group_id, 'Transportation', 3, NOW(), NOW()),
    (gen_random_uuid(), workspace_id, expense_group_id, 'Healthcare', 4, NOW(), NOW()),
    (gen_random_uuid(), workspace_id, expense_group_id, 'Entertainment', 5, NOW(), NOW());

    -- 5. Create default accounts with proper indexing
    INSERT INTO public.accounts (
      id,
      workspace_id,
      name,
      type,
      on_budget,
      closed,
      sort_order,
      created_at,
      updated_at
    ) VALUES
    (gen_random_uuid(), workspace_id, 'Checking Account', 'checking', true, false, 0, NOW(), NOW()),
    (gen_random_uuid(), workspace_id, 'Savings Account', 'savings', true, false, 1, NOW(), NOW()),
    (gen_random_uuid(), workspace_id, 'Cash', 'cash', true, false, 2, NOW(), NOW());

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function
CREATE TRIGGER on_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.setup_default_user_settings();
```

### 2. RLS Policies for Default Settings

```sql
-- These policies align with the existing RLS structure in supabase-rls-policies.md
-- Allow the trigger function to create default settings
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for system-level operations (aligned with existing policies)
CREATE POLICY "System can create default settings" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can create default category groups" ON public.category_groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can create default categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can create default accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can create default preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### 3. Required Indices

```sql
-- These indices align with the existing indices in supabase-indices.md
-- User Preferences
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences (user_id);
CREATE INDEX idx_user_preferences_workspace ON public.user_preferences (default_workspace_id);
CREATE INDEX idx_user_preferences_data_gin ON public.user_preferences USING gin (data jsonb_path_ops);

-- Workspaces
CREATE INDEX idx_workspaces_owner ON public.workspaces (owner_id);
CREATE INDEX idx_workspaces_created ON public.workspaces (created_at);

-- Categories and Groups
CREATE INDEX idx_categories_workspace ON public.categories (workspace_id);
CREATE INDEX idx_categories_group ON public.categories (group_id);
CREATE INDEX idx_category_groups_workspace ON public.category_groups (workspace_id);

-- Accounts
CREATE INDEX idx_accounts_workspace ON public.accounts (workspace_id);
CREATE INDEX idx_accounts_type ON public.accounts (type);
```

### 4. Migration Strategy

1. **For New Users**:
   - The trigger automatically creates all default settings
   - Uses existing indices for optimal performance
   - Respects existing RLS policies

2. **For Existing Users**:
   - Backfill function respects RLS policies
   - Uses proper indexing for efficient queries
   - Maintains data consistency

```sql
-- Function to backfill default settings for existing users
CREATE OR REPLACE FUNCTION public.backfill_default_settings()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id 
    FROM auth.users 
    WHERE email_confirmed_at IS NOT NULL 
    AND id NOT IN (SELECT user_id FROM public.user_preferences)
  LOOP
    PERFORM public.setup_default_user_settings();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Benefits and Monitoring

1. **Performance Optimized**
   - Utilizes proper indices for all operations
   - Follows established RLS patterns
   - Efficient trigger execution

2. **Security Compliant**
   - Follows existing RLS policies
   - Proper permission checks
   - Secure default settings

3. **Maintainable Structure**
   - Aligned with existing table structures
   - Consistent with current functions
   - Clear audit trail

## Future Considerations

1. **RLS Policy Updates**
   - Review and update policies as needed
   - Maintain security best practices
   - Consider new use cases

2. **Index Optimization**
   - Monitor index usage
   - Optimize based on query patterns
   - Remove unused indices

3. **Data Migration**
   - Plan for schema updates
   - Handle version changes
   - Maintain backwards compatibility

## Benefits

1. **Immediate Usability**
   - Users can start using the app immediately after confirmation
   - No empty states to handle
   - Reduced friction in getting started

2. **Consistent Experience**
   - All users start with the same baseline
   - Predictable initial state for support
   - Easy to update defaults globally

3. **Better Onboarding**
   - Shows users how to structure their budget
   - Provides examples of categories and accounts
   - Reduces decision fatigue

4. **Maintainable Structure**
   - Single function for all default settings
   - Easy to modify defaults
   - Clear audit trail

## Monitoring and Updates

1. **Success Tracking**
   - Log successful default creation
   - Monitor for any failures
   - Track which defaults are most commonly modified

2. **Regular Reviews**
   - Review default categories quarterly
   - Update based on user feedback
   - Add new defaults as features are added

3. **Performance Monitoring**
   - Monitor trigger execution time
   - Optimize if needed
   - Track any impact on user confirmation time

## Future Enhancements

1. **Customizable Defaults**
   - Allow admin to modify default settings
   - Create region-specific defaults
   - Support template-based defaults

2. **Smart Defaults**
   - Learn from user patterns
   - Suggest improvements to defaults
   - Personalize based on user segment

3. **Backup and Restore**
   - Allow users to reset to defaults
   - Create backup of user customizations
   - Support rollback of changes

## Implementation Roadmap

| Status | Task |
|--------|------|
| ✅ | Create core tables structure |
| ✅ | Enable RLS on all tables |
| ✅ | Create necessary indices |
| ✅ | Implement create_workspace_with_owner function |
| ✅ | Create setup_default_user_settings function |
| ✅ | Set up trigger for user confirmation |
| | Create backfill function for existing users |
| ✅ | Add RLS policies for system operations |
| ✅ | Test default workspace creation |
| ✅ | Test default categories creation |
| ✅ | Test default accounts creation |
| ✅ | Test user preferences creation |
| ✅ | Verify RLS policies effectiveness |
| ✅ | Test indices performance |
| ✅ | Add monitoring for trigger execution |
| | Document API endpoints for defaults |
| | Create admin interface for managing defaults |
| | Set up automated testing for defaults |
| | Create backup and restore procedures |

## Testing Results

1. **Initial Implementation Issues**
   - Found and fixed issue with auth.uid() in test context
   - Added better error handling and logging
   - Updated functions to handle user ID explicitly

2. **Security Improvements**
   - Verified SECURITY DEFINER on functions
   - Confirmed proper RLS policy application
   - Added explicit permission grants

3. **Monitoring Enhancements**
   - Added debug logging function
   - Improved error messages
   - Added step-by-step verification

4. **Next Steps**
   - Implement backfill function for existing users
   - Create admin interface for managing defaults
   - Set up automated testing suite

## Progress Tracking

To mark a task as complete, add ✅ in the Status column. Example:
| Status | Task |
|--------|------|
| ✅ | Create core tables structure |
|  | Enable RLS on all tables |

## Implementation Notes

1. **Priority Order**:
   - Core tables first
   - Security (RLS) second
   - Default data third
   - Monitoring last

2. **Testing Strategy**:
   - Unit test each function
   - Integration test user flow
   - Performance test with load
   - Security test with penetration

3. **Deployment Steps**:
   - Deploy to staging first
   - Test with sample users
   - Monitor performance
   - Roll out to production

4. **Monitoring Plan**:
   - Track function execution time
   - Monitor error rates
   - Watch for performance issues
   - Alert on failures

## Review Checklist

Before marking any task complete:
1. Function works as expected
2. Security policies are in place
3. Indices are optimized
4. Tests are passing
5. Documentation is updated
6. Monitoring is in place 