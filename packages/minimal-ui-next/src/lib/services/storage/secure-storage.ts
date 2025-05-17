import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Promisify filesystem operations
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);

/**
 * Secure Storage Utility
 * Provides methods for securely storing and retrieving sensitive data
 */
class SecureStorage {
  private basePath: string;
  
  constructor() {
    // Use the data directory from environment variable or default
    this.basePath = process.env.ACTUAL_DATA_DIR || path.join(process.cwd(), '..', '..', '..', 'data');
  }

  /**
   * Initialize storage by creating necessary directories
   */
  async init(): Promise<void> {
    try {
      // Create the base directory if it doesn't exist
      await this.ensureDirectoryExists(this.basePath);
      
      // Create a dedicated directory for secrets
      const secretsPath = path.join(this.basePath, 'secrets');
      await this.ensureDirectoryExists(secretsPath);
      
      console.log('Secure storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      throw new Error('Failed to initialize secure storage');
    }
  }

  /**
   * Ensure a directory exists, creating it if needed
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await accessAsync(dirPath, fs.constants.F_OK);
    } catch (error) {
      // Directory doesn't exist, create it
      await mkdirAsync(dirPath, { recursive: true });
    }
  }

  /**
   * Store a value securely
   */
  async store(key: string, value: any): Promise<void> {
    try {
      const secretsPath = path.join(this.basePath, 'secrets');
      await this.ensureDirectoryExists(secretsPath);
      
      const filePath = path.join(secretsPath, `${key}.json`);
      
      // In a real implementation, we would encrypt the data
      // For now, we'll just store it as JSON
      const data = JSON.stringify({
        value,
        timestamp: new Date().toISOString()
      });
      
      await writeFileAsync(filePath, data, 'utf8');
      console.log(`Stored value for key: ${key}`);
    } catch (error) {
      console.error(`Failed to store value for key ${key}:`, error);
      throw new Error(`Failed to store value for key ${key}`);
    }
  }

  /**
   * Retrieve a value
   */
  async retrieve<T>(key: string): Promise<T | null> {
    try {
      const filePath = path.join(this.basePath, 'secrets', `${key}.json`);
      
      // Check if the file exists
      try {
        await accessAsync(filePath, fs.constants.F_OK);
      } catch (error) {
        // File doesn't exist
        return null;
      }
      
      // Read and parse the file
      const data = await readFileAsync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      return parsed.value as T;
    } catch (error) {
      console.error(`Failed to retrieve value for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if a value exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.basePath, 'secrets', `${key}.json`);
      await accessAsync(filePath, fs.constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove a stored value
   */
  async remove(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.basePath, 'secrets', `${key}.json`);
      
      // Check if the file exists
      try {
        await accessAsync(filePath, fs.constants.F_OK);
      } catch (error) {
        // File doesn't exist
        return false;
      }
      
      // Remove the file
      await promisify(fs.unlink)(filePath);
      console.log(`Removed value for key: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove value for key ${key}:`, error);
      return false;
    }
  }
}

// Export a singleton instance
export const secureStorage = new SecureStorage(); 