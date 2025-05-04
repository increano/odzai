import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceRequired } from "@/components/workspace/workspace-required";
import BudgetClient from "./client";

export const metadata: Metadata = {
  title: "Budget | Odzai",
  description: "Manage your monthly budget",
};

export default function BudgetPage() {
  return (
    <WorkspaceRequired>
      <BudgetClient />
    </WorkspaceRequired>
  );
} 