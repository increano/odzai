import { Metadata } from "next";
import CategoriesClient from "./client";
import { WorkspaceRequired } from "@/components/workspace/workspace-required";

export const metadata: Metadata = {
  title: "Categories | Odzai",
  description: "Manage your spending categories",
};

export default function CategoriesPage() {
  return (
    <WorkspaceRequired>
      <CategoriesClient />
    </WorkspaceRequired>
  );
} 