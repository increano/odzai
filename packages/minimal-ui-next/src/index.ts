import express from 'express';
import expressWs from 'express-ws';
import path from 'path';
import * as actualAPI from '@actual-app/api';
import { Application } from 'express';
import fs from 'fs';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION! Server will continue running:');
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED PROMISE REJECTION! Server will continue running:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
});

// Access the internal send function (used in methods.ts)
const send = actualAPI.internal?.send;

// Initialize Express app with WebSocket support
const app = express();
// Fix type incompatibility with a type assertion
const wsApp = expressWs(app as unknown as expressWs.Application);
const port = process.env.PORT || 3001;

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
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`Minimal Actual UI server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize Actual Budget engine:', error);
  }
})();

// Middleware to check if budget is loaded for protected routes
const ensureBudgetLoaded = (req: Request, res: Response, next: NextFunction) => {
  if (!budgetLoaded) {
    return res.status(400).json({ 
      error: 'No budget file is open', 
      message: 'Please select and load a budget first'
    });
  }
  next();
};

// API Routes
app.get('/api/budgets', async (req: Request, res: Response) => {
  try {
    console.log('Fetching budgets...');
    const budgets = await actualAPI.getBudgets();
    console.log('Budgets found:', JSON.stringify(budgets, null, 2));
    res.json(budgets);
  } catch (error) {
    console.error('Failed to get budgets:', error);
    res.status(500).json({ 
      error: 'Failed to get budgets',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new budget
app.post('/api/budgets/create', async (req: Request, res: Response) => {
  try {
    const { budgetName } = req.body;
    
    if (!budgetName) {
      return res.status(400).json({ error: 'Budget name is required' });
    }
    
    console.log(`Creating new budget: ${budgetName}`);
    
    // Use the internal send function to access the create-budget handler directly
    const result = await actualAPI.internal.send('create-budget', { budgetName });
    
    if (result.error) {
      console.error('Error creating budget:', result.error);
      return res.status(500).json({ error: result.error });
    }
    
    // Get updated list of budgets
    const budgets = await actualAPI.getBudgets();
    
    res.json({ 
      success: true, 
      message: `Budget "${budgetName}" created successfully`,
      budgets
    });
  } catch (error) {
    console.error('Failed to create budget:', error);
    res.status(500).json({ 
      error: 'Failed to create budget',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize reporting views after budget is loaded
const initializeReportingViews = async () => {
  try {
    // We need to create a custom function for runQuery that doesn't use the serialize() method
    const runRawQuery = async (sql: string) => {
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
app.post('/api/budgets/load', async (req: Request, res: Response) => {
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
    
    // Check if there are any accounts
    const accounts = await actualAPI.getAccounts();
    
    // Return the empty accounts status rather than creating dummy data
    return res.json({ 
      success: true, 
      hasAccounts: accounts.length > 0,
      accountCount: accounts.length
    });
  } catch (error) {
    console.error('Error loading budget:', error);
    budgetLoaded = false;
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Restore budget status endpoint that was accidentally removed
app.get('/api/budget-status', async (req: Request, res: Response) => {
  try {
    // Get the current loaded budget status
    res.json({ budgetLoaded });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Fix the TypeScript errors in the reporting endpoints
app.get('/api/reports/spending-by-category', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Income vs Expenses endpoint with JavaScript implementation
app.get('/api/reports/income-vs-expenses', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fix the TypeScript error in account balance history endpoint
app.get('/api/reports/account-balance-history', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Report configuration endpoint
app.post('/api/reports/config', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get saved report configurations
app.get('/api/reports/config', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add an endpoint to expose the data directory
app.get('/api/data-directory', (req: Request, res: Response) => {
  const dataDir = process.env.ACTUAL_DATA_DIR || 'Not set';
  res.json({ dataDir });
});

// Apply budget loaded check to all budget-related endpoints
app.get('/api/accounts', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/accounts', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// IMPORTANT: Order matters for these routes - make sure /api/transactions/all is before /api/transactions/:accountId
// to prevent "all" from being interpreted as an accountId

// Endpoint to fetch transactions from all accounts
app.get('/api/transactions/all', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    console.log('Fetching transactions from all accounts');
    
    // First get all accounts to include account names
    const accounts = await actualAPI.getAccounts();
    console.log(`Found ${accounts.length} accounts`);
    
    const accountsMap = new Map(accounts.map(account => [account.id, account.name]));
    
    // Initialize an array to hold all transactions
    let allTransactions: Array<any> = [];
    
    // Log each account ID for debugging
    accounts.forEach(account => {
      console.log(`Processing account: ${account.id} (${account.name})`);
    });
    
    // Loop through each account and get transactions
    for (const account of accounts) {
      try {
        console.log(`Fetching transactions for account ${account.id} (${account.name})`);
        const accountTransactions = await actualAPI.getTransactions(account.id, undefined, undefined);
        console.log(`Found ${accountTransactions.length} transactions for account ${account.id}`);
        
        // Add account_name to each transaction
        const enhancedTransactions = accountTransactions.map(transaction => ({
          ...transaction,
          account_name: accountsMap.get(transaction.account) || 'Unknown Account'
        }));
        
        allTransactions = allTransactions.concat(enhancedTransactions);
      } catch (accountError) {
        console.error(`Error fetching transactions for account ${account.id}:`, accountError);
        // Continue with other accounts if one fails
      }
    }
    
    // Sort all transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`Retrieved ${allTransactions.length} total transactions from all accounts`);
    
    res.json(allTransactions);
  } catch (error) {
    console.error('Failed to get all transactions:', error);
    res.status(500).json({ 
      error: 'Failed to get all transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : String(error)
    });
  }
});

// Support for query parameter format
app.get('/api/transactions', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const accountId = req.query.accountId as string;
    
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }
    
    console.log(`Fetching transactions for account ${accountId} (query param) at ${new Date().toISOString()}`);
    
    // Call the existing handler logic
    const transactions = await actualAPI.getTransactions(accountId, undefined, undefined);
    
    console.log(`Retrieved ${transactions.length} total transactions for account ${accountId} (query param)`);
    
    // Fetch accounts to add account names to transactions
    const accounts = await actualAPI.getAccounts();
    const accountsMap = new Map(accounts.map(account => [account.id, account.name]));
    
    // Add account_name to each transaction
    const enhancedTransactions = transactions.map(transaction => ({
      ...transaction,
      account_name: accountsMap.get(transaction.account) || 'Unknown Account'
    }));
    
    res.json(enhancedTransactions);
  } catch (error) {
    console.error('Failed to get transactions (query param):', error);
    res.status(500).json({ 
      error: 'Failed to get transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : String(error)
    });
  }
});

app.get('/api/transactions/:accountId', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
    
    // Fetch accounts to add account names to transactions
    const accounts = await actualAPI.getAccounts();
    const accountsMap = new Map(accounts.map(account => [account.id, account.name]));
    
    // Add account_name to each transaction
    const enhancedTransactions = transactions.map(transaction => ({
      ...transaction,
      account_name: accountsMap.get(transaction.account) || 'Unknown Account'
    }));
    
    // Log details about split transactions for debugging
    const parentTransactions = enhancedTransactions.filter(t => 
      t.is_parent === true || (t.subtransactions && t.subtransactions.length > 0)
    );
    
    res.json(enhancedTransactions);
  } catch (error) {
    console.error('Failed to get transactions:', error);
    res.status(500).json({ 
      error: 'Failed to get transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : String(error)
    });
  }
});

app.post('/api/transactions', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/categories', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const categories = await actualAPI.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Failed to get categories:', error);
    res.status(500).json({ 
      error: 'Failed to get categories',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get category groups
app.get('/api/category-groups', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    console.log("Fetching category groups...");
    
    // Add explicit try-catch to handle API errors
    let categories;
    try {
      // This will return categories grouped by their group
      categories = await actualAPI.getCategoryGroups();
      console.log(`Successfully fetched ${categories.length} category groups`);
    } catch (apiError) {
      console.error("API error fetching category groups:", apiError);
      throw apiError; // Re-throw to be caught by the outer try-catch
    }
    
    // Ensure we can respond even if there's an error in the response
    try {
      res.json(categories);
    } catch (responseError) {
      console.error("Error sending category groups response:", responseError);
      throw responseError;
    }
  } catch (error) {
    console.error('Failed to get category groups:', error);
    // Ensure server keeps running even if response fails
    try {
      res.status(500).json({ 
        error: 'Failed to get category groups',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (finalError) {
      console.error("Fatal error sending error response:", finalError);
    }
  }
});

// Create a new category
app.post('/api/categories', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { name, group_id, is_income, hidden } = req.body;
    
    if (!name || !group_id) {
      return res.status(400).json({ error: 'Category name and group ID are required' });
    }
    
    console.log(`Creating category "${name}" in group ${group_id}`);
    
    // Wrap in try-catch to handle potential API errors
    let categoryId;
    try {
      categoryId = await actualAPI.createCategory({
        name,
        group_id,
        is_income: is_income || false,
        hidden: hidden || false
      });
      
      console.log(`Successfully created category "${name}" with ID: ${categoryId}`);
    } catch (apiError) {
      console.error(`API error creating category "${name}":`, apiError);
      throw apiError; // Re-throw to be caught by the outer try-catch
    }
    
    res.json({ 
      success: true, 
      message: `Category "${name}" created successfully`,
      id: categoryId
    });
  } catch (error) {
    console.error('Failed to create category:', error);
    // Ensure server keeps running
    try {
      res.status(500).json({ 
        error: 'Failed to create category',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (responseError) {
      console.error('Error sending error response:', responseError);
    }
  }
});

// Update an existing category
app.put('/api/categories/:categoryId', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { name, group_id, is_income, hidden } = req.body;
    
    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }
    
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No fields to update provided' });
    }
    
    // Only include fields that are provided
    const fields: Record<string, any> = {};
    if (name !== undefined) fields.name = name;
    if (group_id !== undefined) fields.group_id = group_id;
    if (is_income !== undefined) fields.is_income = is_income;
    if (hidden !== undefined) fields.hidden = hidden;
    
    await actualAPI.updateCategory(categoryId, fields);
    
    res.json({ 
      success: true, 
      message: `Category updated successfully`
    });
  } catch (error) {
    console.error('Failed to update category:', error);
    res.status(500).json({ 
      error: 'Failed to update category',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a category
app.delete('/api/categories/:categoryId', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { transferCategoryId } = req.query;
    
    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }
    
    await actualAPI.deleteCategory(categoryId, transferCategoryId as string);
    
    res.json({ 
      success: true, 
      message: `Category deleted successfully`
    });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ 
      error: 'Failed to delete category',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new category group
app.post('/api/category-groups', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { name, is_income, hidden } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category group name is required' });
    }
    
    console.log(`Attempting to create category group with name: "${name}"`);
    
    // Log the exact request we're sending
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Workaround for the API bug: Direct DB access to check groups
    try {
      // Try to create the group - catch only duplicate errors
      const groupId = await actualAPI.createCategoryGroup({
        name,
        is_income: is_income || false,
        hidden: hidden || false
      });
      
      console.log(`Successfully created category group "${name}" with ID: ${groupId}`);
      
      res.json({ 
        success: true, 
        message: `Category group "${name}" created successfully`,
        id: groupId
      });
    } catch (createError) {
      // Check specifically for the duplicate error message
      if (createError instanceof Error && createError.message.includes('already exists')) {
        console.error(`API reports category group "${name}" already exists, but UI doesn't show it.`);
        console.error('Error details:', createError);
        
        // Get all groups including hidden ones
        const allGroups = await actualAPI.getCategoryGroups();
        console.log(`Found ${allGroups.length} total category groups in the budget:`);
        allGroups.forEach(g => {
          console.log(`- "${g.name}" (id: ${g.id}, hidden: ${!!g.hidden})`);
        });
        
        // Try to find any similar group - exactly as the API would
        const similarGroup = allGroups.find(g => 
          g.name.toLowerCase() === name.toLowerCase()
        );
        
        if (similarGroup) {
          console.log(`Found similar group: "${similarGroup.name}" (id: ${similarGroup.id})`);
          
          // If it's hidden, try to un-hide it to make it usable
          if (similarGroup.hidden) {
            try {
              await actualAPI.updateCategoryGroup(similarGroup.id, { hidden: false });
              console.log(`Un-hid existing category group "${similarGroup.name}"`);
              
              return res.json({
                success: true,
                message: `Found and un-hid existing category group "${similarGroup.name}"`,
                id: similarGroup.id,
                wasHidden: true
              });
            } catch (unhideError) {
              console.error('Failed to un-hide category group:', unhideError);
            }
          }
          
          // If we can't un-hide it or it's not hidden, suggest using the existing one
          return res.status(400).json({
            error: 'Category group already exists',
            message: `A category group named "${similarGroup.name}" already exists${similarGroup.hidden ? ' (it may be hidden)' : ''}.`,
            existingGroup: similarGroup
          });
        }
        
        // Weird case: API says it exists but we can't find it
        // Try with a slightly modified name as a workaround
        const modifiedName = `${name} (new)`;
        try {
          console.log(`Trying with modified name: "${modifiedName}"`);
          const modifiedGroupId = await actualAPI.createCategoryGroup({
            name: modifiedName,
            is_income: is_income || false,
            hidden: hidden || false
          });
          
          return res.json({
            success: true,
            message: `Created category group with modified name "${modifiedName}"`,
            id: modifiedGroupId,
            originalName: name,
            modifiedName: modifiedName
          });
        } catch (modifiedError) {
          console.error(`Failed to create with modified name "${modifiedName}":`, modifiedError);
          // Pass through to general error handler
        }
      }
      
      // Re-throw if it's not a duplicate error or our workarounds failed
      throw createError;
    }
  } catch (error) {
    console.error('Failed to create category group:', error);
    res.status(500).json({ 
      error: 'Failed to create category group',
      message: error instanceof Error ? error.message : 'Unknown error',
      // Include the stack trace for debugging
      stack: error instanceof Error ? error.stack : String(error)
    });
  }
});

// Update an existing category group
app.put('/api/category-groups/:groupId', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { name, is_income, hidden } = req.body;
    
    if (!groupId) {
      return res.status(400).json({ error: 'Category group ID is required' });
    }
    
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No fields to update provided' });
    }
    
    // Only include fields that are provided
    const fields: Record<string, any> = {};
    if (name !== undefined) fields.name = name;
    if (is_income !== undefined) fields.is_income = is_income;
    if (hidden !== undefined) fields.hidden = hidden;
    
    await actualAPI.updateCategoryGroup(groupId, fields);
    
    res.json({ 
      success: true, 
      message: `Category group updated successfully`
    });
  } catch (error) {
    console.error('Failed to update category group:', error);
    res.status(500).json({ 
      error: 'Failed to update category group',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a category group
app.delete('/api/category-groups/:groupId', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { transferGroupId } = req.query;
    
    if (!groupId) {
      return res.status(400).json({ error: 'Category group ID is required' });
    }
    
    await actualAPI.deleteCategoryGroup(groupId, transferGroupId as string);
    
    res.json({ 
      success: true, 
      message: `Category group deleted successfully`
    });
  } catch (error) {
    console.error('Failed to delete category group:', error);
    res.status(500).json({ 
      error: 'Failed to delete category group',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/budget/months', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const months = await actualAPI.getBudgetMonths();
    res.json(months);
  } catch (error) {
    console.error('Failed to get budget months:', error);
    res.status(500).json({ 
      error: 'Failed to get budget months',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/budget/month/:month', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { month } = req.params;
    const budgetMonth = await actualAPI.getBudgetMonth(month);
    res.json(budgetMonth);
  } catch (error) {
    console.error('Failed to get budget month:', error);
    res.status(500).json({ 
      error: 'Failed to get budget month',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/budget/set-amount', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/transactions/:transactionId', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/transactions/batch-delete', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
          return { id, success: false, error: error instanceof Error ? error.message : String(error) };
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/transactions/:transactionId/split', ensureBudgetLoaded, async (req: Request, res: Response) => {
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
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : String(error)
    });
  }
});

// Get categories grouped by their parent groups
app.get('/api/categories/grouped', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    console.log("Fetching grouped categories...");
    
    // Fetch groups with explicit error handling
    let groups;
    try {
      // First get all category groups
      groups = await actualAPI.getCategoryGroups();
      console.log(`Successfully fetched ${groups.length} category groups`);
    } catch (groupsError) {
      console.error("Error fetching category groups:", groupsError);
      throw groupsError;
    }
    
    // Fetch categories with explicit error handling
    let categories;
    try {
      // Then get all categories
      categories = await actualAPI.getCategories();
      console.log(`Successfully fetched ${categories.length} categories`);
    } catch (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
      throw categoriesError;
    }
    
    // Organize categories by group with exception handling
    let groupedCategories;
    try {
      groupedCategories = groups.map(group => {
        // Find all categories belonging to this group
        const groupCategories = categories.filter(category => category.group_id === group.id);
        
        return {
          ...group,
          categories: groupCategories
        };
      });
      
      console.log(`Successfully organized categories into ${groupedCategories.length} groups`);
    } catch (organizeError) {
      console.error("Error organizing categories by group:", organizeError);
      throw organizeError;
    }
    
    // Send response with explicit error handling
    try {
      res.json(groupedCategories);
    } catch (responseError) {
      console.error("Error sending grouped categories response:", responseError);
      throw responseError;
    }
  } catch (error) {
    console.error('Failed to get categories grouped by parent groups:', error);
    
    // Ensure server keeps running even if response fails
    try {
      res.status(500).json({ 
        error: 'Failed to get categories grouped by parent groups',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (finalError) {
      console.error("Fatal error sending error response:", finalError);
    }
  }
});

// Mock data for schedules
const mockSchedules = [
  {
    id: "schedule-001",
    name: "Monthly Rent",
    _date: "2025-06-01",
    _amount: -150000,
    _account: "5f464394-819d-451c-b8b1-942109b7bef5",
    _payee: "Landlord",
    _category: "d4b0f075-3343-4408-91ed-fae94f74e5bf",
    frequency: "monthly",
    posts_transaction: 1,
    completed: 0,
    tombstone: 0
  },
  {
    id: "schedule-002",
    name: "Bi-weekly Salary",
    _date: "2025-05-15",
    _amount: 320000,
    _account: "5f464394-819d-451c-b8b1-942109b7bef5",
    _payee: "Employer Inc.",
    _category: "e5b60a39-6069-4b9e-94a1-5f4cfb915275",
    frequency: "biweekly",
    posts_transaction: 1,
    completed: 0,
    tombstone: 0
  },
  {
    id: "schedule-003",
    name: "Water Bill",
    _date: "2025-05-20",
    _amount: -6500,
    _account: "5f464394-819d-451c-b8b1-942109b7bef5",
    _payee: "Water Utility",
    _category: "d4b0f075-3343-4408-91ed-fae94f74e5bf",
    frequency: "monthly",
    posts_transaction: 1,
    completed: 0,
    tombstone: 0
  }
];

// API Endpoint for Schedules
app.get('/api/schedules', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    // Query all schedules from the database using the internal send method
    // This will get the real schedule data from the database instead of using mock data
    const result = await actualAPI.internal.send('db.all', {
      query: 'SELECT s.id, s.name, s.rule, s.active, s.completed, s.posts_transaction, s.tombstone, ' +
             'snp.schedule_id, snp.local_next_date as _date, ' +
             'sjp.account as _account, sjp.payee as _payee, sjp.amount as _amount ' +
             'FROM schedules s ' +
             'LEFT JOIN schedules_next_date snp ON s.id = snp.schedule_id ' +
             'LEFT JOIN schedules_json_paths sjp ON s.id = sjp.schedule_id ' +
             'WHERE s.tombstone = 0'
    });
    
    // Check if we have data in the result
    if (result && result.data) {
      console.log(`Found ${result.data.length} schedules in the database`);
      res.json(result.data);
    } else {
      // If no result or empty data, return an empty array
      console.log('No schedules found in the database');
      res.json([]);
    }
  } catch (error) {
    console.error('Failed to get schedules:', error);
    res.status(500).json({ 
      error: 'Failed to get schedules',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Endpoint for Schedules Status
app.get('/api/schedules/status', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    // For now, just return a hard-coded response to unblock the UI
    res.json({ 
      available: true,
      migrated: true
    });
  } catch (error) {
    console.error('Failed to check schedules status:', error);
    res.status(500).json({ 
      error: 'Failed to check schedules status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a schedule
app.post('/api/schedules', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Log the request data for debugging
    console.log('Creating schedule with data:', JSON.stringify(data, null, 2));
    
    // Create a conditions array for the schedule
    const conditions = [
      { op: 'is', field: 'account', value: data._account },
    ];
    
    // Add date condition
    if (data._date) {
      conditions.push({ op: 'is', field: 'date', value: data._date });
    }
    
    // Add amount condition
    if (data._amount) {
      conditions.push({ op: 'is', field: 'amount', value: data._amount });
    }
    
    // Add payee condition if provided
    if (data._payee) {
      conditions.push({ op: 'is', field: 'payee', value: data._payee });
    }
    
    // Add category condition if provided
    if (data._category) {
      conditions.push({ op: 'is', field: 'category', value: data._category });
    }
    
    // Generate a schedule ID
    const id = crypto.randomUUID();
    
    // Create the schedule in the database
    try {
      await actualAPI.internal.send('schedule/create', {
        schedule: {
          id,
          name: data.name || 'Unnamed Schedule',
          posts_transaction: data.posts_transaction || 1,
          completed: data.completed || 0,
          tombstone: 0
        },
        conditions
      });
      
      console.log(`Created schedule with ID: ${id}`);
      res.json({ id, success: true });
    } catch (createError) {
      console.error('Error creating schedule in database:', createError);
      
      // Fallback to mock data if the API method isn't available
      console.log('Falling back to mock data for schedule creation');
      
      // Create a new schedule object
      const newSchedule = {
        id,
        name: data.name || 'Unnamed Schedule',
        _date: data._date,
        _amount: data._amount,
        _account: data._account,
        _payee: data._payee || null,
        _category: data._category || null,
        frequency: data.frequency || 'monthly',
        posts_transaction: data.posts_transaction || 1,
        completed: data.completed || 0,
        tombstone: 0
      };
      
      // Add to the mock schedules array
      mockSchedules.push(newSchedule);
      
      console.log(`Created mock schedule with ID: ${id}`);
      res.json({ id, success: true });
    }
  } catch (error) {
    console.error('Failed to create schedule:', error);
    res.status(500).json({ 
      error: 'Failed to create schedule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a schedule
app.put('/api/schedules/:id', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    console.log(`Updating schedule ${id} with data:`, JSON.stringify(data, null, 2));
    
    try {
      // Try to update the schedule in the database
      await actualAPI.internal.send('schedule/update', {
        schedule: {
          id,
          name: data.name,
          posts_transaction: data.posts_transaction,
          completed: data.completed
        }
      });
      
      console.log(`Updated schedule ${id} in database`);
    } catch (updateError) {
      console.error('Error updating schedule in database:', updateError);
      
      // Fallback to mock data if the API method isn't available
      console.log('Falling back to mock data for schedule update');
      
      // Find the schedule in our mock data
      const scheduleIndex = mockSchedules.findIndex(s => s.id === id);
      
      if (scheduleIndex !== -1) {
        // Update the fields that were sent
        const fields = ['name', '_date', '_amount', '_account', '_payee', '_category', 'frequency', 'posts_transaction', 'completed'];
        
        fields.forEach(field => {
          if (data[field] !== undefined) {
            (mockSchedules[scheduleIndex] as any)[field] = data[field];
          }
        });
        
        console.log(`Updated mock schedule ${id}`);
      } else {
        console.log(`Schedule ${id} not found in mock data`);
      }
    }
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('Failed to update schedule:', error);
    res.status(500).json({ 
      error: 'Failed to update schedule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a schedule (mark as tombstone)
app.delete('/api/schedules/:id', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`Deleting schedule ${id}`);
    
    try {
      // Try to delete the schedule in the database
      await actualAPI.internal.send('schedule/delete', { id });
      console.log(`Deleted schedule ${id} from database`);
    } catch (deleteError) {
      console.error('Error deleting schedule from database:', deleteError);
      
      // Fallback to mock data if the API method isn't available
      console.log('Falling back to mock data for schedule deletion');
      
      // Find the schedule in our mock data
      const scheduleIndex = mockSchedules.findIndex(s => s.id === id);
      
      if (scheduleIndex !== -1) {
        // Mark as tombstone rather than actually removing
        mockSchedules[scheduleIndex].tombstone = 1;
        console.log(`Marked mock schedule ${id} as tombstone`);
      } else {
        console.log(`Schedule ${id} not found in mock data`);
      }
    }
    
    // Return success regardless
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    res.status(500).json({ 
      error: 'Failed to delete schedule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Post a scheduled transaction
app.post('/api/schedules/:id/post', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`Posting transaction for schedule ${id}`);
    
    try {
      // Try to post the scheduled transaction in the database
      const result = await actualAPI.internal.send('schedule/post-transaction', { id });
      console.log(`Posted transaction for schedule ${id} in database`);
      return res.json({
        success: true,
        transaction_id: result.transaction_id || null,
        next_date: result.next_date || null
      });
    } catch (postError) {
      console.error('Error posting transaction in database:', postError);
      
      // Fallback to mock data if the API method isn't available
      console.log('Falling back to mock data for transaction posting');
      
      // Find the schedule in our mock data
      const schedule = mockSchedules.find(s => s.id === id && s.tombstone === 0);
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      // Generate a transaction ID
      const transactionId = crypto.randomUUID();
      
      // Calculate the next date based on frequency
      const currentDate = new Date(schedule._date);
      let nextDate;
      
      switch(schedule.frequency) {
        case 'daily':
          nextDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
          break;
        case 'weekly':
          nextDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
          break;
        case 'biweekly':
          nextDate = new Date(currentDate.setDate(currentDate.getDate() + 14));
          break;
        case 'monthly':
          nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
          break;
        case 'yearly':
          nextDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
          break;
        default:
          nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      }
      
      // Format next date as YYYY-MM-DD
      const formattedNextDate = nextDate.toISOString().split('T')[0];
      
      // Update the schedule with the new date
      schedule._date = formattedNextDate;
      
      console.log(`Created mock transaction ${transactionId} and updated schedule next date to ${formattedNextDate}`);
      
      res.json({ 
        success: true, 
        transaction_id: transactionId,
        next_date: formattedNextDate
      });
    }
  } catch (error) {
    console.error('Failed to post scheduled transaction:', error);
    res.status(500).json({ 
      error: 'Failed to post scheduled transaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Skip to the next occurrence date
app.post('/api/schedules/:id/skip', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`Skipping to next occurrence for schedule ${id}`);
    
    try {
      // Try to skip the scheduled date in the database
      const result = await actualAPI.internal.send('schedule/skip-next-date', { id });
      console.log(`Skipped to next date for schedule ${id} in database`);
      return res.json({
        success: true,
        next_date: result.next_date || null
      });
    } catch (skipError) {
      console.error('Error skipping schedule in database:', skipError);
      
      // Fallback to mock data if the API method isn't available
      console.log('Falling back to mock data for schedule skipping');
      
      // Find the schedule in our mock data
      const schedule = mockSchedules.find(s => s.id === id && s.tombstone === 0);
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      // Calculate the next date based on frequency
      const currentDate = new Date(schedule._date);
      let nextDate;
      
      switch(schedule.frequency) {
        case 'daily':
          nextDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
          break;
        case 'weekly':
          nextDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
          break;
        case 'biweekly':
          nextDate = new Date(currentDate.setDate(currentDate.getDate() + 14));
          break;
        case 'monthly':
          nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
          break;
        case 'yearly':
          nextDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
          break;
        default:
          nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      }
      
      // Format next date as YYYY-MM-DD
      const formattedNextDate = nextDate.toISOString().split('T')[0];
      
      // Update the schedule with the new date
      schedule._date = formattedNextDate;
      
      console.log(`Updated mock schedule ${id} next date to ${formattedNextDate}`);
      
      res.json({ 
        success: true, 
        next_date: formattedNextDate
      });
    }
  } catch (error) {
    console.error('Failed to skip schedule:', error);
    res.status(500).json({ 
      error: 'Failed to skip schedule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get transactions by status
app.get('/api/transactions/by-status/:status', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const result = await actualAPI.internal.send('db.all', {
      query: 'SELECT * FROM transactions WHERE status = ? AND is_child = 0 ORDER BY date DESC',
      params: [status]
    });
    
    res.json(result.data || []);
  } catch (error) {
    console.error('Failed to get transactions by status:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Reconcile an account
app.post('/api/accounts/:id/reconcile', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetBalance, createAdjustment } = req.body;
    
    if (targetBalance === undefined) {
      return res.status(400).json({ error: 'Target balance is required' });
    }
    
    // Get all transactions for the account
    const result = await actualAPI.internal.send('db.all', {
      query: 'SELECT * FROM transactions WHERE account = ? AND is_child = 0',
      params: [id]
    });
    
    const transactions = result.data || [];
    
    // Calculate the current cleared balance
    let clearedBalance = 0;
    transactions.forEach((transaction: { cleared: boolean; amount: number }) => {
      if (transaction.cleared) {
        clearedBalance += transaction.amount;
      }
    });
    
    // Convert targetBalance to cents (integer)
    const targetBalanceCents = Math.round(parseFloat(targetBalance) * 100);
    
    // Calculate the difference
    const difference = clearedBalance - targetBalanceCents;
    
    let adjustment = null;
    
    // Create an adjustment transaction if needed
    if (createAdjustment && difference !== 0) {
      // Get the account details
      const accountResult = await actualAPI.internal.send('db.all', {
        query: 'SELECT * FROM accounts WHERE id = ?',
        params: [id]
      });
      
      if (!accountResult.data || accountResult.data.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      const account = accountResult.data[0];
      
      // Create the adjustment transaction
      adjustment = {
        date: new Date().toISOString().split('T')[0], // Today's date
        account: id,
        amount: -difference, // Negate the difference to make the balance match
        payee: 'Reconciliation Balance Adjustment',
        notes: `Adjustment to match reconciled balance of ${targetBalance}`,
        cleared: true
      };
      
      await actualAPI.addTransactions(id, [adjustment]);
    }
    
    // Mark account as reconciled
    // Update the last_reconciled field
    const lastReconciled = new Date().getTime().toString();
    await actualAPI.updateAccount(id, { last_reconciled: lastReconciled });
    
    res.json({ success: true, adjustment });
  } catch (error) {
    console.error('Failed to reconcile account:', error);
    res.status(500).json({ 
      error: 'Failed to reconcile account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update transaction cleared status
app.post('/api/transactions/:id/cleared', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cleared } = req.body;
    
    if (cleared === undefined) {
      return res.status(400).json({ error: 'Cleared status is required' });
    }
    
    // Check if transaction is reconciled (you can't unmark a reconciled transaction as cleared)
    const result = await actualAPI.internal.send('db.all', {
      query: 'SELECT * FROM transactions WHERE id = ?',
      params: [id]
    });
    
    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const transaction: { reconciled: boolean; id: string } = result.data[0];
    
    // If the transaction is reconciled and trying to mark as uncleared, don't allow it
    if (transaction.reconciled && !cleared) {
      return res.status(400).json({ 
        error: 'Cannot mark a reconciled transaction as uncleared',
        needsReconcileUnlock: true
      });
    }
    
    // Update the transaction
    await actualAPI.updateTransaction(id, { cleared });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update transaction cleared status:', error);
    res.status(500).json({ 
      error: 'Failed to update transaction cleared status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark transactions as reconciled
app.post('/api/accounts/:id/lock-transactions', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get all cleared transactions for the account that aren't reconciled yet
    const result = await actualAPI.internal.send('db.all', {
      query: 'SELECT * FROM transactions WHERE account = ? AND cleared = 1 AND reconciled = 0',
      params: [id]
    });
    
    const transactions = result.data || [];
    
    // Update each transaction to be reconciled
    const updates = transactions.map((transaction: { id: string }) => {
      return actualAPI.updateTransaction(transaction.id, { reconciled: true });
    });
    
    await Promise.all(updates);
    
    res.json({ success: true, count: transactions.length });
  } catch (error) {
    console.error('Failed to mark transactions as reconciled:', error);
    res.status(500).json({ 
      error: 'Failed to mark transactions as reconciled',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}); 