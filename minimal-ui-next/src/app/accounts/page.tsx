import { Metadata } from "next";
import AccountsClient from "./client";
import { WorkspaceRequired } from "@/components/workspace/workspace-required";

export const metadata: Metadata = {
  title: "Accounts | Odzai",
  description: "Manage your financial accounts",
};

export default function AccountsPage() {
  return (
    <WorkspaceRequired>
      <AccountsClient />
    </WorkspaceRequired>
  );
} 