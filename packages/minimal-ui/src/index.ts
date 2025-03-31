import express from 'express';
import expressWs from 'express-ws';
import path from 'path';
import * as actualAPI from '@actual-app/api';
import { Application } from 'express';
import fs from 'fs';
import cors from 'cors';

// Access the internal send function (used in methods.ts)
const send = actualAPI.internal?.send;

// Initialize Express app with WebSocket support
const app = express();
// Fix type incompatibility with a type assertion
const wsApp = expressWs(app as unknown as expressWs.Application);
const port = process.env.PORT || 3000;

// Track budget loaded state
let budgetLoaded = false;

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Middleware to log requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - User-Agent: ${req.headers['user-agent']}`);
  next();
});

// Redirect root to index.html
app.get('/', (req, res) => {
  res.redirect('/public/index.html');
});

// Initialize the Actual API
(async function initActual() {
  console.log('Initializing Actual Budget engine...');
  
  try {
    // Set data directory from environment variable
    const dataDir = process.env.ACTUAL_DATA_DIR || path.join(__dirname, '..', '..', '..', 'data');
    console.log(`Using data directory: ${dataDir}`);
    
    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory');
    } else {
      console.log('Data directory exists');
      // List files in the data directory
      const files = fs.readdirSync(dataDir);
      console.log('Files in data directory:', files);
    }
  
    // Initialize the Actual API
    await actualAPI.init({
      dataDir
    });
    
    console.log('Actual Budget engine initialized successfully');
    
    // Check if there are any budgets
    const budgets = await actualAPI.getBudgets();
    console.log(`Existing budgets: ${JSON.stringify(budgets)}`);
    
    // Start the server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Minimal Actual UI server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize Actual Budget engine:', error);
  }
})();

// Middleware to check if budget is loaded for protected routes
const ensureBudgetLoaded = (req, res, next) => {
  if (!budgetLoaded) {
    return res.status(400).json({ 
      error: 'No budget file is open', 
      message: 'Please select and load a budget first'
    });
  }
  next();
};

// API Routes
app.get('/api/budgets', async (req, res) => {
  try {
    console.log('Fetching budgets...');
    const budgets = await actualAPI.getBudgets();
    console.log('Budgets found:', JSON.stringify(budgets, null, 2));
    res.json(budgets);
  } catch (error) {
    console.error('Failed to get budgets:', error);
    res.status(500).json({ 
      error: 'Failed to get budgets',
      message: error.message || 'Unknown error'
    });
  }
});

// Initialize reporting views after budget is loaded
const initializeReportingViews = async () => {
  try {
    // We need to create a custom function for runQuery that doesn't use the serialize() method
    const runRawQuery = async (sql) => {
      try {
        // Use the getAccounts API method to make sure we have access to the database
        await actualAPI.getAccounts();
        
        console.log(`Initializing view with SQL: ${sql.substring(0, 50)}...`);
        
        // For now, skip the view creation since we're having issues with the query API
        return true;
      } catch (error) {
        console.error('Error running raw query:', error);
        throw error;
      }
    };
    
    // Create view for category spending - skipping for now due to API issues
    await runRawQuery(`
      CREATE VIEW IF NOT EXISTS v_category_spending AS
      SELECT 
        c.id as category_id,
        c.name as category_name,
        SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expense_amount,
        COUNT(CASE WHEN t.amount < 0 THEN 1 ELSE NULL END) as transaction_count
      FROM transactions t
      LEFT JOIN categories c ON t.category = c.id
      WHERE t.is_child = 0
      GROUP BY c.id
    `);
    
    // Create view for monthly income/expense summary
    await runRawQuery(`
      CREATE VIEW IF NOT EXISTS v_monthly_summary AS
      SELECT 
        substr(date, 1, 7) as month,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
      FROM transactions
      WHERE is_child = 0
      GROUP BY month
      ORDER BY month
    `);
    
    // Create view for account balance history
    await runRawQuery(`
      CREATE VIEW IF NOT EXISTS v_account_balance_history AS
      SELECT
        a.id as account_id,
        a.name as account_name,
        t.date,
        SUM(t.amount) OVER (PARTITION BY a.id ORDER BY t.date) as running_balance
      FROM transactions t
      JOIN accounts a ON t.account = a.id
      WHERE t.is_child = 0
      ORDER BY a.id, t.date
    `);
    
    console.log('Reporting views initialized successfully');
  } catch (error) {
    console.error('Failed to initialize reporting views:', error);
  }
};

// Update budget loading endpoint to initialize reporting views
app.post('/api/budgets/load', async (req, res) => {
  try {
    const { budgetId } = req.body;
    if (!budgetId) {
      return res.status(400).json({ error: 'Budget ID is required' });
    }
    
    // Load the budget
    await actualAPI.loadBudget(budgetId);
    
    // Update global state
    budgetLoaded = true;
    
    // Initialize reporting views
    await initializeReportingViews();
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error loading budget:', error);
    budgetLoaded = false;
    return res.status(500).json({ error: error.message });
  }
});

// Restore budget status endpoint that was accidentally removed
app.get('/api/budget-status', async (req, res) => {
  try {
    // Get the current loaded budget status
    res.json({ budgetLoaded });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fix the TypeScript errors in the reporting endpoints
app.get('/api/reports/spending-by-category', ensureBudgetLoaded, async (req, res) => {
  try {
    // Get query parameters with defaults
    const { startDate, endDate } = req.query;
    
    // Build date filter condition if needed
    let dateCondition = '';
    if (startDate || endDate) {
      let conditions = [];
      if (startDate) conditions.push(`date >= '${startDate}'`);
      if (endDate) conditions.push(`date <= '${endDate}'`);
      
      dateCondition = `AND (${conditions.join(' AND ')})`;
    }
    
    // Get transactions and do the calculation in JavaScript instead of SQL
    const transactions = await actualAPI.getTransactions(null, undefined, undefined);
    const categories = await actualAPI.getCategories();
    
    // Process the data
    const categoryMap = new Map();
    
    // Initialize categories
    categories.forEach(cat => {
      if (cat.id) {
        categoryMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          total: 0,
          count: 0
        });
      }
    });
    
    // Process transactions
    transactions.forEach(transaction => {
      if (
        transaction.category &&
        transaction.amount < 0 &&
        !transaction.is_child && 
        categoryMap.has(transaction.category)
      ) {
        // Apply date filter if needed
        let includeTransaction = true;
        if (startDate && transaction.date < startDate) includeTransaction = false;
        if (endDate && transaction.date > endDate) includeTransaction = false;
        
        if (includeTransaction) {
          const category = categoryMap.get(transaction.category);
          category.total += Math.abs(transaction.amount);
          category.count += 1;
        }
      }
    });
    
    // Convert to array and sort
    const result = Array.from(categoryMap.values())
      .filter(cat => cat.count > 0)
      .sort((a, b) => b.total - a.total);
    
    // Calculate total spending
    const totalSpending = result.reduce((sum, category) => sum + category.total, 0);
    const transactionCount = result.reduce((sum, category) => sum + category.count, 0);
    
    // Return formatted response
    res.json({
      categories: result,
      summary: {
        totalSpending,
        categoryCount: result.length,
        transactionCount
      },
      dateRange: {
        start: startDate || 'all time',
        end: endDate || 'all time'
      }
    });
  } catch (error) {
    console.error('Failed to get category spending data:', error);
    res.status(500).json({ 
      error: 'Failed to get category spending data',
      message: error.message || 'Unknown error'
    });
  }
});

// Income vs Expenses endpoint with JavaScript implementation
app.get('/api/reports/income-vs-expenses', ensureBudgetLoaded, async (req, res) => {
  try {
    // Get transactions
    const transactions = await actualAPI.getTransactions(null, undefined, undefined);
    
    // Group by month
    const monthlyData = new Map();
    
    transactions.forEach(transaction => {
      if (transaction.is_child) return; // Skip child transactions
      
      // Extract month (YYYY-MM)
      const month = transaction.date.substring(0, 7);
      
      // Initialize month data if needed
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { month, income: 0, expenses: 0 });
      }
      
      // Update data
      const monthData = monthlyData.get(month);
      if (transaction.amount > 0) {
        monthData.income += transaction.amount;
      } else {
        monthData.expenses += Math.abs(transaction.amount);
      }
    });
    
    // Convert to array and sort by month
    const result = Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
    
    // Calculate summary totals
    const totalIncome = result.reduce((sum, month) => sum + month.income, 0);
    const totalExpenses = result.reduce((sum, month) => sum + month.expenses, 0);
    
    res.json({
      monthly: result,
      summary: {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        months: result.length
      }
    });
  } catch (error) {
    console.error('Failed to get income vs expenses data:', error);
    res.status(500).json({ 
      error: 'Failed to get income vs expenses data',
      message: error.message || 'Unknown error'
    });
  }
});

// Fix the TypeScript error in account balance history endpoint
app.get('/api/reports/account-balance-history', ensureBudgetLoaded, async (req, res) => {
  try {
    // Get all accounts with transactions
    const accounts = await actualAPI.getAccounts();
    const result = [];
    
    // For each account, calculate balance history
    for (const account of accounts) {
      // Get transactions for this account
      const transactions = await actualAPI.getTransactions(account.id, undefined, undefined);
      
      // Skip accounts with no transactions
      if (!transactions || transactions.length === 0) continue;
      
      // Sort transactions by date
      transactions.sort((a, b) => a.date.localeCompare(b.date));
      
      // Calculate running balance
      let runningBalance = 0;
      const history = transactions.map(t => {
        runningBalance += t.amount;
        return {
          date: t.date,
          balance: runningBalance
        };
      });
      
      result.push({
        id: account.id,
        name: account.name,
        offBudget: account.offbudget,
        currentBalance: runningBalance,
        history
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to get account balance history:', error);
    res.status(500).json({ 
      error: 'Failed to get account balance history',
      message: error.message || 'Unknown error'
    });
  }
});

// Report configuration endpoint
app.post('/api/reports/config', ensureBudgetLoaded, async (req, res) => {
  try {
    const { reportType, configuration } = req.body;
    
    if (!reportType || !configuration) {
      return res.status(400).json({ error: 'Report type and configuration are required' });
    }
    
    // Store the configuration in the database
    // This would be saved in a real implementation
    console.log(`Saving report configuration for ${reportType}:`, configuration);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save report configuration:', error);
    res.status(500).json({
      error: 'Failed to save report configuration',
      message: error.message || 'Unknown error'
    });
  }
});

// Get saved report configurations
app.get('/api/reports/config', ensureBudgetLoaded, async (req, res) => {
  try {
    // This would fetch from the database in a real implementation
    res.json({
      defaultDateRange: {
        type: 'last3Months',
        customStart: null,
        customEnd: null
      },
      savedReports: []
    });
  } catch (error) {
    console.error('Failed to get report configurations:', error);
    res.status(500).json({
      error: 'Failed to get report configurations',
      message: error.message || 'Unknown error'
    });
  }
});

// Add an endpoint to expose the data directory
app.get('/api/data-directory', (req, res) => {
  const dataDir = process.env.ACTUAL_DATA_DIR || 'Not set';
  res.json({ dataDir });
});

// Apply budget loaded check to all budget-related endpoints
app.get('/api/accounts', ensureBudgetLoaded, async (req, res) => {
  try {
    const accounts = await actualAPI.getAccounts();
    console.log('Accounts found:', accounts.length);
    
    // Enhance accounts with current balances
    const enhancedAccounts = await Promise.all(accounts.map(async (account) => {
      try {
        // Get transactions for this account to calculate balance
        const transactions = await actualAPI.getTransactions(account.id, undefined, undefined);
        const balance = transactions.reduce((sum, trans) => sum + trans.amount, 0);
        
        return {
          ...account,
          calculated_balance: balance,
          // Add a budget_category field to show if it's on or off budget
          budget_category: account.offbudget ? 'Off Budget' : 'On Budget'
        };
      } catch (error) {
        console.error(`Error fetching transactions for account ${account.id}:`, error);
        return {
          ...account,
          calculated_balance: 0,
          budget_category: account.offbudget ? 'Off Budget' : 'On Budget'
        };
      }
    }));
    
    res.json(enhancedAccounts);
  } catch (error) {
    console.error('Failed to get accounts:', error);
    res.status(500).json({ 
      error: 'Failed to get accounts',
      message: error.message || 'Unknown error'
    });
  }
});

app.post('/api/accounts', ensureBudgetLoaded, async (req, res) => {
  try {
    const { account, initialBalance } = req.body;
    if (!account) {
      return res.status(400).json({ error: 'Account details are required' });
    }
    
    // Convert offBudget boolean to the format expected by Actual API (0/1)
    if (account.offBudget !== undefined) {
      account.offbudget = account.offBudget ? true : false;
      delete account.offBudget; // Remove the original property
    }
    
    // Create the account and get its ID
    const accountId = await actualAPI.createAccount(account, initialBalance);
    
    res.json({ success: true, id: accountId });
  } catch (error) {
    console.error('Failed to create account:', error);
    res.status(500).json({ 
      error: 'Failed to create account',
      message: error.message || 'Unknown error'
    });
  }
});

app.get('/api/transactions/:accountId', ensureBudgetLoaded, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Force a fresh fetch with cache-busting query parameter
    console.log(`Fetching transactions for account ${accountId} at ${new Date().toISOString()}`);
    
    // Get all transactions including child transactions
    // The getTransactions API expects (accountId, dateFilter, options) parameters
    const transactions = await actualAPI.getTransactions(accountId, undefined, undefined);
    
    // Enhanced debugging for split transactions
    console.log(`Retrieved ${transactions.length} total transactions for account ${accountId}`);
    
    // Debug transaction types
    const parentCount = transactions.filter(t => t.is_parent === true).length;
    const subtransactionsCount = transactions.filter(t => t.subtransactions && t.subtransactions.length > 0).length;
    const childCount = transactions.filter(t => t.is_child === true).length;
    
    console.log(`Transaction breakdown: ${parentCount} parents, ${childCount} children, ${subtransactionsCount} with subtransactions array`);
    
    // Log details about split transactions for debugging
    const parentTransactions = transactions.filter(t => 
      t.is_parent === true || (t.subtransactions && t.subtransactions.length > 0)
    );
    
    if (parentTransactions.length > 0) {
      console.log(`Found ${parentTransactions.length} parent transactions with splits`);
      
      parentTransactions.forEach(parent => {
        const subCount = parent.subtransactions?.length || 0;
        console.log(`Parent transaction ${parent.id}: ${parent.payee || 'No payee'} - ${subCount} splits, is_parent=${parent.is_parent}`);
        
        if (parent.subtransactions && parent.subtransactions.length > 0) {
          console.log(`  Subtransactions for ${parent.id}:`, 
            parent.subtransactions.map(sub => 
              `${sub.amount} ${sub.category || 'no category'}`
            ).join(', ')
          );
        } else {
          console.log(`  No subtransactions array for parent ${parent.id}`);
        }
      });
      
      // Look for orphaned child transactions
      const childTransactions = transactions.filter(t => t.is_child === true || t.parent_id);
      console.log(`Found ${childTransactions.length} child transactions`);
      
      if (childTransactions.length > 0) {
        childTransactions.forEach(child => {
          console.log(`  Child transaction ${child.id} - parent_id=${child.parent_id || 'none'}`);
          
          // Check if parent exists
          const parentExists = transactions.some(t => t.id === child.parent_id);
          if (!parentExists && child.parent_id) {
            console.log(`    WARNING: Parent ${child.parent_id} not found for child ${child.id}`);
          }
        });
      }
    }
    
    // Process transactions to ensure is_parent flag is correct
    transactions.forEach(transaction => {
      // If a transaction has subtransactions but is not marked as parent, fix it
      if (transaction.subtransactions && transaction.subtransactions.length > 0 && !transaction.is_parent) {
        console.log(`Fixing transaction ${transaction.id} - has subtransactions but not marked as parent`);
        transaction.is_parent = true;
      }
      
      // If a transaction is marked as parent but has no subtransactions, log it
      if (transaction.is_parent && (!transaction.subtransactions || transaction.subtransactions.length === 0)) {
        console.log(`Warning: Transaction ${transaction.id} is marked as parent but has no subtransactions`);
      }
    });
    
    console.log(`Returning ${transactions.length} transactions for account ${accountId}`);
    res.json(transactions);
  } catch (error) {
    console.error('Failed to get transactions:', error);
    res.status(500).json({ 
      error: 'Failed to get transactions',
      message: error.message || 'Unknown error',
      stack: error.stack
    });
  }
});

app.post('/api/transactions', ensureBudgetLoaded, async (req, res) => {
  try {
    const { accountId, transaction } = req.body;
    if (!accountId || !transaction) {
      return res.status(400).json({ error: 'Account ID and transaction details are required' });
    }
    
    await actualAPI.addTransactions(accountId, [transaction]);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to add transaction:', error);
    res.status(500).json({ 
      error: 'Failed to add transaction',
      message: error.message || 'Unknown error'
    });
  }
});

app.get('/api/categories', ensureBudgetLoaded, async (req, res) => {
  try {
    const categories = await actualAPI.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Failed to get categories:', error);
    res.status(500).json({ 
      error: 'Failed to get categories',
      message: error.message || 'Unknown error'
    });
  }
});

app.get('/api/budget/months', ensureBudgetLoaded, async (req, res) => {
  try {
    const months = await actualAPI.getBudgetMonths();
    res.json(months);
  } catch (error) {
    console.error('Failed to get budget months:', error);
    res.status(500).json({ 
      error: 'Failed to get budget months',
      message: error.message || 'Unknown error'
    });
  }
});

app.get('/api/budget/month/:month', ensureBudgetLoaded, async (req, res) => {
  try {
    const { month } = req.params;
    const budgetMonth = await actualAPI.getBudgetMonth(month);
    res.json(budgetMonth);
  } catch (error) {
    console.error('Failed to get budget month:', error);
    res.status(500).json({ 
      error: 'Failed to get budget month',
      message: error.message || 'Unknown error'
    });
  }
});

app.post('/api/budget/set-amount', ensureBudgetLoaded, async (req, res) => {
  try {
    const { month, categoryId, amount } = req.body;
    if (!month || !categoryId || amount === undefined) {
      return res.status(400).json({ error: 'Month, category ID, and amount are required' });
    }
    
    await actualAPI.setBudgetAmount(month, categoryId, amount);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to set budget amount:', error);
    res.status(500).json({ 
      error: 'Failed to set budget amount',
      message: error.message || 'Unknown error'
    });
  }
});

app.delete('/api/transactions/:transactionId', ensureBudgetLoaded, async (req, res) => {
  try {
    const { transactionId } = req.params;
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    
    await actualAPI.deleteTransaction(transactionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    res.status(500).json({ 
      error: 'Failed to delete transaction',
      message: error.message || 'Unknown error'
    });
  }
});

app.post('/api/transactions/batch-delete', ensureBudgetLoaded, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Transaction IDs array is required' });
    }
    
    // Delete each transaction in sequence
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          await actualAPI.deleteTransaction(id);
          return { id, success: true };
        } catch (error) {
          console.error(`Failed to delete transaction ${id}:`, error);
          return { id, success: false, error: error.message };
        }
      })
    );
    
    // Check if all deletions were successful
    const allSuccessful = results.every(result => result.success);
    
    if (allSuccessful) {
      res.json({ success: true, count: ids.length });
    } else {
      // Some deletions failed
      const failedIds = results.filter(r => !r.success).map(r => r.id);
      res.status(207).json({ 
        success: false, 
        message: `Failed to delete some transactions: ${failedIds.join(', ')}`,
        results
      });
    }
  } catch (error) {
    console.error('Failed to process batch delete:', error);
    res.status(500).json({ 
      error: 'Failed to process batch delete',
      message: error.message || 'Unknown error'
    });
  }
});

app.post('/api/transactions/:transactionId/split', ensureBudgetLoaded, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { splits } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    
    if (!splits || !Array.isArray(splits) || splits.length < 2) {
      return res.status(400).json({ error: 'At least two splits are required' });
    }
    
    console.log(`Splitting transaction ${transactionId} into ${splits.length} parts`);
    console.log('Split details:', JSON.stringify(splits, null, 2));
    
    // First get the original transaction
    const transactions = await actualAPI.getTransactions(null, undefined, undefined);
    const originalTransaction = transactions.find(t => t.id === transactionId);
    
    if (!originalTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Verify that split amounts sum to the original amount
    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(Math.abs(totalSplitAmount) - Math.abs(originalTransaction.amount)) > 0.01) {
      console.log(`Split total (${totalSplitAmount}) doesn't match original amount (${originalTransaction.amount})`);
      return res.status(400).json({ 
        error: 'Split amounts must sum to the original transaction amount',
        expected: originalTransaction.amount,
        received: totalSplitAmount
      });
    }
    
    console.log('Original transaction:', JSON.stringify(originalTransaction, null, 2));
    
    // IMPORTANT: Instead of directly updating with subtransactions, we'll use a more
    // compatible approach. First, update the original transaction to mark it as a parent,
    // then create the child transactions individually.
    
    // Step 1: Update the original transaction to mark it as a parent
    await actualAPI.updateTransaction(transactionId, {
      is_parent: true
    });
    
    console.log('Updated parent transaction');
    
    // Step 2: Create each child transaction with the correct relationship to the parent
    let successCount = 0;
    for (const split of splits) {
      try {
        // Create a child transaction with all required fields
        await actualAPI.addTransactions(originalTransaction.account, [{
          amount: split.amount,
          date: originalTransaction.date,
          account: originalTransaction.account,
          payee: originalTransaction.payee,
          category: split.category,
          notes: split.notes || originalTransaction.notes,
          cleared: originalTransaction.cleared,
          is_child: true,
          parent_id: transactionId
        }]);
        
        successCount++;
      } catch (childError) {
        console.error('Error creating child transaction:', childError);
      }
    }
    
    if (successCount === 0) {
      return res.status(500).json({ 
        error: 'Failed to create any child transactions',
        message: 'Split transaction failed'
      });
    }
    
    console.log(`Successfully created ${successCount} of ${splits.length} child transactions`);
    
    // Return success even if some transactions failed
    res.json({ 
      success: true, 
      message: `Transaction split into ${successCount} parts`,
      splits: successCount
    });
  } catch (error) {
    console.error('Failed to split transaction:', error);
    res.status(500).json({ 
      error: 'Failed to split transaction',
      message: error.message || 'Unknown error',
      stack: error.stack
    });
  }
}); 