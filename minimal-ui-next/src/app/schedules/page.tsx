import { Metadata } from "next";
import SchedulesClient from "./client";
import { WorkspaceRequired } from "@/components/workspace/workspace-required";

export const metadata: Metadata = {
  title: "Schedules | Odzai",
  description: "Manage scheduled transactions",
};

export default function SchedulesPage() {
  return (
    <WorkspaceRequired>
      <SchedulesClient />
    </WorkspaceRequired>
  );
} 