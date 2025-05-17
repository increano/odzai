import { Request, Response } from 'express';
import { goCardlessConfig, getGoCardlessCredentials } from '../services/gocardless/config';
import { goCardlessService } from '../services/gocardless/service';

/**
 * GoCardless Controller
 * Handles API requests related to GoCardless integration
 */
export class GoCardlessController {
  /**
   * Initialize GoCardless configuration
   */
  async init() {
    try {
      // First initialize configuration
      const configResult = await goCardlessConfig.init();
      
      // Then initialize service with the loaded credentials
      const serviceResult = await goCardlessService.init();
      
      const result = configResult && serviceResult;
      
      if (result) {
        console.log('GoCardless controller initialized successfully');
      } else {
        console.log('GoCardless controller initialized with incomplete configuration');
      }
    } catch (error) {
      console.error('Failed to initialize GoCardless controller:', error);
    }
  }

  /**
   * Configure GoCardless credentials
   */
  async setup(req: Request, res: Response) {
    try {
      const { secretId, secretKey } = req.body;
      
      if (!secretId || !secretKey) {
        return res.status(400).json({ 
          error: 'Missing credentials', 
          message: 'Both Secret ID and Secret Key are required' 
        });
      }
      
      // First store credentials in config
      const configResult = await goCardlessConfig.storeCredentials(secretId, secretKey);
      
      if (!configResult) {
        return res.status(400).json({ 
          error: 'Invalid credentials', 
          message: 'Failed to validate GoCardless credentials' 
        });
      }
      
      // Then configure the service with these credentials
      const serviceResult = await goCardlessService.configure(secretId, secretKey);
      
      if (serviceResult) {
        return res.json({ success: true });
      } else {
        return res.status(400).json({ 
          error: 'Invalid credentials', 
          message: 'Failed to configure GoCardless service with provided credentials' 
        });
      }
    } catch (error) {
      console.error('Failed to set up GoCardless:', error);
      return res.status(500).json({ 
        error: 'Failed to set up GoCardless',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get GoCardless configuration status
   */
  async getStatus(req: Request, res: Response) {
    try {
      // Check if credentials file exists and return status
      const credentials = await getGoCardlessCredentials();
      
      return res.json({
        configured: !!credentials
      });
    } catch (error) {
      console.error('Failed to get GoCardless status:', error);
      return res.status(500).json({ 
        error: 'Failed to get GoCardless status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get banks by country
   */
  async getBanksByCountry(req: Request, res: Response) {
    try {
      const { country } = req.query;
      
      if (!country || typeof country !== 'string') {
        return res.status(400).json({ 
          error: 'Missing country', 
          message: 'Country parameter is required' 
        });
      }
      
      // Check if service is configured
      const serviceStatus = goCardlessService.getStatus();
      if (!serviceStatus.configured) {
        return res.status(400).json({ 
          error: 'GoCardless not configured', 
          message: 'Please configure GoCardless credentials first' 
        });
      }
      
      const banks = await goCardlessService.getBanksByCountry(country);
      return res.json({ banks });
    } catch (error) {
      console.error('Failed to get banks:', error);
      return res.status(500).json({ 
        error: 'Failed to get banks',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create bank connection requisition
   */
  async connectBank(req: Request, res: Response) {
    try {
      const { institutionId } = req.body;
      
      if (!institutionId) {
        return res.status(400).json({ 
          error: 'Missing institution ID', 
          message: 'Institution ID is required' 
        });
      }
      
      // Check if service is configured
      const serviceStatus = goCardlessService.getStatus();
      if (!serviceStatus.configured) {
        return res.status(400).json({ 
          error: 'GoCardless not configured', 
          message: 'Please configure GoCardless credentials first' 
        });
      }
      
      // Get host from request
      const host = `${req.protocol}://${req.get('host')}`;
      
      const result = await goCardlessService.createRequisition(institutionId, host);
      
      if (!result) {
        return res.status(500).json({ 
          error: 'Failed to create bank connection', 
          message: 'Could not create requisition' 
        });
      }
      
      return res.json(result);
    } catch (error) {
      console.error('Failed to connect to bank:', error);
      return res.status(500).json({ 
        error: 'Failed to connect to bank',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get accounts from a requisition
   */
  async getAccounts(req: Request, res: Response) {
    try {
      const { requisitionId } = req.query;
      
      if (!requisitionId || typeof requisitionId !== 'string') {
        return res.status(400).json({ 
          error: 'Missing requisition ID', 
          message: 'Requisition ID is required' 
        });
      }
      
      // Check if service is configured
      const serviceStatus = goCardlessService.getStatus();
      if (!serviceStatus.configured) {
        return res.status(400).json({ 
          error: 'GoCardless not configured', 
          message: 'Please configure GoCardless credentials first' 
        });
      }
      
      const accounts = await goCardlessService.getAccounts(requisitionId);
      return res.json({ accounts });
    } catch (error) {
      console.error('Failed to get accounts:', error);
      return res.status(500).json({ 
        error: 'Failed to get accounts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Reset GoCardless configuration
   */
  async reset(req: Request, res: Response) {
    try {
      const result = await goCardlessConfig.clearCredentials();
      return res.json({ success: result });
    } catch (error) {
      console.error('Failed to reset GoCardless configuration:', error);
      return res.status(500).json({ 
        error: 'Failed to reset GoCardless configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Export a singleton instance
export const goCardlessController = new GoCardlessController(); 