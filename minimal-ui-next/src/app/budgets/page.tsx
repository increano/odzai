import { Metadata } from "next";
import BudgetsClient from "./client";
import { WorkspaceRequired } from "@/components/workspace/workspace-required";

export const metadata: Metadata = {
  title: "Budgets | Minimal Odzai",
  description: "Manage your budgets",
};

export default function BudgetsPage() {
  return (
    <WorkspaceRequired>
      <BudgetsClient />
    </WorkspaceRequired>
  );
} 