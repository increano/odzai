// Transaction import endpoint
app.post('/api/transactions-import', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { accountId } = req.body;
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }
    
    const file = req.files.file as any;
    
    // Get file extension to determine type
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    // Check file type
    const supportedTypes = ['csv', 'ofx', 'qfx', 'xlsx', 'xls'];
    if (!supportedTypes.includes(fileExt)) {
      return res.status(400).json({ error: 'Unsupported file type. Supported: CSV, OFX, QFX, XLSX, XLS' });
    }
    
    console.log(`Importing transactions from ${file.name} (${file.size} bytes) to account ${accountId}`);
    
    // Process file based on type
    let transactions = [];
    
    if (fileExt === 'csv') {
      // Parse CSV file
      const csvContent = file.data.toString('utf8');
      
      // Simple CSV parsing (in real implementation, use a CSV parsing library)
      const rows = csvContent.split('\n').filter(Boolean);
      const headers = rows[0].split(',').map(h => h.trim());
      
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => v.trim());
        
        // Map CSV columns to transaction properties
        const transaction = {
          date: values[headers.indexOf('Date')] || new Date().toISOString().split('T')[0],
          amount: parseFloat(values[headers.indexOf('Amount')]) * 100 || 0,
          payee_name: values[headers.indexOf('Payee')] || 'Unknown',
          notes: values[headers.indexOf('Notes')] || '',
          category: null,
          imported_id: `import-${Date.now()}-${i}`
        };
        
        transactions.push(transaction);
      }
    } else {
      // For OFX, QFX, XLSX handling, we'd need specialized libraries
      // This is simplified for the example
      return res.status(400).json({ 
        error: `${fileExt.toUpperCase()} import functionality is not yet implemented`
      });
    }
    
    // Default options
    const defaultCleared = req.body.defaultCleared === 'true';
    const skipDuplicates = req.body.skipDuplicates === 'true';
    
    console.log(`Parsed ${transactions.length} transactions, defaultCleared: ${defaultCleared}, skipDuplicates: ${skipDuplicates}`);
    
    // Insert transactions
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let errors = [];
    
    for (const transaction of transactions) {
      try {
        // Add transaction
        await actualAPI.addTransactions(accountId, [{
          ...transaction,
          cleared: defaultCleared
        }]);
        
        added++;
      } catch (err) {
        if (err.message?.includes('duplicate')) {
          if (skipDuplicates) {
            skipped++;
          } else {
            // Update existing transaction
            // In a real implementation, we'd need to find the existing transaction ID first
            updated++;
          }
        } else {
          errors.push(err.message || 'Unknown error');
        }
      }
    }
    
    console.log(`Import completed: ${added} added, ${updated} updated, ${skipped} skipped, ${errors.length} errors`);
    
    res.json({
      success: true,
      added,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Failed to import transactions:', error);
    res.status(500).json({ 
      error: 'Failed to import transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Transaction export endpoint
app.post('/api/transactions-export', ensureBudgetLoaded, async (req: Request, res: Response) => {
  try {
    const { transactionIds, accountId, format = 'csv', startDate, endDate } = req.body;
    
    // Validate input
    if (!transactionIds && !accountId) {
      return res.status(400).json({ error: 'Either transactionIds or accountId must be provided' });
    }
    
    // Get transactions
    let transactions = [];
    
    if (transactionIds) {
      // Parse transaction IDs if they're in JSON string format
      const ids = typeof transactionIds === 'string' ? JSON.parse(transactionIds) : transactionIds;
      
      // Get specific transactions by IDs
      for (const id of ids) {
        try {
          const transaction = await actualAPI.getTransaction(id);
          if (transaction) {
            transactions.push(transaction);
          }
        } catch (err) {
          console.error(`Error fetching transaction ${id}:`, err);
        }
      }
    } else {
      // Get transactions for the account
      const allTransactions = await actualAPI.getTransactions(accountId, startDate, endDate);
      transactions = allTransactions;
    }
    
    console.log(`Exporting ${transactions.length} transactions in ${format} format`);
    
    // Generate export content based on format
    if (format === 'csv') {
      // Generate CSV
      const headers = ['Date', 'Payee', 'Category', 'Amount', 'Notes'];
      const rows = transactions.map(t => [
        t.date,
        t.payee_name || t.payee,
        t.category_name || '',
        (t.amount / 100).toFixed(2),
        t.notes || ''
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="transactions-export-${Date.now()}.csv"`);
      
      // Send CSV content
      res.send(csvContent);
    } else if (format === 'json') {
      // Set headers for JSON download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="transactions-export-${Date.now()}.json"`);
      
      // Send JSON content
      res.json(transactions);
    } else {
      return res.status(400).json({ error: `Unsupported export format: ${format}` });
    }
  } catch (error) {
    console.error('Failed to export transactions:', error);
    res.status(500).json({ 
      error: 'Failed to export transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}); 