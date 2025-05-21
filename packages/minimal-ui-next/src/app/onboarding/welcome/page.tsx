'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link'; 
import { StepLayout } from '../../../components/onboarding/StepLayout';
import { useOnboarding } from '../../../components/providers/OnboardingProvider';
import { Button } from '../../../components/ui/button';

function WelcomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { goToStep, goToNextStep } = useOnboarding();
  
  useEffect(() => {
    // Ensure we're on the correct step when this component mounts
    console.log('WelcomeContent mounted, current pathname:', pathname);
    goToStep('welcome');
  }, [goToStep, pathname]);
  
  const handleNextClick = () => {
    console.log('Next button clicked from welcome page');
    // Force a direct navigation as a fallback if context navigation fails
    try {
      goToNextStep();
    } catch (error) {
      console.error('Error navigating with goToNextStep:', error);
      router.push('/onboarding/workspace');
    }
  };
  
  const handleButtonClick = () => {
    console.log('Direct button clicked');
    router.push('/onboarding/workspace');
  };
  
  return (
    <StepLayout
      title="Welcome to Odzai Budget"
      description="Let's set up your budget in just a few steps"
      currentStep="welcome"
      showBackButton={false}
      onNextButtonClick={handleNextClick}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">
            Odzai Budget helps you take control of your finances with easy-to-use budgeting tools.
          </p>
          
          <p className="text-gray-700">
            In this short setup, we'll help you create your first workspace and configure your account.
          </p>
          
          {/* Fallback navigation options */}
          <div className="mt-8 flex flex-col gap-4">
            <Button onClick={handleButtonClick} className="mx-auto">
              Continue to Workspace Setup
            </Button>
            
            <p className="text-sm text-gray-500">
              If the button above doesn't work, <Link href="/onboarding/workspace" className="text-blue-600 underline">click here</Link> to continue.
            </p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}

export default function WelcomePage() {
  return <WelcomeContent />;
} 