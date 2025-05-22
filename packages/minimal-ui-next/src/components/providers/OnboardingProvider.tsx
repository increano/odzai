'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './SupabaseAuthProvider';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'react-hot-toast';

// Define the steps in the onboarding process
export type OnboardingStep = 'welcome' | 'complete';

// Define the onboarding context type
type OnboardingContextType = {
  currentStep: OnboardingStep;
  fullName: string;
  setFullName: (name: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  completeOnboarding: () => void;
  isStepComplete: (step: OnboardingStep) => boolean;
  saveOnboardingState: () => Promise<void>;
  isAuthReady: boolean;
};

// Create the context with a default value
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Define the order of steps for navigation - removed profile step
const STEP_ORDER: OnboardingStep[] = ['welcome', 'complete'];

// Provider component
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [fullName, setFullName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Load onboarding state from Supabase or initialize defaults
  useEffect(() => {
    async function loadOnboardingState() {
      // Only proceed if auth is no longer loading
      if (authLoading) {
        return;
      }

      try {
        // Set auth ready state
        setIsAuthReady(true);
        
        // Always set initialized to prevent infinite loops
        setIsInitialized(true);

        if (!session?.user) {
          // For non-authenticated users in onboarding, use default state
          setCurrentStep('welcome');
          console.log('No session available, using default onboarding state');
          return;
        }

        console.log('Session available, loading onboarding state');
        
        // Try to get existing preferences from Supabase
        const { data: preferences, error } = await supabase
          .from('user_preferences')
          .select('data, default_workspace_id')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found error
          console.error('Error loading onboarding state:', error);
        } else if (preferences?.data?.onboarding) {
          // We have onboarding data in preferences
          const { onboarding } = preferences.data;
          if (onboarding.fullName) setFullName(onboarding.fullName);
          if (onboarding.currentStep) setCurrentStep(onboarding.currentStep as OnboardingStep);
          console.log('Loaded onboarding state:', onboarding);
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
    }

    if (!isInitialized) {
      loadOnboardingState();
    }
  }, [session, user, isInitialized, authLoading]);

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
              fullName,
              lastUpdated: new Date().toISOString()
            }
          },
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving onboarding state:', error);
        toast.error('Failed to save progress');
      }
    } catch (err) {
      console.error('Failed to save onboarding state:', err);
      toast.error('Failed to save progress');
    }
  }, [session, currentStep, fullName]);

  // Complete the onboarding process
  const completeOnboarding = useCallback(async () => {
    if (!session?.user) {
      console.error('Cannot complete onboarding without session');
      return;
    }

    try {
      // Update user preferences to mark onboarding as complete
      const { error } = await supabase
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

      if (error) {
        throw error;
      }

      // Navigate to the main app using Next.js router
      router.push('/budget');
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      toast.error('Failed to complete onboarding');
    }
  }, [session, router]);

  // Check if a step is complete based on required data
  const isStepComplete = useCallback((step: OnboardingStep): boolean => {
    switch (step) {
      case 'welcome':
        return true; // Always complete
      case 'complete':
        return true; // Always complete
      default:
        return false;
    }
  }, [fullName]);

  // Navigate to the next step in the process
  const goToNextStep = useCallback(async () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    console.log('goToNextStep called. Current step:', currentStep, 'Current index:', currentIndex);
    
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      console.log('Moving to next step:', nextStep);

      // The user should already be authenticated at this point since they're in the onboarding flow
      // Instead of redirecting to login, we'll continue with the flow
      setCurrentStep(nextStep);
      
      // Save state before navigation if we have a session
      if (session?.user) {
        await saveOnboardingState();
      }
      
      // Use Next.js router for navigation
      try {
        console.log('Attempting navigation to:', `/onboarding/${nextStep}`);
        router.push(`/onboarding/${nextStep}`);
      } catch (error) {
        console.error('Error during navigation:', error);
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
      router.replace(`/onboarding/${prevStep}`);
    }
  }, [currentStep, router, session, saveOnboardingState]);

  // Navigate to a specific step
  const goToStep = useCallback(async (step: OnboardingStep) => {
    console.log('goToStep called with step:', step, 'Current step:', currentStep);
    
    // The user should already be authenticated at this point since they're in the onboarding flow
    // Only update state and navigate if we're actually changing steps
    if (step !== currentStep) {
      setCurrentStep(step);
      
      // Save state if we have a session
      if (session?.user) {
        await saveOnboardingState();
      }
      
      // Only navigate if we're not already on the correct page
      const currentPath = window.location.pathname;
      const targetPath = `/onboarding/${step}`;
      
      if (currentPath !== targetPath) {
        router.replace(targetPath);
      }
    }
  }, [currentStep, router, session, saveOnboardingState]);

  // Create the context value
  const contextValue = {
    currentStep,
    fullName,
    setFullName,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    completeOnboarding,
    isStepComplete,
    saveOnboardingState,
    isAuthReady
  };

  // If we're still loading auth, render a loading state or just the children
  // This prevents errors from being thrown while auth is loading
  if (authLoading) {
    return <>{children}</>;
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Custom hook to use the onboarding context
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
} 