// Fix accounts data
const express = require('express');
const app = express();
const port = 3002;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Mock database for account data
const accounts = [
  {
    "id": "9d6b901c-db67-4e2e-b39f-56b768bfa937",
    "name": "testDaoli",
    "offbudget": false,
    "closed": false,
    "calculated_balance": 100000,
    "numTransactions": 1,
    "isConnected": false,
    "budget_category": "On Budget"
  },
  {
    "id": "0f51bab9-08ab-48b3-bfc2-cecae2e4bc08",
    "name": "Unknown Account",
    "offbudget": false,
    "closed": false,
    "calculated_balance": 25000,
    "numTransactions": 0,
    "isConnected": false,
    "budget_category": "On Budget"
  },
  {
    "id": "32af5d91-19f4-4565-8f11-8ca10c96c2a8",
    "name": "Unknown Account",
    "offbudget": false,
    "closed": false,
    "calculated_balance": 35000,
    "numTransactions": 0,
    "isConnected": false,
    "budget_category": "On Budget"
  },
  {
    "id": "11b24489-088c-48be-8d0c-f3096e9e92b7",
    "name": "Unknown Account",
    "offbudget": false,
    "closed": false,
    "calculated_balance": 47500,
    "numTransactions": 0,
    "isConnected": false,
    "budget_category": "On Budget"
  }
];

// Handle GET request for all accounts
app.get('/api/accounts', (req, res) => {
  res.json(accounts);
});

// Handle GET request for a specific account
app.get('/api/accounts/:id', (req, res) => {
  const account = accounts.find(a => a.id === req.params.id);
  if (account) {
    res.json(account);
  } else {
    res.status(404).json({ error: 'Account not found' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Accounts fix server running at http://localhost:${port}`);
}); 