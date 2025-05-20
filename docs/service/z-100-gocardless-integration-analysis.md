# GoCardless Integration Analysis for minimal-ui-next

## Overview

This analysis explores the feasibility of integrating GoCardless bank API with the minimal-ui-next implementation to enable users to add accounts directly from their bank. The goal is to automatically populate account information and fetch transactions while still allowing users to customize settings like the Off Budget option. This implementation uses a centralized credential management approach, where a single set of GoCardless API credentials is used for all users, simplifying the user experience.

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
1. Country and bank selection
2. Bank authorization redirection
3. Account selection and configuration

### 2. Admin UI for Credential Management

A separate admin interface should be created to manage the centralized GoCardless credentials:

```jsx
// Admin configuration UI
<AdminConfigPanel>
  <Section title="GoCardless Configuration">
    <GoCardlessCredentialsForm />
  </Section>
</AdminConfigPanel>
```

The admin interface should be secured and only accessible to administrators of the minimal-ui-next implementation.

### 3. API Endpoints

The following new API endpoints are needed:

#### GoCardless Configuration (Admin-only)

```typescript
// Store GoCardless credentials (admin only endpoint)
app.post('/api/admin/gocardless/setup', ensureAdmin, async (req, res) => {
  try {
    const { secretId, secretKey } = req.body;
    // Store credentials securely in server environment
    // Validate credentials with GoCardless
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to configure GoCardless' });
  }
});

// Get GoCardless configuration status
app.get('/api/gocardless/status', async (req, res) => {
  try {
    // Check if GoCardless is configured at the system level
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
    // Fetch banks from GoCardless API using system credentials
    res.json({ banks: [...] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get banks' });
  }
});

// Initialize bank connection
app.post('/api/gocardless/connect', ensureBudgetLoaded, async (req, res) => {
  try {
    const { institutionId, host, userId } = req.body;
    // Create requisition and get authorization link using system credentials
    // Associate the requisition with the current user
    res.json({ link: '...', requisitionId: '...' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to bank' });
  }
});

// Get accounts from connected bank
app.get('/api/gocardless/accounts', ensureBudgetLoaded, async (req, res) => {
  try {
    const { requisitionId } = req.query;
    // Fetch accounts from GoCardless using system credentials
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

### 4. Backend Integration

The backend needs to integrate with the GoCardless API:

1. **Centralized GoCardless Client**:
   - Implement a singleton GoCardless client that uses the system-wide credentials
   - Manage authentication tokens and refreshing centrally
   - Handle API rate limits appropriately for multi-user environment

2. **Account Linking with User Context**:
   - Create or update accounts with details from GoCardless
   - Store requisition IDs and metadata with user context for future synchronization
   - Fetch initial transactions

3. **Transaction Syncing**:
   - Add capabilities to sync transactions on-demand
   - Implement logic to avoid duplicate transactions
   - Handle proper isolation between different users' accounts

## User Flow

1. User clicks "Add Account" on the accounts page
2. User selects "Connect Bank" tab in the dialog
3. User selects country and bank from lists
4. User is redirected to bank authorization page in a new tab
5. Upon successful authorization, user returns to application
6. Application shows available accounts from the bank
7. User selects which account(s) to add and configures:
   - Whether the account is Off Budget
   - Any name adjustments
8. User confirms, and the account is created with initial balance
9. Transactions are fetched automatically
10. User is returned to the accounts overview with the new account added

## Admin Flow

1. Administrator navigates to the admin interface
2. Administrator enters GoCardless Secret ID and Key in the secure form
3. System validates the credentials with the GoCardless API
4. Credentials are stored securely in the server environment
5. All users can now connect to their banks using the system's credentials

## Technical Considerations

### Security
- Centralized GoCardless credentials must be stored securely in server environment
- OAuth token management and refreshing must be handled centrally
- HTTPS for all API communications
- Proper isolation of user data despite shared credentials
- System must track which bank connections belong to which users

### Performance
- Rate limiting considerations for GoCardless API across all users
- Implement proper queuing and throttling for shared credentials
- Efficient transaction syncing to avoid duplicates
- Background processing for large transaction sets

### Error Handling
- Network connectivity issues
- Bank authorization failures
- Rate limiting and API errors
- Handling errors without exposing system credentials to users

## Implementation Phases

### Phase 1: Admin Configuration
- Implement secure storage for system-wide credentials
- Create admin interface for credential management
- Set up GoCardless client with centralized authentication

### Phase 2: User Bank Connection
- Implement country and bank selection interface
- Create bank authorization flow using system credentials
- Implement account selection and linking with user context

### Phase 3: Transaction Syncing
- Implement transaction fetching with proper user isolation
- Add manual sync button on account pages
- Develop error handling and retry mechanisms

## Conclusion

Integrating GoCardless with the minimal-ui-next implementation using a centralized credential approach is feasible and provides significant advantages. It simplifies the user experience by removing the need for individual GoCardless accounts while maintaining the ability to connect to banks and synchronize transactions.

The enhanced account creation flow with bank synchronization would provide a more streamlined experience for users while still maintaining flexibility in account configuration. The centralized credential management approach also simplifies maintenance and monitoring of the GoCardless integration. 