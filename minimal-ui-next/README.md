# Minimal UI Next.js Implementation

This is a modern implementation of the Minimal UI for Odzai using Next.js and shadcn/ui components.

## Features

- **Modern UI**: Built with Next.js and shadcn/ui components
- **Type Safety**: Written in TypeScript
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Account Reconciliation**: Feature to reconcile account balances with bank statements
- **API Routes**: Modern API implementation using Next.js API routes

## Account Reconciliation

The account reconciliation feature allows users to:

1. **Select an account** to reconcile
2. **Enter statement information** (balance and date)
3. **Mark transactions as cleared** that appear on the statement
4. **See the difference** between cleared balance and statement balance
5. **Create adjustment transactions** automatically if needed
6. **Complete the reconciliation process** with proper record keeping

## Project Structure

- **`/src/app`**: Next.js App Router pages and layouts
- **`/src/app/api`**: API endpoints for data access
  - **`/api/accounts/[id]/reconcile`**: Reconciliation endpoints
  - **`/api/transactions/[id]`**: Transaction management endpoints
- **`/src/components`**: Reusable UI components
  - **`/src/components/ui`**: shadcn/ui components
  - **`/src/components/navigation`**: Navigation-related components
- **`/src/lib`**: Utility functions and helpers

## Tech Stack

- **Next.js**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Re-usable component library
- **React Hook Form**: Form validation
- **Zod**: Schema validation
- **Zustand**: State management
- **React Query**: Data fetching

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) to see the app

## Future Development

- **Authentication**: User login and registration
- **Budget Management**: Budget creation and management
- **Transaction Management**: Full CRUD operations
- **Reports**: Financial reporting
- **Scheduled Transactions**: Recurring transaction management
- **Mobile Optimization**: Improved mobile experience
- **Dark Mode**: Theme support
