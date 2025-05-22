import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  requireEmailConfirmed?: boolean;
}

export async function AuthGuard({ children, requireEmailConfirmed = false }: AuthGuardProps) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  if (requireEmailConfirmed && !user.email_confirmed_at) {
    redirect('/login?message=Please confirm your email first');
  }

  return <>{children}</>;
} 