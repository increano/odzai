# Minimal UI for Actual Budget

This package provides a minimal UI for Actual Budget, demonstrating the separation of the core engine from the UI. It's part of Phase 1 of the roadmap for making Actual Budget more extensible.

## Features

- Simple web-based UI for accessing Actual Budget data
- Uses the official Actual Budget API
- Supports core functionality:
  - Loading and switching between budgets
  - Managing accounts
  - Adding and viewing transactions
  - Setting budget amounts

## Getting Started

1. Ensure you have Node.js (v18+) and Yarn installed
2. Install dependencies from the root of the Actual Budget repository:
   ```
   yarn install
   ```
3. Start the minimal UI:
   ```
   yarn start:minimal-ui
   ```
4. Visit http://localhost:3000 in your browser

## Architecture

This project demonstrates:

1. **Decoupling the Core Engine** - Using the `@actual-app/api` package to interact with the core
2. **Minimal UI** - Simple HTML/CSS/JS interface with no dependencies on the original UI
3. **Data Integrity** - All operations go through the official API, maintaining data consistency

## Implementation

- Server: Express.js application that serves the UI and API endpoints
- API Layer: Translates HTTP requests to Actual API calls
- UI: Simple HTML with inline JavaScript for demonstration purposes

## Next Steps

This implementation is the first phase toward a plugin-enabled system:

1. **Phase 1** (Current): Core Integration and Custom UI 
2. **Phase 2**: Plugin SDK and Internal Module Refactoring
3. **Phase 3**: Extensible UX & Marketplace with Monetization 