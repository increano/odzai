/**
 * Enhanced storage utility for managing browser storage operations efficiently
 * Features:
 * - Batched writes to reduce UI freezes
 * - Automatic type handling
 * - Error recovery
 * - Storage event synchronization
 * - Fallbacks for private browsing
 */

type StorageType = 'local' | 'session';
type StorageValue = string | number | boolean | object | Array<any> | null;
type PendingWrite = {
  key: string;
  value: string;
  timestamp: number;
  storageType: StorageType;
};

// Queue for batched writes
const writeQueue: PendingWrite[] = [];
let writeTimeout: NodeJS.Timeout | null = null;
const BATCH_DELAY = 100; // ms before processing batch

// In-memory cache
const memoryCache: Record<string, string> = {};

// Check if storage is available
function isStorageAvailable(type: StorageType): boolean {
  const storage = type === 'local' ? localStorage : sessionStorage;
  try {
    const testKey = `__storage_test__${Math.random()}`;
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Get storage object based on type
function getStorage(type: StorageType): Storage {
  return type === 'local' ? localStorage : sessionStorage;
}

// Local memory fallback for private browsing mode
class MemoryStorage {
  private data: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.data[key] || null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  clear(): void {
    this.data = {};
  }
}

const localMemoryFallback = new MemoryStorage();
const sessionMemoryFallback = new MemoryStorage();

// Process the write queue in batches
function processWriteQueue() {
  if (writeQueue.length === 0) return;

  // Group writes by storage type
  const localWrites: PendingWrite[] = [];
  const sessionWrites: PendingWrite[] = [];

  // Organize writes, keeping only the latest write for each key
  const latestWrites = new Map<string, PendingWrite>();
  
  writeQueue.forEach(write => {
    const existingWrite = latestWrites.get(`${write.storageType}:${write.key}`);
    if (!existingWrite || write.timestamp > existingWrite.timestamp) {
      latestWrites.set(`${write.storageType}:${write.key}`, write);
    }
  });

  // Sort into appropriate storage types
  latestWrites.forEach((write) => {
    if (write.storageType === 'local') {
      localWrites.push(write);
    } else {
      sessionWrites.push(write);
    }
  });

  // Process local storage writes
  if (localWrites.length > 0) {
    const localAvailable = isStorageAvailable('local');
    localWrites.forEach(({ key, value }) => {
      // Update memory cache
      memoryCache[`local:${key}`] = value;
      
      // Try to write to actual storage
      if (localAvailable) {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error(`Error writing to localStorage: ${key}`, error);
          // Fallback to memory storage
          localMemoryFallback.setItem(key, value);
        }
      } else {
        // Use memory fallback
        localMemoryFallback.setItem(key, value);
      }
    });
  }

  // Process session storage writes
  if (sessionWrites.length > 0) {
    const sessionAvailable = isStorageAvailable('session');
    sessionWrites.forEach(({ key, value }) => {
      // Update memory cache
      memoryCache[`session:${key}`] = value;
      
      // Try to write to actual storage
      if (sessionAvailable) {
        try {
          sessionStorage.setItem(key, value);
        } catch (error) {
          console.error(`Error writing to sessionStorage: ${key}`, error);
          // Fallback to memory storage
          sessionMemoryFallback.setItem(key, value);
        }
      } else {
        // Use memory fallback
        sessionMemoryFallback.setItem(key, value);
      }
    });
  }

  // Clear the queue
  writeQueue.length = 0;
}

// Schedule batch processing
function scheduleQueueProcessing() {
  if (writeTimeout !== null) {
    clearTimeout(writeTimeout);
  }
  writeTimeout = setTimeout(() => {
    processWriteQueue();
    writeTimeout = null;
  }, BATCH_DELAY);
}

// Add a value to the write queue
function queueWrite(key: string, value: string, storageType: StorageType) {
  writeQueue.push({
    key,
    value,
    timestamp: Date.now(),
    storageType,
  });
  scheduleQueueProcessing();
}

// Generic storage API
export const storage = {
  /**
   * Get a value from storage with type conversion
   */
  get<T = any>(key: string, storageType: StorageType = 'local'): T | null {
    // First check memory cache for most recent value
    const cacheKey = `${storageType}:${key}`;
    if (memoryCache[cacheKey] !== undefined) {
      try {
        return JSON.parse(memoryCache[cacheKey]) as T;
      } catch (e) {
        return memoryCache[cacheKey] as unknown as T;
      }
    }
    
    // Check actual storage
    try {
      if (isStorageAvailable(storageType)) {
        const storage = getStorage(storageType);
        const value = storage.getItem(key);
        if (value === null) return null;
        
        try {
          // Update cache
          memoryCache[cacheKey] = value;
          return JSON.parse(value) as T;
        } catch {
          // Not JSON, return as is
          return value as unknown as T;
        }
      } else {
        // Use memory fallback
        const fallback = storageType === 'local' ? localMemoryFallback : sessionMemoryFallback;
        const value = fallback.getItem(key);
        if (value === null) return null;
        
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as unknown as T;
        }
      }
    } catch (error) {
      console.error(`Error reading from ${storageType}Storage:`, error);
      return null;
    }
  },

  /**
   * Set a value in storage with type conversion and batched writes
   */
  set(key: string, value: StorageValue, storageType: StorageType = 'local'): void {
    try {
      // Convert to string for storage
      const valueString = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      // Queue write for batch processing
      queueWrite(key, valueString, storageType);
      
      // Update memory cache immediately for fast reads
      memoryCache[`${storageType}:${key}`] = valueString;
    } catch (error) {
      console.error(`Error preparing to write to ${storageType}Storage:`, error);
    }
  },

  /**
   * Remove a value from storage
   */
  remove(key: string, storageType: StorageType = 'local'): void {
    try {
      // Remove from memory cache
      delete memoryCache[`${storageType}:${key}`];
      
      // Queue write for batch processing (null value will be removed)
      queueWrite(key, 'null', storageType);
      
      // Try to remove immediately too
      if (isStorageAvailable(storageType)) {
        getStorage(storageType).removeItem(key);
      } else {
        // Use memory fallback
        const fallback = storageType === 'local' ? localMemoryFallback : sessionMemoryFallback;
        fallback.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing from ${storageType}Storage:`, error);
    }
  },

  /**
   * Clear all storage of a specific type
   */
  clear(storageType: StorageType = 'local'): void {
    try {
      // Clear memory cache for this storage type
      Object.keys(memoryCache).forEach(key => {
        if (key.startsWith(`${storageType}:`)) {
          delete memoryCache[key];
        }
      });
      
      // Clear actual storage
      if (isStorageAvailable(storageType)) {
        getStorage(storageType).clear();
      } else {
        // Clear memory fallback
        const fallback = storageType === 'local' ? localMemoryFallback : sessionMemoryFallback;
        fallback.clear();
      }
      
      // Clear pending writes for this storage type
      const indexesToRemove = [];
      for (let i = 0; i < writeQueue.length; i++) {
        if (writeQueue[i].storageType === storageType) {
          indexesToRemove.push(i);
        }
      }
      
      // Remove from end to beginning to avoid index shifts
      for (let i = indexesToRemove.length - 1; i >= 0; i--) {
        writeQueue.splice(indexesToRemove[i], 1);
      }
    } catch (error) {
      console.error(`Error clearing ${storageType}Storage:`, error);
    }
  },

  /**
   * Flush all pending writes immediately
   */
  flush(): void {
    if (writeTimeout !== null) {
      clearTimeout(writeTimeout);
      writeTimeout = null;
    }
    processWriteQueue();
  },
  
  /**
   * Get all keys in a specific storage
   */
  keys(storageType: StorageType = 'local'): string[] {
    try {
      // First get keys from actual storage
      let keys: string[] = [];
      if (isStorageAvailable(storageType)) {
        const storage = getStorage(storageType);
        keys = Object.keys(storage);
      }
      
      // Add keys from memory cache
      const cachePrefix = `${storageType}:`;
      Object.keys(memoryCache)
        .filter(key => key.startsWith(cachePrefix))
        .forEach(key => {
          const actualKey = key.substring(cachePrefix.length);
          if (!keys.includes(actualKey)) {
            keys.push(actualKey);
          }
        });
      
      return keys;
    } catch (error) {
      console.error(`Error getting keys from ${storageType}Storage:`, error);
      return [];
    }
  }
};

// Add storage event listener to keep memory cache in sync across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    // Update memory cache when storage changes in other tabs
    if (event.key && event.newValue !== null) {
      memoryCache[`local:${event.key}`] = event.newValue;
    } else if (event.key && event.newValue === null) {
      delete memoryCache[`local:${event.key}`];
    }
  });
} 