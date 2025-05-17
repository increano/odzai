# GoCardless Integration Analysis for minimal-ui-next

## Overview

This analysis explores the feasibility of integrating GoCardless bank API with the minimal-ui-next implementation to enable users to add accounts directly from their bank. The goal is to automatically populate account information and fetch transactions while still allowing users to customize settings like the Off Budget option.

## Current Implementation

The minimal-ui-next application currently supports manual account creation through the following components:

- `CreateAccountDialog` component that allows users to input:
  - Account name
  - Initial balance
  - Off Budget status (checkbox)

- Express API endpoint at `/api/accounts` that handles:
  - Creating account records
  - Setting initial balances
  - Account configuration

## Required Changes for GoCardless Integration

### 1. UI Component Enhancements

The `CreateAccountDialog` component needs to be enhanced to support:

```jsx
// Enhanced CreateAccountDialog
<Dialog>
  <Tabs>
    <TabsList>
      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
      <TabsTrigger value="bank">Connect Bank</TabsTrigger>
    </TabsList>
    
    <TabsContent value="manual">
      {/* Existing manual account creation form */}
    </TabsContent>
    
    <TabsContent value="bank">
      {/* New bank connection UI */}
      <GoCardlessConnectionForm />
    </TabsContent>
  </Tabs>
</Dialog>
```

A new `GoCardlessConnectionForm` component would handle:
1. GoCardless API credential setup (if not already configured)
2. Country and bank selection
3. Bank authorization redirection
4. Account selection and configuration

### 2. API Endpoints

The following new API endpoints are needed:

#### GoCardless Configuration

```typescript
// Store GoCardless credentials
app.post('/api/gocardless/setup', ensureBudgetLoaded, async (req, res) => {
  try {
    const { secretId, secretKey } = req.body;
    // Store credentials securely
    // Validate credentials with GoCardless
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to configure GoCardless' });
  }
});

// Get GoCardless configuration status
app.get('/api/gocardless/status', ensureBudgetLoaded, async (req, res) => {
  try {
    // Check if GoCardless is configured
    res.json({ configured: true/false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get GoCardless status' });
  }
});
```

#### Bank and Account Management

```typescript
// Get available banks by country
app.get('/api/gocardless/banks', ensureBudgetLoaded, async (req, res) => {
  try {
    const { country } = req.query;
    // Fetch banks from GoCardless API
    res.json({ banks: [...] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get banks' });
  }
});

// Initialize bank connection
app.post('/api/gocardless/connect', ensureBudgetLoaded, async (req, res) => {
  try {
    const { institutionId, host } = req.body;
    // Create requisition and get authorization link
    res.json({ link: '...', requisitionId: '...' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to bank' });
  }
});

// Get accounts from connected bank
app.get('/api/gocardless/accounts', ensureBudgetLoaded, async (req, res) => {
  try {
    const { requisitionId } = req.query;
    // Fetch accounts from GoCardless
    res.json({ accounts: [...] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get accounts' });
  }
});

// Link GoCardless account to Actual
app.post('/api/accounts/link', ensureBudgetLoaded, async (req, res) => {
  try {
    const { requisitionId, account, offBudget } = req.body;
    // Link account and fetch initial transactions
    res.json({ success: true, id: '...' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to link account' });
  }
});
```

### 3. Backend Integration

The backend needs to integrate with the GoCardless API:

1. **GoCardless Client**:
   - Implement the GoCardless client similar to the existing implementation in the sync-server
   - Manage authentication tokens and refreshing
   - Handle API errors appropriately

2. **Account Linking**:
   - Create or update accounts with details from GoCardless
   - Store requisition IDs and metadata for future synchronization
   - Fetch initial transactions

3. **Transaction Syncing**:
   - Add capabilities to sync transactions on-demand
   - Implement logic to avoid duplicate transactions

## User Flow

1. User clicks "Add Account" on the accounts page
2. User selects "Connect Bank" tab in the dialog
3. If GoCardless is not configured:
   - User is prompted to enter GoCardless Secret ID and Key
   - Credentials are validated and stored
4. User selects country and bank from lists
5. User is redirected to bank authorization page in a new tab
6. Upon successful authorization, user returns to application
7. Application shows available accounts from the bank
8. User selects which account(s) to add and configures:
   - Whether the account is Off Budget
   - Any name adjustments
9. User confirms, and the account is created with initial balance
10. Transactions are fetched automatically
11. User is returned to the accounts overview with the new account added

## Technical Considerations

### Security
- GoCardless credentials must be stored securely
- OAuth token management and refreshing
- HTTPS for all API communications

### Performance
- Rate limiting considerations for GoCardless API
- Efficient transaction syncing to avoid duplicates
- Background processing for large transaction sets

### Error Handling
- Network connectivity issues
- Bank authorization failures
- Rate limiting and API errors

## Implementation Phases

### Phase 1: Basic Setup
- Implement GoCardless configuration endpoints
- Create UI for entering GoCardless credentials
- Add country and bank selection interfaces

### Phase 2: Account Connection
- Implement bank authorization flow
- Create account selection interface
- Develop account linking functionality

### Phase 3: Transaction Syncing
- Implement transaction fetching
- Add manual sync button on account pages
- Develop error handling and retry mechanisms

## Conclusion

Integrating GoCardless with the minimal-ui-next implementation is feasible and would provide significant value to users. The implementation can leverage existing patterns from the main application but will require significant additions to the minimal-ui-next codebase to match the functionality already present in the desktop-client implementation.

The enhanced account creation flow with bank synchronization would provide a more streamlined experience for users while still maintaining flexibility in account configuration. 