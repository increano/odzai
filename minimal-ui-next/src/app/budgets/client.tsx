'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export default function BudgetsClient() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the settings page with the workspaces tab selected
    const redirectTimeout = setTimeout(() => {
      router.replace('/settings?tab=workspaces');
    }, 1000);

    return () => clearTimeout(redirectTimeout);
  }, [router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Redirecting...</h1>
        <p className="text-muted-foreground">
          The Budgets Management feature has been moved to Settings → Workspaces
        </p>
      </div>
      <Card>
        <CardContent className="flex items-center justify-center p-10">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Redirecting to Workspace Management...</span>
        </CardContent>
      </Card>
    </div>
  );
} 