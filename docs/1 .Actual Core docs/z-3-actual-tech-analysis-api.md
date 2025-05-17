# Actual Budget - API Layer Analysis

## Internal API Architecture

Unlike traditional web applications that expose REST or GraphQL endpoints, Actual Budget provides a JavaScript/TypeScript API in the form of an NPM package. This design choice aligns with Actual's local-first philosophy, where the API directly interacts with the local database rather than calling remote services.

### API Package

The `@actual-app/api` package allows programmatic access to the budget data and operations. It effectively runs Actual's core logic in a **headless mode**, providing the same methods the UI uses to manipulate budget data.

## Core API Functionality

The API exposes a comprehensive set of functions for managing the budget:

### Initialization

- `init()` - Initialize the core engine
- `loadBudget(fileId)` - Load a specific budget file
- `initConfig()` - Set up configuration options

### Account Management

- `getAccounts()` - Retrieve all accounts
- `createAccount(data)` - Create a new account
- `updateAccount(id, fields)` - Modify an existing account
- `closeAccount(id)` - Close an account

### Category Operations

- `getCategories()` - Get all categories
- `getCategoryGroups()` - Get category groupings
- `createCategory({...})` - Create a new category
- `updateCategory(id, fields)` - Update a category
- `deleteCategory(id)` - Remove a category

### Transaction Handling

- `getTransactions(accountId, [options])` - Get transactions for an account
- `createTransaction({...})` - Create a new transaction
- `updateTransaction(id, fields)` - Update a transaction
- `deleteTransaction(id)` - Remove a transaction

### Budget Operations

- `getBudgetMonths()` - List months with budget data
- `getBudgetMonth(month)` - Get budget data for a specific month
- `setBudgetAmount(month, categoryId, amount)` - Set budget allocation
- `setBudgetCarryover(month, categoryId, flag)` - Configure category rollover
- `batchBudgetUpdates(updates)` - Apply multiple budget changes efficiently

### Data Import/Export

- `runImport(file)` - Import data from external sources
- `exportTransactions()` - Export transaction data

### Rules and Payees

- `getPayees()` - List all payees
- `updatePayee(id, fields)` - Modify a payee
- `mergePayees(id1, id2)` - Combine duplicate payees
- `getRules()` - Get transaction rules
- `createRule(conditionActionObject)` - Create auto-categorization rule

### Meta Operations

- `sync()` - Manually trigger synchronization
- `undo()` - Revert last operation
- `redo()` - Reapply undone operation

## API Design Principles

The API is designed with several key principles:

1. **Local-First** - All operations run directly on local data
2. **Programmatic Access** - Provides complete control via code
3. **Performance** - Direct interaction with the database for speed
4. **Consistency** - Same API used by the UI and external tools
5. **Data Integrity** - Enforces business rules regardless of caller

## No Direct REST API

As clarified in Actual's documentation, *"Actual does not have a REST API with endpoints that you can just call"*. This design choice reflects the local-first nature of the application:

- The optional sync server is a relay for changes, not a full application backend
- It does not expose general budget manipulation endpoints
- External tools must use the API package rather than HTTP calls

## Internal Communication

Within the Actual app, communication between front-end and back-end occurs through a message-passing architecture:

### Web Implementation

- UI calls API methods through a web worker messaging system
- Core performs SQLite operations in the worker thread
- Results are returned to the UI via postMessage

### Electron Implementation

- Similar principle but implemented via IPC or WebSockets
- Core runs in a background process
- UI communicates through a channel to the background process

In both cases, the UI never directly reads or writes to the database - all data access is mediated through the API layer.

## Example Flow

When a user action triggers data changes:

1. UI dispatches a call to an API method (e.g., `api.createTransaction({...})`)
2. The request is serialized and sent to the core thread/process
3. Core receives the request and performs necessary database operations
4. Changes are recorded for sync and undo/redo capability
5. Core responds with updated data
6. UI updates its state to reflect changes

All operations happen locally and quickly due to the absence of network latency.

## External Integration Options

Because there is no REST API, external tools or plugins must:

1. Use the API library directly in a Node.js environment
2. Run within the Actual environment
3. Use community-built wrappers that leverage the API

Examples of existing integrations:

- **Python bindings** - `actualpy` wraps the HTTP interface to Actual Server
- **CLI tools** - `actual-budget-cli` automates Actual by talking to an Actual Server
- **Community scripts** - Various automation tools that use the API package

## Potential for Plugin Architecture

The API layer serves as a foundation for a potential plugin system:

- Plugins could use the existing API to interact with budget data
- A plugin SDK could wrap the API with permission controls
- Extension points could be added to the API for plugin hook registration

The clean separation between UI and core through this API boundary provides a strong foundation for adding plugin capabilities without modifying core internals.

## API Evolution

The API is designed to evolve while maintaining compatibility:

- New methods can be added for new features
- Existing methods maintain backward compatibility
- Versioning can manage breaking changes when necessary

For advanced queries not covered by high-level API methods, the `runQuery(sql)` function provides direct SQL access, offering flexibility while maintaining the API abstraction.

## Security Considerations

The API design has inherent security benefits:

- No network exposure of budget data
- Local execution limits attack vectors
- API calls can validate input and enforce constraints

For potential plugins, the API could be wrapped with permission checks to ensure plugins only access authorized functionality.

## Conclusion

Actual's API layer takes an uncommon but effective approach by providing a programmatic interface rather than a network service. This design:

- Aligns perfectly with the local-first philosophy
- Provides high performance through direct database access
- Maintains privacy by keeping data local
- Offers a foundation for extensibility through plugins or custom interfaces

This architecture makes Actual unique among financial applications and positions it well for future modular extensions while preserving its core strengths of speed and privacy. 