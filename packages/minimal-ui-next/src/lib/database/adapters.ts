/**
 * Database adapter interface as specified in the Supabase migration roadmap
 * This provides a consistent API across both SQLite and PostgreSQL/Supabase
 */

// Basic transaction type definition
export interface Transaction {
  id: string;
  account: string;
  amount: number;
  date: string;
  payee?: string;
  payee_name?: string;
  category?: string;
  notes?: string;
  cleared?: boolean;
}

// Input for creating/updating transactions
export interface TransactionInput {
  account: string;
  amount: number;
  date: string;
  payee?: string;
  payee_name?: string;
  category?: string;
  notes?: string;
  cleared?: boolean;
}

// Database adapter interface
export interface DatabaseAdapter {
  getTransactions(accountId?: string): Promise<Transaction[]>;
  createTransaction(transaction: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<TransactionInput>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  getAccounts(): Promise<any[]>;
  createAccount(account: any, initialBalance?: number): Promise<any>;
  updateAccount(id: string, data: any): Promise<any>;
  getBudgetMonth(month: string): Promise<any>;
  setBudgetAmount(month: string, categoryId: string, amount: number): Promise<boolean>;
  // Additional methods for other entities would be added here
}

// SQLite adapter implementation - uses existing API functions
export class SQLiteAdapter implements DatabaseAdapter {
  async getTransactions(accountId?: string): Promise<Transaction[]> {
    const url = accountId ? `/api/transactions/${accountId}` : '/api/transactions/all';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  }

  async createTransaction(transaction: TransactionInput): Promise<Transaction> {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: transaction.account,
        transaction: {
          date: transaction.date,
          amount: transaction.amount,
          payee_name: transaction.payee_name,
          notes: transaction.notes,
          category: transaction.category,
          cleared: transaction.cleared
        }
      })
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

  async getAccounts(): Promise<any[]> {
    const response = await fetch('/api/accounts');
    if (!response.ok) throw new Error('Failed to fetch accounts');
    return response.json();
  }

  async createAccount(account: any, initialBalance?: number): Promise<any> {
    const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, initialBalance })
    });
    
    if (!response.ok) throw new Error('Failed to create account');
    const result = await response.json();
    return { id: result.id, ...account };
  }

  async updateAccount(id: string, data: any): Promise<any> {
    const response = await fetch(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) throw new Error('Failed to update account');
    const result = await response.json();
    return result.account;
  }

  async getBudgetMonth(month: string): Promise<any> {
    const response = await fetch(`/api/budget/month/${month}`);
    if (!response.ok) throw new Error('Failed to fetch budget month');
    return response.json();
  }

  async setBudgetAmount(month: string, categoryId: string, amount: number): Promise<boolean> {
    const response = await fetch('/api/budget/set-amount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, categoryId, amount })
    });
    
    if (!response.ok) throw new Error('Failed to set budget amount');
    const result = await response.json();
    return result.success;
  }
}

// Supabase/PostgreSQL adapter implementation
export class SupabaseAdapter implements DatabaseAdapter {
  constructor(private supabase: any) {}

  async getTransactions(accountId?: string): Promise<Transaction[]> {
    let query = this.supabase.from('transactions').select('*');
    
    if (accountId) {
      query = query.eq('account', accountId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createTransaction(transaction: TransactionInput): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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

  async getAccounts(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*');
    
    if (error) throw error;
    return data;
  }

  async createAccount(account: any, initialBalance?: number): Promise<any> {
    // Start a transaction if initialBalance is provided
    if (initialBalance !== undefined) {
      // This would need to be a transaction in actual implementation
      // For now, we're just inserting the account
      const { data, error } = await this.supabase
        .from('accounts')
        .insert(account)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await this.supabase
        .from('accounts')
        .insert(account)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }

  async updateAccount(id: string, data: any): Promise<any> {
    const { data: updatedData, error } = await this.supabase
      .from('accounts')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData;
  }

  async getBudgetMonth(month: string): Promise<any> {
    // This would need to be a complex query in actual implementation
    // For now, we're returning a simple structure
    const { data: categories, error: categoriesError } = await this.supabase
      .from('budget_months')
      .select('*')
      .eq('month', month);
    
    if (categoriesError) throw categoriesError;
    
    // Get summary data
    const { data: summary, error: summaryError } = await this.supabase
      .from('budget_month_summary')
      .select('*')
      .eq('month', month)
      .single();
    
    if (summaryError && summaryError.code !== 'PGRST116') throw summaryError;
    
    return {
      month,
      categories,
      income: summary?.income || 0,
      spent: summary?.spent || 0,
      budgeted: summary?.budgeted || 0
    };
  }

  async setBudgetAmount(month: string, categoryId: string, amount: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('budget_months')
      .upsert({
        month,
        category_id: categoryId,
        budgeted: amount
      }, {
        onConflict: 'month,category_id'
      });
    
    if (error) throw error;
    return true;
  }
}

// Factory function to get the appropriate adapter
export function getDatabaseAdapter(options: { useSupabase: boolean; supabase?: any }): DatabaseAdapter {
  if (options.useSupabase && options.supabase) {
    return new SupabaseAdapter(options.supabase);
  }
  return new SQLiteAdapter();
} 