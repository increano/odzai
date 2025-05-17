import { goCardlessClient as client } from './client';
import { getGoCardlessCredentials } from './config';

/**
 * GoCardless service configuration
 */
interface GoCardlessConfig {
  secretId: string;
  secretKey: string;
}

/**
 * GoCardless Service
 * Provides a higher-level interface to the GoCardless client and manages credentials
 */
class GoCardlessService {
  private isConfigured = false;

  /**
   * Initialize the service with saved credentials
   */
  async init(): Promise<boolean> {
    try {
      const credentials = getGoCardlessCredentials();
      
      if (!credentials) {
        console.log('No GoCardless credentials found');
        return false;
      }
      
      return this.configure(credentials.secretId, credentials.secretKey);
    } catch (error) {
      console.error('Error initializing GoCardless service:', error);
      return false;
    }
  }

  /**
   * Configure the GoCardless service with API credentials
   */
  async configure(secretId: string, secretKey: string): Promise<boolean> {
    try {
      if (!secretId || !secretKey) {
        console.error('Invalid GoCardless credentials');
        this.isConfigured = false;
        return false;
      }
      
      // Initialize the client
      const success = await client.configure(secretId, secretKey);
      
      if (success) {
        this.isConfigured = true;
        console.log('GoCardless service configured successfully');
        return true;
      } else {
        this.isConfigured = false;
        return false;
      }
    } catch (error) {
      console.error('Failed to configure GoCardless service:', error);
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Check if the GoCardless service is configured
   */
  getStatus(): { configured: boolean } {
    return { configured: this.isConfigured };
  }

  /**
   * Ensure the service is configured before making API calls
   */
  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new Error('GoCardless service is not configured');
    }
  }

  /**
   * Get list of banks by country
   */
  async getBanksByCountry(country: string): Promise<any[]> {
    try {
      this.ensureConfigured();
      return await client.getInstitutions(country);
    } catch (error) {
      console.error('Error getting banks by country:', error);
      return [];
    }
  }

  /**
   * Create a bank connection requisition
   */
  async createRequisition(institutionId: string, host: string): Promise<{ requisitionId: string, link: string } | null> {
    try {
      this.ensureConfigured();
      
      // Create callback URL
      const redirectUrl = `${host}/bank-connection/callback`;
      
      const result = await client.createRequisition(institutionId, redirectUrl);
      
      if (!result) {
        throw new Error('Failed to create requisition');
      }
      
      return {
        requisitionId: result.id,
        link: result.link
      };
    } catch (error) {
      console.error('Error creating requisition:', error);
      return null;
    }
  }

  /**
   * Get accounts from a requisition
   */
  async getAccounts(requisitionId: string): Promise<any[]> {
    try {
      this.ensureConfigured();
      
      // First get the requisition details
      const requisition = await client.getRequisition(requisitionId);
      
      if (!requisition || !requisition.accounts || !requisition.accounts.length) {
        return [];
      }
      
      // Get details for each account
      const accountPromises = requisition.accounts.map(async (accountId: string) => {
        return client.getAccount(accountId);
      });
      
      const accounts = await Promise.all(accountPromises);
      return accounts.filter(Boolean);
    } catch (error) {
      console.error('Error getting accounts:', error);
      return [];
    }
  }

  /**
   * Get transactions for an account
   */
  async getTransactions(accountId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      this.ensureConfigured();
      return await client.getTransactions(accountId, startDate, endDate);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const goCardlessService = new GoCardlessService(); 