import { Metadata } from "next";
import SettingsClient from "./client";

export const metadata: Metadata = {
  title: "Settings | Odzai",
  description: "Manage application settings and workspaces",
};

export default function SettingsPage() {
  return <SettingsClient />;
} 