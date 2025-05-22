import { redirect } from 'next/navigation';

// Profile page is no longer used in the onboarding flow
export default function ProfilePage() {
  redirect('/onboarding/welcome');
} 