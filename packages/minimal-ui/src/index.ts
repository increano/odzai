import express from 'express';
import expressWs from 'express-ws';
import path from 'path';
import * as actualAPI from '@actual-app/api';

// Initialize Express app with WebSocket support
const app = express();
const wsApp = expressWs(app);
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Initialize the Actual API
async function initActual() {
  try {
    console.log('Initializing Actual Budget engine...');
    await actualAPI.init({
      dataDir: path.join(__dirname, '..', '..', '..', 'data'),
    });
    console.log('Actual Budget engine initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Actual Budget engine:', error);
    process.exit(1);
  }
}

// API Routes
app.get('/api/budgets', async (req, res) => {
  try {
    const budgets = await actualAPI.getBudgets();
    res.json(budgets);
  } catch (error) {
    console.error('Failed to get budgets:', error);
    res.status(500).json({ error: 'Failed to get budgets' });
  }
});

app.post('/api/budgets/load', async (req, res) => {
  try {
    const { budgetId } = req.body;
    if (!budgetId) {
      return res.status(400).json({ error: 'Budget ID is required' });
    }
    
    const result = await actualAPI.loadBudget(budgetId);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Failed to load budget:', error);
    res.status(500).json({ error: 'Failed to load budget' });
  }
});

app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await actualAPI.getAccounts();
    res.json(accounts);
  } catch (error) {
    console.error('Failed to get accounts:', error);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { account, initialBalance } = req.body;
    if (!account) {
      return res.status(400).json({ error: 'Account details are required' });
    }
    
    const result = await actualAPI.createAccount(account, initialBalance);
    res.json({ success: true, id: result });
  } catch (error) {
    console.error('Failed to create account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.get('/api/transactions/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;
    
    const transactions = await actualAPI.getTransactions(
      accountId,
      startDate as string | undefined,
      endDate as string | undefined
    );
    
    res.json(transactions);
  } catch (error) {
    console.error('Failed to get transactions:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { accountId, transaction } = req.body;
    if (!accountId || !transaction) {
      return res.status(400).json({ error: 'Account ID and transaction details are required' });
    }
    
    await actualAPI.addTransactions(accountId, [transaction]);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to add transaction:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await actualAPI.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Failed to get categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

app.get('/api/budget/months', async (req, res) => {
  try {
    const months = await actualAPI.getBudgetMonths();
    res.json(months);
  } catch (error) {
    console.error('Failed to get budget months:', error);
    res.status(500).json({ error: 'Failed to get budget months' });
  }
});

app.get('/api/budget/month/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const budgetMonth = await actualAPI.getBudgetMonth(month);
    res.json(budgetMonth);
  } catch (error) {
    console.error('Failed to get budget month:', error);
    res.status(500).json({ error: 'Failed to get budget month' });
  }
});

app.post('/api/budget/set-amount', async (req, res) => {
  try {
    const { month, categoryId, amount } = req.body;
    if (!month || !categoryId || amount === undefined) {
      return res.status(400).json({ error: 'Month, category ID, and amount are required' });
    }
    
    await actualAPI.setBudgetAmount(month, categoryId, amount);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to set budget amount:', error);
    res.status(500).json({ error: 'Failed to set budget amount' });
  }
});

// Start the server
async function startServer() {
  await initActual();
  
  app.listen(port, () => {
    console.log(`Minimal Actual UI server running at http://localhost:${port}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 