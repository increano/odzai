'use client';

import { useEffect } from 'react';
import { StepLayout } from '../../../components/onboarding/StepLayout';
import { useOnboarding } from '../../../components/providers/OnboardingProvider';
import { CheckCircle } from 'lucide-react';

function CompleteContent() {
  const { workspaceName, fullName, goToStep } = useOnboarding();

  useEffect(() => {
    // Ensure we're on the correct step when this component mounts
    goToStep('complete');
  }, [goToStep]);

  return (
    <StepLayout
      title="All Set!"
      description="Your account has been successfully configured"
      currentStep="complete"
      nextButtonText="Go to Dashboard"
      isLastStep={true}
    >
      <div className="space-y-6">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-lg font-medium mb-4">
            Thank you, {fullName || 'there'}!
          </p>
          
          <p className="text-gray-700 mb-6">
            You're all set up and ready to start using Odzai Budget. Your workspace <span className="font-medium">{workspaceName}</span> has been created successfully.
          </p>
          
          <div className="rounded-md bg-blue-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  What's next?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1 text-left">
                    <li>Set up your categories and budget allocations</li>
                    <li>Connect your bank accounts (optional)</li>
                    <li>Start tracking your expenses</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}

export default function CompletePage() {
  return <CompleteContent />;
} 