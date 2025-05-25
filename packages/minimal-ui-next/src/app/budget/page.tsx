// Server Component
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BudgetContent } from './budget-content';

export default async function BudgetPage() {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }

  return <BudgetContent />;
} 