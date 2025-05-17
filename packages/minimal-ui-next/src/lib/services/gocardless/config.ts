/**
 * GoCardless configuration manager for centralized credentials
 * This module handles secure storage and retrieval of GoCardless API credentials
 */

import fs from 'fs';
import path from 'path';

// Constants
const CREDENTIALS_FILE = process.env.GOCARDLESS_CREDENTIALS_PATH || 
  path.join(process.cwd(), 'data', 'gocardless-credentials.json');

/**
 * Interface for GoCardless credentials
 */
export interface GoCardlessCredentials {
  secretId: string;
  secretKey: string;
  timestamp: string;
}

/**
 * Get the centralized GoCardless credentials
 * These credentials are used for all users of the application
 * 
 * @returns The GoCardless credentials or null if not configured
 */
export function getGoCardlessCredentials(): GoCardlessCredentials | null {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return null;
    }
    
    const rawData = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
    const credentials = JSON.parse(rawData) as GoCardlessCredentials;
    
    return credentials;
  } catch (error) {
    console.error('Error reading GoCardless credentials:', error);
    return null;
  }
}

/**
 * Validate GoCardless credentials with their API
 * 
 * @param secretId The GoCardless Secret ID
 * @param secretKey The GoCardless Secret Key
 * @returns True if credentials are valid, false otherwise
 */
export async function validateGoCardlessCredentials(
  secretId: string, 
  secretKey: string
): Promise<boolean> {
  try {
    // In a real implementation, we would make a request to GoCardless API
    // to validate the credentials
    
    // This is a simplified version that just checks if they're not empty
    return Boolean(secretId) && Boolean(secretKey);
    
    // Example of a real implementation:
    // const response = await fetch('https://bankaccountdata.gocardless.com/api/v2/institutions', {
    //   headers: {
    //     'Authorization': `Bearer ${secretKey}`,
    //     'Content-Type': 'application/json',
    //   },
    // });
    // 
    // return response.ok;
  } catch (error) {
    console.error('Error validating GoCardless credentials:', error);
    return false;
  }
}

/**
 * Save GoCardless configuration
 * 
 * @param secretId The GoCardless Secret ID
 * @param secretKey The GoCardless Secret Key
 * @returns True if saved successfully, false otherwise
 */
export async function saveGoCardlessConfig(
  secretId: string, 
  secretKey: string
): Promise<boolean> {
  try {
    // Ensure directory exists
    const dir = path.dirname(CREDENTIALS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save credentials
    const credentials: GoCardlessCredentials = {
      secretId,
      secretKey,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error saving GoCardless config:', error);
    return false;
  }
}

/**
 * Get GoCardless configuration status
 * @returns Configuration status object
 */
export async function getGoCardlessConfig(): Promise<GoCardlessCredentials> {
  try {
    // In a real implementation, retrieve from secure storage
    // For development, we'll use environment variables
    const secretId = process.env.GOCARDLESS_SECRET_ID || '';
    const secretKey = process.env.GOCARDLESS_SECRET_KEY || '';
    
    // Check if credentials exist
    const isConfigured = !!(secretId && secretKey);
    
    return {
      secretId,
      secretKey,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error retrieving GoCardless configuration:', error);
    return {
      secretId: '',
      secretKey: '',
      timestamp: ''
    };
  }
}

/**
 * Clear GoCardless configuration
 * @returns Success status
 */
export async function clearGoCardlessConfig(): Promise<boolean> {
  try {
    // In a real implementation, remove from secure storage
    console.log('Clearing GoCardless credentials...');
    fs.unlinkSync(CREDENTIALS_FILE);
    return true;
  } catch (error) {
    console.error('Error clearing GoCardless configuration:', error);
    return false;
  }
}

// Export a simplified version for client components
export const goCardlessConfig = {
  isConfigured: false, // This will be populated at runtime
  
  /**
   * Initialize the GoCardless configuration
   * Loads credentials from file if available
   */
  async init(): Promise<boolean> {
    try {
      const credentials = getGoCardlessCredentials();
      
      if (credentials) {
        this.isConfigured = true;
        console.log('GoCardless configuration loaded');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing GoCardless config:', error);
      return false;
    }
  },
  
  /**
   * Store GoCardless credentials
   */
  async storeCredentials(secretId: string, secretKey: string): Promise<boolean> {
    try {
      // Validate the credentials first
      const isValid = await validateGoCardlessCredentials(secretId, secretKey);
      
      if (!isValid) {
        console.error('Invalid GoCardless credentials');
        return false;
      }
      
      // Save the credentials
      const result = await saveGoCardlessConfig(secretId, secretKey);
      
      if (result) {
        this.isConfigured = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error storing GoCardless credentials:', error);
      return false;
    }
  },
  
  /**
   * Clear GoCardless credentials
   */
  async clearCredentials(): Promise<boolean> {
    try {
      const result = await clearGoCardlessConfig();
      
      if (result) {
        this.isConfigured = false;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error clearing GoCardless credentials:', error);
      return false;
    }
  },
  
  /**
   * Get GoCardless configuration status
   */
  getStatus(): { configured: boolean } {
    return { configured: this.isConfigured };
  }
}; 