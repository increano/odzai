import { redirect } from 'next/navigation';

// Redirect to profile page since workspace creation is no longer needed
export default function OnboardingWorkspacePage() {
  // This page is no longer used as we now create a default budget automatically
  redirect('/onboarding/profile');
} 