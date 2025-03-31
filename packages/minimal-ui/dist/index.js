"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const path_1 = __importDefault(require("path"));
const actualAPI = __importStar(require("@actual-app/api"));
const fs_1 = __importDefault(require("fs"));
// Initialize Express app with WebSocket support
const app = (0, express_1.default)();
// Fix type incompatibility with a type assertion
const wsApp = (0, express_ws_1.default)(app);
const port = process.env.PORT || 3000;
// Track budget loaded state
let budgetLoaded = false;
// Get the absolute data directory path
const dataDir = path_1.default.resolve(path_1.default.join(__dirname, '..', '..', '..', 'data'));
// Serve static files from the public directory
app.use('/public', express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(express_1.default.json());
// Middleware to log requests for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - User-Agent: ${req.headers['user-agent']}`);
    next();
});
// Redirect root to index.html
app.get('/', (req, res) => {
    res.redirect('/public/index.html');
});
// Create a sample budget
async function createSampleBudget() {
    console.log('Creating sample budget...');
    try {
        // Check if there are any existing budgets
        const budgets = await actualAPI.getBudgets();
        if (budgets.length > 0) {
            console.log('Budgets already exist, skipping sample budget creation');
            return budgets[0].id;
        }
        // Create a budget directory and files
        const dataDir = process.env.ACTUAL_DATA_DIR;
        if (!dataDir) {
            throw new Error('ACTUAL_DATA_DIR environment variable is not set');
        }
        console.log(`Using data directory: ${dataDir}`);
        // Create budgets directory if it doesn't exist
        const budgetsDir = path_1.default.join(dataDir, 'budgets');
        if (!fs_1.default.existsSync(budgetsDir)) {
            fs_1.default.mkdirSync(budgetsDir, { recursive: true });
        }
        // Create a new budget with a unique ID
        const budgetId = 'sample-budget-' + Date.now();
        const budgetDir = path_1.default.join(budgetsDir, budgetId);
        fs_1.default.mkdirSync(budgetDir, { recursive: true });
        // Create necessary directories within the budget
        fs_1.default.mkdirSync(path_1.default.join(budgetDir, 'db'), { recursive: true });
        // Create an empty metadata.json file
        const metadata = {
            id: budgetId,
            name: 'Sample Budget',
            created: new Date().toISOString()
        };
        fs_1.default.writeFileSync(path_1.default.join(budgetDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
        console.log(`Created budget directory at: ${budgetDir}`);
        // Load the newly created budget
        await actualAPI.loadBudget(budgetId);
        // Create basic accounts
        await actualAPI.createAccount({
            name: 'Checking',
            type: 'checking'
        });
        await actualAPI.createAccount({
            name: 'Savings',
            type: 'savings'
        });
        await actualAPI.createAccount({
            name: 'Credit Card',
            type: 'credit'
        });
        // Add some sample transactions
        const accounts = await actualAPI.getAccounts();
        if (accounts.length > 0) {
            const checkingId = accounts.find(a => a.name === 'Checking')?.id;
            if (checkingId) {
                await actualAPI.addTransactions(checkingId, [
                    {
                        date: new Date().toISOString().slice(0, 10),
                        payee_name: 'Initial Balance',
                        amount: 150000 // $1,500.00
                    },
                    {
                        date: new Date().toISOString().slice(0, 10),
                        payee_name: 'Grocery Store',
                        amount: -7500 // -$75.00
                    }
                ]);
            }
        }
        console.log(`Sample budget created with ID: ${budgetId}`);
        return budgetId;
    }
    catch (error) {
        console.error('Failed to create sample budget:', error);
        throw error;
    }
}
// Initialize the Actual API
async function initActual() {
    try {
        console.log('Initializing Actual Budget engine...');
        console.log(`Using data directory: ${dataDir}`);
        // Check if directory exists
        if (fs_1.default.existsSync(dataDir)) {
            console.log('Data directory exists');
            try {
                const files = fs_1.default.readdirSync(dataDir);
                console.log('Files in data directory:', files);
            }
            catch (err) {
                console.error('Error reading data directory:', err);
            }
        }
        else {
            console.log('Data directory does not exist, it will be created');
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        // Create budgets directory if it doesn't exist
        const budgetsDir = path_1.default.join(dataDir, 'budgets');
        if (!fs_1.default.existsSync(budgetsDir)) {
            console.log('Creating budgets directory');
            fs_1.default.mkdirSync(budgetsDir, { recursive: true });
        }
        await actualAPI.init({
            dataDir: dataDir,
        });
        console.log('Actual Budget engine initialized successfully');
        // Check if we have any budgets, if not create a sample one
        const budgets = await actualAPI.getBudgets();
        console.log('Existing budgets:', budgets);
        if (budgets.length === 0) {
            console.log('No budgets found, creating a sample budget');
            await createSampleBudget();
        }
    }
    catch (error) {
        console.error('Failed to initialize Actual Budget engine:', error);
        process.exit(1);
    }
}
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
        // If no budgets found, create a sample one
        if (budgets.length === 0) {
            console.log('No budgets found in API call, creating a sample budget');
            await createSampleBudget();
            const updatedBudgets = await actualAPI.getBudgets();
            return res.json(updatedBudgets);
        }
        res.json(budgets);
    }
    catch (error) {
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
        console.log(`Loading budget with ID: ${budgetId}`);
        const result = await actualAPI.loadBudget(budgetId);
        budgetLoaded = true; // Mark budget as loaded
        console.log('Budget loaded successfully:', result);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Failed to load budget:', error);
        budgetLoaded = false;
        res.status(500).json({
            error: 'Failed to load budget',
            message: error.message || 'Unknown error'
        });
    }
});
// Check budget loaded status
app.get('/api/budget-status', (req, res) => {
    res.json({ budgetLoaded });
});
// Create a sample budget
app.post('/api/sample-budget', async (req, res) => {
    try {
        const budgetId = await createSampleBudget();
        if (budgetId) {
            res.json({ success: true, budgetId });
        }
        else {
            res.status(500).json({ error: 'Failed to create sample budget' });
        }
    }
    catch (error) {
        console.error('Failed to create sample budget:', error);
        res.status(500).json({
            error: 'Failed to create sample budget',
            message: error.message || 'Unknown error'
        });
    }
});
// Apply budget loaded check to all budget-related endpoints
app.get('/api/accounts', ensureBudgetLoaded, async (req, res) => {
    try {
        const accounts = await actualAPI.getAccounts();
        console.log('Accounts found:', accounts.length);
        res.json(accounts);
    }
    catch (error) {
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
        const result = await actualAPI.createAccount(account, initialBalance);
        res.json({ success: true, id: result });
    }
    catch (error) {
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
        const transactions = await actualAPI.getTransactions(accountId, startDate, endDate);
        res.json(transactions);
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Failed to set budget amount:', error);
        res.status(500).json({
            error: 'Failed to set budget amount',
            message: error.message || 'Unknown error'
        });
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
