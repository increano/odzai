import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export async function AuthGuard({ children }: AuthGuardProps) {
  const supabase = createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return <>{children}</>;
} 