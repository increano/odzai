"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";
import { ClientWrapper } from "@/components/ClientWrapper";

export default function BankConnectionError() {
  return (
    <ClientWrapper>
      <BankConnectionErrorContent />
    </ClientWrapper>
  );
}

function BankConnectionErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "An unknown error occurred during the bank connection process.";
  
  const goBack = () => {
    router.push('/bank-connection');
  };
  
  return (
    <div className="container max-w-3xl py-10">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-6" 
        onClick={goBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <XCircle className="mr-2 h-5 w-5" />
            Connection Failed
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 text-destructive rounded-md p-4">
            <p className="text-sm">{error}</p>
          </div>
          
          <div className="text-sm space-y-4">
            <p>Some common reasons for connection failures:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your bank might be experiencing technical issues</li>
              <li>Your bank connection credentials may have expired</li>
              <li>The GoCardless service might be temporarily unavailable</li>
              <li>Your API configuration might need to be updated</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={goBack}>
            Go Back
          </Button>
          <Button onClick={() => router.push('/bank-connection')}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 