import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // If user is authenticated, redirect to budget page
    redirect('/budget');
  }

  // If not authenticated, redirect to login
  redirect('/login');
} 