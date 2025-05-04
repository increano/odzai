import { Metadata } from "next";
import ReconciliationClient from "./client";
import { WorkspaceRequired } from "@/components/workspace/workspace-required";

export const metadata: Metadata = {
  title: "Account Reconciliation | Odzai",
  description: "Reconcile your account balances with your statements",
};

export default function ReconciliationPage() {
  return (
    <WorkspaceRequired>
      <ReconciliationClient />
    </WorkspaceRequired>
  );
} 