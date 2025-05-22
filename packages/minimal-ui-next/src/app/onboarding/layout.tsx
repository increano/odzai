import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';
import { OnboardingProvider } from '@/components/providers/OnboardingProvider';

const inter = Inter({ subsets: ['latin'] });

// Special minimalistic layout for onboarding pages
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check session server-side
  const supabase = createServerComponentClient({ cookies });
  
  console.log('Onboarding layout - Checking session...');
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Onboarding layout - Auth error:', error);
    redirect('/login');
  }

  if (!user) {
    console.log('Onboarding layout - No user found');
    redirect('/login');
  }

  console.log('Onboarding layout - User found:', { 
    id: user.id,
    email: user.email 
  });

  // Check if user has already completed onboarding
  console.log('Onboarding layout - Checking preferences...');
  const { data: preferences, error: prefError } = await supabase
    .from('user_preferences')
    .select('data')
    .single();

  if (prefError) {
    console.error('Onboarding layout - Error fetching preferences:', prefError);
  }

  const onboardingCompleted = preferences?.data?.onboarding?.completed;
  console.log('Onboarding layout - Onboarding status:', { 
    completed: onboardingCompleted,
    preferences: preferences?.data 
  });

  if (onboardingCompleted) {
    console.log('Onboarding layout - Redirecting to budget (onboarding completed)');
    redirect('/budget');
  }

  return (
    <div className={`${inter.className} min-h-screen bg-background`}>
      <OnboardingProvider>
        <main className="h-full">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </OnboardingProvider>
    </div>
  );
} 