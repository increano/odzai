'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { OnboardingStep, useOnboarding } from '../providers/OnboardingProvider';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/SupabaseAuthProvider';

// Define the order of steps for progress indicator - removed profile step
const STEP_ORDER: OnboardingStep[] = ['welcome', 'complete'];

interface StepLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  currentStep: OnboardingStep;
  showBackButton?: boolean;
  showNextButton?: boolean;
  nextButtonText?: string;
  nextButtonDisabled?: boolean;
  onNextButtonClick?: () => void;
  isLastStep?: boolean;
  customButtons?: React.ReactNode;
}

export function StepLayout({
  children,
  title,
  description,
  currentStep,
  showBackButton = true,
  showNextButton = true,
  nextButtonText = 'Next',
  nextButtonDisabled = false,
  onNextButtonClick,
  isLastStep = false,
  customButtons,
}: StepLayoutProps) {
  const { goToNextStep, goToPreviousStep, completeOnboarding } = useOnboarding();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Check session availability
  useEffect(() => {
    // Add a small delay to allow session to be properly initialized
    const timer = setTimeout(() => {
      if (!authLoading && !session?.user) {
        console.log('StepLayout: No session detected after delay, redirecting to login');
        router.push('/login?message=Please log in to continue with onboarding');
      }
    }, 1000); // 1 second delay
    
    return () => clearTimeout(timer);
  }, [session, authLoading, router]);

  const handleNextClick = async () => {
    console.log('StepLayout: Next button clicked');
    console.log('StepLayout: Current session state:', { 
      hasSession: !!session, 
      sessionUser: session?.user?.email,
      authLoading,
      isNavigating
    });
    
    // Prevent multiple clicks
    if (isNavigating) return;
    setIsNavigating(true);
    
    try {
      // Make sure we have a session
      if (!session?.user) {
        console.log('StepLayout: No session for navigation, redirecting to login');
        router.push('/login?message=Please log in to continue with onboarding');
        return;
      }
      
      if (onNextButtonClick) {
        console.log('StepLayout: Using custom onNextButtonClick handler');
        onNextButtonClick();
      } else if (isLastStep) {
        console.log('StepLayout: Using completeOnboarding');
        await completeOnboarding();
      } else {
        console.log('StepLayout: Using default goToNextStep');
        const nextStep = STEP_ORDER[STEP_ORDER.indexOf(currentStep) + 1];
        
        // For more reliable navigation, use direct router.push for complete step
        if (nextStep === 'complete') {
          console.log('StepLayout: Direct navigation to complete step');
          router.push('/onboarding/complete');
        } else {
          await goToNextStep();
        }
      }
    } catch (error) {
      console.error('StepLayout: Error during next button handling:', error);
      // Fallback navigation based on current step
      const currentIndex = STEP_ORDER.indexOf(currentStep);
      if (currentIndex < STEP_ORDER.length - 1) {
        const nextStep = STEP_ORDER[currentIndex + 1];
        console.log(`StepLayout: Fallback navigation to ${nextStep}`);
        router.push(`/onboarding/${nextStep}`);
      }
    } finally {
      setIsNavigating(false);
    }
  };

  // Define step indicators - removed profile step
  const steps: { name: string; step: OnboardingStep }[] = [
    { name: 'Welcome', step: 'welcome' },
    { name: 'Complete', step: 'complete' },
  ];

  // If still loading auth, show minimal UI
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-2xl rounded-lg bg-white shadow-md p-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-md p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div 
                key={step.step}
                className={`flex items-center ${index !== steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep === step.step 
                      ? 'bg-blue-600 text-white' 
                      : (STEP_ORDER.indexOf(currentStep) > STEP_ORDER.indexOf(step.step)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-700')
                  }`}
                >
                  {index + 1}
                </div>
                {index !== steps.length - 1 && (
                  <div 
                    className={`flex-1 h-1 mx-2 ${
                      STEP_ORDER.indexOf(currentStep) > STEP_ORDER.indexOf(step.step)
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            {steps.map((step) => (
              <div key={step.step} className="w-16 text-center">
                {step.name}
              </div>
            ))}
          </div>
        </div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
        
        {/* Content */}
        <div className="mb-8">
          {children}
        </div>
        
        {/* Navigation and Custom Buttons */}
        <div className="flex flex-col gap-4">
          {/* Custom Buttons */}
          {customButtons}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-4">
            {showBackButton ? (
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isNavigating}
              >
                Back
              </Button>
            ) : (
              <div></div> // Empty div to maintain flex layout
            )}
            
            {showNextButton && (
              <Button
                onClick={(e) => {
                  console.log('Button direct click handler');
                  e.preventDefault();
                  handleNextClick();
                }}
                disabled={nextButtonDisabled || isNavigating}
              >
                {isNavigating ? 'Loading...' : nextButtonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 