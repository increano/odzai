/**
 * Data migration worker for transferring data from SQLite to PostgreSQL
 * This is based on the specification in the Supabase migration roadmap
 */

// Define supported table names for migration
export type MigrationTable = 
  | 'transactions' 
  | 'accounts' 
  | 'categories' 
  | 'budget_months';

// Message types for worker communication
export type WorkerMessage = {
  type: 'progress' | 'complete' | 'error';
  tableName?: string;
  success?: number;
  failed?: number;
  message?: string;
  totalRecords?: number;
  processedRecords?: number;
};

/**
 * Transforms a record from SQLite format to PostgreSQL format
 * This handles any data type conversions or structure changes needed
 */
function transformRecord(record: any, tableName: MigrationTable) {
  // Default - return record as is
  let transformed = { ...record };
  
  switch (tableName) {
    case 'transactions':
      // Handle transaction-specific transformations
      // For example, convert date format, handle decimal amounts, etc.
      if (transformed.date) {
        // Ensure date is in ISO format
        transformed.date = new Date(transformed.date).toISOString().split('T')[0];
      }
      
      // Convert amount from integer to decimal if needed
      if (typeof transformed.amount === 'number') {
        // Keeping as is for now, but could be transformed if needed
      }
      break;
      
    case 'accounts':
      // Handle account-specific transformations
      // For example, set default values for new fields
      transformed.last_synced = transformed.last_synced || null;
      break;
      
    case 'categories':
      // Handle category-specific transformations
      transformed.hidden = !!transformed.hidden; // Ensure boolean
      transformed.is_income = !!transformed.is_income; // Ensure boolean
      break;
      
    case 'budget_months':
      // Handle budget month-specific transformations
      // Convert amounts, ensure proper keys, etc.
      break;
  }
  
  return transformed;
}

/**
 * Worker entry point
 * Handles messages from the main thread and processes data chunks
 */
self.addEventListener('message', async (e: MessageEvent) => {
  const { chunk, tableName, operation, supabaseConfig } = e.data;
  
  if (!chunk || !tableName || !operation || !supabaseConfig) {
    self.postMessage({
      type: 'error',
      message: 'Invalid worker parameters. Required: chunk, tableName, operation, supabaseConfig'
    } as WorkerMessage);
    return;
  }
  
  try {
    // Create Supabase client
    // Note: In a real implementation, we would import the Supabase JS client
    // For this example, we're simulating the operations
    
    // Process records based on the requested operation
    if (operation === 'migrate') {
      await migrateChunk(chunk, tableName, supabaseConfig);
    } else if (operation === 'validate') {
      await validateChunk(chunk, tableName, supabaseConfig);
    } else {
      throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : 'Unknown error in worker'
    } as WorkerMessage);
  }
});

/**
 * Migrates a chunk of records to Supabase
 */
async function migrateChunk(chunk: any[], tableName: MigrationTable, supabaseConfig: any) {
  // Progress tracking
  let success = 0;
  let failed = 0;
  const totalRecords = chunk.length;
  
  // Process each record with rate limiting to prevent UI freezing
  for (let i = 0; i < chunk.length; i++) {
    try {
      // Transform the record
      const record = chunk[i];
      const transformed = transformRecord(record, tableName);
      
      // In a real implementation, we would insert into Supabase
      // For now, simulate a successful insert
      // const { data, error } = await supabase.from(tableName).upsert(transformed);
      
      // Simulate some processing time and success/failure
      await new Promise(resolve => setTimeout(resolve, 5));
      
      if (Math.random() > 0.05) { // 95% success rate in simulation
        success++;
      } else {
        failed++;
        console.error(`Failed to migrate record in ${tableName}:`, record.id);
      }
      
      // Report progress every 10 records or at the end
      if (i % 10 === 0 || i === chunk.length - 1) {
        self.postMessage({
          type: 'progress',
          tableName,
          success,
          failed,
          totalRecords,
          processedRecords: i + 1
        } as WorkerMessage);
      }
    } catch (err) {
      failed++;
      console.error(`Error processing record in ${tableName}:`, err);
    }
  }
  
  // Send completion message
  self.postMessage({
    type: 'complete',
    tableName,
    success,
    failed,
    totalRecords,
    processedRecords: totalRecords
  } as WorkerMessage);
}

/**
 * Validates a chunk of records against Supabase
 * This checks if records exist and match without modifying anything
 */
async function validateChunk(chunk: any[], tableName: MigrationTable, supabaseConfig: any) {
  // Progress tracking
  let matching = 0;
  let mismatched = 0;
  let missing = 0;
  const totalRecords = chunk.length;
  
  // Process each record
  for (let i = 0; i < chunk.length; i++) {
    try {
      const record = chunk[i];
      
      // In a real implementation, we would query Supabase
      // For now, simulate a validation check
      // const { data, error } = await supabase.from(tableName).select('*').eq('id', record.id).single();
      
      // Simulate some processing time and different outcomes
      await new Promise(resolve => setTimeout(resolve, 3));
      
      const rand = Math.random();
      if (rand > 0.2) { // 80% match in simulation
        matching++;
      } else if (rand > 0.1) { // 10% mismatch
        mismatched++;
      } else { // 10% missing
        missing++;
      }
      
      // Report progress every 10 records or at the end
      if (i % 10 === 0 || i === chunk.length - 1) {
        self.postMessage({
          type: 'progress',
          tableName,
          success: matching,
          failed: mismatched + missing,
          message: `Matching: ${matching}, Mismatched: ${mismatched}, Missing: ${missing}`,
          totalRecords,
          processedRecords: i + 1
        } as WorkerMessage);
      }
    } catch (err) {
      console.error(`Error validating record in ${tableName}:`, err);
      missing++;
    }
  }
  
  // Send completion message
  self.postMessage({
    type: 'complete',
    tableName,
    success: matching,
    failed: mismatched + missing,
    message: `Validation complete. Matching: ${matching}, Mismatched: ${mismatched}, Missing: ${missing}`,
    totalRecords,
    processedRecords: totalRecords
  } as WorkerMessage);
} 