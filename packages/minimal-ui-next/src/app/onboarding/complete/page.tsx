import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function CompletePage() {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }

  // Mark onboarding as complete
  await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      data: {
        onboarding: {
          completed: true,
          completedAt: new Date().toISOString()
        }
      },
      updated_at: new Date().toISOString()
    });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Setup Complete!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You're ready to start budgeting
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <p className="text-center text-gray-700">
            Congratulations! Your account is now set up and ready to use.
          </p>
          <div>
            <a
              href="/budget"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Budget Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 