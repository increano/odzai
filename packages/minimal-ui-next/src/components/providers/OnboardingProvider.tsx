'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './SupabaseAuthProvider';
import { supabase } from '../../lib/supabase/client';

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
  saveOnboardingState: () => Promise<void>;
};

// Create the context with a default value
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Define the order of steps for navigation
const STEP_ORDER: OnboardingStep[] = ['welcome', 'workspace', 'profile', 'complete'];

// Provider component
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [workspaceName, setWorkspaceName] = useState('');
  const [fullName, setFullName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load onboarding state from Supabase or initialize defaults
  useEffect(() => {
    async function loadOnboardingState() {
      if (!session?.user) {
        // Not logged in, can't load state
        setIsInitialized(true);
        return;
      }

      try {
        // Try to get existing preferences from Supabase
        const { data: preferences, error } = await supabase
          .from('user_preferences')
          .select('data')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found error
          console.error('Error loading onboarding state:', error);
        } else if (preferences?.data?.onboarding) {
          // We have onboarding data in preferences
          const { onboarding } = preferences.data;
          if (onboarding.workspaceName) setWorkspaceName(onboarding.workspaceName);
          if (onboarding.fullName) setFullName(onboarding.fullName);
          if (onboarding.currentStep) setCurrentStep(onboarding.currentStep as OnboardingStep);
        } else if (user?.user_metadata && typeof user.user_metadata === 'object') {
          // Use data from user metadata if available
          const metadata = user.user_metadata as Record<string, any>;
          if (metadata.full_name) {
            setFullName(metadata.full_name);
          }
        }
      } catch (err) {
        console.error('Failed to load onboarding state:', err);
      }

      setIsInitialized(true);
    }

    if (!isInitialized) {
      loadOnboardingState();
    }
  }, [session, user, isInitialized]);

  // Save onboarding state to Supabase
  const saveOnboardingState = useCallback(async () => {
    if (!session?.user) {
      console.log('Cannot save onboarding state: no active session');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          data: {
            onboarding: {
              currentStep,
              workspaceName,
              fullName,
              lastUpdated: new Date().toISOString()
            }
          },
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving onboarding state:', error);
      }
    } catch (err) {
      console.error('Failed to save onboarding state:', err);
    }
  }, [session, currentStep, workspaceName, fullName]);

  // Navigate to the next step in the process
  const goToNextStep = useCallback(async () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    console.log('goToNextStep called. Current step:', currentStep, 'Current index:', currentIndex);
    
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      console.log('Moving to next step:', nextStep);
      setCurrentStep(nextStep);
      
      // Save state before navigation
      if (session?.user) {
        await saveOnboardingState();
      }
      
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
  }, [currentStep, router, session, saveOnboardingState]);

  // Navigate to the previous step
  const goToPreviousStep = useCallback(async () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1];
      setCurrentStep(prevStep);
      
      // Save state before navigation
      if (session?.user) {
        await saveOnboardingState();
      }
      
      // Use replace instead of push for more reliable navigation
      try {
        window.location.href = `/onboarding/${prevStep}`;
      } catch (error) {
        router.replace(`/onboarding/${prevStep}`);
      }
    }
  }, [currentStep, router, session, saveOnboardingState]);

  // Navigate to a specific step
  const goToStep = useCallback(async (step: OnboardingStep) => {
    console.log('goToStep called with step:', step, 'Current step:', currentStep);
    setCurrentStep(step);
    
    // Save state if we're changing steps
    if (step !== currentStep && session?.user) {
      await saveOnboardingState();
    }
    
    // Only navigate if we're changing steps
    if (step !== currentStep) {
      try {
        window.location.href = `/onboarding/${step}`;
      } catch (error) {
        router.replace(`/onboarding/${step}`);
      }
    }
  }, [currentStep, router, session, saveOnboardingState]);

  // Complete the onboarding process
  const completeOnboarding = useCallback(async () => {
    // Mark onboarding as complete in user preferences
    if (session?.user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: session.user.id,
            data: {
              onboarding: {
                completed: true,
                completedAt: new Date().toISOString()
              }
            },
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.error('Failed to mark onboarding as complete:', err);
      }
    }
    
    // Navigate to the main app
    try {
      window.location.href = '/budget';
    } catch (error) {
      router.replace('/budget');
    }
  }, [router, session]);

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

  // Only render children once initialized
  if (!isInitialized) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

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
    saveOnboardingState,
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