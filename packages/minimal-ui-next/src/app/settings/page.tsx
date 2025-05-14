import { Metadata } from 'next';
import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout';
import { Settings as SettingsIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings | Odzai',
  description: 'Configure your application settings',
};

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <DashboardContent title="Settings">
        <div className="rounded-lg border p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-primary/10 p-6">
              <SettingsIcon className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Application Settings</h2>
            <p className="max-w-md text-muted-foreground">
              Configure your preferences, account settings, and application options.
            </p>
            <div className="mt-4 w-full max-w-2xl">
              <div className="grid gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Account Settings</h3>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <span>Profile Information</span>
                      <span className="text-sm text-muted-foreground">Edit your personal details</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <span>Password & Security</span>
                      <span className="text-sm text-muted-foreground">Manage login credentials</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <span>Notifications</span>
                      <span className="text-sm text-muted-foreground">Configure alert preferences</span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Application Settings</h3>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <span>Theme</span>
                      <span className="text-sm text-muted-foreground">Light / Dark mode</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <span>Currency</span>
                      <span className="text-sm text-muted-foreground">Set default currency</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <span>Date Format</span>
                      <span className="text-sm text-muted-foreground">Configure display format</span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Data Management</h3>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <span>Backup & Restore</span>
                      <span className="text-sm text-muted-foreground">Manage your data</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <span>Export Data</span>
                      <span className="text-sm text-muted-foreground">Download your information</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardLayout>
  );
} 