import { Metadata } from "next";
import { WorkspaceRequired } from "@/components/workspace/workspace-required";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";

export const metadata: Metadata = {
  title: "Rules | Odzai",
  description: "Define and manage automatic transaction rules",
};

export default function RulesPage() {
  return (
    <WorkspaceRequired>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Rules</h1>
          <p className="text-muted-foreground">
            Create automation rules for categorizing and organizing transactions
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle>Transaction Rules</CardTitle>
            </div>
            <CardDescription>
              Automate transaction categorization and processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Transaction rules functionality will be implemented in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </WorkspaceRequired>
  );
} 