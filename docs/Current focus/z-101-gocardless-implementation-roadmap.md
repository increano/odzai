# GoCardless Implementation Roadmap for minimal-ui-next

This roadmap outlines the step-by-step implementation process for integrating GoCardless bank synchronization into the minimal-ui-next application using a centralized credential management approach. The implementation is divided into phases, with each phase building upon the previous one to achieve the complete integration.

## Centralized Credential Approach

Throughout this implementation, we'll use a centralized credential management approach with the following key principles:

1. **Single Set of API Credentials**: All users will share the same GoCardless API credentials, which are managed by system administrators.
2. **User Context Isolation**: Despite shared credentials, each user's data must be properly isolated:
   - Each bank connection will be associated with a specific user via requisition IDs
   - All GoCardless API calls will include the appropriate user context
   - Storage of bank connection metadata must maintain user boundaries
3. **Security Considerations**:
   - System-wide credentials will be stored securely and not exposed to users
   - Rate limiting will be managed at the system level across all users
   - Error handling will not expose credential details to end users

This approach simplifies the user experience by removing the need for individual GoCardless accounts while maintaining strict data isolation.

## Phase 1: Foundation Setup (Weeks 1-2)

### Step 1: Environment Configuration
- ✅ Add necessary dependencies
  ```bash
  yarn add nordigen-node uuid
  ```
- ✅ Create configuration structure for centralized GoCardless credentials
- ✅ Set up secure storage for system-wide API keys and tokens

### Step 2: Admin Configuration Endpoints
- ✅ Implement admin-only GoCardless configuration endpoints
  - ✅ POST `/api/admin/gocardless/setup` - Store and validate centralized credentials
  - ✅ GET `/api/gocardless/status` - Check system-wide configuration status
- ✅ Set up error handling middleware for GoCardless-specific errors

### Step 3: Centralized GoCardless Client Implementation
- ✅ Create a singleton GoCardless client service
  ```typescript
  // src/lib/services/gocardless/client.ts
  
  class GoCardlessClient {
    private static instance: GoCardlessClient;
    private secretId: string | null = null;
    private secretKey: string | null = null;
    private token: string | null = null;
    private isConfigured: boolean = false;

    private constructor() {
      // Private constructor to prevent direct instantiation
    }

    public static getInstance(): GoCardlessClient {
      if (!GoCardlessClient.instance) {
        GoCardlessClient.instance = new GoCardlessClient();
      }
      return GoCardlessClient.instance;
    }
    
    // ... methods for configuration, token generation, etc.
    }
    
  // Export the singleton instance
  export const goCardlessClient = GoCardlessClient.getInstance();
  ```
- ✅ Implement centralized token generation and refreshing
- ✅ Add methods for fetching banks by country using system credentials

### Step 4: Admin UI for Credential Management
- ✅ Create `AdminConfigPage` with `GoCardlessCredentialsForm` component
  - ✅ Secret ID input field (admin only)
  - ✅ Secret Key input field (admin only)
  - ✅ Validation and submission handling
- ✅ Update `CreateAccountDialog` to include tabs for manual and bank connection (without credential input)

## Phase 2: User Bank Connection Flow (Weeks 3-4)

**Centralized Credential Approach**: All bank connection operations must use the system-wide credentials configured in Phase 1 while maintaining separate user contexts via requisition IDs. Each user's bank connection data must be properly isolated despite sharing the same GoCardless credentials.

### Step 1: Bank Selection Interface
- [ ] Implement country selection dropdown
- [ ] Create bank search/selection interface
- [ ] Add API endpoints for bank listing using centralized credentials
  - [ ] GET `/api/gocardless/banks` - Get available banks by country

### Step 2: Bank Authorization Flow
- [ ] Implement bank connection initialization endpoint with user context
  - [ ] POST `/api/gocardless/connect` - Create requisition and get authorization link
  - [ ] Store requisition ID with user context to maintain data isolation
- ✅ Create authorization redirect handler with user session tracking
  - ✅ Ensure callback handling maintains specific user's session context
- ✅ Implement authorization status checking mechanism
  - ✅ Associate status checks with specific user's requisition IDs

### Step 3: Account Selection UI
- ✅ Create account selection component
  - ✅ Display account details (name, balance, etc.)
  - ✅ Allow selection of multiple accounts
  - ✅ Enable configuration of Off Budget status
- ✅ Implement API endpoint for fetching available accounts using system credentials
  - ✅ GET `/api/gocardless/accounts` - Fetch accounts from connected bank

### Step 4: Account Linking and Creation
- ✅ Implement account linking endpoint with user context
  - ✅ POST `/api/accounts/link` - Link GoCardless account to Actual
  - [ ] Ensure each bank account is linked to the correct user context
- [ ] Update account model to store GoCardless-specific metadata and user association
  - [ ] Include requisition ID and user ID in metadata to maintain isolation
- [ ] Enhance account creation process to handle GoCardless accounts
  - [ ] Implement proper user context propagation to maintain isolation

## Phase 3: Multi-user Transaction Synchronization (Weeks 5-6)

**Centralized Credential Approach**: Transaction synchronization must use the system-wide credentials while ensuring strict data isolation between users. Each API call to GoCardless should include the appropriate user context (via requisition IDs) to maintain security boundaries between different users' financial data.

### Step 1: Initial Transaction Import
- [ ] Implement transaction fetching from GoCardless with user isolation
  - Use requisition IDs to ensure users only access their own transactions
  - Include user context in all API calls to GoCardless
- [ ] Create data normalization utilities for transactions
  - Ensure transaction processing maintains user boundaries
- [ ] Add logic to avoid duplicate transactions based on imported_id
  - Transaction deduplication should operate within user boundaries only
- [ ] Implement initial account balance setting
  - Balance information must be isolated to specific user accounts

### Step 2: Manual Sync Functionality
- [ ] Add sync button to account details page
- ✅ Implement transaction sync endpoint with rate limiting consideration
  - ✅ POST `/api/accounts/{id}/sync` - Sync transactions for specific account
- [ ] Create UI for sync status and progress

### Step 3: Transaction Conflict Resolution
- [ ] Implement conflict detection for transactions
- [ ] Create strategy for handling duplicate transactions
- [ ] Add reconciliation mechanism for mismatched balances

### Step 4: Error Handling and Recovery
- [ ] Implement comprehensive error handling for API failures
- [ ] Add retry mechanisms for transient errors
- [ ] Create user-friendly error messages and recovery suggestions
- [ ] Implement system monitoring for credential failures

## Phase 4: Polish and Optimization (Weeks 7-8)

### Step 1: UI/UX Refinements
- [ ] Improve loading states and transitions
- [ ] Add tooltips and help text for bank connection flow
- [ ] Create onboarding experience for first-time users
- [ ] Add admin dashboard for monitoring GoCardless usage across users

### Step 2: Performance Optimization
- [ ] Implement batched transaction processing for large accounts
- [ ] Add caching for frequently accessed bank information
- [ ] Implement request queuing to manage API rate limits across users
- [ ] Optimize API calls to minimize rate limit usage

### Step 3: Testing and Validation
- [ ] Create comprehensive tests for GoCardless integration
  - [ ] Unit tests for centralized client implementation
  - [ ] Integration tests for API endpoints with multiple user contexts
  - [ ] End-to-end tests for user flows
- [ ] Test with various banks and account types
- [ ] Validate error handling and recovery scenarios
- [ ] Test rate limiting handling with simulated multi-user traffic

### Step 4: Documentation and Deployment
- ✅ Update user documentation with GoCardless connection instructions
- ✅ Create administrator guide for system-wide credential setup and troubleshooting
- [ ] Create monitoring guide for tracking API usage across users
- [ ] Finalize deployment process for the integration

## Key Milestones

1. **End of Week 2**: Admin interface for GoCardless setup and configuration complete
2. **End of Week 4**: User bank selection and authorization flow working
3. **End of Week 6**: Multi-user transaction synchronization functional
4. **End of Week 8**: Complete integrated solution with polished UI and documentation

## Technical Debt Considerations

- Regular monitoring of GoCardless API changes that might affect system-wide credentials
- Token refresh mechanism needs to be robust and handle multiple concurrent users
- Implement proper rate limiting strategies to avoid hitting API limits across users
  - Consider per-user quotas within the shared credential limits
  - Implement queuing for high-traffic periods
- Plan for handling API deprecations or changes in the future
- Monitor credential security and consider key rotation policies
- Ensure all data queries maintain proper user isolation despite shared backend credentials

## Success Criteria

- Admins can successfully configure system-wide GoCardless credentials
- Users can connect to their banks via GoCardless without needing their own credentials
- Account information is accurately imported with proper user isolation
- Transactions are correctly synchronized with no duplicates
- Balance reconciliation is accurate
- User experience is intuitive and error messages are helpful
- Performance remains good even with many concurrent users
- System properly manages API rate limits across all users

## Post-Implementation Tasks

- [ ] Monitor error rates and user feedback
- [ ] Gather metrics on connection success rates across different users
- [ ] Monitor API usage and rate limit consumption
- [ ] Schedule regular reviews of GoCardless API changes
- [ ] Implement credential rotation procedures
- [ ] Plan for additional bank sync providers in the future 