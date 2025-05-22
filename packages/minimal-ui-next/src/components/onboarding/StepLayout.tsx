'use client';

import React from 'react';
import { Button } from '../ui/button';
import { OnboardingStep, useOnboarding } from '../providers/OnboardingProvider';
import { useRouter } from 'next/navigation';

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
}: StepLayoutProps) {
  const { goToNextStep, goToPreviousStep, completeOnboarding } = useOnboarding();
  const router = useRouter();

  const handleNextClick = () => {
    console.log('StepLayout: Next button clicked');
    
    try {
      if (onNextButtonClick) {
        console.log('StepLayout: Using custom onNextButtonClick handler');
        onNextButtonClick();
      } else if (isLastStep) {
        console.log('StepLayout: Using completeOnboarding');
        completeOnboarding();
      } else {
        console.log('StepLayout: Using default goToNextStep');
        goToNextStep();
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
    }
  };

  // Define step indicators - removed profile step
  const steps: { name: string; step: OnboardingStep }[] = [
    { name: 'Welcome', step: 'welcome' },
    { name: 'Complete', step: 'complete' },
  ];

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
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {showBackButton ? (
            <Button
              variant="outline"
              onClick={goToPreviousStep}
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
              disabled={nextButtonDisabled}
            >
              {nextButtonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 