import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Check if user has completed onboarding
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('data')
      .eq('user_id', user.id)
      .single();
    
    const onboardingCompleted = preferences?.data?.onboarding?.completed;
    
    if (onboardingCompleted) {
      redirect('/budget');
    } else {
      redirect('/onboarding/welcome');
    }
  } else {
    redirect('/login');
  }
} 