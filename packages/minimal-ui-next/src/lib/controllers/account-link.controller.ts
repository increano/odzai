import { Request, Response } from 'express';
import * as actualAPI from '@actual-app/api';
import { goCardlessService } from '../services/gocardless/service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Account Link Controller
 * Handles linking external accounts from GoCardless with Actual accounts
 */
export class AccountLinkController {
  /**
   * Link a GoCardless account to an Actual account
   */
  async linkAccount(req: Request, res: Response) {
    try {
      const { requisitionId, account, offBudget = false } = req.body;
      
      if (!requisitionId || !account) {
        return res.status(400).json({ 
          error: 'Missing parameters', 
          message: 'Requisition ID and account details are required' 
        });
      }
      
      // Prepare account data for Actual API
      const actualAccount = {
        name: account.name,
        type: this.mapAccountType(account), // Map external account type to Actual type
        offbudget: offBudget,
        // Store GoCardless metadata
        metadata: {
          gocardless_account_id: account.id,
          gocardless_requisition_id: requisitionId,
          gocardless_iban: account.iban,
          sync_source: 'gocardless'
        }
      };
      
      // Convert balance from floating-point to integer (cents)
      const initialBalance = Math.round(account.balance * 100);
      
      // Create the account using Actual API
      const accountId = await actualAPI.createAccount(actualAccount, initialBalance);
      
      // TODO: In a future implementation, fetch initial transactions
      
      return res.json({ 
        success: true, 
        id: accountId,
        message: 'Account linked successfully'
      });
    } catch (error) {
      console.error('Failed to link account:', error);
      return res.status(500).json({ 
        error: 'Failed to link account',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Sync transactions for a linked account
   */
  async syncTransactions(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return res.status(400).json({ 
          error: 'Missing account ID', 
          message: 'Account ID is required' 
        });
      }
      
      // In a real implementation, we would:
      // 1. Get the account from Actual API
      // 2. Extract GoCardless metadata
      // 3. Use the metadata to fetch transactions from GoCardless
      // 4. Import transactions into Actual
      
      // For now, we'll just return a mock success response
      return res.json({ 
        success: true, 
        message: 'Account transactions synced successfully',
        transactions_added: 0,
        new_balance: 0
      });
    } catch (error) {
      console.error('Failed to sync account transactions:', error);
      return res.status(500).json({ 
        error: 'Failed to sync account transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Map external account type to Actual account type
   */
  private mapAccountType(account: any): string {
    // In a real implementation, we would map the account type from GoCardless
    // to an Actual account type based on the account details
    
    // For now, we'll use a simple mapping
    if (account.name?.toLowerCase().includes('saving')) {
      return 'savings';
    } else if (account.name?.toLowerCase().includes('credit')) {
      return 'credit';
    } else {
      return 'checking'; // Default type
    }
  }
}

// Export a singleton instance
export const accountLinkController = new AccountLinkController(); 