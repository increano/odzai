'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Define the steps in the onboarding process
export type OnboardingStep = 'welcome' | 'workspace' | 'profile' | 'complete';

// Define the onboarding context type
type OnboardingContextType = {
  currentStep: OnboardingStep;
  workspaceName: string;
  fullName: string;
  setWorkspaceName: (name: string) => void;
  setFullName: (name: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  completeOnboarding: () => void;
  isStepComplete: (step: OnboardingStep) => boolean;
};

// Create the context with a default value
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Define the order of steps for navigation
const STEP_ORDER: OnboardingStep[] = ['welcome', 'workspace', 'profile', 'complete'];

// Provider component
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [workspaceName, setWorkspaceName] = useState('');
  const [fullName, setFullName] = useState('');

  // Navigate to the next step in the process
  const goToNextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    console.log('goToNextStep called. Current step:', currentStep, 'Current index:', currentIndex);
    
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      console.log('Moving to next step:', nextStep);
      setCurrentStep(nextStep);
      
      // Use replace instead of push for more reliable navigation
      try {
        console.log('Attempting navigation to:', `/onboarding/${nextStep}`);
        window.location.href = `/onboarding/${nextStep}`;
      } catch (error) {
        console.error('Error during navigation:', error);
        router.replace(`/onboarding/${nextStep}`);
      }
    } else {
      console.log('Already at the last step');
    }
  }, [currentStep, router]);

  // Navigate to the previous step
  const goToPreviousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1];
      setCurrentStep(prevStep);
      
      // Use replace instead of push for more reliable navigation
      try {
        window.location.href = `/onboarding/${prevStep}`;
      } catch (error) {
        router.replace(`/onboarding/${prevStep}`);
      }
    }
  }, [currentStep, router]);

  // Navigate to a specific step
  const goToStep = useCallback((step: OnboardingStep) => {
    console.log('goToStep called with step:', step, 'Current step:', currentStep);
    setCurrentStep(step);
    
    // Only navigate if we're changing steps
    if (step !== currentStep) {
      try {
        window.location.href = `/onboarding/${step}`;
      } catch (error) {
        router.replace(`/onboarding/${step}`);
      }
    }
  }, [currentStep, router]);

  // Complete the onboarding process
  const completeOnboarding = useCallback(() => {
    // Navigate to the main app
    try {
      window.location.href = '/budget';
    } catch (error) {
      router.replace('/budget');
    }
  }, [router]);

  // Check if a step is complete based on required data
  const isStepComplete = useCallback((step: OnboardingStep): boolean => {
    switch (step) {
      case 'welcome':
        return true; // Always complete
      case 'workspace':
        return !!workspaceName;
      case 'profile':
        return !!fullName;
      case 'complete':
        return true; // Always complete
      default:
        return false;
    }
  }, [workspaceName, fullName]);

  // Provide the context value
  const value = {
    currentStep,
    workspaceName,
    fullName,
    setWorkspaceName,
    setFullName,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    completeOnboarding,
    isStepComplete,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

// Custom hook to use the onboarding context
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 