import express from 'express';
import expressWs from 'express-ws';
import path from 'path';
import * as actualAPI from '@actual-app/api';
import { Application } from 'express';
import fs from 'fs';
import cors from 'cors';

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
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error loading budget:', error);
    budgetLoaded = false;
    return res.status(500).json({ error: error.message });
  }
});

// Set up API routes
app.get('/api/budget-status', async (req, res) => {
  try {
    // Get the current loaded budget status
    res.json({ budgetLoaded });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const { startDate, endDate } = req.query;
    
    const transactions = await actualAPI.getTransactions(
      accountId,
      startDate as string | undefined,
      endDate as string | undefined
    );

    // Get categories and payees to resolve names
    const categories = await actualAPI.getCategories();
    const payees = await actualAPI.getPayees();
    
    // Create lookup maps for faster access
    const categoryMap = categories.reduce((map, cat) => {
      map[cat.id] = cat.name;
      return map;
    }, {});
    
    const payeeMap = payees.reduce((map, payee) => {
      map[payee.id] = payee.name;
      return map;
    }, {});
    
    // Enhance transactions with resolved names
    const enhancedTransactions = transactions.map(transaction => {
      return {
        ...transaction,
        // Use payee_name if it exists, otherwise resolve from payee ID
        payee: transaction.payee_name || (transaction.payee && payeeMap[transaction.payee]) || 'N/A',
        // Resolve category name from category ID
        category: (transaction.category && categoryMap[transaction.category]) || 'N/A'
      };
    });
    
    res.json(enhancedTransactions);
  } catch (error) {
    console.error('Failed to get transactions:', error);
    res.status(500).json({ 
      error: 'Failed to get transactions',
      message: error.message || 'Unknown error'
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
    
    // Get all transactions to find the one we need
    const transactions = await actualAPI.getTransactions(null, null, null);
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Verify that split amounts sum to the original amount
    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
    if (totalSplitAmount !== transaction.amount) {
      return res.status(400).json({ 
        error: 'Split amounts must sum to the original transaction amount',
        expected: transaction.amount,
        received: totalSplitAmount
      });
    }
    
    // Since Actual doesn't have a direct splitTransaction API,
    // we'll implement splitting by:
    // 1. Update the original transaction to be the parent
    // 2. Create child transactions for each split
    
    // First mark the transaction as a parent
    await actualAPI.updateTransaction(transactionId, { is_parent: true });
    
    // Then create child transactions for each split
    for (const split of splits) {
      await actualAPI.addTransactions(transaction.account, [{
        date: transaction.date,
        amount: split.amount,
        payee: transaction.payee,
        notes: split.notes || transaction.notes,
        category: split.category,
        parent_id: transactionId,
        // Copy other relevant fields from the parent
        cleared: transaction.cleared,
        imported_payee: transaction.imported_payee
      }]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to split transaction:', error);
    res.status(500).json({ 
      error: 'Failed to split transaction',
      message: error.message || 'Unknown error'
    });
  }
}); 