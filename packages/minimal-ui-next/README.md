# Minimal UI Next.js Version

This package is a copy of the minimal-ui package intended for modernization with Next.js. It currently runs on port 3001 to avoid conflicts with the original implementation.

## Modernization Plan

This package will be transformed to use:
- Next.js for the frontend
- React components instead of vanilla JavaScript
- Modern UI libraries and patterns
- TypeScript for type safety
- Improved developer experience

## Current Implementation

The current implementation is identical to the original minimal-ui, just with a different port:

- Simple web-based UI for accessing Actual Budget data
- Uses the official Actual Budget API
- Express.js server with static HTML/CSS/JS frontend

## Getting Started

1. Ensure you have Node.js (v18+) and Yarn installed
2. Install dependencies from the root of the Actual Budget repository:
   ```
   yarn install
   ```
3. Start the minimal UI Next with the path to your Actual Budget data directory:
   ```
   cd packages/minimal-ui-next
   ACTUAL_DATA_DIR=../../data yarn start
   ```
4. Visit http://localhost:3001 in your browser

## Important Notes

- Make sure to point the `ACTUAL_DATA_DIR` environment variable to the same data directory used by your full Actual Budget application to ensure you can access the same budgets.
- The minimal UI will read and write to the same budget files as the full application.

## Architecture

The current architecture is:

- Server: Express.js application that serves the UI and API endpoints
- API Layer: Translates HTTP requests to Actual API calls
- UI: Simple HTML with inline JavaScript

## Modernization Steps

1. Set up Next.js project structure
2. Convert HTML pages to React components
3. Split the monolithic JavaScript into modular components
4. Add modern UI libraries
5. Implement responsive design
6. Improve error handling and loading states
7. Enhance developer experience with TypeScript

## Features

- Simple web-based UI for accessing Actual Budget data
- Uses the official Actual Budget API
- Supports core functionality:
  - Loading and switching between budgets
  - Managing accounts
  - Adding and viewing transactions
  - Setting budget amounts

## Next Steps

This implementation is the first phase toward a plugin-enabled system:

1. **Phase 1** (Current): Core Integration and Custom UI 
2. **Phase 2**: Plugin SDK and Internal Module Refactoring
3. **Phase 3**: Extensible UX & Marketplace with Monetization 