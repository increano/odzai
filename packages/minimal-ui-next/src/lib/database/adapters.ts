/**
 * Database adapter interface as specified in the Supabase migration roadmap
 * This provides a consistent API across both SQLite and PostgreSQL/Supabase
 */
import { SupabaseClient } from '@supabase/supabase-js';

// ============== Type Definitions ==============

// Account type definitions
export interface Account {
  id: string;
  workspace_id: string;
  name: string;
  type: string;
  on_budget: boolean;
  closed: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface AccountInput {
  workspace_id: string;
  name: string;
  type: string;
  on_budget?: boolean;
  closed?: boolean;
  sort_order?: number;
}

// Category type definitions
export interface Category {
  id: string;
  workspace_id: string;
  group_id?: string;
  name: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryInput {
  workspace_id: string;
  group_id?: string;
  name: string;
  sort_order?: number;
}

export interface CategoryGroup {
  id: string;
  workspace_id: string;
  name: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryGroupInput {
  workspace_id: string;
  name: string;
  sort_order?: number;
}

// Payee type definitions
export interface Payee {
  id: string;
  workspace_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface PayeeInput {
  workspace_id: string;
  name: string;
}

// Budget type definitions
export interface BudgetAllocation {
  id: string;
  workspace_id: string;
  category_id: string;
  month: string; // Format: YYYY-MM
  amount: number; // In cents
  created_at?: string;
  updated_at?: string;
}

export interface BudgetAllocationInput {
  workspace_id: string;
  category_id: string;
  month: string;
  amount: number;
}

export interface BudgetMonth {
  month: string;
  categories: {
    [id: string]: {
      allocated: number;
      activity: number;
      available: number;
    };
  };
}

// Transaction type definition
export interface Transaction {
  id: string;
  workspace_id: string;
  account_id: string;
  payee_id?: string;
  category_id?: string;
  date: string;
  amount: number; // In cents
  notes?: string;
  cleared?: boolean;
  reconciled?: boolean;
  transfer_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Input for creating/updating transactions
export interface TransactionInput {
  workspace_id: string;
  account_id: string;
  payee_id?: string;
  category_id?: string;
  date: string;
  amount: number;
  notes?: string;
  cleared?: boolean;
  reconciled?: boolean;
  transfer_id?: string;
}

// Workspace type definitions
export interface Workspace {
  id: string;
  name: string;
  display_name?: string;
  color?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceInput {
  name: string;
  display_name?: string;
  color?: string;
}

// Database adapter interface
export interface DatabaseAdapter {
  // Workspace methods
  getWorkspaces(): Promise<Workspace[]>;
  createWorkspace(data: WorkspaceInput): Promise<Workspace>;
  updateWorkspace(id: string, data: Partial<WorkspaceInput>): Promise<Workspace>;
  
  // Account methods
  getAccounts(workspaceId: string): Promise<Account[]>;
  getAccount(id: string): Promise<Account>;
  createAccount(data: AccountInput, initialBalance?: number): Promise<Account>;
  updateAccount(id: string, data: Partial<AccountInput>): Promise<Account>;
  deleteAccount(id: string): Promise<boolean>;
  
  // Category methods
  getCategories(workspaceId: string): Promise<Category[]>;
  getCategory(id: string): Promise<Category>;
  createCategory(data: CategoryInput): Promise<Category>;
  updateCategory(id: string, data: Partial<CategoryInput>): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Category Group methods
  getCategoryGroups(workspaceId: string): Promise<CategoryGroup[]>;
  createCategoryGroup(data: CategoryGroupInput): Promise<CategoryGroup>;
  updateCategoryGroup(id: string, data: Partial<CategoryGroupInput>): Promise<CategoryGroup>;
  deleteCategoryGroup(id: string): Promise<boolean>;
  
  // Payee methods
  getPayees(workspaceId: string): Promise<Payee[]>;
  createPayee(data: PayeeInput): Promise<Payee>;
  updatePayee(id: string, data: Partial<PayeeInput>): Promise<Payee>;
  deletePayee(id: string): Promise<boolean>;
  
  // Transaction methods
  getTransactions(workspaceId: string, accountId?: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction>;
  createTransaction(data: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<TransactionInput>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Budget methods
  getBudgetMonth(workspaceId: string, month: string): Promise<BudgetMonth>;
  getBudgetAllocations(workspaceId: string, month: string): Promise<BudgetAllocation[]>;
  setBudgetAmount(workspaceId: string, categoryId: string, month: string, amount: number): Promise<boolean>;
}

// SQLite adapter implementation - uses existing API functions
export class SQLiteAdapter implements DatabaseAdapter {
  // Workspace methods
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await fetch('/api/workspaces');
    if (!response.ok) throw new Error('Failed to fetch workspaces');
    return response.json();
  }

  async createWorkspace(data: WorkspaceInput): Promise<Workspace> {
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace: data })
    });
    
    if (!response.ok) throw new Error('Failed to create workspace');
    const result = await response.json();
    return result.workspace;
  }

  async updateWorkspace(id: string, data: Partial<WorkspaceInput>): Promise<Workspace> {
    const response = await fetch(`/api/workspaces/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) throw new Error('Failed to update workspace');
    const result = await response.json();
    return result.workspace;
  }

  // Account methods
  async getAccounts(workspaceId: string): Promise<Account[]> {
    const response = await fetch(`/api/workspaces/${workspaceId}/accounts`);
    if (!response.ok) throw new Error('Failed to fetch accounts');
    return response.json();
  }

  async getAccount(id: string): Promise<Account> {
    const response = await fetch(`/api/accounts/${id}`);
    if (!response.ok) throw new Error('Failed to fetch account');
    return response.json();
  }

  async createAccount(data: AccountInput, initialBalance?: number): Promise<Account> {
    const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: data, initialBalance })
    });
    
    if (!response.ok) throw new Error('Failed to create account');
    const result = await response.json();
    return result.account;
  }

  async updateAccount(id: string, data: Partial<AccountInput>): Promise<Account> {
    const response = await fetch(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) throw new Error('Failed to update account');
    const result = await response.json();
    return result.account;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const response = await fetch(`/api/accounts/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete account');
    const result = await response.json();
    return result.success;
  }

  // Category methods
  async getCategories(workspaceId: string): Promise<Category[]> {
    const response = await fetch(`/api/workspaces/${workspaceId}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  }

  async getCategory(id: string): Promise<Category> {
    const response = await fetch(`/api/categories/${id}`);
    if (!response.ok) throw new Error('Failed to fetch category');
    return response.json();
  }

  async createCategory(data: CategoryInput): Promise<Category> {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: data })
    });
    
    if (!response.ok) throw new Error('Failed to create category');
    const result = await response.json();
    return result.category;
  }

  async updateCategory(id: string, data: Partial<CategoryInput>): Promise<Category> {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) throw new Error('Failed to update category');
    const result = await response.json();
    return result.category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete category');
    const result = await response.json();
    return result.success;
  }

  // Category Group methods
  async getCategoryGroups(workspaceId: string): Promise<CategoryGroup[]> {
    const response = await fetch(`/api/workspaces/${workspaceId}/category-groups`);
    if (!response.ok) throw new Error('Failed to fetch category groups');
    return response.json();
  }

  async createCategoryGroup(data: CategoryGroupInput): Promise<CategoryGroup> {
    const response = await fetch('/api/category-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryGroup: data })
    });
    
    if (!response.ok) throw new Error('Failed to create category group');
    const result = await response.json();
    return result.categoryGroup;
  }

  async updateCategoryGroup(id: string, data: Partial<CategoryGroupInput>): Promise<CategoryGroup> {
    const response = await fetch(`/api/category-groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) throw new Error('Failed to update category group');
    const result = await response.json();
    return result.categoryGroup;
  }

  async deleteCategoryGroup(id: string): Promise<boolean> {
    const response = await fetch(`/api/category-groups/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete category group');
    const result = await response.json();
    return result.success;
  }

  // Payee methods
  async getPayees(workspaceId: string): Promise<Payee[]> {
    const response = await fetch(`/api/workspaces/${workspaceId}/payees`);
    if (!response.ok) throw new Error('Failed to fetch payees');
    return response.json();
  }

  async createPayee(data: PayeeInput): Promise<Payee> {
    const response = await fetch('/api/payees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payee: data })
    });
    
    if (!response.ok) throw new Error('Failed to create payee');
    const result = await response.json();
    return result.payee;
  }

  async updatePayee(id: string, data: Partial<PayeeInput>): Promise<Payee> {
    const response = await fetch(`/api/payees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) throw new Error('Failed to update payee');
    const result = await response.json();
    return result.payee;
  }

  async deletePayee(id: string): Promise<boolean> {
    const response = await fetch(`/api/payees/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete payee');
    const result = await response.json();
    return result.success;
  }

  // Transaction methods 
  async getTransactions(workspaceId: string, accountId?: string): Promise<Transaction[]> {
    const url = accountId 
      ? `/api/workspaces/${workspaceId}/accounts/${accountId}/transactions` 
      : `/api/workspaces/${workspaceId}/transactions`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await fetch(`/api/transactions/${id}`);
    if (!response.ok) throw new Error('Failed to fetch transaction');
    return response.json();
  }

  async createTransaction(data: TransactionInput): Promise<Transaction> {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: data })
    });
    
    if (!response.ok) throw new Error('Failed to create transaction');
    const result = await response.json();
    return result.transaction;
  }

  async updateTransaction(id: string, data: Partial<TransactionInput>): Promise<Transaction> {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) throw new Error('Failed to update transaction');
    const result = await response.json();
    return result.transaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete transaction');
    const result = await response.json();
    return result.success;
  }

  // Budget methods
  async getBudgetMonth(workspaceId: string, month: string): Promise<BudgetMonth> {
    const response = await fetch(`/api/workspaces/${workspaceId}/budget/${month}`);
    if (!response.ok) throw new Error('Failed to fetch budget month');
    return response.json();
  }

  async getBudgetAllocations(workspaceId: string, month: string): Promise<BudgetAllocation[]> {
    const response = await fetch(`/api/workspaces/${workspaceId}/budget/${month}/allocations`);
    if (!response.ok) throw new Error('Failed to fetch budget allocations');
    return response.json();
  }

  async setBudgetAmount(workspaceId: string, categoryId: string, month: string, amount: number): Promise<boolean> {
    const response = await fetch('/api/budget/set-amount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, categoryId, month, amount })
    });
    
    if (!response.ok) throw new Error('Failed to set budget amount');
    const result = await response.json();
    return result.success;
  }
}

// Supabase/PostgreSQL adapter implementation
export class SupabaseAdapter implements DatabaseAdapter {
  constructor(private supabase: SupabaseClient) {}

  // Workspace methods
  async getWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select('*');
    
    if (error) throw error;
    return data;
  }

  async createWorkspace(data: WorkspaceInput): Promise<Workspace> {
    // Use the Supabase function that generates an ID and sets the creator as admin
    const { data: result, error } = await this.supabase
      .rpc('create_workspace_with_owner', {
        workspace_name: data.name,
        workspace_color: data.color || null
      });
    
    if (error) throw error;
    
    // Fetch the created workspace to return the complete object
    const { data: workspace, error: fetchError } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('id', result)
      .single();
    
    if (fetchError) throw fetchError;
    return workspace;
  }

  async updateWorkspace(id: string, data: Partial<WorkspaceInput>): Promise<Workspace> {
    const { data: updatedData, error } = await this.supabase
      .from('workspaces')
      .update({
        name: data.name,
        display_name: data.display_name,
        color: data.color
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData;
  }

  // Account methods
  async getAccounts(workspaceId: string): Promise<Account[]> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    if (error) throw error;
    return data;
  }

  async getAccount(id: string): Promise<Account> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createAccount(data: AccountInput, initialBalance?: number): Promise<Account> {
    // Start a transaction if initialBalance is provided
    const { data: account, error } = await this.supabase
      .from('accounts')
      .insert({
        workspace_id: data.workspace_id,
        name: data.name,
        type: data.type,
        on_budget: data.on_budget ?? true,
        closed: data.closed ?? false,
        sort_order: data.sort_order ?? 0
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // If initial balance is provided, create a transaction
    if (initialBalance !== undefined && initialBalance !== 0) {
      await this.createTransaction({
        workspace_id: data.workspace_id,
        account_id: account.id,
        amount: initialBalance,
        date: new Date().toISOString().split('T')[0],
        notes: 'Initial balance',
        cleared: true
      });
    }
    
    return account;
  }

  async updateAccount(id: string, data: Partial<AccountInput>): Promise<Account> {
    const { data: updatedData, error } = await this.supabase
      .from('accounts')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Category methods
  async getCategories(workspaceId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    if (error) throw error;
    return data;
  }

  async getCategory(id: string): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createCategory(data: CategoryInput): Promise<Category> {
    const { data: category, error } = await this.supabase
      .from('categories')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return category;
  }

  async updateCategory(id: string, data: Partial<CategoryInput>): Promise<Category> {
    const { data: updatedData, error } = await this.supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Category Group methods
  async getCategoryGroups(workspaceId: string): Promise<CategoryGroup[]> {
    const { data, error } = await this.supabase
      .from('category_groups')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    if (error) throw error;
    return data;
  }

  async createCategoryGroup(data: CategoryGroupInput): Promise<CategoryGroup> {
    const { data: categoryGroup, error } = await this.supabase
      .from('category_groups')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return categoryGroup;
  }

  async updateCategoryGroup(id: string, data: Partial<CategoryGroupInput>): Promise<CategoryGroup> {
    const { data: updatedData, error } = await this.supabase
      .from('category_groups')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData;
  }

  async deleteCategoryGroup(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('category_groups')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Payee methods
  async getPayees(workspaceId: string): Promise<Payee[]> {
    const { data, error } = await this.supabase
      .from('payees')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    if (error) throw error;
    return data;
  }

  async createPayee(data: PayeeInput): Promise<Payee> {
    const { data: payee, error } = await this.supabase
      .from('payees')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return payee;
  }

  async updatePayee(id: string, data: Partial<PayeeInput>): Promise<Payee> {
    const { data: updatedData, error } = await this.supabase
      .from('payees')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData;
  }

  async deletePayee(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('payees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Transaction methods
  async getTransactions(workspaceId: string, accountId?: string): Promise<Transaction[]> {
    let query = this.supabase
      .from('transactions')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getTransaction(id: string): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createTransaction(data: TransactionInput): Promise<Transaction> {
    // Use the RPC function that handles validation and can create payees
    const { data: transaction, error } = await this.supabase
      .rpc('create_transaction', {
        transaction_data: data
      });
    
    if (error) throw error;
    
    // Fetch the complete transaction with all fields
    const { data: createdTransaction, error: fetchError } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction)
      .single();
    
    if (fetchError) throw fetchError;
    return createdTransaction;
  }

  async updateTransaction(id: string, data: Partial<TransactionInput>): Promise<Transaction> {
    const { data: updatedData, error } = await this.supabase
      .from('transactions')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Budget methods
  async getBudgetMonth(workspaceId: string, month: string): Promise<BudgetMonth> {
    // Get all the categories for this workspace
    const { data: categories, error: categoriesError } = await this.supabase
      .from('categories')
      .select('id')
      .eq('workspace_id', workspaceId);
      
    if (categoriesError) throw categoriesError;
    
    // Build the budget month response
    const result: BudgetMonth = {
      month,
      categories: {}
    };
    
    // Get budget data for each category
    for (const category of categories) {
      const { data: budgetData, error } = await this.supabase
        .rpc('get_category_budget', {
          p_workspace_id: workspaceId,
          p_category_id: category.id,
          p_month: month
        });
        
      if (error) throw error;
      
      result.categories[category.id] = {
        allocated: budgetData.allocated,
        activity: budgetData.activity,
        available: budgetData.available
      };
    }
    
    return result;
  }

  async getBudgetAllocations(workspaceId: string, month: string): Promise<BudgetAllocation[]> {
    const { data, error } = await this.supabase
      .from('budget_allocations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('month', month);
      
    if (error) throw error;
    return data;
  }

  async setBudgetAmount(workspaceId: string, categoryId: string, month: string, amount: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('set_budget_allocation', {
        category_id: categoryId,
        month: month,
        amount: amount
      });
      
    if (error) throw error;
    return data;
  }
}

// Factory function to get the appropriate adapter
export function getDatabaseAdapter(options: { 
  useSupabase: boolean; 
  supabase?: SupabaseClient 
}): DatabaseAdapter {
  if (options.useSupabase) {
    if (!options.supabase) {
      throw new Error('Supabase client is required when useSupabase is true');
    }
    return new SupabaseAdapter(options.supabase);
  } else {
    return new SQLiteAdapter();
  }
} 