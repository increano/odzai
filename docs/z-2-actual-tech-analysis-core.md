# Actual Budget - Core Architecture Analysis

## Overall Design

Actual Budget is built as a local-first application with a clear separation between the user interface (front-end) and the budgeting engine (back-end). The app runs a React-based front-end *and* a local in-browser or in-process database "server" concurrently, often termed the "frontend" and "backend" respectively. 

Unlike typical web apps, there is no remote central server for core logic – all budget computations happen locally for performance and privacy. This architecture prioritizes:

- User privacy (data stays on device)
- Performance (no network latency for calculations)
- Offline capability (works without internet connection)
- Data ownership (user controls their financial data)

## Key Components

### Loot Core
The core engine implementing business logic and data management. This is a shared module used on all platforms. It encapsulates:
- Budget logic and calculations
- Transaction processing
- Database access and management
- Business rules enforcement

Loot Core runs either in a web worker (browser) or a background process (desktop). The core exposes an API for the UI to perform operations like adding transactions, updating budgets, etc.

### Desktop Client (Web)
A React-based UI package (despite the name, it's essentially the web app UI). It:
- Renders views for Budget, Accounts, Reports
- Communicates with Loot Core for data operations
- Manages UI state and user interactions
- Provides a responsive interface that works on both desktop and mobile browsers

### Desktop Electron
An Electron wrapper that packages the web client and core into a desktop application. This component:
- Handles launching the local core process
- Establishes communication (via IPC or WebSockets) with the UI
- Provides native desktop features (file system access, notifications)
- Enables offline-first functionality

### Sync Server
An optional Node.js server for multi-device sync. Key characteristics:
- Stores a cloud archive of budget files and change logs (deltas)
- Does not store or process active budget data
- Clients push local changes using CRDT-based conflict resolution
- Provides a point-in-time backup for new devices to catch up
- Enables end-to-end encryption for privacy

## Primary Entities & Relationships

Actual employs an **envelope budgeting** model, with these core entities:

### Budget File
Represents a complete set of accounts and budgeting data. Users can have multiple budget files (e.g., personal budget, business budget) and switch between them. Each file corresponds to a separate SQLite database.

### Accounts
Financial accounts tracked in the budget (checking, credit cards, savings, etc.). Each account has:
- Unique identifier
- Name and type
- Currency
- On-budget/off-budget status
- Transaction list

Credit card accounts are treated as negative-balance accounts (debt), meaning the budget treats *cash minus credit debt* as funds available.

### Transactions
Individual financial records associated with accounts. A transaction includes:
- Identifier
- Account reference
- Date and amount (stored as integer in minor currency units)
- Optional payee and category
- Notes and status flags (cleared, reconciled)

Special transaction types include:
- **Transfers** - Linked transactions between accounts
- **Split Transactions** - Parent transactions with multiple sub-transactions for detailed categorization

### Categories
Budget categories function as "envelopes" for planning money. Categories:
- Are grouped into Category Groups (e.g., "Food" containing "Groceries" and "Restaurants")
- Have either Expense or Income designation
- Track budgeted amounts, actual spending, and available balances

### Budget Periods
Budgeting is organized by month, with allocations assigned to each category monthly. The system:
- Tracks budgeted amounts per category per month
- Computes derived values (available, overspent)
- Handles carryover of balances between months based on settings

## Internal Services

Loot Core contains specialized sub-services:

### Database Service
Manages direct access to SQLite, handling queries and migrations.

### Budget Service
Applies budget changes and computes envelope balances.

### Transaction Service
Handles creation and editing of transactions, splits, and transfers.

### Rule Engine
Applies payee rules for auto-categorization of transactions.

### Schedule Service
Generates transactions from scheduled templates when due.

### Sync/CRDT Service
Packages local changes into sync messages and merges incoming changes. Built on CRDTs (Conflict-Free Replicated Data Types) to handle concurrent edits without conflicts.

## Architecture Benefits

This modular architecture provides several advantages:

1. **Separation of concerns** - UI and business logic are cleanly separated
2. **Local-first performance** - No network latency for core operations
3. **Privacy by design** - Data stays on device unless explicitly synced
4. **Extensibility** - The core can be used without the official UI
5. **Cross-platform consistency** - Same core logic across all platforms

The architecture sets the stage for potential plugin development, custom UIs, and API-driven automation while maintaining the integrity of the core budgeting engine. 