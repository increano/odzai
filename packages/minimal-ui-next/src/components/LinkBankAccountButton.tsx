"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plug } from "lucide-react";

interface LinkBankAccountButtonProps {
  accountId?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Button component that initiates the bank account linking process
 */
export default function LinkBankAccountButton({
  accountId,
  variant = "default",
  size = "default",
  className = ""
}: LinkBankAccountButtonProps) {
  const router = useRouter();

  const handleStartLinking = () => {
    // If accountId is provided, we're linking an existing account
    // Otherwise, user will create a new account as part of the flow
    const url = accountId 
      ? `/bank-connection?accountId=${accountId}` 
      : '/bank-connection';
    
    router.push(url);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartLinking}
      className={className}
    >
      <Plug className="mr-2 h-4 w-4" />
      Link Bank Account
    </Button>
  );
} 