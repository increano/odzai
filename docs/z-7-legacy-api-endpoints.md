# Odzai Legacy API Endpoints Documentation

This document lists the legacy API endpoints from the original Actual Budget application that are not yet fully implemented in the minimal-ui version of Odzai. These endpoints may be useful for developers looking to extend the functionality of Odzai or build integrations with the existing API.

## Table of Contents

- [Batch Operations](#batch-operations)
- [Payee Management](#payee-management)
- [Rules Management](#rules-management)
- [Advanced Budget Operations](#advanced-budget-operations)
- [Transfer Operations](#transfer-operations)
- [Import/Export Operations](#importexport-operations)
- [Sync Operations](#sync-operations)
- [Bank Sync Operations](#bank-sync-operations)

## Batch Operations

### Start Batch Budget Updates

```
POST /api/batch-budget-start
```

Begins a batch operation for multiple budget updates to be processed as a single unit. This improves performance and ensures data consistency when making multiple changes.

**Example Response:**
```json
{
  "success": true
}
```

### End Batch Budget Updates

```
POST /api/batch-budget-end
```

Completes a batch operation and commits all changes made since the batch was started.

**Example Response:**
```json
{
  "success": true
}
```

## Payee Management

### Get Common Payees

```
GET /api/common-payees-get
```

Retrieves a list of commonly used payees.

**Example Response:**
```json
[
  {
    "id": "96407515-db33-42b4-bff1-e53211c13c97",
    "name": "Grocery Store",
    "usage_count": 15
  }
]
```

### Merge Payees

```
POST /api/payees-merge
```

Merges multiple payees into a target payee, combining all transactions.

**Request Body:**
```json
{
  "targetId": "96407515-db33-42b4-bff1-e53211c13c97",
  "mergeIds": [
    "51568c0a-2d39-46ec-9c8f-241ca807946d",
    "f2977ab0-0000-46e8-8859-9c45aa5bca06"
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Payees merged successfully"
}
```

## Rules Management

### Get Rules

```
GET /api/rules-get
```

Retrieves all transaction rules.

**Example Response:**
```json
[
  {
    "id": "rule-1",
    "name": "Grocery Rule",
    "conditions": [
      {
        "field": "payee",
        "op": "contains",
        "value": "Grocery"
      }
    ],
    "actions": [
      {
        "field": "category",
        "value": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61"
      }
    ]
  }
]
```

### Get Payee Rules

```
GET /api/payee-rules-get
```

Retrieves rules associated with a specific payee.

**Request Parameters:**
```json
{
  "id": "96407515-db33-42b4-bff1-e53211c13c97"
}
```

**Example Response:**
```json
[
  {
    "id": "rule-1",
    "name": "Grocery Rule",
    "conditions": [
      {
        "field": "payee",
        "op": "is",
        "value": "96407515-db33-42b4-bff1-e53211c13c97"
      }
    ],
    "actions": [
      {
        "field": "category",
        "value": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61"
      }
    ]
  }
]
```

### Create Rule

```
POST /api/rule-create
```

Creates a new transaction rule.

**Request Body:**
```json
{
  "rule": {
    "name": "Coffee Shops",
    "conditions": [
      {
        "field": "payee",
        "op": "contains",
        "value": "Coffee"
      }
    ],
    "actions": [
      {
        "field": "category",
        "value": "29ec2c58-8cd3-42fe-9187-7b5dfe0f70a6"
      }
    ]
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "id": "rule-2"
}
```

### Update Rule

```
POST /api/rule-update
```

Updates an existing transaction rule.

**Request Body:**
```json
{
  "rule": {
    "id": "rule-1",
    "name": "Updated Grocery Rule",
    "conditions": [
      {
        "field": "payee",
        "op": "contains",
        "value": "Supermarket"
      }
    ],
    "actions": [
      {
        "field": "category",
        "value": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61"
      }
    ]
  }
}
```

**Example Response:**
```json
{
  "success": true
}
```

### Delete Rule

```
POST /api/rule-delete
```

Deletes a transaction rule.

**Request Body:**
```json
{
  "id": "rule-1"
}
```

**Example Response:**
```json
{
  "success": true
}
```

## Advanced Budget Operations

### Set Budget Carryover

```
POST /api/budget-set-carryover
```

Sets whether a category should carry over unused funds to the next month.

**Request Body:**
```json
{
  "month": "2025-05",
  "categoryId": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61",
  "flag": true
}
```

**Example Response:**
```json
{
  "success": true
}
```

### Hold for Next Month

```
POST /api/budget-hold-for-next-month
```

Sets aside money from the current month's available funds for next month's budget.

**Request Body:**
```json
{
  "month": "2025-05",
  "amount": 20000
}
```

**Example Response:**
```json
{
  "success": true
}
```

### Reset Hold

```
POST /api/budget-reset-hold
```

Resets the amount held for next month back to zero.

**Request Body:**
```json
{
  "month": "2025-05"
}
```

**Example Response:**
```json
{
  "success": true
}
```

### Cover Overspending

```
POST /api/budget/cover-overspending
```

Moves money from one category to cover overspending in another category.

**Request Body:**
```json
{
  "month": "2025-05",
  "fromCategoryId": "afb0f075-3343-4408-91ed-fae94f74e5aa",
  "toCategoryId": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61", 
  "amount": 5000
}
```

**Example Response:**
```json
{
  "success": true
}
```

### Transfer Available

```
POST /api/budget/transfer-available
```

Transfers available funds between categories.

**Request Body:**
```json
{
  "month": "2025-05",
  "fromCategoryId": "afb0f075-3343-4408-91ed-fae94f74e5aa",
  "toCategoryId": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61", 
  "amount": 10000
}
```

**Example Response:**
```json
{
  "success": true
}
```

## Transfer Operations

### Transfer Category

```
POST /api/budget/transfer-category
```

Creates a transfer between categories with proper accounting entries.

**Request Body:**
```json
{
  "month": "2025-05",
  "fromCategoryId": "afb0f075-3343-4408-91ed-fae94f74e5aa",
  "toCategoryId": "6bbd8472-25d4-4cee-8a11-5bd9f7e83d61", 
  "amount": 15000
}
```

**Example Response:**
```json
{
  "success": true
}
```

## Import/Export Operations

### Start Import

```
POST /api/start-import
```

Begins a data import process.

**Request Body:**
```json
{
  "budgetName": "My Budget"
}
```

**Example Response:**
```json
{
  "success": true
}
```

### Finish Import

```
POST /api/finish-import
```

Completes a data import process and commits changes.

**Example Response:**
```json
{
  "success": true
}
```

### Abort Import

```
POST /api/abort-import
```

Aborts a data import process without committing changes.

**Example Response:**
```json
{
  "success": true
}
```

### Import Transactions

```
POST /api/transactions-import
```

Imports transactions with special handling for duplicates and matching.

**Request Body:**
```json
{
  "accountId": "5f464394-819d-451c-b8b1-942109b7bef5",
  "transactions": [
    {
      "date": "2025-05-15",
      "amount": -25000,
      "payee_name": "Grocery Store",
      "notes": "Weekly shopping",
      "imported_id": "123456"
    }
  ],
  "opts": {
    "defaultCleared": true
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "added": 1,
  "updated": 0,
  "skipped": 0
}
```

### Export Transactions

```
POST /api/transactions-export
```

Exports transactions in a specified format.

**Request Body:**
```json
{
  "transactions": [
    "f2977ab0-0000-46e8-8859-9c45aa5bca06",
    "51568c0a-2d39-46ec-9c8f-241ca807946d"
  ],
  "format": "csv"
}
```

**Example Response:**
A file download with the exported data.

## Sync Operations

### Sync Budget

```
POST /api/sync
```

Synchronizes the current budget with the server.

**Example Response:**
```json
{
  "success": true,
  "newDataAvailable": false
}
```

### Download Budget

```
POST /api/download-budget
```

Downloads a budget from the sync server.

**Request Body:**
```json
{
  "syncId": "my-budget-12345",
  "password": "optional-encryption-password"
}
```

**Example Response:**
```json
{
  "success": true,
  "id": "my-budget-12345"
}
```

## Bank Sync Operations

### Run Bank Sync

```
POST /api/bank-sync
```

Initiates synchronization with bank accounts.

**Request Body:**
```json
{
  "accountId": "5f464394-819d-451c-b8b1-942109b7bef5"
}
```

**Example Response:**
```json
{
  "success": true,
  "newTransactions": 5,
  "updatedAccounts": ["5f464394-819d-451c-b8b1-942109b7bef5"]
}
```

## Testing Legacy Endpoints

To test these legacy API endpoints:

1. Use the original Actual Budget client or a tool like Postman
2. Ensure you have a budget loaded first
3. Test the endpoints with appropriate parameters

**Note**: These endpoints are part of the original API but may not be fully implemented in the minimal-ui version of Odzai. Use with caution and refer to the original codebase for detailed implementation. 