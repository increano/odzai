'use client';

import { useState, useEffect } from 'react';
import { StepLayout } from '../../../components/onboarding/StepLayout';
import { useOnboarding } from '../../../components/providers/OnboardingProvider';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../../components/providers/SupabaseAuthProvider';
import { supabase } from '../../../lib/supabase/client';

function ProfileContent() {
  const { fullName, setFullName, goToNextStep, goToStep } = useOnboarding();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const { session, user } = useAuth();

  useEffect(() => {
    // Ensure we're on the correct step when this component mounts
    goToStep('profile');
  }, [goToStep]);

  const isFormValid = fullName.trim().length > 0;

  const handleUpdateProfile = async () => {
    if (!isFormValid) return;
    
    try {
      setIsUpdating(true);
      setError('');
      
      // During onboarding, we'll store the name in the context and continue without requiring auth
      // Users can update their profile information later when they have an active session
      
      // If we have a session, try to update the user metadata
      if (session) {
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              full_name: fullName.trim(),
            }
          });
          
          if (updateError) {
            console.warn('Could not update profile in Supabase:', updateError.message);
            // Continue anyway for onboarding
          }
        } catch (err) {
          console.warn('Error during profile update:', err);
          // Continue anyway for onboarding
        }
      } else {
        console.log('No active session, storing profile data in context only');
        // We'll just use the data from the onboarding context
      }
      
      // Store the profile data in local storage for later use
      try {
        localStorage.setItem('odzai-user-profile', JSON.stringify({
          fullName: fullName.trim(),
          updatedAt: new Date().toISOString()
        }));
      } catch (err) {
        console.warn('Could not store profile in local storage:', err);
      }
      
      toast.success('Profile updated successfully');
      
      // Move to next step
      goToNextStep();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <StepLayout
      title="Complete Your Profile"
      description="Tell us a bit about yourself"
      currentStep="profile"
      nextButtonDisabled={!isFormValid || isUpdating}
      nextButtonText={isUpdating ? 'Saving...' : 'Save Profile'}
      onNextButtonClick={handleUpdateProfile}
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="full-name">Full Name</Label>
          <Input 
            id="full-name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isUpdating}
          />
          <p className="text-sm text-gray-500">
            This name will be displayed to other users if you share your workspace.
          </p>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> {user?.email ? 
              `You're using ${user.email} as your account email.` : 
              'Your profile information will be associated with your account.'}
            You can update your profile settings later from your account settings.
          </p>
        </div>
      </div>
    </StepLayout>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
} 