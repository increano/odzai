# Actual Budget - UI Layer Analysis

## Overview of UI Architecture

Actual's user interface is built with **React** and related libraries, organized as the *desktop-client* package. Despite its name, this package serves as the foundation for both the desktop and web interfaces of the application.

The UI is structured around the primary functionalities of envelope budgeting, with a clean, efficient interface that prioritizes usability.

## Main UI Components

### Navigation and Layout

- **Sidebar** for primary navigation between major views
- **Header** with context-specific actions and information
- **Main Content Area** that changes based on the selected view
- **Modal Dialogs** for focused interactions like editing or configuration

### Primary Views

#### Budget View
The central budgeting interface where users allocate money to categories:
- Displays a table of categories (rows) vs. months (columns)
- Shows budgeted amount, activity, and available balance for each category
- Highlights the "To Be Budgeted" amount (unallocated money)
- Provides visual indicators for overspent categories or progress toward goals
- Allows direct editing of budget allocations with instant updates

#### Accounts & Transactions
Functions as a checkbook register for financial accounts:
- Lists transactions in a tabular format with sorting and filtering
- Displays columns for Date, Payee, Category, Memo, Amount, and Balance
- Includes a "running balance" feature to show account balance progression
- Provides input form for adding new transactions
- Supports "All Accounts" view to combine transactions from multiple accounts

#### Reports
Data visualization section for financial analysis:
- Net Worth over time charts
- Spending by Category breakdowns
- Income vs. Expense comparisons
- Customizable date ranges and filtering options
- Tabular and graphical presentations of data

#### Scheduled Transactions
Management interface for recurring financial events:
- Lists upcoming bills and income
- Displays due dates and frequency information
- Provides options to post transactions when due
- Includes editing capabilities for schedule details

#### Additional Utility Views
- **Payees Management** for organizing and merging payee entries
- **Transaction Rules** interface for creating auto-categorization rules
- **Settings** for application configuration
- **Files Menu** for managing multiple budget files

## State Management

Actual's UI implements global state management to coordinate application data and UI state:

### Redux Implementation
- Recently migrated to **Redux Toolkit** for state management
- Organized into "slices" for different domains (accounts, budgets, preferences)
- Handles UI state like selected month, active account, and dialog visibility
- Manages undo/redo history state

### State and API Interaction
- UI components are primarily presentational, relying on API calls
- When edits occur, components dispatch API calls and wait for data updates
- State is updated based on API responses or optimistic updates
- Component lifecycle (mount/unmount) typically triggers data fetching

## UI and Backend Coupling

While most business logic resides in the core, some areas have UI-specific logic:

### Form Handling
- The UI manages formatting of amounts (displaying currency with 2 decimals)
- Input parsing converts user text entries to proper data types
- Form validation occurs in the UI before sending to the core

### Display Calculations
- Some aggregate displays are computed in UI (like category group totals)
- The UI calculates visual indicators for budget progress
- Date handling and user timezone adjustments

### Interaction Logic
- Transaction reconciliation workflow
- Navigation between months in budget view
- File management operations (opening/closing budget files)

### Business Logic Separation
- Most budgeting rules are enforced in the core
- UI primarily handles presentation and user interaction
- Complex calculations (like budget math) are handled by the core or database views

## UI Modularity

The existing UI architecture has several characteristics relevant to modularization:

### Current Structure
- React components in the desktop-client package
- Redux store for state management
- API calls to the core for data operations

### Potential for Modularization
- Components could be separated from business logic
- UI elements could be factored into a reusable component library
- Extension points could be identified for plugin UI integration

### Challenges for Reuse
- Some components assume Redux store presence
- UI has assumptions about the Actual environment
- Elements like reconciliation are tightly tied to workflows

## Visual Design System

The UI employs a consistent design language:

- Clean, minimal interface with focus on clarity
- Data-dense displays for budget information
- Consistent color coding (red for overspending, green for available)
- Responsive design that works across device sizes
- Accessibility considerations for keyboard navigation

## User Experience Flow

Actual's UI is designed around common budgeting workflows:

### Budget Setup
- Creating account structure
- Defining initial categories
- Setting up first month's budget

### Daily Money Management
- Recording new transactions
- Categorizing spending
- Checking budget compliance

### Monthly Budgeting
- Allocating new income
- Adjusting category amounts
- Handling overspending

### Reporting and Analysis
- Examining spending trends
- Tracking net worth
- Comparing performance over time

## Technology Stack

The UI is built with modern web technologies:

- **React** for component-based UI
- **Redux** for state management
- **CSS Modules** for styling
- **Modern JavaScript/TypeScript** for type safety
- **React Router** for navigation

## Extension Possibilities

The current UI does not have a plugin system, but could support one with modifications:

### Potential Extension Points
- **Sidebar Navigation** - Adding new sections
- **Transaction Register** - Adding custom columns
- **Reports** - Creating custom report types
- **Dashboard** - Widget-based customizable overview
- **Settings** - Plugin configuration panels

### Implementation Approach
- Component composition could allow plugin UI elements
- Redux middleware could integrate plugin state
- A registry system could manage plugin UI components
- React's context API could provide services to plugins

## Performance Considerations

The UI maintains performance through several strategies:

- **Virtual Lists** for handling large transaction sets
- **Memoization** of expensive calculations
- **Lazy Loading** of views not immediately needed
- **Efficient API Calls** to minimize data transfer
- **Local State** for UI-only concerns to avoid Redux overhead

## Conclusion

Actual's UI is a modern web application that provides a clean interface to the powerful budgeting engine beneath. While tightly integrated with the current core, the UI has clear boundaries through its API usage, making it conceptually possible to replace or extend.

The React/Redux architecture provides a solid foundation for future extension, though creating a truly pluggable UI would require some refactoring to add explicit extension points and component registries. The existing UI serves as both a functional interface and a reference implementation for how to interact with Actual's core engine. 