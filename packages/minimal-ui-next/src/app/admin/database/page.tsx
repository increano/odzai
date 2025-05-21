'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DatabaseSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    details?: any;
  } | null>(null);

  const handleSetupDatabase = async () => {
    if (!confirm('Are you sure you want to run the database setup? This will execute SQL commands with admin privileges.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error setting up database:', error);
      setResult({
        success: false,
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Database Administration</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This will execute the SQL scripts to set up all required tables, functions, 
            triggers, and indices in the Supabase database. This operation is idempotent 
            and can be safely run multiple times.
          </p>
          
          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleSetupDatabase}
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Running Setup...' : 'Run Database Setup'}
            </Button>
            
            {result && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={result.success ? "secondary" : "destructive"}>
                    {result.success ? 'Success' : 'Error'}
                  </Badge>
                  <span className="font-bold">
                    {result.message || result.error || 'Operation completed'}
                  </span>
                </div>
                
                {result.details && (
                  <Alert>
                    <AlertDescription>
                      <pre className="p-3 overflow-x-auto text-sm bg-gray-50 dark:bg-gray-800 rounded">
                        {typeof result.details === 'string' 
                          ? result.details 
                          : JSON.stringify(result.details, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            <li>This operation requires admin permissions</li>
            <li>The script creates tables only if they don't already exist</li>
            <li>RLS policies will be applied to protect your data</li>
            <li>Database indices are created for optimal performance</li>
            <li>The script uses a Supabase service role key with full database access</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 