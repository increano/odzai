import { Metadata } from "next";
import ReconciliationClient from "./client";

export const metadata: Metadata = {
  title: "Account Reconciliation | Minimal Actual Budget",
  description: "Reconcile your account balances with your statements",
};

export default function ReconciliationPage() {
  return <ReconciliationClient />;
} 