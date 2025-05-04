import { Metadata } from "next";
import ReportsClient from "./client";
import { WorkspaceRequired } from "@/components/workspace/workspace-required";

export const metadata: Metadata = {
  title: "Reports | Odzai",
  description: "View financial reports and insights",
};

export default function ReportsPage() {
  return (
    <WorkspaceRequired>
      <ReportsClient />
    </WorkspaceRequired>
  );
} 