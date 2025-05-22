import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { StepLayout } from '@/components/onboarding/StepLayout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function WelcomePage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();

  // If user is not logged in, redirect to login with message
  if (error || !user) {
    redirect('/login?message=Please log in to continue with onboarding');
  }

  // If user is logged in but hasn't confirmed email
  if (!user.email_confirmed_at) {
    return (
      <StepLayout
        title="Please Confirm Your Email"
        description="Check your email for a confirmation link to continue."
        currentStep="welcome"
        showBackButton={false}
        nextButtonText="Next"
        isLastStep={false}
      >
        <div className="space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <div>
            <p className="text-gray-700 mb-4">
              We've sent a confirmation email to {user.email}.
            </p>
            <p className="text-gray-700 mb-4">
              Please click the link in the email to verify your account and continue with the onboarding process.
            </p>
          </div>
        </div>
      </StepLayout>
    );
  }

  // Get user's default workspace
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('default_workspace_id')
    .eq('user_id', user.id)
    .single();

  const hasDefaultWorkspace = !!preferences?.default_workspace_id;

  return (
    <StepLayout
      title="Welcome to Odzai Budget"
      description="You're all set up and ready to go!"
      currentStep="welcome"
      showBackButton={false}
      nextButtonText="Next"
      isLastStep={false}
    >
      <div className="space-y-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div>
          <p className="text-gray-700 mb-4">
            Odzai Budget helps you take control of your finances with easy-to-use budgeting tools.
          </p>
          
          <p className="text-gray-700 mb-4">
            {hasDefaultWorkspace ? 
              "A default budget has been created for you. You're ready to start tracking your finances!" : 
              "You'll need to set up your budget in the dashboard."
            }
          </p>
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-md text-left">
          <h3 className="font-medium text-blue-800 mb-2">Here's what you can do next:</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-700">
            <li>Customize your profile in account settings</li>
            <li>Set up your budget categories</li>
            <li>Track your income and expenses</li>
            <li>Create savings goals</li>
          </ul>
        </div>
      </div>
    </StepLayout>
  );
} 