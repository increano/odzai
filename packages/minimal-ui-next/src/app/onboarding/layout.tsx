'use client';

import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';
import { SupabaseAuthProvider } from '../../components/providers/SupabaseAuthProvider';
import { OnboardingProvider } from '../../components/providers/OnboardingProvider';

const inter = Inter({ subsets: ['latin'] });

// Special minimalistic layout for onboarding pages
// Doesn't include sidebar or other components that might make API requests before the user is ready
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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