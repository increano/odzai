# Actual Budget - Data Layer Analysis

## Storage Engine

Actual Budget stores all data in a **SQLite database** on the local device. Each budget file is essentially a SQLite file. This approach provides:

- **Performance** - Fast local queries without network latency
- **Reliability** - SQLite's proven stability and ACID compliance
- **Portability** - Same data format across platforms

### Platform-Specific Implementation

- **Desktop**: Uses actual `.sqlite` files stored in the user's application data directory
- **Web/Browser**: Utilizes **sql.js** (SQLite compiled to WebAssembly) combined with *AbsurdSQL*, an IndexedDB-backed virtual file system
- **Mobile**: Similar approach to desktop with native SQLite libraries

This implementation ensures that regardless of platform, the core logic interacts with SQLite via the same API, maintaining consistent behavior.

## Database Schema

When Actual is first set up, it creates a new database by copying a **default template** (`default-db.sqlite` in the `loot-core` package). This template contains:

- Base schema (tables, indexes)
- Initial data (default categories, settings)
- SQL views for common calculations

The database is then upgraded using migration scripts (found in `loot-core/migrations`) to match the latest schema version.

### Core Tables

The primary tables in the schema include:

- `accounts` - Account information (id, name, type, on-budget flag)
- `transactions` - Transaction records with indexed account references
- `categories` and `category_groups` - Budget categories and their groupings
- `payees` - List of transaction counterparties
- `rules` - Conditions and actions for auto-categorization
- `scheduled_transactions` - Templates for recurring transactions
- `budget_allocations` - Monthly budget amounts for each category
- `preferences` - User configuration settings

### SQL Views

Actual makes extensive use of SQL views (prefixed with `v_`) to provide computed data:

- `v_categories` or `v_budget` - Joins categories with monthly budget and transaction sums
- `v_account_transactions` - Account register with running balance calculations
- `v_reports` - Aggregated data for reporting purposes
- `v_payees` - Enhanced payee information with usage statistics

Using views allows the data model to evolve without changing application code, as views can be updated to maintain consistent API responses even if underlying tables change.

## Data Access Patterns

The core interacts with SQLite through a thin abstraction layer found in `loot-core/src/server/db`. Rather than using an ORM, Actual employs:

- Raw SQL queries for performance-critical operations
- Helper functions for common data access patterns
- SQL transactions for maintaining data integrity

### API Operations

The data layer exposes high-level functions through the API such as:

- `getAccounts()`, `getTransactions(accountId)`
- `getBudgetMonth(month)`, `setBudgetAmount(month, categoryId, amount)`
- `createTransaction(data)`, `updateTransaction(id, fields)`

These API methods handle the complexity of joins, calculations, and maintaining relationships between entities.

### Generic Query Support

Actual provides a `runQuery(q)` API that allows running arbitrary SQL queries for advanced use cases:

- Custom reporting needs
- Ad-hoc analysis
- Plugin functionality

## Persistence and Synchronization

### Local Storage

In local-only mode, data lives exclusively in the SQLite file on the device. Actual provides:

- Export/Import functionality for backups
- File-based portability between devices

### Sync Mechanism

When using the optional sync server:

1. Each client maintains its own complete database
2. Changes (SQLite write operations) generate sync messages
3. Messages are sent to the server with timestamp information
4. Other clients fetch and apply these messages to their local database
5. CRDT (Conflict-Free Replicated Data Types) ensures consistent merging

The sync server stores:
- A backup copy of each budget file
- A log of change messages for incremental sync
- Encrypted data that only clients with the correct key can decrypt

### Data Import

Actual supports importing from external sources:

- CSV files (bank exports)
- YNAB4/nYNAB (dedicated importers)
- QIF/OFX/QFX financial formats

Importers use the same data layer/API to insert accounts, categories, and transactions.

## Performance Considerations

Actual maintains performance with large datasets through:

- **Indexing** - Strategic indexes on frequently queried fields
- **SQL Views** - Pre-computed joins and aggregations
- **Local Processing** - Sub-millisecond query response times
- **Pagination** - For large transaction sets
- **Efficient Storage** - Integer amount storage (cents) instead of floating point

## Data Integrity

The data layer enforces constraints to maintain consistency:

- **Referential Integrity** - Foreign key relationships between tables
- **Transaction Atomicity** - Related changes grouped in database transactions
- **Undo/Redo Support** - Changes are recorded for reversibility
- **Data Validation** - Input validation before storage
- **Error Handling** - Graceful recovery from data issues

## Design Benefits

This data architecture provides several advantages:

1. **Consistency** - Same data model across all platforms
2. **Independence** - No server dependence for core functionality
3. **Scalability** - Efficiently handles years of transaction history
4. **Privacy** - Data remains under user control
5. **Flexibility** - SQL allows complex queries and calculations

The combination of local SQLite storage, CRDT-based synchronization, and a well-designed schema gives Actual a solid foundation for reliable personal finance management. 