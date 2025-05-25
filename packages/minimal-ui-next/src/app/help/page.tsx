'use client'

import { DashboardLayout, DashboardContent } from '@/components/dashboard-layout';
import { WorkspaceRequired } from '@/components/workspace-required';
import { HelpCircle, Book, Video, MessageCircle, FileText } from 'lucide-react';

export default function HelpPage() {
  const content = (
    <DashboardLayout>
      <DashboardContent title="Help & Support">
        <div className="rounded-lg border p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-primary/10 p-6">
              <HelpCircle className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">How Can We Help?</h2>
            <p className="max-w-md text-muted-foreground">
              Find answers to common questions, learn how to use features, and get support when you need it.
            </p>
            
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-4xl">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <Book className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Documentation</h3>
                <p className="text-sm text-muted-foreground">Detailed guides and reference materials</p>
              </div>
              
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <Video className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Video Tutorials</h3>
                <p className="text-sm text-muted-foreground">Learn through step-by-step videos</p>
              </div>
              
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <MessageCircle className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Community Forum</h3>
                <p className="text-sm text-muted-foreground">Get help from other users</p>
              </div>
              
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <FileText className="h-8 w-8 text-primary" />
                <h3 className="font-medium">FAQ</h3>
                <p className="text-sm text-muted-foreground">Answers to common questions</p>
              </div>
            </div>
            
            <div className="mt-8 w-full max-w-2xl">
              <h3 className="text-xl font-semibold mb-4 text-left">Frequently Asked Questions</h3>
              
              <div className="space-y-4">
                <div className="rounded-lg border p-4 text-left">
                  <h4 className="font-medium mb-2">How do I create a workspace?</h4>
                  <p className="text-sm text-muted-foreground">
                    Navigate to the Workspaces section, click "New Workspace", provide a name, and click "Create Workspace".
                  </p>
                </div>
                
                <div className="rounded-lg border p-4 text-left">
                  <h4 className="font-medium mb-2">How do I add a new account?</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Accounts, click "Add Account", fill in the required information, and save your changes.
                  </p>
                </div>
                
                <div className="rounded-lg border p-4 text-left">
                  <h4 className="font-medium mb-2">Can I import transactions from my bank?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can import transactions from CSV files or connect directly with supported financial institutions.
                  </p>
                </div>
                
                <div className="rounded-lg border p-4 text-left">
                  <h4 className="font-medium mb-2">How do I set up a budget?</h4>
                  <p className="text-sm text-muted-foreground">
                    Navigate to the Budget section, allocate amounts to different categories, and track your spending against those allocations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardLayout>
  );

  return (
    <WorkspaceRequired>
      {content}
    </WorkspaceRequired>
  );
} 