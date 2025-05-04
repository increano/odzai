import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  ArrowRight, 
  Settings, 
  CreditCard, 
  PiggyBank, 
  FileText, 
  BarChart4 
} from "lucide-react";

export const metadata: Metadata = {
  title: "Odzai | Financial Management",
  description: "Personal finance management application",
};

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">Welcome to Odzai</h1>
        <p className="text-xl text-muted-foreground">
          Personal finance management made simple
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Management</CardTitle>
            <CardDescription>
              Create, import, or select a workspace to manage your finances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings?tab=workspaces">
              <Button className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Manage Workspaces
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Learn how to use Odzai effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/help">
              <Button variant="outline" className="w-full">
                View Tutorials
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4">Financial Management</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CreditCard className="h-6 w-6 mb-2 text-primary" />
            <CardTitle>Accounts</CardTitle>
            <CardDescription>
              Track balances and manage all your financial accounts
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/accounts" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between">
                View Accounts
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <FileText className="h-6 w-6 mb-2 text-primary" />
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Record and organize your financial transactions
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/transactions" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between">
                View Transactions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <PiggyBank className="h-6 w-6 mb-2 text-primary" />
            <CardTitle>Budget</CardTitle>
            <CardDescription>
              Plan spending and track your monthly budget goals
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/budget" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between">
                View Budget
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <BarChart4 className="h-6 w-6 mb-2 text-primary" />
            <CardTitle>Reconciliation</CardTitle>
            <CardDescription>
              Verify your account balances against bank statements
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/reconciliation" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between">
                Reconcile Accounts
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
