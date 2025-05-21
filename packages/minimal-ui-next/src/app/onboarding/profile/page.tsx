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
    
    // If user already has a full_name in metadata, pre-populate it
    if (user?.user_metadata && typeof user?.user_metadata === 'object') {
      const metadata = user.user_metadata as Record<string, any>;
      if (metadata.full_name && !fullName) {
        setFullName(metadata.full_name);
      }
    }
  }, [goToStep, user, fullName, setFullName]);

  const isFormValid = fullName.trim().length > 0;

  const handleUpdateProfile = async () => {
    if (!isFormValid) return;
    
    try {
      setIsUpdating(true);
      setError('');
      
      if (!session?.user) {
        throw new Error('You must be logged in to update your profile');
      }
      
      // Update user metadata in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
        }
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // Also store in user_preferences for more structured access
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          data: {
            profile: {
              fullName: fullName.trim(),
              updatedAt: new Date().toISOString()
            }
          },
          updated_at: new Date().toISOString()
        });
      
      if (preferencesError) {
        console.warn('Could not update preferences in Supabase:', preferencesError.message);
        // Continue anyway since the primary update succeeded
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