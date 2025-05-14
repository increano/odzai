# **Actual Budget Open-Source Architecture Analysis**

## **Core Architecture**

**Overall Design:** *Actual Budget* is built as a local-first application with a clear separation between the user interface (front-end) and the budgeting engine (back-end). The app runs a React-based front-end *and* a local in-browser or in-process database “server” concurrently, often termed the “frontend” and “backend” respectively. Unlike typical web apps, there is no remote central server for core logic – all budget computations happen locally for performance and privacy. Key components include:

* **Loot Core** – the core engine implementing business logic and data management. This is a shared module used on all platforms. It encapsulates the budget logic, transaction processing, and database access, running either in a web worker (browser) or a background process (desktop). The core exposes an API for the UI to perform operations like adding transactions, updating budgets, etc.

* **Desktop Client (Web)** – a React-based UI package (despite the name, it’s essentially the web app UI). It renders views for Budget, Accounts, Reports, and so on, and communicates with Loot Core for data. The UI is designed to be responsive and also serves as the interface on mobile browsers.

* **Desktop Electron** – an Electron wrapper that packages the web client and core into a desktop application. This mainly handles launching the local core process and establishing communication (via IPC or WebSockets) with the UI.

* **Sync Server** – an optional Node.js server (formerly in a separate `actual-server` repo) for multi-device sync. It stores a cloud **archive of the budget file and a log of changes** (deltas) rather than the primary live database. Clients push their local changes (using CRDT-based conflict resolution) to the server and pull updates from others. The Sync Server persists these change messages and a point-in-time backup for new devices to catch up. The Actual sync protocol is optimized for merging changes offline-first – only the changes are sent to the server, not every query or operation.

**Primary Entities & Relationships:** Actual employs an **envelope budgeting** model, so its core data entities revolve around budgets, accounts, and categories. The major entities include:

* **Budget File** – Represents a set of accounts and budgeting data (one “budget” can contain multiple accounts). Users can have multiple budget files (for example, different personal budgets) and switch between them. Each file corresponds to a separate SQLite database on disk.

* **Accounts** – Financial accounts (e.g. checking account, credit card, savings) tracked in the budget. Each account has an `id`, name, type (like “checking” or “credit”), a currency, and flags like on-budget/off-budget. Accounts hold a list of transactions. In Actual’s model, credit card accounts are treated as negative-balance accounts (debt), which means the budget treats *cash minus credit debt* as the funds available.

* **Transactions** – Individual financial transactions, each associated with an account. A `Transaction` has fields such as `id`, `account` (account ID), `date`, `amount` (stored as an integer in minor currency units, e.g. cents), optional `payee` (payee ID or name), optional `category` (category ID), `notes`, and status flags (`cleared`, `reconciled`). Transfers between accounts are handled via linked transactions: Actual creates two transactions (one in each account) that reference each other’s IDs (`transfer_id`) to keep them in sync. Transactions can also be split into sub-transactions for itemized budgeting of a single bank transaction – in the data model a parent transaction will have `is_parent=true` and contain an array of `subtransactions`, each with its own category and amount summing up to the parent’s total.

* **Categories** – Budget categories serve as the “envelopes” for planning money. Categories are grouped into **Category Groups** (for example, a group “Food” might contain categories “Groceries” and “Restaurants”). Each category has an `id`, a name, a group association, and is designated either as an **Expense** category or part of the single **Income** group (Actual allows only one income category group). Expense categories are the envelopes to which you assign money; the Income group is used to track incoming funds.

* **Budget Periods** – Actual’s budgeting is organized by month. For each month and each category, the user can assign a *budgeted amount*. The core stores these allocations and computes derived values like how much is available or overspent. In the database, there is a table (or logically, an entity) for “budget values” per category per month. The API exposes this via calls like `getBudgetMonth(month)` which returns a structured view of all categories for that month including budgeted amounts, expenses, balances, and goal info. If a category is overspent or has leftover money, Actual can either carry that balance over based on user settings (see *Carryover* below).

* **Payees** – List of payees or transaction counter-parties (e.g. vendor names, “Salary”, or special payees for transfers). Each payee has an `id` and name. Payees can have linking rules (for example, a payee may be marked as a transfer payee linking to an account).

* **Rules** – Actual includes a **transaction rule engine** for auto-categorization and renaming. Each rule (or “Payee Rule”) consists of conditions (like text match on payee or memo) and actions (such as set category or rename payee). These rules are evaluated typically when importing or adding transactions. For example, you can create a rule that if payee name contains “Starbucks”, set the category to “Coffee”. Rules are stored in the budget and can be managed via the UI’s *Payee Rules* section.

* **Scheduled Transactions** – Also called *Schedules*, these represent recurring transactions (bills, paychecks, etc.). A schedule has details like next due date, frequency (e.g. monthly on the 1st), template payee/category/amount, and it can auto-post a transaction when due. Schedules live in their own table and the core service is responsible for generating real transactions from them either automatically or when the user triggers it (e.g. “enter this scheduled transaction”).

* **Others:** There are additional supporting entities like **Account balances** (often derived from transactions), **Category goals** (if the user sets a target or uses templates), and internal constructs for **syncing** (such as sync “messages” or a log of changes).

**Entity Relationships:** The relationships are straightforward: Accounts have many Transactions; Category Groups have many Categories; Categories are referenced by Transactions (each expense transaction may link to a category, incomes might link to an income category or no category if treated as global income); Payees are referenced by Transactions and can have a default category (via rules). Transfer transactions link two accounts’ transactions together. There is also a notion of all accounts contributing to an aggregate “budget available” pool: essentially, Actual sums the balances of all on-budget accounts (plus any budgeted credit accounts considered as negative) to compute the total funds available to budget. This ties into how the “To Be Budgeted” amount is calculated each month (net money available after budgeting all categories).

**Budget Allocation Logic:** Actual implements **zero-sum envelope budgeting**. Every dollar of income is given a job in some category, and you cannot budget more than you have on hand. When new income (e.g. a paycheck transaction categorized as Income) occurs, it increases the pool of money available to budget. The core logic ensures that the sum of all category budgets in the current month cannot exceed the available funds (otherwise, you’ll see a negative “To allocate” amount). Key aspects of the budgeting logic include:

* **Monthly Budgeting** – Users assign amounts to each category for the month. Actual likely stores these in a table keyed by `(month, category_id)` with the budgeted amount. The *Budget view* in the UI shows, for each category and month: *Budgeted*, *Activity* (sum of transactions in that category for that month), and *Available* (remaining balance). The core computes *Available* as `last month’s remaining + this month’s budgeted + incoming transfers - spending` for each category. These calculations happen via SQL queries or *views* that join the budgets and transactions. In fact, Actual uses SQL **views** (table-like queries) prefixed with `v_` to simplify these computations for the UI. For example, a view might aggregate all transactions by category and month so that the UI can quickly fetch “amount spent per category per month” without complex logic in JavaScript.

* **Envelope Enforcement** – If you overspend a category (activity exceeds budget), Actual will show a negative available balance for that envelope. By default, Actual handles this by reducing the *overall funds available* (akin to YNAB’s method of “debt in a category reduces money available to budget elsewhere”). The user can also toggle **carryover** on a category (the *Carryover* flag, sometimes called *Rollover*). If *carryover* is enabled via `setBudgetCarryover(month, categoryId, true)`, then overspending can be carried to next month (or leftover can carry forward). If carryover is off (the default for credit card payments or certain categories), overspending will simply reduce that month’s available-to-budget, resetting the category to 0 next month. These options allow flexibility in handling negative category balances. Additionally, Actual supports a feature to **hold funds for next month**: a user can choose to not allocate some money this month and explicitly carry it to next month’s pool using `holdBudgetForNextMonth`. This essentially earmarks leftover money so it doesn’t get counted as “available” in the current month.

* **Goals and Templates** – Actual is adding budgeting “goals” and provides **budget templates** that automate monthly allocations. For example, a template like `#template 100` on a category will automatically fill in $100 budgeted each new month. These templates (goals) are stored in the category settings and the core applies them when a new month starts (or on command). While full goal-tracking (like “save $X by December”) is under development, the current system covers repeating targets. The UI indicates progress toward goals (e.g. if you set a monthly savings goal, it might show if you’ve budgeted enough).

* **Reconciliation** – Actual helps reconcile account balances with bank statements. The core doesn’t use double-entry accounting, but it provides tools for reconciliation. When a user marks transactions as cleared and inputs a statement balance, Actual will compute the difference and can automatically create an *adjustment transaction* if needed to true-up the account (for instance, adding an “Adjustment” transaction so that the account balance in the app matches the real-world balance). Reconciliation status (cleared/un-cleared) is a field on transactions, and accounts track a running cleared balance vs. uncleared for display. This functionality is mostly at the UI level (the “Reconcile” dialog) but it leverages core operations (creating transactions).

**Internal Services:** The Loot Core module contains sub-services that handle specific domains:

* **Database Service** – manages direct access to the SQLite DB (queries, migrations, etc. under `loot-core/src/server/db`).

* **Budget Service** – applies budget changes and computes envelope balances (likely via SQL views or helper functions).

* **Transaction Service** – handles creation/editing of transactions, splits, transfers (enforcing that a transfer creates the paired transaction).

* **Rule Engine** – applies payee rules. For example, upon adding/importing a transaction, the core can check the list of rules and auto-modify the transaction’s payee or category if conditions match. (This might be triggered on transaction import or when the user clicks “Apply Rules”).

* **Schedule Service** – generates transactions from scheduled transactions when due. It likely runs when the app starts or on a schedule tick (for the web, perhaps on load; on the desktop, maybe a background timer) to insert any past-due recurring transactions.

* **Sync/CRDT Service** – packages local changes into sync *messages* and merges incoming messages from the server. Actual’s sync is built on CRDTs (Conflict-Free Replicated Data Types) under the hood, meaning changes from different devices can merge without conflicts. Each user action (like “edit transaction X amount from 50 to 60”) produces a message describing that change, which is assigned a timestamp (using Hybrid Logical Clocks, as per the Actual design discussions) to order events consistently across devices. The *crdt* package in the repo implements this merging logic. This service ensures that if you edit your budget offline on two devices, when both sync, all edits are applied without data loss – for example, edits to different transactions or different fields will both reflect. If the same field is edited in two places, the later timestamp wins (but all changes are recorded in the history for undo).

In summary, the core architecture is modular: **Loot Core** encapsulates all fundamental logic (data storage, sync, budget math), enabling the UI to remain relatively thin. This modularity is intentional, as evidenced by the separate *api* package and the design of running the core in a worker process. It sets the stage for reusing the core engine in different contexts (CLI tools, headless automation, or a custom UI) without needing the official UI. The next sections will delve into how data is stored and accessed, and how the UI and potential plugins interact with this core.

## **Data Layer**

**Storage Engine:** Actual Budget stores all data in a **SQLite database** on the local device. Each budget file is essentially a SQLite file. On desktop, this is an actual `.sqlite` file stored in the user’s application data (or a chosen location for custom files). On web (self-hosted server or in-browser use), Actual utilizes a web-compatible SQLite. Specifically, it uses **sql.js** (SQLite compiled to WebAssembly) combined with *AbsurdSQL*, an IndexedDB-backed virtual file system, to persist the database in the browser’s storage. This allows the same SQLite schema and queries to run in a browser environment, treating the browser’s IndexedDB as disk storage for SQLite pages. The result is that whether on desktop or web, the core logic interacts with SQLite via the same API, ensuring consistent behavior.

**Database Schema:** When Actual is first set up, it creates a new database by copying a **default template** (`default-db.sqlite` in the `loot-core` package). This default has the baseline schema (tables, indexes, some initial data for categories, etc.). Then a series of migration scripts are run to upgrade the schema to the latest version. The migrations (found under `loot-core/migrations`) apply changes like adding new tables/columns for features introduced in updates.

Some core tables in the schema (deduced from the app’s domain) likely include:

* `accounts` – storing account info (id, name, type, onBudget flag, etc).

* `transactions` – storing transactions (with fields as discussed). Likely an index on account ID for quick retrieval of an account’s register.

* `categories` and `category_groups` – for budget categories and their grouping. Possibly a field marking the group as the special “Income” group.

* `payees` – list of payees, including possibly a flag if a payee represents a transfer to a specific account (transfer payees might have an embedded account reference).

* `rules` – conditions and actions for the auto-categorization rules. Could be split into tables for rule definitions and rule conditions, or serialized JSON in a single field.

* `scheduled_transactions` – storing recurring transaction templates (with next due date, frequency, etc).

* Budget allocation tables – The schema likely has tables to track budgeted amounts and any carryover flags. Common designs might be a table `budget_allocations` with columns: month (YYYY-MM), category\_id, amount, carryover (boolean). There could also be a table for tracking “holds” (funds held to next month) or that might be integrated in the allocations table as a special category or flag.

* `knobs` or `preferences` – possibly a small table for user preferences flags (like whether to enable certain experimental features, currency format, etc), though these might also be stored in a JSON config outside the DB. Actual seems to sync some preferences (noted by “SyncedPrefs” in release notes) so they likely live in the DB.

* `files` – if the database supports multiple budget files within it, but more likely each file is separate so this may not exist in the schema. However, the sync server’s database likely has a table for budget files and user info, whereas the client’s DB is just one file’s data.

**Views and Derived Data:** Actual’s use of **SQL views** is a notable part of the data layer design. The database defines several views prefixed with `v_` (virtual tables) that present computed data for convenience. These are regenerated on each app start to match the current schema and business rules. For example, instead of the UI or API manually joining tables and doing math for budget balances, the DB has:

* `v_categories` or `v_budget` view – likely joining categories with their monthly budget and transaction sums, yielding fields like “budgeted”, “spent”, “available” for each category in the current month. This allows a simple `SELECT * FROM v_budget WHERE month = ?` to get the entire budget view.

* `v_account_transactions` – a view to get an account register with running balance. Actual’s Tips & Tricks mentions a *running balance* column in the UI, which implies a query that calculates the cumulative sum of transactions. The view can compute the running total for each transaction row by window functions or a self-join. This saves the UI from iterating and summing in JavaScript.

* Possibly `v_reports` or specific views for reports that aggregate data (like spending per category per month for trends, etc.).

* `v_payees` might join payees with some info like last-used category.

Using views means the **data shape can evolve** without changing app logic – if field names or formulas change, they update the view definition rather than the application code. This is particularly important because the sync engine references raw tables/fields by name; views allow the UI to use consistent names even if underlying schema changes (the migrations will update the view queries accordingly).

**Data Access Patterns:** The core interacts with SQLite through a thin abstraction. In `loot-core`, under `src/server/db`, there are likely modules for querying. Actual might not use an ORM; instead it uses raw SQL queries or a query builder to retrieve and manipulate data. For example, adding a transaction might execute an `INSERT INTO transactions ...` and then update related balances or mirror a transfer pair. Because the data layer is local, these queries are fast and can be done synchronously in the background thread.

For read operations, the **API layer** (discussed next) provides high-level functions like `getAccounts()`, `getTransactions(accountId)`, `getBudgetMonth(month)` etc., which internally run one or more SQL queries (often hitting the views described). There is also a generic `runQuery(q)` API that allows running arbitrary queries – in practice, this can be used for ad-hoc analysis or by advanced features (for example, a custom report could use `runQuery` to retrieve needed data).

**Persistence and Sync:** When running with the optional sync server, the **data files** (SQLite databases) are still primarily on each client. The server itself stores a copy of each budget file’s database for backup and to help new device onboarding. However, day-to-day sync uses a message log: the core records every change (each SQL write operation can produce a sync message, essentially a diff or an operation like “insert transaction X” with details). These messages are sent to the server and stored. Other clients fetch the new messages and the core applies them to its local DB (via SQL operations). Thanks to CRDT, even out-of-order messages or concurrent edits are resolved. Actual uses a **Hybrid Logical Clock (HLC)** timestamp on each change to sequence them globally. The *crdt* module likely stores a metadata table (e.g. a table for sync state, last seen timestamp from each peer, etc.) to manage this.

**Offline and Local-Only Use:** In pure local usage (no sync), the data just lives in the SQLite file on disk. Actual encourages users to take backups (and offers an Export/Import feature to save the whole budget file). The data layer also supports **importing from other sources**: for example, Actual has official importers for YNAB4/nYNAB that read those files and populate the SQLite with equivalent data. Those import tools (found in the repo or as separate packages) utilize the same data layer/API to insert accounts, categories, and transactions from external files.

**Performance:** Using SQLite means Actual can handle a large number of transactions efficiently. Complex filtering (searching transactions, etc.) can be done in SQL. The app likely uses database indexes on important fields like `transactions(date)` or `transactions(imported_id)` (to prevent duplicate import) to keep queries fast. Moreover, because all data is local, there’s virtually no latency in queries – the UI can get sub-millisecond responses from the core for most calls, contributing to Actual’s snappy feel.

**Data Integrity:** Actual’s core enforces certain constraints to maintain consistency. For example, it may enforce via code or triggers that:

* Deleting a category might prompt to reassign or remove related transactions (or perhaps it “tombstones” the category and keeps it for historical data).

* Changing an account’s on/off-budget status might not be allowed after creation (there’s an FAQ noting it can’t be changed later) because it would mess up past budget calculations.

* Each transaction’s amount is stored as an integer (cents) to avoid floating issues.

* All operations that modify data are recorded for undo/redo. The core likely wraps changes in an internal transaction log so that it can revert them if needed. (For instance, adding a transaction can be undone by deleting that transaction; the core keeps an undo stack in memory.)

In summary, Actual’s data layer is a **single-source-of-truth SQLite database**, accessed through a well-defined interface. This gives it the reliability of a SQL relational model (with transactions and constraints), while the product leverages views and careful migrations to adapt the schema as features evolve. The combination of *AbsurdSQL* for browser storage and normal SQLite for desktop/mobile ensures consistency across platforms. This solid foundation allows the API and UI to work with high-level data (accounts, categories, etc.) without worrying about low-level storage details.

## **API Layer**

**Internal API (JavaScript):** Instead of exposing a traditional REST or GraphQL API, Actual provides a JavaScript/TypeScript API in the form of an NPM package. This API can be used in a Node environment (or in the browser console of the app) to programmatically drive Actual’s engine. It essentially runs Actual’s core logic in a **headless mode** – spinning up the Loot Core without the UI – and lets you call the same methods the UI uses. According to the docs, the API package “allows programmatic access to the budget” and lets you perform most operations available in the UI. For example, methods include:

* `init()` / `loadBudget(fileId)` – Initialize the core and load a specific budget file (or the default one).

* **Account Methods:** `getAccounts()`, `createAccount(data)`, `updateAccount(id, fields)`, `closeAccount(id)` to manage accounts.

* **Category & Group Methods:** `getCategories()`, `createCategory({...})`, `updateCategory(id, fields)`, `deleteCategory(id)`, similarly `getCategoryGroups()` etc..

* **Transaction Methods:** `getTransactions(accountId, [options])`, `createTransaction({...})`, `updateTransaction(id, fields)`, `deleteTransaction(id)` – and behind the scenes, these handle splits and transfers appropriately. (The API likely has convenience such that creating a transfer requires just one call with a special payee and the system links the two accounts’ entries).

* **Budgeting Methods:** `getBudgetMonths()` to list which months have data, `getBudgetMonth(month)` to retrieve the full budget data for that month (including all categories’ status), `setBudgetAmount(month, categoryId, amount)` to set the budget allocation for a category, `setBudgetCarryover(month, categoryId, flag)` to mark whether that category should rollover surplus/deficit, and `batchBudgetUpdates(updates)` for applying many changes at once (useful when auto-filling a template across categories).

* **Transactions Import/Export:** `runImport(file)` can be used to import data (the YNAB import tool uses this under the hood). `exportTransactions()` or a combination of `getTransactions` per account is used to export data (the CLI tools use these to, say, dump all transactions to CSV).

* **Payees and Rules:** `getPayees()`, `updatePayee(id, fields)`, `mergePayees(id1, id2)` (to combine duplicates); `getRules()`, `createRule(conditionActionObject)`, etc. The rule structure (ConditionOrAction in docs) allows creating rules that Actual will apply automatically.

* **Meta Operations:** `initConfig()` to set up config (perhaps path for storage, etc.), `sync()` to manually trigger a sync with the server, `openURL()` if needed (maybe not part of headless), and critically `undo()` and `redo()` to programmatically trigger undo/redo operations in the core (Actual supports unlimited undo in a session).

This **API package is essentially the same interface the Actual UI uses internally**, just exposed for external use. It is “battle-tested” as it drives the front-end itself. If a developer wants to integrate or automate Actual, they can install the `@actual-app/api` package and use these functions instead of calling REST endpoints. This approach was chosen because Actual is local-first – there’s no always-on server with a REST interface to call, since your data lives on your device. By providing a library, Actual enables scriptability while keeping all operations local.

**No Direct REST API:** As clarified in the FAQ, *“Actual does not have a REST API with endpoints that you can just call”*. This is a deliberate design choice due to the local-first nature. The optional sync server is not a full application backend – it’s more of a relay for changes (and a backup store) and does **not expose general budget manipulation endpoints**. In other words, you cannot (for example) send an HTTP POST to the sync server to create a transaction in a budget. The server wouldn’t know how to merge that properly, since the logic for applying changes lives in the client. Instead, any automation or integration must either run inside the Actual app’s context or utilize the API package to load the budget in a headless way and manipulate it using the core logic.

**Internal Communication:** Within the Actual app, the front-end and back-end communicate via an RPC-like layer. In the web app, when the UI calls an API method (like `createTransaction`), under the hood it posts a message to the web worker running the core, the core performs the SQL writes, then responds (often with updated data or an acknowledgment). This likely happens via a web worker `postMessage` API or a lightweight RPC library. In the Electron app, the principle is the same but implemented with IPC or a local WebSocket – the core runs in a background process, and a WebSocket channel carries JSON-RPC calls between the UI and core. From the perspective of the React UI code, it might not matter if it’s a web worker or a WebSocket – they probably have an abstraction such as `api.call(method, args)` that sends the request to whichever backend is active. This design means the UI never directly reads the SQLite file or writes data; it always goes through the core’s API.

**Example Flow:** If a user enters a new transaction in the UI, the UI dispatches (via Redux or a controller) a call to `api.createTransaction({...})`. The API layer serializes this request and sends it to the core thread. The core receives it, inserts the transaction into the DB (and if a transfer, inserts the paired transaction and links them, if split, inserts subtransactions, etc.), updates any derived info (like account balance, maybe budgets if it’s income), stores a sync message for later, and then responds back with the new transaction’s details (including the assigned `id`). The UI then updates its state (adds the transaction to the list) and the change is visible. All of this happens very quickly because it’s just a local call.

**Feasibility for External Plugins:** Because there is no REST API, **external tools or plugins must run within the Actual environment or use the API library**. This is how community contributions function today. For instance, there are Python bindings (`actualpy`) that simply wrap the HTTP interface of Actual Server to download/upload the raw budget file or use the API library through Node. Community CLI tools (like `actual-budget-cli`) actually start an Actual instance in the background or talk to an Actual Server that is running somewhere (they provide `SERVER_URL` and `SERVER_PASSWORD`) and then call methods – effectively automating Actual from outside by treating the Actual Server like a headless host. It’s important to note: Actual Server itself, when running, likely exposes a minimal HTTP API for the Actual web app to connect to it (for example, to download the encrypted budget file or to submit sync messages). But that API is not documented for general use, and the recommended way is still to use the official JS API or one of the wrappers.

For a plugin architecture, this implies that **trusted code** (like a plugin script) could load the `actual` core and call these API functions to interact with the data. The API covers most needs, but for advanced analysis, one can also query the DB directly via `runQuery` or by opening the SQLite file in read-only mode. Indeed, *ActualQL* (a term mentioned in docs) likely refers to using SQL for custom queries – advanced users or plugins can leverage SQL for things not yet in the high-level API.

**Internal Service Communication:** Besides UI-core interaction, within the core itself services may communicate. For example, when a sync message arrives (perhaps via a WebSocket from Actual Server), the sync service will apply changes to the database, and then likely notify the UI to refresh data. Actual might use an event emitter or simply rely on the UI polling certain endpoints (some apps have a subscription mechanism, but given it’s local, the UI can afford to refresh on every user action or on a timer for sync). The UI does have a real-time feel, so presumably when a transaction is added or budgets changed (whether locally or from a sync), the core pushes an update. Possibly the UI store subscribes to certain data and the core triggers a callback. The specifics are not documented, but one could imagine an event like `onDataChange('transactions', handler)` that the UI uses to know when to fetch new data.

**API for Plugins vs. API for UI:** They are essentially the same. Any future plugin SDK (Phase 2 in the roadmap) would likely be a thin wrapper around this existing API, possibly restricting certain calls (for security) or providing higher-level convenience. The good news is that Actual’s architecture already has a **clean separation and API boundary** – this is a strong foundation for adding plugins that can call core functions without hacking the internals.

In summary, the API layer in Actual is not a network service but a **programmatic interface**. It’s invoked internally by the UI and can be invoked by external code running on the user’s machine. This design favors local integration (safe and fast) and maintains user privacy (no need to expose data over a network). The trade-off is that integration from completely external systems (like an online service) is harder – one would have to run an Actual instance to use the API. However, for a plugin system within Actual or local scripts, the API layer is robust and sufficient.

## **UI Layer**

**Overview of UI:** Actual’s user interface is built with **React** (and related libraries), organized as the *desktop-client* package. The UI is structured around the main functionalities of budgeting:

* A sidebar for navigation and switching the primary view. The main views include **Budget**, **Accounts (All Accounts & individual account registers)**, **Reports**, and **Settings**, among a few others.

* **Budget View:** This is where users allocate their money to categories per month. It presents a table of categories (rows) vs. months (columns), focusing on the current month by default. Each cell shows budgeted amount, activity, and available balance for that category. Users can click a cell to edit the budgeted amount for that category and month. The Budget view also shows the aggregate “To Be Budgeted” amount (unallocated money) for the month and highlights any overspent categories or goals. The logic for summing up income minus budget allocations to compute the “left to budget” is handled here (or by the core view). If the user has set up goals or templates, the UI might visually indicate those (e.g., a category that should get $100 every month might show a marker if you budgeted less or more).

* **Accounts & Transactions:** This is essentially a checkbook register for each account. The UI lists transactions in a table with columns Date, Payee, Category, Memo, Amount, and Balance. Actual supports sorting by date and filtering. Users can add a transaction via an input form at the top or a floating “Add Transaction” button. When viewing “All Accounts”, it combines transactions from all on-budget accounts (often filtered by date or account). The *running balance* column can be toggled to show how each transaction affects the account balance – the UI calculates this using the data from the core (which might supply running balance via view or the UI can reduce).

* **Reports:** Actual includes various reports (Net Worth over time, Spending by Category, Income vs Expense, etc.). The Reports UI likely generates queries to fetch aggregated data from the DB (like sum of spending per category per month) and then uses chart components to visualize it. These charts and tables are part of the UI layer (D3 or a charting library might be used). Each report view might have some controls (date range pickers, category filters).

* **Scheduled Transactions (Schedules):** A view where all recurring transactions are listed. Users can see upcoming bills or incomes, and there are options to add a new schedule or edit existing ones. The UI might highlight if something is due soon or overdue. Entering a scheduled transaction (posting it to account) is either automatic on due date or done via this UI by clicking e.g. “pay now”.

* **Payees Management:** A utility view to manage payees (merge duplicates, rename). This is mostly a CRUD interface on payees and their associated rules.

* **Transaction Rules:** A UI to create and edit the auto-categorization rules. Likely shows a list of rules with conditions (“if Payee contains X and amount \< Y”) and allows editing their outcomes (“set category to Z”). This interface ties closely with how transactions are processed but editing rules here doesn’t immediately affect data until new transactions come in.

* **Settings:** Contains configuration like currency, date format, and perhaps options like “warn on overspending” or experimental feature toggles. Some settings (like enabling an experimental feature) might enable hidden UI elements or back-end options.

* **Files Menu:** In the web app and desktop app, there’s an interface to manage budget files (open, create, close budgets). For example, “Close file” and “Open another file” in the app (Cmd+O is a shortcut). This is part of the UI logic to let users maintain multiple budgets, though under the hood it just means switching the SQLite database in use.

**State Management:** The Actual UI uses a global state store to manage UI state and some app state. It was originally built with custom state logic, but recently the project has been migrating to **Redux Toolkit** for state management. The codebase now has Redux “slices” such as accountsSlice, budgetsSlice, preferencesSlice, etc., that handle state updates in a structured way. Redux is used for things like:

* The list of accounts and transactions currently loaded (to easily share between components and implement things like the “All Accounts” combined view).

* UI state like which month is currently selected on the budget view, which account is open, visibility of dialogs (e.g., “Edit transaction” dialog), and undo/redo history state.

* User preferences (some may be synced, some just in UI memory).

* Perhaps caching some derived data from the core to avoid re-querying too often. However, since the core is fast, the UI might also just call the API on demand instead of caching everything.

The UI components are mostly presentational, relying on the API calls to do heavy lifting. For example, the Budget table component will render categories and allow editing amounts, but when an edit occurs, it dispatches `setBudgetAmount(month, catId, value)` via the API and then waits for new data (or optimistic update in Redux state) to reflect the change. The accounts register might pull transactions via `getTransactions(accountId)` on mount, then subscribe to any changes (like if a new transaction is added via another component or sync, to refresh the list). The use of Redux slices suggests the app now has a cleaner separation where each domain’s data is in the store and updated by reducers when API calls return data.

**Coupling of Backend Logic in UI:** Ideally, the UI should contain minimal business logic. In Actual, most calculations are done in the core or via queries. However, there are a few areas where UI and logic intertwine:

* **Form Validation & Formatting:** The UI is responsible for formatting amounts (e.g., showing currency with 2 decimals) and parsing user input. The core deals with integer cents, but the UI must convert “$12.30” to 1230 internally. There is likely shared code for formatting (maybe a util in loot-core or a duplicated util in the UI). Recently, there was work to ensure consistent number formatting across Redux state usage. This indicates some logic about numbers existed in the UI state management and was refactored.

* **Undo/Redo UI:** The core supports undo/redo, but the UI implements how it’s triggered (keyboard shortcuts Ctrl+Z) and the *notification* or visual feedback for it. The desktop app can maintain a continuous undo stack (since the process stays alive), whereas the web app’s undo history is lost on page refresh (the memory is cleared). This implies the undo stack is kept in the application memory (likely in a Redux slice or a central history object in core) and not in the persistent DB. The UI must coordinate with core: e.g., when the user hits undo, the UI calls `api.undo()`, which will revert the last transaction or budget change, and then the UI refreshes to reflect that. The UI also may show an “Undo” toast notification after certain actions (“Transaction created – Undo?”).

* **Budget Math for Display:** While totals per category are via core, the UI might compute some aggregate displays. For instance, the “group totals” – category groups in the budget view show a summed total of all child categories. It’s possible the core view `v_budget` already provides group totals as separate rows (YNAB’s database did something similar), but if not, the UI would sum category values on the fly to display group-level budget/spending/remaining. Similarly, the UI might compute overall “Budget total vs Income” to show if you’ve budgeted every dollar.

* **Navigation & Derived UI State:** Some logic like determining which month’s budget to show (usually current month, but user can scroll to past/future months) is UI-only. The UI must also handle the logic of switching budget files (closing one DB and opening another through the API, then updating all state to new file’s data).

* **Interaction Logic:** The UI contains logic for things like “if the user marks a transaction as cleared, update the cleared balance, and if reconciling, prompt for adjustment”. This involves some decision-making in UI before calling the core. For example, on reconciliation, the UI compares the user-entered statement balance with the computed balance from core; if there’s a discrepancy, the UI decides to create an adjustment transaction via API.

* **Reports calculations:** Some report calculations might be done in UI for flexibility. However, since Actual has `runQuery`, the reports could also be implemented by simply running an appropriate SQL (for example, the Net Worth report might do `SELECT month, SUM(balance) FROM accounts_balances GROUP BY month`). It’s possible some simpler calculations (like trend percentages or charts formatting) happen in JS, but the heavy lifting (summing, grouping) can be done by the database and delivered via the API.

Overall, the **UI is mostly a thin layer** – most rules of budgeting (e.g. “don’t let user budget money they don’t have” or “link transfer transactions together”) are enforced in core. This means one could replace the UI without needing to rewrite those rules. For instance, if building a new UI, you’d rely on calls like `setBudgetAmount` to automatically enforce the zero-sum rule (the core will adjust the “to be budgeted” pool accordingly).

**Modularity of UI:** Since Actual’s front-end was designed to pair with its core, some parts of the UI are somewhat monolithic. If we want to *strip the UI to use only the engine*, we can. The desktop-client code can be removed entirely and replaced by a custom interface, as long as we still initialize Loot Core and use the API. A recommendation for modularizing the UI is to **separate presentational components from logic**. Many of Actual’s UI components could potentially be reused (they are React components for tables, forms, etc.). But they currently assume the presence of the Actual Redux store and API. One approach is to factor out a “UI kit” – e.g., a component for TransactionList that accepts data as props – but in Actual, it likely pulls from Redux state directly. To use these in a new app might require refactoring.

If creating a new UI, one should consider **which UI elements to carry over or rewrite**:

* The core logic (engine) we keep – no change there.

* The *visual components* like tables, dialogs, etc., could theoretically be reused, but detangling them from Actual’s specific state management might be more effort than writing fresh ones, depending on how they’re structured.

* Some UI parts are tightly tied to Actual’s workflows (like the reconciliation dialog). Those can serve as a reference for implementing similar functionality in a new UI.

* Any UI that is purely informative (reports, charts) can be reimagined; they use data from the core via queries, so a new implementation can call the same queries or even extend them.

**What to Strip/Modularize:** If the goal is to use Actual’s engine but replace the UI (Phase 1 of the roadmap), essentially the entire `desktop-client` can be seen as optional. However, within that, **one might retain** certain utility modules:

* **Icons, Styles, and UI Utilities:** Actual likely has a set of icons, CSS styles or a design system. Those could be reused to maintain a familiar look (if desired) or dropped if creating a completely new design.

* **Localization strings:** Actual is translated into multiple languages. The strings for UI labels are probably in the desktop-client. If you scrap the UI, you lose those translations, unless you build your UI also using their translation files.

* **Redux store logic:** If you plan to use some of Actual’s UI components, you might need parts of the Redux slices (for example, the logic for toggling dark mode, or the slice that caches “last opened page” etc.). But if making a clean break, you won’t need their store – you could call the API directly and manage your own state.

It could be wise to **modularize** the UI such that the core engine doesn’t depend on it at all (which is already the case: loot-core has no dependency on the UI). Likewise, the UI should only depend on the API, not on internal DB details – which it does, via the provided API functions.

**UI Extensibility:** The current UI does not have a plugin mechanism, but one can envision it. For example, the sidebar could allow extra sections (say a plugin “Investments” page). Or the transaction register could allow extra columns (if a plugin tracks extra metadata per transaction). At present, to do that, one would have to modify the source. There is no dynamic injection of components. But because it’s React/Redux, a plugin system could be designed to use React component composition or a registry to mount plugin components at certain extension points.

In summary, Actual’s UI is a modern web app layered on top of a powerful core. It cleanly separates concerns: almost all the state that matters for budgeting is in the database (and reflected via API calls), while the UI state (Redux) is mostly about presentation (current view, selection, etc.). **Replacing the UI** is feasible: one would replicate the key interactions by calling the same API functions. The existing UI codebase can serve as a guide for how to use the API (and even copy some helper logic), but you wouldn’t need to carry over any heavy business logic because that resides in the core.

For a new UI, one should strip out any direct DB access (Actual’s UI probably doesn’t do any, it goes through the API) and any assumptions about running inside Actual’s electron app. For instance, Actual’s UI might have some code that only runs when in electron (like for auto-updates or file menus). Those parts can be isolated or removed if not applicable. The end goal is a UI that is just a client to the Actual engine.

## **Plugin/Modular Potential**

Given Actual’s architecture, there are several points that could be leveraged to introduce a **plugin system** or modular extensions:

**Reusable Core Components:** The most reusable piece is the **Loot Core engine** itself. This is essentially an SDK already for budget data: it exposes methods to query and mutate budgets, and handles all the complex logic internally. A potential **Plugin SDK** would likely be a wrapper around these core APIs:

* The plugin author should be able to call functions like “create transaction” or “query budget data” without worrying about implementation – exactly what the API offers.

* Because the core is separated, one could even run it in a sandboxed context for each plugin if needed (though that might be heavy; more likely, plugins share the main core instance to see real-time data).

Additionally, other parts that are candidates for reuse/extensibility:

* **Report Generation:** The reporting system could be made pluggable. For instance, if someone wants to create a *new type of report* (say, a Cashflow Forecast report), a plugin could query transactions and budgets and present a custom UI. Actual could facilitate this by providing hooks or components – e.g., a plugin can register a new “Report” and the main UI will show it in the Reports section. Internally, there could be an API to supply data for charts (or just let the plugin directly use the core API).

* **Import/Integration Hooks:** Many community tools already integrate by running separate scripts (for bank sync, crypto tracking, etc. as listed in Community Projects). A formal plugin system could allow these to be inside Actual itself. For example, a plugin could add a “Sync with XYZ Bank” button in the UI. Under the hood, it might use an external API (requiring internet access) to fetch transactions, then use `api.createTransaction` to insert them. The core logic is flexible enough to accept transactions from any source. Reusable parts here include: the logic for matching imported transactions to existing ones (Actual tries to avoid duplicates via `imported_id` field), and the scheduling of such imports. The plugin SDK could expose a method to schedule periodic tasks (e.g., run every day to fetch new bank data).

* **UI Components & Theming:** If Actual’s UI components (tables, forms) are made modular, plugins could reuse them to build UI that feels native. For instance, if a plugin wants to present a new table of data, it could use Actual’s table component and styling. The team could expose a UI toolkit to plugin developers to ensure consistency. This might include currency formatting functions, date pickers, category selectors, etc., which are already in the app.

**Integration Points (Hooks):** To make the app extensible, we should identify where a plugin might want to insert logic:

* **On Transaction Creation/Update:** A hook after any transaction is added or modified. For example, a plugin might watch transactions and if one meets certain criteria, perform an action (like logging it externally, or splitting it further, etc.). Actual’s core could emit an event “transactionAdded” with details, and plugin listeners can react.

* **On Budget Change (month close/open):** A plugin might want to do something at the end of a month or beginning of a new month – e.g., carry over a specific category differently, or produce a summary report email. Hooks around month rollover or budget changes would enable that.

* **UI Navigation Hooks:** Allow plugins to register a new route or page. For example, “/investments” route that the plugin handles, or a new sidebar link that opens the plugin’s component.

* **Data Model Extension:** While harder in a relational DB, plugins might want to store custom data (like linking an Actual transaction to an external ID, or storing additional attributes per transaction). We could accommodate this by providing a key-value store or a dedicated plugin data table in the DB. For instance, a plugin could have a namespace to store JSON data keyed by transaction ID or globally. Another approach is to allow adding *custom fields* via the plugin (like a user-defined field “Project” for each transaction). That would involve altering the schema or having a generic entity-property table.

**Isolated Plugin Modules:** For safety and maintainability, plugins should ideally run in isolation:

* **Sandboxing:** Given Actual is an Electron/web app, plugins (which are essentially arbitrary code) could be sandboxed in a separate JS context. For example, each plugin could run in a Web Worker (web) or separate process (desktop) and communicate via a defined message protocol. This would prevent a buggy or malicious plugin from freezing the UI or directly manipulating internal state in unsupported ways. The plugin would request actions via the API (which can enforce permissions).

* **Permission Model:** The platform can grant plugins certain permissions: e.g., a plugin might declare if it needs to access the internet, or read/write transactions, or just read data. Then the user can approve these. This is important for privacy – e.g., a plugin that sends data to an external service should be vetted. By default, a plugin might only have read access to budget data unless it explicitly needs write access.

* **Plugin Manifest & Loading:** Each plugin could have a manifest file (with name, version, permissions, entry point, etc.). Actual can load installed plugins at startup, perhaps placing their front-end components into an iframe or container if in web, or dynamically importing their code (with sandbox). Using a technology like module federation or a plugin loader that does `import('plugin.bundle.js')` at runtime could work (Electron allows dynamic require of packages if enabled, but that might be unsafe without sandbox).

* **Events and API Access:** The plugin API would essentially mirror what we described: functions to get data and perform actions, plus event subscription for core events (transaction added, etc.). The core can provide an object to the plugin context that has these methods, rather than letting the plugin directly import the core modules (which could tempt them to call private functions). This way, core can validate and maybe log what plugins do (for debugging or auditing, e.g., one could see that plugin X created a transaction).

**Potential Plugin Types:** We can envision a few types of plugins:

* **Data Importers/Syncers:** e.g., a plugin that connects to a bank API or another financial service and imports transactions or balances regularly.

* **Automation/Workflow:** e.g., a plugin that adds a “Bill Pay Calendar” view, or automatically transfers leftover budget from one category to another at month’s end according to user rules (beyond Actual’s built-in carryover).

* **Integrations:** e.g., connect Actual with third-party apps – maybe update a Google Sheet with budget totals, or send notifications via email/Slack when certain events happen (big transactions, budget thresholds).

* **UI Extensions:** e.g., a dashboard widget plugin that shows a custom metric (“fireyness” of your spending), or a new report type (maybe a plugin that does an advanced investment performance report if you track investments in Actual).

* **Analytics/AI:** e.g., *Actual AI* (community project) which categorizes transactions using AI could be a plugin that runs locally or calls an API to label transactions.

Given the modular core, many of these can be done without modifying Actual’s source, if a plugin system existed to tap into it.

**Scaffolding for Plugins:** To support plugins, the Actual project could implement:

* A **Plugin Manager UI** in Settings where users can install/uninstall plugins. This could fetch plugins from a registry (marketplace) or allow manual loading (pointing to a plugin package file).

* A **Marketplace/Registry** (Phase 3 talks about monetization, so likely a curated store). Plugins would be submitted, reviewed (for security), and listed with user ratings perhaps. Users might install plugins through the app or by placing plugin files in a folder.

* Under the hood, a **dedicated directory or database table** for plugins. For instance, an `extensions` folder where each plugin has its own subfolder with code and manifest. On startup, Actual could scan this and load each plugin.

* **Version compatibility checks:** since core updates could break plugins, the manifest should declare which Actual version it supports. Actual could disable incompatible plugins if the core API changes.

* **Testing Sandbox:** Perhaps a mode to run a plugin in an isolated environment to test its behavior (to ensure it doesn’t do something harmful). This is more on the dev side, but worth noting for security.

**Integration with 3-Phase Roadmap:**

* *Phase 1 (Core setup, replacing UI):* Here, focus is to get Actual’s engine running with minimal UI – possibly just a basic interface or none at all, if the intent is to use it headlessly first. The outcome of Phase 1 is essentially *Actual as a service* (the API is running, maybe accessible via a simple placeholder UI or CLI) ready to accept plugins or a new UI. In this phase, no plugin system exists yet, but laying the groundwork is key: ensure the core can start and operate independently of the old UI. This might involve writing a small harness to launch Loot Core and keep it running (if not using the full electron app).

* *Phase 2 (Plugin SDK & internal modules):* Develop the infrastructure described above: define how plugins will be structured, create a *Plugin API* object that wraps core API safely, and define hook points. You might implement one or two sample plugins to prove the concept (for example, a plugin that logs every transaction to console, or one that adds a dummy report). Also, some existing features of Actual could even be turned into internal plugins to test modularity – for instance, the *bank sync feature (if Actual has native bank sync via Plaid or similar)* could be refactored as a plugin using the same SDK. That ensures the SDK can handle real needs. This phase involves a lot of internal refactoring: introducing an event bus in the core for plugin hooks, ensuring the UI can dynamically load plugin UIs, etc.

* *Phase 3 (Extensible UX & Marketplace):* With the foundation in place, focus on the UX for discoverability and management of plugins. Build the marketplace integration (could be as simple as a curated list that the app can fetch, or a full store with purchasing if monetization is a goal). For monetization, consider a model (maybe similar to VSCode or Obsidian where most plugins are free, but some could be paid). The marketplace could handle licensing, or one could rely on an external payment and provide the user a key to unlock a plugin. Security is paramount here: users should trust that installing a plugin from the marketplace won’t steal their data – hence curation and sandboxing. The UX should also allow enabling/disabling plugins easily, updating them, and perhaps configuring them (each plugin might have its own settings panel).

In essence, Actual is well-suited to become a **platform** for personal finance because of its strong core. The plugin approach would amplify community contributions (which currently exist as external scripts) by bringing them into the app in a seamless way. The existing modular structure (with an API package and separation of concerns) will simplify integration of a plugin system, but careful thought is needed for security and consistency.

## **Security & Privacy**

**Current Data Security:** Actual is designed to be secure and private by default, since all data lives locally under user control. The application does not send your financial data to any company servers. When using the sync server, Actual takes measures to protect data:

* **End-to-End Encryption:** The sync messages and backup stored on Actual Server can be encrypted with a user-provided key so that the server operator cannot read the budget contents. In practice, the “sync password” a user sets up is used to encrypt the data. Actual’s FAQ and docs indicate that *“all your data is fully local and can be encrypted with a local key, so that not even the server can read your statements”*. This means the changes pushed to the server are likely encrypted blobs, and only clients with the key can decrypt them. (If the user doesn’t set an encryption password, at least a server password is required to authenticate, but data might be in plaintext on the server – the recommended setup is to use encryption for full privacy).

* **Authentication:** The Actual Server requires a password (as seen in the CLI `.env` configuration, `SERVER_PASSWORD`) to prevent unauthorized access. This password gates who can sync or download the data. In a self-hosted scenario, this is akin to an API key for your personal server.

* **Local Access:** On desktop, the SQLite database is stored in the user’s profile (or a user-chosen location). It inherits the OS file system permissions. There is no additional encryption on disk by default (the user could store their budget on an encrypted drive for extra security). Actual does not yet integrate OS keychain or require a password to open the app (though that could be a feature—some users might want a “passcode” to open the budget file, which would essentially encrypt the SQLite with SQLCipher).

* **Backups:** Actual allows exporting your budget (which produces a plaintext JSON or another SQLite). Users should keep those safe. The app itself can automatically backup data to a file. If plugins are allowed, one might need to consider securing those backups (a malicious plugin shouldn’t silently export your data).

**Code Security:** Since Actual is open-source, its code is audited by the community and any vulnerabilities can be spotted. Running it locally reduces many typical web app risks (like server-side breaches, SQL injection attacks on a server, etc., since there is no multi-tenant server). However, being a local app doesn’t eliminate all risk:

* Actual’s use of Electron means it has a Chromium browser context and Node integration for the core. The maintainers have to ensure that the boundary between UI and Node is secure (they likely do not expose Node APIs directly to the UI except what’s needed, to mitigate risk of XSS leading to full system access).

* The app does load data from possibly untrusted sources (for example, importing a CSV or connecting to a bank API via a community script). There is some inherent risk if an import file is crafted maliciously, but since it’s not an automated interface, this is low.

**Third-Party Module Integration (Plugins) Security:** Introducing plugins raises new security considerations:

* **Review and Sandboxing:** Each plugin is third-party code that runs with the same privileges as the app (if not sandboxed). If unrestricted, a plugin could read all your budget data and potentially send it to a remote server without you knowing. It could even read any file your user account has access to, since the app can use Node file APIs. Mitigating this is crucial. We should implement a *sandbox for plugins*. For example, run plugins in a Web Worker with no direct DOM or Node access – they would only communicate via message with the main app. The plugin API can be the only interface they have. This way, if a plugin tries to do something forbidden, it simply has no capability to do so (e.g., the plugin environment doesn’t include a `fetch` to call external sites, unless we explicitly provide a controlled fetch).

* **Permission prompts:** The app can adopt a permission model like a mobile OS: when a plugin needs to perform a sensitive action (access internet, open an external link, etc.), it should request permission from the user. The user would see a prompt, e.g., “Plugin X wants to connect to api.bank.com – Allow or Deny”. This puts the user in control and aware of data leaving the app.

* **Data Access Limitations:** Not all plugins need full read-write access. Some might only need read-only access to certain data. The plugin SDK could enforce this. For instance, a report plugin might declare read-only access, so the API object it gets only allows `get` calls and no `create/update` calls. A plugin that needs to add transactions would declare write access. The core could maintain an access control list internally to reject calls from plugins that are not permitted (though if plugins run in the same process, they could circumvent unless thoroughly sandboxed).

* **Isolation of Effects:** To preserve the integrity of budget data, core logic already is robust (it won’t allow broken state easily). But a plugin could misuse the API (like adding a million dummy transactions) and ruin the user experience. While this is ultimately user’s responsibility if they install a bad plugin, perhaps the app could have a safety net: e.g., track changes done by plugins and allow easy undo or require confirmation for bulk changes (“Plugin X is about to import 5000 transactions. Proceed?”).

* **Protecting Sensitive Info:** Budget data is sensitive, but also any credentials used in plugins are sensitive (say a bank plugin stores a bank API token). The app should provide secure storage for such credentials (perhaps integrating with system keychain or encrypting them in the SQLite using the user’s sync password). The plugin API might offer `storeSecret(key, value)` which keeps it encrypted, rather than the plugin writing to disk in plaintext.

* **Upgrades and Malicious Updates:** If there is a marketplace, ensure the update mechanism for plugins is secure. Code signing of plugins or at least checksums from a trusted registry could prevent tampering. Possibly, Official plugins or community-verified plugins get a signed manifest.

**Privacy Considerations:** Actual’s philosophy is privacy-first – no data leaves the device without consent. The plugin system should uphold this: the base platform should *assume plugins are untrusted* and give them only the access absolutely needed. Documentation for plugin developers should also emphasize respecting user privacy (e.g., “Don’t send user data to external services without clearly informing the user and getting consent”). If monetization is involved, clarify that users are paying for convenience or advanced features, not their data.

**Secure Layers for Third-Party Code:** We recommend implementing the plugin sandbox using well-tested frameworks. For example, in an Electron context, using *Electron’s context isolation* and sandbox for any plugin UI. The main process could fork a separate V8 context for plugin logic. On the web (if we allow plugins in the pure web app), Web Workers or Service Workers could be leveraged (though Service Workers are more for network proxy, so maybe not). A Web Worker with a messaging protocol is straightforward and limits access to global scope.

**Audit and Logging:** For additional safety, the app could log plugin actions (optionally, in a debug console or a log file). If a user suspects a plugin misbehaving, they could inspect a log of “Plugin X called getTransactions and made 3 new transactions” to trace its activity. This transparency helps build trust and aids in debugging.

Finally, **community oversight** will be important. Much like how Actual’s code is open for review, plugins (especially if open source) would benefit from community review. A rating/review system in the marketplace can allow users to report if a plugin is doing something unexpected.

In conclusion, Actual’s current security posture is strong due to local-first design and encryption for sync. Extending the platform with plugins requires a thoughtful security model: sandboxing plugins, explicit permission grants, and possibly vetting through a marketplace. By layering these protections, Actual can support third-party extensions **safely**, maintaining user trust that their financial data stays under their control.

---

## **Phased Roadmap for Extensibility**

To align the architecture with the goal of a plugin-enabled, extensible system, we outline a three-phase implementation plan:

### **Phase 1: Core Integration and Custom UI Setup**

**Objective:** Decouple the core engine from the existing UI and get a minimal application running with Actual’s back-end (Loot Core) but a new front-end or interface. This phase treats Actual’s engine as the foundation and proves we can drive it independently.

* **Integrate Actual Engine:** Utilize *loot-core* and the Official API in a standalone manner. For example, create a small Node.js or Electron app that calls `init()` on the Actual API and opens a budget. This will ensure we can start the database and core services without the desktop-client. Any hard dependencies of core on the old UI should be identified and removed (the docs suggest loot-core is already independent).

* **Replace UI:** Develop a basic UI (could be a simple web app or command-line interface initially) that uses the API to perform essential actions: list accounts, show transactions, edit budgets. At this step, we don’t replicate full functionality, just enough to confirm the engine works with our UI. For instance, a rudimentary web UI that shows the budget categories and lets you input a new transaction through a form.

* **Maintain Feature Parity (Minimal):** Ensure critical flows work: adding accounts, transactions, budgeting, and sync. We rely on Actual for the logic, so most of this is invoking API calls. If any required API is missing, implement it in core or adapt (e.g., if we need a combined “all accounts transactions” view and there isn’t a direct API, we can call getTransactions for each account and merge results for now).

* **Preserve Data Integrity:** In this phase, the focus is not on new features but not breaking existing ones. We should validate that using the engine without the old UI doesn’t cause issues. For example, verify that migrations run, that undo/redo works via API (maybe expose a button for undo in the test UI to confirm it).

* **No Plugins Yet:** During Phase 1, we are **not adding plugins**, but laying ground for them. However, we can already start designing how a plugin might attach. For instance, consider using the same API for our new UI that we plan to give to plugins. We might end up essentially writing a “plugin” which *is* our new UI in terms of how it interacts with core – this mindset can help ensure the API is general.

* **Outcome:** By end of Phase 1, we have Actual’s engine running with a custom interface (perhaps not fully featured, but sufficient), demonstrating that the core and UI are separated. We also produce documentation of the core API usage and perhaps improve the API if we found any gaps when building the UI.

### **Phase 2: Plugin SDK and Internal Module Refactoring**

**Objective:** Introduce a formal Plugin System and convert some parts of Actual into modules/plugins to test the concept. Provide tools for third-party developers to extend Actual in a controlled way.

* **Design Plugin API:** Define the surface area of what plugins can do. This involves creating a **Plugin SDK** documentation and implementing the scaffolding in code. Likely components:

  * A Plugin registration system (the app can load plugin bundles, register their hooks/UI contributions).

  * An event bus or observer in the core: e.g., core emits events like `onTransactionCreate` that plugins can subscribe to. Implement this if not already present.

  * Wrappers for core API: Provide plugin code with an `actual` object limited to allowed methods (e.g., `actual.createTransaction`, `actual.getCategories`, etc.). This may just forward to the real API, but can include permission checks.

* **Isolate Plugin Execution:** Implement a sandbox environment for plugin logic. For example, instantiate each plugin in a Web Worker or an iframe (in Electron, perhaps a hidden BrowserWindow or VM context). Ensure the plugin runs with *context isolation*, meaning it cannot directly call internal Electron or Node APIs unless we expose them. This step may be complex, but it’s critical for safety. We might use something like a **RPC bridge**: the plugin calls `postMessage` for an action, the main app verifies and executes it via core, then returns the result.

* **Extending UI for Plugins:** Create extension points in the new UI:

  * Perhaps a section in the navigation for “Plugins” or dynamic insertion into existing sections (like new Report pages, new sidebar entries, or even extending transaction rows with extra info).

  * Use a dynamic component loader to mount plugin-provided UI elements. For example, if a plugin provides a React component as a bundle, the host app can render it inside a div in the designated area.

  * Standardize styling and ensure plugins can adopt the app’s CSS theme (maybe expose a CSS variables API or a UI components library for consistency).

* **Convert Internal Features to Plugins (Optional):** A great way to test the system is to take an existing feature and implement it as if it were a plugin:

  * For instance, Actual’s *bank sync* (if it had one), or the *sample data generator*, or even *reports*. We could try to re-package “Reports” as a plugin: the core already provides `runQuery` and data, the plugin could provide all the report UI and computations. If we succeed, that means our plugin API is capable enough. If we discover missing pieces (like needing some private function), we can adjust the API.

  * Another candidate is the *Importers*. The YNAB import or CSV import could be moved out of core and into a plugin that uses public APIs to insert data. This checks that the API can handle bulk operations efficiently.

* **Security Measures:** Implement permission prompts or config for plugins. Perhaps in this phase we start simple (all plugins run with full access but in sandbox) and plan to tighten in Phase 3\. We should at least create the structures: e.g., update the plugin manifest format to include a list of permissions (like `{"permissions": ["net", "write"]}` etc.) in anticipation of enforcing them.

* **Developer Experience:** Provide tools for plugin developers: maybe a CLI to scaffold a new plugin project (generate manifest, sample code), and a way to reload plugins without restarting the entire app (for easier development). Also, write thorough documentation for the SDK with examples.

* **Testing:** Write tests for the plugin system. E.g., a test plugin that performs a known set of actions, to verify events and API calls work as expected. Also test sandbox escape attempts (ensuring a plugin can’t do what it shouldn’t). Possibly do a security audit of the sandbox approach.

* **Outcome:** By end of Phase 2, the Actual app supports loading external plugin modules. We should have at least one or two plugins functioning (one possibly developed in-house as a reference). The core and UI are now flexible, with hooks and extension points in place. We likely will release this as a beta feature for community to try writing plugins.

### **Phase 3: Extensible UX & Marketplace with Monetization**

**Objective:** Embrace full extensibility in the user experience and build an ecosystem around Actual. This involves making plugin management user-friendly and setting up a marketplace for discovery (and possibly sale) of plugins.

* **Polish Plugin UI/UX:** Create a *Plugin Manager* section in the Settings or main menu. Users should be able to see installed plugins, enable/disable them, configure them, and check for updates. Include details like plugin version, description, author, and permission usage (“This plugin can read transactions and access the internet.”).

* **Discovery of Plugins:** Integrate a **Plugin Marketplace** browser within the app. This could fetch a list of available plugins from a central repository (e.g., Actual’s website or a GitHub repository listing plugins). Users can browse or search for plugins by category (Import, Reports, Automation, etc.), and install them with one click. Under the hood, installation might download a plugin package (likely a secure, signed bundle) and place it into the app’s plugins directory.

* **Monetization Support:** If certain plugins are paid, implement a flow to purchase or unlock them. This could redirect to an external store or use an in-app purchase mechanism. A practical approach might be issuing license keys: the plugin can check a license key before activating full features. The marketplace UI can handle the purchase and provide the key to the plugin (maybe stored in the plugin’s config). This area can get complex (handling payments, subscriptions, revenue share), but since it’s beyond core technical architecture, the main point is ensuring the platform doesn’t hinder closed-source or paid plugins. Perhaps allow plugins to be distributed as simply as open ones (the difference being the code might be obfuscated and require a license to function).

* **Scaling and Quality:** With many plugins, ensure the app remains stable. Possibly implement **plugin sandbox resource limits** (so one plugin can’t consume all memory or CPU indefinitely – e.g., if it goes haywire, the host can terminate its worker). Also, consider an approval process for the official marketplace to maintain quality and security. Community ratings and comments can be shown in the UI to inform users.

* **Extensible UX Elements:** At this phase, we can add more advanced extension points if needed by popular demand. For example, allow plugins to define *new types of entities* in the UI or even new data in the core (with careful design). Or allow deep integrations like a plugin that replaces certain core behaviors (though that is tricky with consistency). Based on Phase 2 feedback, we might add more hooks.

* **Community & Monetization Balance:** Encourage a healthy mix of free and paid plugins. Perhaps some core features that were on Actual’s roadmap but not yet implemented could be done by third parties (with or without charge). The marketplace could incentivize developers to contribute and maybe earn for niche features (for instance, integration with a regional bank or a cryptocurrency wallet might be too niche for core but perfect as a paid plugin by a community dev).

* **Continuous Security Monitoring:** As plugins proliferate, set up a process for reporting malicious or problematic plugins. The app could have a kill-switch to disable known bad plugins (for example, if a plugin is found stealing data, the marketplace could flag it and the app could warn users who have it installed).

* **Outcome:** By the end of Phase 3, Actual Budget transforms into an **extensible platform**. Users can tailor their budgeting app with plugins – from cosmetic themes to full new modules – and developers have a marketplace to distribute and possibly sell their plugins. Actual’s core remains lean and focused, while the ecosystem handles diverse user needs. This should significantly increase Actual’s appeal (much like VSCode or Obsidian gained from plugins) and can create a community-driven innovation cycle. Importantly, all this is achieved without sacrificing the app’s performance, security, or privacy ethos.

---

**Tables & Diagrams (for summary):**

Below is a **summary table of Actual’s core components** and their roles, which also highlights where extension is possible:

| Component | Description | Extensibility |
| ----- | ----- | ----- |
| **Loot Core (Engine)** | Core budgeting logic, data access, and local DB server. Runs in a worker/process. Manages accounts, transactions, budgets, sync (CRDT). | Exposed via API; Plugins use this for all data operations. New rules or calculations can hook into core events. |
| **Sync Server** | Optional server for multi-device sync. Stores encrypted change messages and a backup of the budget file. | Could allow plugins on server side (less likely) – focus is on client-side plugins as server is stateless relay. |
| **Desktop/Web UI** | React app (with Redux) providing the user interface: Budgeting screen, account registers, reports, etc. | To be modularized. Plugins can insert UI elements (new pages or widgets). The UI will load plugin components as needed. |
| **API Layer** | JavaScript API (`@actual-app/api`) for core operations, used by UI and available to scripts. | Foundation of the Plugin SDK. The SDK will be a restricted view of this API for third-party use. |
| **Database (SQLite)** | Local SQLite database storing all data. Utilizes views for derived data. | Schema changes via migrations. Plugins may get read/write access through API, but direct DB schema mods by plugins are discouraged (to maintain integrity). |
| **CRDT Sync Engine** | Part of core – handles merging changes from multiple devices using CRDT, ensuring eventual consistency. | Generally internal. Not exposed directly, but ensures plugins triggering changes still sync properly. |
| **Security Mechanisms** | Encryption for sync, authentication, sandboxing (planned for plugins). Ensures data is local and safe. | Plugins will operate in sandbox with defined permissions. The core will enforce access rules to protect data. |

Finally, here’s a **Phase-wise focus summary** in a table for clarity:

| Phase | Focus | Key Actions |
| ----- | ----- | ----- |
| **1: Core \+ New UI** | Establish standalone core usage; replace UI | \- Initialize core engine in isolation. \- Build minimal custom UI using core API. \- Ensure all basic features work via API (accounts, transactions, budgeting, sync). |
| **2: Plugin SDK** | Introduce plugins & hooks; internal refactor | \- Define plugin API surface (wrap core API) and events. \- Implement plugin loading and sandbox execution. \- Create extension points in UI (dynamic menus/views). \- Convert some built-in features into plugins to test system. |
| **3: Marketplace & UX** | Community plugin ecosystem & polish | \- Provide in-app plugin browser/installer with ratings. \- Implement optional monetization (license keys or similar). \- Harden security: permission prompts, plugin signing. \- Refine plugin API from feedback, add any needed hooks. |

Each phase builds on the previous, gradually transitioning Actual from a closed system to an open platform while maintaining its core strengths of speed, privacy, and robust budgeting functionality.

Throughout all phases, thorough testing and community involvement will guide adjustments. By the end, Actual Budget will not only be a personal finance app, but a **flexible budgeting framework** that users can customize to their needs, and a marketplace will enable developers to innovate on top of a solid foundation.

**Sources:**

* Official Actual Budget documentation and repository, which describe the project structure and design.

* Community references confirming use of local SQLite and no REST API.

* Release notes and issue trackers indicating technology choices (Redux) and ongoing modularization efforts.

* Actual Budget FAQ explaining the security model and lack of remote endpoints.

* Actual community projects that highlight potential integration points for plugins (bank sync, AI categorize).

