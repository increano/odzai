# Odzai API Endpoints Documentation

This document provides a complete list of API endpoints available in the Odzai (formerly Actual Budget) application. Use this as a reference for testing with Postman or integrating with other services.

## Table of Contents

- [Budget Management](#budget-management)
- [Account Management](#account-management)
- [Transaction Management](#transaction-management)
- [Category Management](#category-management)
- [Budget Items](#budget-items)
- [Reporting](#reporting)
- [Scheduled Transactions](#scheduled-transactions)
- [Reconciliation](#reconciliation)
- [System Information](#system-information)

## Budget Management

### Get All Budgets

```
GET /api/budgets
```

Returns a list of all available budgets.

**Example Response:**
```json
[
  {"id": "Test-d5cd74b", "name": "Test"},
  {"id": "mwwkspc-fe8f00c", "name": "mwwkspc"}
]
```

### Create New Budget

```
POST /api/budgets/create
```

Creates a new budget.

**Request Body:**
```json
{
  "budgetName": "My New Budget"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Budget \"My New Budget\" created successfully",
  "budgets": [
    {"id": "Test-d5cd74b", "name": "Test"},
    {"id": "my-new-budget-a1b2c3d", "name": "My New Budget"}
  ]
}
```

### Load Budget

```
POST /api/budgets/load
```

Loads a specific budget for use.

**Request Body:**
```json
{
  "budgetId": "Test-d5cd74b"
}
```

**Example Response:**
```json
{
  "success": true,
  "hasAccounts": true,
  "accountCount": 2
}
```

### Get Budget Status

```
GET /api/budget-status
```

Checks if a budget is currently loaded.

**Example Response:**
```json
{
  "budgetLoaded": true
}
```

## Account Management

### Get All Accounts

```
GET /api/accounts
```

Returns all accounts in the current budget.

**Example Response:**
```json
[
  {
    "id": "5f464394-819d-451c-b8b1-942109b7bef5",
    "name": "Checking Account",
    "offbudget": false,
    "closed": false,
    "calculated_balance": 30700,
    "budget_category": "On Budget"
  }
]
```

### Create Account

```
POST /api/accounts
```

Creates a new account.

**Request Body:**
```json
{
  "account": {
    "name": "Savings Account",
    "offBudget": false
  },
  "initialBalance": 50000
}
```

**Example Response:**
```json
{
  "success": true,
  "id": "7c89484d-072c-4834-ac60-4620436705dd"
}
```

## Transaction Management

### Get All Transactions

```
GET /api/transactions/all
```

Retrieves transactions from all accounts.

**Example Response:**
```json
[
  {
    "id": "f2977ab0-0000-46e8-8859-9c45aa5bca06",
    "account": "5f464394-819d-451c-b8b1-942109b7bef5",
    "amount": -156600,
    "payee": "96407515-db33-42b4-bff1-e53211c13c97",
    "notes": "",
    "date": "2025-05-03",
    "account_name": "Checking Account",
    "category": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61"
  }
]
```

### Get Transactions By Account

```
GET /api/transactions/:accountId
```

Retrieves transactions for a specific account.

**Example:**
```
GET /api/transactions/5f464394-819d-451c-b8b1-942109b7bef5
```

**Example Response:**
```json
[
  {
    "id": "f2977ab0-0000-46e8-8859-9c45aa5bca06",
    "account": "5f464394-819d-451c-b8b1-942109b7bef5",
    "amount": -156600,
    "payee": "96407515-db33-42b4-bff1-e53211c13c97",
    "notes": "",
    "date": "2025-05-03",
    "account_name": "Checking Account",
    "category": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61"
  }
]
```

### Get Transactions By Query Parameters

```
GET /api/transactions?accountId=:accountId
```

Alternative way to retrieve transactions for a specific account using query parameters.

### Add Transaction

```
POST /api/transactions
```

Creates a new transaction.

**Request Body:**
```json
{
  "accountId": "5f464394-819d-451c-b8b1-942109b7bef5",
  "transaction": {
    "date": "2025-05-15",
    "amount": 12500,
    "payee_name": "Test Payee",
    "notes": "Test transaction",
    "category": null
  }
}
```

**Example Response:**
```json
{
  "success": true
}
```

### Delete Transaction

```
DELETE /api/transactions/:transactionId
```

Deletes a specific transaction.

**Example:**
```
DELETE /api/transactions/f2977ab0-0000-46e8-8859-9c45aa5bca06
```

**Example Response:**
```json
{
  "success": true
}
```

### Batch Delete Transactions

```
POST /api/transactions/batch-delete
```

Deletes multiple transactions at once.

**Request Body:**
```json
{
  "ids": [
    "f2977ab0-0000-46e8-8859-9c45aa5bca06",
    "51568c0a-2d39-46ec-9c8f-241ca807946d"
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "count": 2
}
```

### Split Transaction

```
POST /api/transactions/:transactionId/split
```

Splits a transaction into multiple parts.

**Request Body:**
```json
{
  "splits": [
    {
      "amount": -10000,
      "category": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61",
      "notes": "First part"
    },
    {
      "amount": -5000,
      "category": "29ec2c58-8cd3-42fe-9187-7b5dfe0f70a6",
      "notes": "Second part"
    }
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Transaction split into 2 parts",
  "splits": 2
}
```

### Get Transactions By Status

```
GET /api/transactions/by-status/:status
```

Retrieves transactions with a specific status.

**Example:**
```
GET /api/transactions/by-status/pending
```

### Update Transaction Cleared Status

```
POST /api/transactions/:id/cleared
```

Updates the cleared status of a transaction.

**Request Body:**
```json
{
  "cleared": true
}
```

**Example Response:**
```json
{
  "success": true
}
```

## Category Management

### Get Categories

```
GET /api/categories
```

Retrieves all categories.

**Example Response:**
```json
[
  {
    "id": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61",
    "name": "Groceries",
    "group_id": "3a052a10-8b61-4f40-a7a5-ddce7f48a983",
    "is_income": false,
    "hidden": false
  }
]
```

### Get Categories Grouped

```
GET /api/categories/grouped
```

Retrieves categories grouped by their parent category groups.

**Example Response:**
```json
[
  {
    "id": "3a052a10-8b61-4f40-a7a5-ddce7f48a983",
    "name": "Living Expenses",
    "is_income": false,
    "hidden": false,
    "categories": [
      {
        "id": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61",
        "name": "Groceries",
        "group_id": "3a052a10-8b61-4f40-a7a5-ddce7f48a983",
        "is_income": false,
        "hidden": false
      }
    ]
  }
]
```

### Create Category

```
POST /api/categories
```

Creates a new category.

**Request Body:**
```json
{
  "name": "Restaurants",
  "group_id": "3a052a10-8b61-4f40-a7a5-ddce7f48a983",
  "is_income": false,
  "hidden": false
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Category \"Restaurants\" created successfully",
  "id": "af375fd4-d759-46b3-bffe-74a856151d57"
}
```

### Update Category

```
PUT /api/categories/:categoryId
```

Updates an existing category.

**Request Body:**
```json
{
  "name": "Dining Out",
  "hidden": false
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Category updated successfully"
}
```

### Delete Category

```
DELETE /api/categories/:categoryId
```

Deletes a category.

**Query Parameters:**
- `transferCategoryId` (optional): ID of category to transfer transactions to

**Example Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

### Get Category Groups

```
GET /api/category-groups
```

Retrieves all category groups.

**Example Response:**
```json
[
  {
    "id": "3a052a10-8b61-4f40-a7a5-ddce7f48a983",
    "name": "Living Expenses",
    "is_income": false,
    "hidden": false
  }
]
```

### Create Category Group

```
POST /api/category-groups
```

Creates a new category group.

**Request Body:**
```json
{
  "name": "Entertainment",
  "is_income": false,
  "hidden": false
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Category group \"Entertainment\" created successfully",
  "id": "5e6f8a2b-9c7d-46e5-8f4a-3b2d1c0a9e8f"
}
```

### Update Category Group

```
PUT /api/category-groups/:groupId
```

Updates an existing category group.

**Request Body:**
```json
{
  "name": "Fun & Entertainment",
  "hidden": false
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Category group updated successfully"
}
```

### Delete Category Group

```
DELETE /api/category-groups/:groupId
```

Deletes a category group.

**Query Parameters:**
- `transferGroupId` (optional): ID of group to transfer categories to

**Example Response:**
```json
{
  "success": true,
  "message": "Category group deleted successfully"
}
```

## Budget Items

### Get Budget Months

```
GET /api/budget/months
```

Retrieves all budget months.

**Example Response:**
```json
[
  "2025-04",
  "2025-05",
  "2025-06"
]
```

### Get Budget Month

```
GET /api/budget/month/:month
```

Retrieves budget data for a specific month.

**Example:**
```
GET /api/budget/month/2025-05
```

**Example Response:**
```json
{
  "month": "2025-05",
  "categories": [
    {
      "id": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61",
      "budgeted": 50000,
      "spent": 15660,
      "balance": 34340
    }
  ],
  "income": 75000,
  "spent": 15660,
  "budgeted": 50000
}
```

### Set Budget Amount

```
POST /api/budget/set-amount
```

Sets the budgeted amount for a category in a specific month.

**Request Body:**
```json
{
  "month": "2025-05",
  "categoryId": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61",
  "amount": 60000
}
```

**Example Response:**
```json
{
  "success": true
}
```

## Reporting

### Spending By Category

```
GET /api/reports/spending-by-category
```

Retrieves spending data grouped by category.

**Query Parameters:**
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)

**Example Response:**
```json
{
  "categories": [
    {
      "id": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61",
      "name": "Groceries",
      "total": 156600,
      "count": 1
    }
  ],
  "summary": {
    "totalSpending": 156600,
    "categoryCount": 1,
    "transactionCount": 1
  },
  "dateRange": {
    "start": "2025-04-01",
    "end": "2025-05-31"
  }
}
```

### Income vs Expenses

```
GET /api/reports/income-vs-expenses
```

Retrieves income vs expenses data by month.

**Example Response:**
```json
{
  "monthly": [
    {
      "month": "2025-04",
      "income": 0,
      "expenses": 0
    },
    {
      "month": "2025-05",
      "income": 75000,
      "expenses": 156600
    }
  ],
  "summary": {
    "totalIncome": 75000,
    "totalExpenses": 156600,
    "netIncome": -81600,
    "months": 2
  }
}
```

### Account Balance History

```
GET /api/reports/account-balance-history
```

Retrieves account balance history over time.

**Example Response:**
```json
[
  {
    "id": "5f464394-819d-451c-b8b1-942109b7bef5",
    "name": "Checking Account",
    "offBudget": false,
    "currentBalance": 30700,
    "history": [
      {
        "date": "2025-05-03",
        "balance": 100000
      },
      {
        "date": "2025-05-03",
        "balance": 112300
      },
      {
        "date": "2025-05-03",
        "balance": 187300
      },
      {
        "date": "2025-05-03",
        "balance": 30700
      }
    ]
  }
]
```

### Save Report Configuration

```
POST /api/reports/config
```

Saves configuration for a report.

**Request Body:**
```json
{
  "reportType": "spending-by-category",
  "configuration": {
    "defaultDateRange": "last3Months",
    "excludeCategories": []
  }
}
```

**Example Response:**
```json
{
  "success": true
}
```

### Get Report Configurations

```
GET /api/reports/config
```

Retrieves saved report configurations.

**Example Response:**
```json
{
  "defaultDateRange": {
    "type": "last3Months",
    "customStart": null,
    "customEnd": null
  },
  "savedReports": []
}
```

## Scheduled Transactions

### Get Schedules Status

```
GET /api/schedules/status
```

Checks if scheduled transactions are available.

**Example Response:**
```json
{
  "available": true,
  "migrated": true
}
```

### Get All Schedules

```
GET /api/schedules
```

Retrieves all scheduled transactions.

**Example Response:**
```json
[
  {
    "id": "schedule-001",
    "name": "Monthly Rent",
    "_date": "2025-06-01",
    "_amount": -150000,
    "_account": "5f464394-819d-451c-b8b1-942109b7bef5",
    "_payee": "Landlord",
    "_category": "d4b0f075-3343-4408-91ed-fae94f74e5bf",
    "frequency": "monthly",
    "posts_transaction": 1,
    "completed": 0,
    "tombstone": 0
  }
]
```

### Create Schedule

```
POST /api/schedules
```

Creates a new scheduled transaction.

**Request Body:**
```json
{
  "name": "Car Payment",
  "_date": "2025-06-15",
  "_amount": -35000,
  "_account": "5f464394-819d-451c-b8b1-942109b7bef5",
  "_payee": "Auto Loan Company",
  "_category": "d4b0f075-3343-4408-91ed-fae94f74e5bf",
  "frequency": "monthly",
  "posts_transaction": 1
}
```

**Example Response:**
```json
{
  "id": "schedule-004",
  "success": true
}
```

### Update Schedule

```
PUT /api/schedules/:id
```

Updates an existing scheduled transaction.

**Request Body:**
```json
{
  "name": "Updated Car Payment",
  "_amount": -36000,
  "frequency": "monthly"
}
```

**Example Response:**
```json
{
  "success": true,
  "id": "schedule-004"
}
```

### Delete Schedule

```
DELETE /api/schedules/:id
```

Deletes a scheduled transaction.

**Example Response:**
```json
{
  "success": true
}
```

### Post Scheduled Transaction

```
POST /api/schedules/:id/post
```

Creates a transaction from a schedule and updates the next occurrence date.

**Example Response:**
```json
{
  "success": true,
  "transaction_id": "98b3f5bf-644d-471b-b696-c1651ada7bb2",
  "next_date": "2025-07-01"
}
```

### Skip Scheduled Transaction

```
POST /api/schedules/:id/skip
```

Skips to the next occurrence date without creating a transaction.

**Example Response:**
```json
{
  "success": true,
  "next_date": "2025-07-01"
}
```

## Reconciliation

### Reconcile Account

```
POST /api/accounts/:id/reconcile
```

Reconciles an account to match a target balance.

**Request Body:**
```json
{
  "targetBalance": 306.75,
  "createAdjustment": true
}
```

**Example Response:**
```json
{
  "success": true,
  "adjustment": {
    "date": "2025-05-15",
    "account": "5f464394-819d-451c-b8b1-942109b7bef5",
    "amount": -25,
    "payee": "Reconciliation Balance Adjustment",
    "notes": "Adjustment to match reconciled balance of 306.75",
    "cleared": true
  }
}
```

### Lock Transactions (Mark as Reconciled)

```
POST /api/accounts/:id/lock-transactions
```

Marks all cleared transactions as reconciled for an account.

**Example Response:**
```json
{
  "success": true,
  "count": 3
}
```

## System Information

### Get Data Directory

```
GET /api/data-directory
```

Retrieves the path to the data directory.

**Example Response:**
```json
{
  "dataDir": "/Users/username/Desktop/Dev/odzai/data"
}
```

## Testing with Postman

To test these API endpoints in Postman:

1. Create a new collection
2. Set up a request for each endpoint
3. Test in the following order:
   - Check budget status
   - Load a budget
   - Test other endpoints

**Important**: Many endpoints require a budget to be loaded first. Always make sure you've loaded a budget before testing other endpoints.

## Common Response Codes

- **200 OK**: Request succeeded
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

## Authentication

The API currently does not implement authentication. This is intended for local development and testing use only. 