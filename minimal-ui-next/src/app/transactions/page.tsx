import { Metadata } from "next";
import TransactionsClient from "./client";
import { WorkspaceRequired } from "@/components/workspace/workspace-required";

export const metadata: Metadata = {
  title: "Transactions | Odzai",
  description: "Manage your transactions and financial activity",
};

export default function TransactionsPage() {
  return (
    <WorkspaceRequired>
      <TransactionsClient />
    </WorkspaceRequired>
  );
} 