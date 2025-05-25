import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function WelcomePage() {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Odzai Budget
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Let's get you set up with your budget
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <p className="text-center text-gray-700">
            You're all set up and ready to go! Click continue to start managing your budget.
          </p>
          <div>
            <a
              href="/onboarding/complete"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 