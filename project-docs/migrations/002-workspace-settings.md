# Workspace Settings Migration

## Overview
This migration adds workspace settings and preferences support to enhance the workspace management functionality.

## Changes

### 1. Add Settings Column to Workspaces Table

```sql
-- Add settings column to workspaces table
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT jsonb_build_object(
  'display', jsonb_build_object(
    'compact_mode', false,
    'show_closed_accounts', false,
    'currency_position', 'before',
    'decimal_separator', '.',
    'thousand_separator', ','
  ),
  'notifications', jsonb_build_object(
    'email_notifications', true,
    'budget_alerts', true,
    'balance_alerts', true
  ),
  'default_currency', 'USD',
  'fiscal_year_start', 1
);

-- Add index for the settings column
CREATE INDEX IF NOT EXISTS idx_workspaces_settings ON public.workspaces USING gin (settings jsonb_path_ops);
```

### 2. Add Display Name Function

```sql
-- Function to update workspace display name
CREATE OR REPLACE FUNCTION public.update_workspace_display_name(
  workspace_id TEXT,
  new_display_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_has_permission BOOLEAN;
BEGIN
  -- Check if user has write access to this workspace
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE workspace_id = update_workspace_display_name.workspace_id
    AND user_id = auth.uid()
    AND access_level IN ('write', 'admin')
  ) INTO user_has_permission;
  
  IF NOT user_has_permission THEN
    RAISE EXCEPTION 'You do not have permission to update this workspace';
  END IF;
  
  -- Update the display name
  UPDATE public.workspaces
  SET 
    display_name = new_display_name,
    updated_at = NOW()
  WHERE id = workspace_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Add Workspace Settings Functions

```sql
-- Function to update workspace settings
CREATE OR REPLACE FUNCTION public.update_workspace_settings(
  workspace_id TEXT,
  settings_update JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  user_has_permission BOOLEAN;
  current_settings JSONB;
BEGIN
  -- Check if user has write access
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE workspace_id = update_workspace_settings.workspace_id
    AND user_id = auth.uid()
    AND access_level IN ('write', 'admin')
  ) INTO user_has_permission;
  
  IF NOT user_has_permission THEN
    RAISE EXCEPTION 'You do not have permission to update workspace settings';
  END IF;
  
  -- Get current settings
  SELECT settings INTO current_settings
  FROM public.workspaces
  WHERE id = workspace_id;
  
  -- Update settings, merging with existing ones
  UPDATE public.workspaces
  SET 
    settings = current_settings || settings_update,
    updated_at = NOW()
  WHERE id = workspace_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workspace settings
CREATE OR REPLACE FUNCTION public.get_workspace_settings(
  workspace_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  workspace_settings JSONB;
BEGIN
  -- Check if user has access to this workspace
  PERFORM 1
  FROM public.workspace_users
  WHERE workspace_id = get_workspace_settings.workspace_id
  AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'You do not have access to this workspace';
  END IF;
  
  -- Get the settings
  SELECT settings INTO workspace_settings
  FROM public.workspaces
  WHERE id = workspace_id;
  
  RETURN workspace_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Add RLS Policies for Settings

```sql
-- Policy for workspace settings access
CREATE POLICY "Users can view workspace settings" ON workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for workspace settings updates
CREATE POLICY "Users can update workspace settings" ON workspaces
  FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_users 
      WHERE user_id = auth.uid() 
      AND access_level IN ('write', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT workspace_id 
      FROM workspace_users 
      WHERE user_id = auth.uid() 
      AND access_level IN ('write', 'admin')
    )
  );
```

## Usage Examples

### Update Display Name
```sql
SELECT public.update_workspace_display_name('workspace-123', 'My Budget 2024');
```

### Update Settings
```sql
SELECT public.update_workspace_settings(
  'workspace-123',
  '{
    "display": {
      "compact_mode": true,
      "currency_position": "after"
    }
  }'
);
```

### Get Settings
```sql
SELECT public.get_workspace_settings('workspace-123');
``` 